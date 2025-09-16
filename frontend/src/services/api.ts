import axios from 'axios';

// API Base URL - should match your backend server
const API_BASE_URL = 'http://localhost:3001/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      lastLogin?: string;
    };
    token: string;
    expiresIn: string;
  };
  message: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLogin?: string;
}

// Authentication API methods
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile');
    return response.data.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setAuthData: (authData: AuthResponse['data']) => {
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PatternData {
  pattern: string;
  frequency: number;
  successRate: number;
  totalOccurrences: number;
}

export interface CorrelationData {
  numbers: string[];
  correlations: number[][];
}

export interface RiskData {
  labels: string[];
  riskLevels: number[];
  confidenceIntervals: {
    upper: number[];
    lower: number[];
  };
  thresholds: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface TrendData {
  actual: Array<{ x: number; y: number }>;
  predicted: Array<{ x: number; y: number }>;
  regression: Array<{ x: number; y: number }>;
  confidence: {
    upper: Array<{ x: number; y: number }>;
    lower: Array<{ x: number; y: number }>;
  };
}

export interface AccuracyData {
  timestamps: Date[];
  accuracy: number[];
  precision: number[];
  recall: number[];
  f1Score: number[];
  sampleSize: number[];
}

// Prediction-related interfaces
export interface PredictionRequest {
  numbers?: number[];
  gameType: 'pick3' | 'pick4';
  strategy?: string;
}

export interface EnhancedPredictionData {
  id: string;
  numbers: number[];
  gameType: string;
  strategy: string;
  confidence: number;
  boxes: number[][];
  columnTop3: {
    hundreds?: number[];
    tens?: number[];
    units?: number[];
  };
  overallTop5: number[];
  reasoning: string[];
  createdAt: string;
  accuracy?: number;
  performance?: {
    historicalAccuracy: number;
    improvement: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export interface PredictionHistory {
  predictions: EnhancedPredictionData[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PredictionStats {
  totalPredictions: number;
  accuracy: number;
  averageConfidence: number;
  topStrategies: Array<{
    strategy: string;
    accuracy: number;
    count: number;
  }>;
  performanceTrend: Array<{
    date: string;
    accuracy: number;
    count: number;
  }>;
}

// Analytics API Service
export class AnalyticsService {
  // Get performance analytics data
  static async getPerformanceData(): Promise<PatternData[]> {
    try {
      const response = await apiClient.get('/analytics/performance');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching performance data:', error);
      // Return mock data as fallback
      return [
        { pattern: 'Pattern A', frequency: 45, successRate: 0.78, totalOccurrences: 120 },
        { pattern: 'Pattern B', frequency: 32, successRate: 0.65, totalOccurrences: 95 },
        { pattern: 'Pattern C', frequency: 28, successRate: 0.82, totalOccurrences: 85 },
        { pattern: 'Pattern D', frequency: 19, successRate: 0.71, totalOccurrences: 65 },
        { pattern: 'Pattern E', frequency: 15, successRate: 0.69, totalOccurrences: 55 }
      ];
    }
  }

  // Get trend analysis data
  static async getTrendData(): Promise<TrendData> {
    try {
      const response = await apiClient.get('/analytics/trends');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching trend data:', error);
      // Return mock data as fallback
      return {
        actual: [
          { x: 1, y: 2.1 }, { x: 2, y: 2.3 }, { x: 3, y: 2.0 }, { x: 4, y: 2.4 },
          { x: 5, y: 1.9 }, { x: 6, y: 2.2 }, { x: 7, y: 2.1 }, { x: 8, y: 2.5 }
        ],
        predicted: [
          { x: 1, y: 2.0 }, { x: 2, y: 2.2 }, { x: 3, y: 2.1 }, { x: 4, y: 2.3 },
          { x: 5, y: 2.0 }, { x: 6, y: 2.1 }, { x: 7, y: 2.2 }, { x: 8, y: 2.4 }
        ],
        regression: [
          { x: 1, y: 2.05 }, { x: 2, y: 2.15 }, { x: 3, y: 2.25 }, { x: 4, y: 2.35 },
          { x: 5, y: 2.45 }, { x: 6, y: 2.55 }, { x: 7, y: 2.65 }, { x: 8, y: 2.75 }
        ],
        confidence: {
          upper: [
            { x: 1, y: 2.3 }, { x: 2, y: 2.4 }, { x: 3, y: 2.5 }, { x: 4, y: 2.6 },
            { x: 5, y: 2.7 }, { x: 6, y: 2.8 }, { x: 7, y: 2.9 }, { x: 8, y: 3.0 }
          ],
          lower: [
            { x: 1, y: 1.8 }, { x: 2, y: 1.9 }, { x: 3, y: 2.0 }, { x: 4, y: 2.1 },
            { x: 5, y: 2.2 }, { x: 6, y: 2.3 }, { x: 7, y: 2.4 }, { x: 8, y: 2.5 }
          ]
        }
      };
    }
  }

  // Get pattern recognition data
  static async getPatternData(): Promise<PatternData[]> {
    try {
      const response = await apiClient.get('/analytics/patterns');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pattern data:', error);
      // Return mock data as fallback
      return this.getPerformanceData();
    }
  }

  // Get accuracy metrics over time
  static async getAccuracyData(): Promise<AccuracyData> {
    try {
      const response = await apiClient.get('/analytics/accuracy');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching accuracy data:', error);
      // Return mock data as fallback
      return {
        timestamps: [
          new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03'),
          new Date('2024-01-04'), new Date('2024-01-05'), new Date('2024-01-06'),
          new Date('2024-01-07'), new Date('2024-01-08')
        ],
        accuracy: [0.75, 0.78, 0.82, 0.79, 0.85, 0.81, 0.83, 0.87],
        precision: [0.72, 0.75, 0.79, 0.76, 0.82, 0.78, 0.80, 0.84],
        recall: [0.78, 0.81, 0.85, 0.82, 0.88, 0.84, 0.86, 0.90],
        f1Score: [0.75, 0.78, 0.82, 0.79, 0.85, 0.81, 0.83, 0.87],
        sampleSize: [150, 145, 160, 155, 170, 165, 175, 180]
      };
    }
  }

  // Get correlation heatmap data
  static async getCorrelationData(): Promise<CorrelationData> {
    try {
      const response = await apiClient.get('/analytics/correlations');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching correlation data:', error);
      // Return mock data as fallback
      return {
        numbers: ['1', '2', '3', '4', '5', '6', '7', '8'],
        correlations: [
          [1.0, 0.3, 0.1, -0.2, 0.4, 0.2, -0.1, 0.3],
          [0.3, 1.0, 0.5, 0.1, -0.3, 0.4, 0.2, -0.2],
          [0.1, 0.5, 1.0, 0.3, 0.2, -0.1, 0.4, 0.1],
          [-0.2, 0.1, 0.3, 1.0, 0.5, 0.2, -0.3, 0.4],
          [0.4, -0.3, 0.2, 0.5, 1.0, 0.3, 0.1, -0.2],
          [0.2, 0.4, -0.1, 0.2, 0.3, 1.0, 0.5, 0.1],
          [-0.1, 0.2, 0.4, -0.3, 0.1, 0.5, 1.0, 0.3],
          [0.3, -0.2, 0.1, 0.4, -0.2, 0.1, 0.3, 1.0]
        ]
      };
    }
  }

  // Get risk assessment data
  static async getRiskData(): Promise<RiskData> {
    try {
      const response = await apiClient.get('/analytics/risk');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching risk data:', error);
      // Return mock data as fallback
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        riskLevels: [2.1, 1.8, 2.5, 1.9, 2.2, 1.7],
        confidenceIntervals: {
          upper: [2.8, 2.4, 3.1, 2.6, 2.9, 2.3],
          lower: [1.4, 1.2, 1.9, 1.2, 1.5, 1.1]
        },
        thresholds: {
          high: 2.5,
          medium: 2.0,
          low: 1.5
        }
      };
    }
  }
}

// Prediction API Service
export class PredictionService {
  // Generate enhanced prediction with 20 boxes, top 3 per column, and top 5 overall
  static async generateEnhancedPrediction(request: PredictionRequest): Promise<EnhancedPredictionData> {
    try {
      const response = await apiClient.post('/predictions/enhanced', request);
      return response.data.data;
    } catch (error) {
      console.error('Error generating enhanced prediction:', error);
      throw new Error('Failed to generate enhanced prediction');
    }
  }

  // Generate standard prediction
  static async generatePrediction(request: PredictionRequest): Promise<EnhancedPredictionData> {
    try {
      const response = await apiClient.post('/predictions/generate', request);
      return response.data.data;
    } catch (error) {
      console.error('Error generating prediction:', error);
      throw new Error('Failed to generate prediction');
    }
  }

  // Get prediction history with pagination
  static async getPredictionHistory(page: number = 1, limit: number = 20, gameType?: string): Promise<PredictionHistory> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(gameType && { gameType })
      });
      const response = await apiClient.get(`/predictions?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching prediction history:', error);
      // Return mock data as fallback
      return {
        predictions: [],
        total: 0,
        page,
        limit,
        pages: 0
      };
    }
  }

  // Get prediction statistics
  static async getPredictionStats(): Promise<PredictionStats> {
    try {
      const response = await apiClient.get('/predictions/stats/overview');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching prediction stats:', error);
      // Return mock data as fallback
      return {
        totalPredictions: 0,
        accuracy: 0,
        averageConfidence: 0,
        topStrategies: [],
        performanceTrend: []
      };
    }
  }

  // Get prediction by ID
  static async getPredictionById(id: string): Promise<EnhancedPredictionData> {
    try {
      const response = await apiClient.get(`/predictions/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching prediction:', error);
      throw new Error('Failed to fetch prediction');
    }
  }

  // Delete prediction
  static async deletePrediction(id: string): Promise<void> {
    try {
      await apiClient.delete(`/predictions/${id}`);
    } catch (error) {
      console.error('Error deleting prediction:', error);
      throw new Error('Failed to delete prediction');
    }
  }

  // Batch generate predictions
  static async generateBatchPredictions(requests: PredictionRequest[]): Promise<EnhancedPredictionData[]> {
    try {
      const response = await apiClient.post('/predictions/batch', { predictions: requests });
      return response.data.data;
    } catch (error) {
      console.error('Error generating batch predictions:', error);
      throw new Error('Failed to generate batch predictions');
    }
  }
}

export default AnalyticsService;