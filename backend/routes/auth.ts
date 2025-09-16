import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authLimiter } from '@/middleware/rateLimit';
import { User } from '@/models/User';

// In-memory user store for development (when MongoDB is not available)
interface TempUser {
  id: string;
  email: string;
  password: string; // This will be hashed
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

const tempUsers: TempUser[] = [];
let useDatabase = true;

// Check if we should use database or in-memory store
const checkDatabaseConnection = async () => {
  try {
    await User.findOne({});
    useDatabase = true;
  } catch (error) {
    useDatabase = false;
    console.log('⚠️  Using in-memory user store for development');
  }
};

// Initialize database check
checkDatabaseConnection();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing Credentials',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Find user by email
    let user: any = null;
    let userData: any = null;

    if (useDatabase) {
      user = await User.findOne({ email: email.toLowerCase(), isActive: true });
      if (user) {
        userData = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin
        };
      }
    } else {
      // Use in-memory store
      const tempUser = tempUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
      if (tempUser) {
        user = tempUser;
        userData = {
          id: tempUser.id,
          email: tempUser.email,
          name: tempUser.name,
          role: tempUser.role,
          lastLogin: tempUser.lastLogin
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Check password
    let isPasswordValid = false;
    if (useDatabase && user.comparePassword) {
      isPasswordValid = await user.comparePassword(password);
    } else {
      // For in-memory store, compare hashed password
      isPasswordValid = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Update last login
    if (useDatabase) {
      user.lastLogin = new Date();
      await user.save();
    } else {
      user.lastLogin = new Date();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login Failed',
      message: 'An error occurred during login',
      timestamp: new Date().toISOString()
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing Information',
        message: 'Email, password, and name are required',
        timestamp: new Date().toISOString()
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid Email',
        message: 'Please provide a valid email address',
        timestamp: new Date().toISOString()
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Weak Password',
        message: 'Password must be at least 8 characters long',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user already exists
    let existingUser: any = null;

    if (useDatabase) {
      existingUser = await User.findOne({ email: email.toLowerCase() });
    } else {
      existingUser = tempUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    if (existingUser) {
      return res.status(409).json({
        error: 'User Exists',
        message: 'A user with this email already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    let newUser: any = null;
    let userData: any = null;

    if (useDatabase) {
      newUser = new User({
        email: email.toLowerCase(),
        password,
        name,
        role: 'user',
        isActive: true
      });
      await newUser.save();
      userData = {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt
      };
    } else {
      // Create in-memory user
      const tempUser: TempUser = {
        id: 'user-' + Date.now(),
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: 'user',
        isActive: true,
        createdAt: new Date()
      };
      tempUsers.push(tempUser);
      newUser = tempUser;
      userData = {
        id: tempUser.id,
        email: tempUser.email,
        name: tempUser.name,
        role: tempUser.role,
        createdAt: tempUser.createdAt
      };
    }

    // Generate JWT token
    const userId = useDatabase ? newUser._id.toString() : newUser.id;
    const token = jwt.sign(
      { id: userId, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration Failed',
      message: 'Unable to create user account',
      timestamp: new Date().toISOString()
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Missing Token',
        message: 'Refresh token is required',
        timestamp: new Date().toISOString()
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any;

    // Generate new access token
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: '24h'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid Token',
      message: 'Unable to refresh authentication token',
      timestamp: new Date().toISOString()
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
});

// Get current user profile
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
    }

    // Find user by ID
    let user: any = null;

    if (useDatabase) {
      user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      user = tempUsers.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      data: {
        id: user.id || user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      error: 'Profile Retrieval Failed',
      message: 'Unable to retrieve user profile',
      timestamp: new Date().toISOString()
    });
  }
});

// Update user profile
router.put('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
    }

    // Find and update user
    let user: any = null;

    if (useDatabase) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        });
      }

      // Update fields
      if (name) user.name = name;
      await user.save();
    } else {
      user = tempUsers.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        });
      }

      // Update fields
      if (name) user.name = name;
    }

    res.json({
      success: true,
      data: {
        id: user.id || user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        updatedAt: user.updatedAt || new Date()
      },
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile Update Failed',
      message: 'Unable to update user profile',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;