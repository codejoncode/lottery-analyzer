import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import type { LoginRequest } from '../../services/api';

interface LoginProps {
  onLoginSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    if (authAPI.isAuthenticated()) {
      onLoginSuccess?.();
    }
  }, [onLoginSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(formData);
      authAPI.setAuthData(response.data);

      console.log('Login successful:', response.data.user);
      onLoginSuccess?.();
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: '#1f2937',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: '1.5rem',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Login to Super Predictor
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              color: '#9ca3af',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '1rem'
            }}
            placeholder="Enter your email"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              color: '#9ca3af',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '1rem'
            }}
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#4b5563' : '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {onSwitchToRegister && (
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #374151'
        }}>
          <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>
            Don't have an account?
          </p>
          <button
            onClick={onSwitchToRegister}
            style={{
              backgroundColor: 'transparent',
              color: '#3b82f6',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              textDecoration: 'underline'
            }}
          >
            Create an account
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;