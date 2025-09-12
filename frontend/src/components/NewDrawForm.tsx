import React, { useState } from 'react';
import { DataManager } from '../utils/scoringSystem';
import type { Draw } from '../utils/scoringSystem';

interface NewDrawFormProps {
  onDrawAdded: () => void;
}

export const NewDrawForm: React.FC<NewDrawFormProps> = ({ onDrawAdded }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date
    whiteBall1: '',
    whiteBall2: '',
    whiteBall3: '',
    whiteBall4: '',
    whiteBall5: '',
    redBall: '',
    powerPlay: '1X'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null); // Clear error when user starts typing
  };

  const validateForm = (): boolean => {
    const whiteBalls = [
      parseInt(formData.whiteBall1),
      parseInt(formData.whiteBall2),
      parseInt(formData.whiteBall3),
      parseInt(formData.whiteBall4),
      parseInt(formData.whiteBall5)
    ];

    const redBall = parseInt(formData.redBall);

    // Check if all white balls are valid numbers between 1-69
    if (whiteBalls.some(ball => isNaN(ball) || ball < 1 || ball > 69)) {
      setError('White balls must be numbers between 1 and 69');
      return false;
    }

    // Check for duplicates in white balls
    if (new Set(whiteBalls).size !== 5) {
      setError('White balls must be unique');
      return false;
    }

    // Check red ball
    if (isNaN(redBall) || redBall < 1 || redBall > 26) {
      setError('Powerball must be a number between 1 and 26');
      return false;
    }

    // Check date
    if (!formData.date) {
      setError('Please select a date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const whiteBalls = [
        parseInt(formData.whiteBall1),
        parseInt(formData.whiteBall2),
        parseInt(formData.whiteBall3),
        parseInt(formData.whiteBall4),
        parseInt(formData.whiteBall5)
      ].sort((a, b) => a - b); // Sort white balls

      const newDraw: Draw = {
        date: formData.date,
        white_balls: whiteBalls,
        red_ball: parseInt(formData.redBall),
        power_play: formData.powerPlay
      };

      const dataManager = DataManager.getInstance();
      dataManager.addDraw(newDraw);

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        whiteBall1: '',
        whiteBall2: '',
        whiteBall3: '',
        whiteBall4: '',
        whiteBall5: '',
        redBall: '',
        powerPlay: '1X'
      });

      onDrawAdded();
      alert('✅ New draw added successfully!');
    } catch (err) {
      setError('Failed to add draw. Please try again.');
      console.error('Error adding draw:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Powerball Draw</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Draw Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-5 gap-2">
          <div>
            <label htmlFor="whiteBall1" className="block text-sm font-medium text-gray-700 mb-1">
              White Ball 1
            </label>
            <input
              type="number"
              id="whiteBall1"
              name="whiteBall1"
              value={formData.whiteBall1}
              onChange={handleInputChange}
              min="1"
              max="69"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="whiteBall2" className="block text-sm font-medium text-gray-700 mb-1">
              White Ball 2
            </label>
            <input
              type="number"
              id="whiteBall2"
              name="whiteBall2"
              value={formData.whiteBall2}
              onChange={handleInputChange}
              min="1"
              max="69"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="whiteBall3" className="block text-sm font-medium text-gray-700 mb-1">
              White Ball 3
            </label>
            <input
              type="number"
              id="whiteBall3"
              name="whiteBall3"
              value={formData.whiteBall3}
              onChange={handleInputChange}
              min="1"
              max="69"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="whiteBall4" className="block text-sm font-medium text-gray-700 mb-1">
              White Ball 4
            </label>
            <input
              type="number"
              id="whiteBall4"
              name="whiteBall4"
              value={formData.whiteBall4}
              onChange={handleInputChange}
              min="1"
              max="69"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="whiteBall5" className="block text-sm font-medium text-gray-700 mb-1">
              White Ball 5
            </label>
            <input
              type="number"
              id="whiteBall5"
              name="whiteBall5"
              value={formData.whiteBall5}
              onChange={handleInputChange}
              min="1"
              max="69"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="redBall" className="block text-sm font-medium text-gray-700 mb-1">
              Powerball
            </label>
            <input
              type="number"
              id="redBall"
              name="redBall"
              value={formData.redBall}
              onChange={handleInputChange}
              min="1"
              max="26"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label htmlFor="powerPlay" className="block text-sm font-medium text-gray-700 mb-1">
              Power Play
            </label>
            <select
              id="powerPlay"
              name="powerPlay"
              value={formData.powerPlay}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1X">1X</option>
              <option value="2X">2X</option>
              <option value="3X">3X</option>
              <option value="4X">4X</option>
              <option value="5X">5X</option>
              <option value="10X">10X</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding Draw...' : 'Add Draw'}
        </button>
      </form>
    </div>
  );
};
