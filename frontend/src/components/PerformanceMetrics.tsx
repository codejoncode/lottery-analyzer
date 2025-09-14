import React, { useState, useEffect } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  benchmark: number;
  description: string;
}

interface PerformanceData {
  period: string;
  metrics: PerformanceMetric[];
  overall: {
    accuracy: number;
    roi: number;
    hitRate: number;
    confidence: number;
  };
}

const PerformanceMetrics: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last-30-days');
  const [loading, setLoading] = useState(false);

  const periods = [
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-90-days', label: 'Last 90 Days' },
    { value: 'last-6-months', label: 'Last 6 Months' },
    { value: 'last-year', label: 'Last Year' }
  ];

  const generatePerformanceData = () => {
    setLoading(true);

    // Mock performance data generation
    const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const data: PerformanceData[] = periods.map((period, _index) => ({
      period,
      metrics: [
        {
          name: 'Prediction Accuracy',
          value: 0.65 + Math.random() * 0.2,
          unit: '%',
          trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
          benchmark: 0.7,
          description: 'Percentage of correct predictions'
        },
        {
          name: 'ROI',
          value: -20 + Math.random() * 80,
          unit: '%',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          benchmark: 15,
          description: 'Return on investment'
        },
        {
          name: 'Hit Rate',
          value: 0.12 + Math.random() * 0.15,
          unit: '%',
          trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
          benchmark: 0.2,
          description: 'Percentage of winning predictions'
        },
        {
          name: 'Confidence Level',
          value: 0.75 + Math.random() * 0.2,
          unit: '%',
          trend: 'stable',
          benchmark: 0.8,
          description: 'Average prediction confidence'
        },
        {
          name: 'Profit Margin',
          value: -5 + Math.random() * 25,
          unit: '%',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          benchmark: 10,
          description: 'Net profit margin'
        },
        {
          name: 'Risk Score',
          value: 0.3 + Math.random() * 0.4,
          unit: '/10',
          trend: Math.random() > 0.5 ? 'down' : 'up',
          benchmark: 0.4,
          description: 'Risk assessment score'
        }
      ],
      overall: {
        accuracy: 0.65 + Math.random() * 0.2,
        roi: -15 + Math.random() * 60,
        hitRate: 0.15 + Math.random() * 0.15,
        confidence: 0.75 + Math.random() * 0.2
      }
    }));

    setPerformanceData(data);
    setLoading(false);
  };

  useEffect(() => {
    generatePerformanceData();
  }, [selectedPeriod]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getValueColor = (value: number, benchmark: number) => {
    if (value >= benchmark) return 'text-green-600';
    if (value >= benchmark * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOverallScore = (data: PerformanceData) => {
    const weights = { accuracy: 0.3, roi: 0.3, hitRate: 0.25, confidence: 0.15 };
    const score = (
      data.overall.accuracy * weights.accuracy +
      (data.overall.roi > 0 ? Math.min(data.overall.roi / 50, 1) : 0) * weights.roi +
      data.overall.hitRate * weights.hitRate +
      data.overall.confidence * weights.confidence
    );
    return Math.min(score, 1);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">📊 Performance Metrics</h2>
        <p className="text-gray-600 mb-4">
          Comprehensive analysis of prediction system performance over time
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-medium">Analysis Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border rounded px-3 py-1"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generatePerformanceData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Analyzing...' : '📊 Refresh Metrics'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing performance data...</p>
        </div>
      ) : (
        <>
          {/* Overall Performance Summary */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold mb-4">Overall Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {performanceData.map((data, index) => (
                <div key={index} className="text-center">
                  <div className="text-lg font-semibold mb-1">{data.period}</div>
                  <div className={`text-2xl font-bold ${getValueColor(getOverallScore(data), 0.7)}`}>
                    {(getOverallScore(data) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Performance Score</div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="space-y-6">
            {performanceData.map((data, periodIndex) => (
              <div key={periodIndex} className="bg-white border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">{data.period} - Detailed Metrics</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {data.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className="bg-gray-50 p-4 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{metric.name}</span>
                        <span className={`text-sm ${getTrendColor(metric.trend)}`}>
                          {getTrendIcon(metric.trend)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-lg font-bold ${getValueColor(metric.value, metric.benchmark)}`}>
                          {typeof metric.value === 'number' && metric.value < 1
                            ? (metric.value * 100).toFixed(1)
                            : metric.value.toFixed(1)
                          }{metric.unit}
                        </span>
                        <span className="text-xs text-gray-500">
                          Target: {metric.benchmark}{metric.unit}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600">{metric.description}</p>
                    </div>
                  ))}
                </div>

                {/* Period Summary */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Period Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {(data.overall.accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${data.overall.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.overall.roi >= 0 ? '+' : ''}{data.overall.roi.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">ROI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {(data.overall.hitRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Hit Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-indigo-600">
                        {(data.overall.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Confidence</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Insights */}
          <div className="bg-blue-50 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-blue-800">Strengths</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Consistent confidence levels above 75%</li>
                  <li>• Strong performance in pattern recognition</li>
                  <li>• Good risk management metrics</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-blue-800">Areas for Improvement</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ROI could be improved with better risk assessment</li>
                  <li>• Hit rate optimization needed for higher frequency</li>
                  <li>• Consider adjusting benchmark targets</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceMetrics;
