import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PatternDistributionChart,
  CorrelationHeatmap,
  RiskAssessmentChart,
  TrendAnalysisChart,
  AccuracyOverTimeChart
} from './Charts';
import AnalyticsService from '../services/api';
import websocketService from '../services/websocketService';
import EnhancedPredictionDisplay from './EnhancedPredictionDisplay';
import PredictionTracker from './PredictionTracker';
import type {
  PatternData,
  CorrelationData,
  RiskData,
  TrendData,
  AccuracyData
} from '../services/api';

interface AnalyticsDashboardProps {
  className?: string;
}

interface DataCache {
  patternData: PatternData[];
  correlationData: CorrelationData | null;
  riskData: RiskData | null;
  trendData: TrendData | null;
  accuracyData: AccuracyData | null;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = React.memo(({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'correlations' | 'risk' | 'trends' | 'accuracy' | 'predictions' | 'performance'>('overview');

  // State for data and loading
  const [patternData, setPatternData] = useState<PatternData[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [accuracyData, setAccuracyData] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataCache, setDataCache] = useState<DataCache | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadAllData();

    // Set up WebSocket listeners for real-time updates
    const unsubscribePrediction = websocketService.onPredictionUpdate((data) => {
      console.log('📈 Real-time prediction update received:', data);
      // Refresh prediction-related data
      loadAllData();
    });

    const unsubscribeAnalytics = websocketService.onAnalyticsUpdate((data) => {
      console.log('📊 Real-time analytics update received:', data);
      // Refresh analytics data
      loadAllData();
    });

    // Cleanup WebSocket listeners on unmount
    return () => {
      unsubscribePrediction();
      unsubscribeAnalytics();
    };
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      // Check cache first
      if (dataCache && (Date.now() - dataCache.timestamp) < CACHE_DURATION) {
        setPatternData(dataCache.patternData);
        setCorrelationData(dataCache.correlationData);
        setRiskData(dataCache.riskData);
        setTrendData(dataCache.trendData);
        setAccuracyData(dataCache.accuracyData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Load all data in parallel with timeout
      const loadPromises = [
        AnalyticsService.getPatternData(),
        AnalyticsService.getCorrelationData(),
        AnalyticsService.getRiskData(),
        AnalyticsService.getTrendData(),
        AnalyticsService.getAccuracyData()
      ];

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const results = await Promise.race([
        Promise.all(loadPromises),
        timeoutPromise
      ]) as [PatternData[], CorrelationData, RiskData, TrendData, AccuracyData];

      const [patterns, correlations, risk, trends, accuracy] = results;

      setPatternData(patterns);
      setCorrelationData(correlations);
      setRiskData(risk);
      setTrendData(trends);
      setAccuracyData(accuracy);

      // Update cache
      setDataCache({
        patternData: patterns,
        correlationData: correlations,
        riskData: risk,
        trendData: trends,
        accuracyData: accuracy,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Using cached data.');
    } finally {
      setLoading(false);
    }
  }, [dataCache]);

  // Fallback data in case API fails
  const fallbackPatternData: PatternData[] = useMemo(() => [
    { pattern: 'Pattern A', frequency: 45, successRate: 0.78, totalOccurrences: 120 },
    { pattern: 'Pattern B', frequency: 32, successRate: 0.65, totalOccurrences: 95 },
    { pattern: 'Pattern C', frequency: 28, successRate: 0.82, totalOccurrences: 85 },
    { pattern: 'Pattern D', frequency: 19, successRate: 0.71, totalOccurrences: 65 },
    { pattern: 'Pattern E', frequency: 15, successRate: 0.69, totalOccurrences: 55 }
  ], []);

  const fallbackCorrelationData: CorrelationData = useMemo(() => ({
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
  }), []);

  const fallbackRiskData: RiskData = useMemo(() => ({
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
  }), []);

  const fallbackTrendData: TrendData = useMemo(() => ({
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
  }), []);

  const fallbackAccuracyData: AccuracyData = useMemo(() => ({
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
  }), []);

  // Memoized current data calculations
  const currentData = useMemo(() => ({
    patternData: patternData.length > 0 ? patternData : fallbackPatternData,
    correlationData: correlationData || fallbackCorrelationData,
    riskData: riskData || fallbackRiskData,
    trendData: trendData || fallbackTrendData,
    accuracyData: accuracyData || fallbackAccuracyData
  }), [
    patternData, correlationData, riskData, trendData, accuracyData,
    fallbackPatternData, fallbackCorrelationData, fallbackRiskData,
    fallbackTrendData, fallbackAccuracyData
  ]);

  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'patterns', label: 'Patterns', icon: '🎯' },
    { id: 'correlations', label: 'Correlations', icon: '🔗' },
    { id: 'risk', label: 'Risk Analysis', icon: '⚠️' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'accuracy', label: 'Accuracy', icon: '🎯' },
    { id: 'predictions', label: 'Predictions', icon: '🔮' },
    { id: 'performance', label: 'Performance', icon: '📈' }
  ], []);

  const handleTabChange = useCallback((tabId: typeof activeTab) => {
    setActiveTab(tabId);
  }, []);

  const renderOverview = useCallback(() => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
      <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Pattern Performance</h3>
        <PatternDistributionChart data={currentData.patternData} height={300} />
      </div>
      <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Risk Overview</h3>
        <RiskAssessmentChart data={currentData.riskData} height={300} />
      </div>
      <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Accuracy Trend</h3>
        <AccuracyOverTimeChart data={currentData.accuracyData} height={300} />
      </div>
      <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Number Correlations</h3>
        <CorrelationHeatmap data={currentData.correlationData} height={300} />
      </div>
    </div>
  ), [currentData]);

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'patterns':
        return (
          <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
            <PatternDistributionChart data={currentData.patternData} height={500} />
          </div>
        );
      case 'correlations':
        return (
          <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
            <CorrelationHeatmap data={currentData.correlationData} height={600} />
          </div>
        );
      case 'risk':
        return (
          <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
            <RiskAssessmentChart data={currentData.riskData} height={500} />
          </div>
        );
      case 'trends':
        return (
          <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
            <TrendAnalysisChart data={currentData.trendData} height={500} />
          </div>
        );
      case 'accuracy':
        return (
          <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
            <AccuracyOverTimeChart data={currentData.accuracyData} height={500} />
          </div>
        );
      case 'predictions':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Pick 3 Enhanced Predictions</h3>
              <EnhancedPredictionDisplay gameType="pick3" />
            </div>
            <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Pick 4 Enhanced Predictions</h3>
              <EnhancedPredictionDisplay gameType="pick4" />
            </div>
          </div>
        );
      case 'performance':
        return (
          <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px' }}>
            <PredictionTracker refreshInterval={5} />
          </div>
        );
      default:
        return renderOverview();
    }
  }, [activeTab, renderOverview, currentData]);

  return (
    <div className={`analytics-dashboard ${className}`} style={{
      backgroundColor: '#111827',
      minHeight: '100vh',
      padding: '20px',
      color: '#ffffff'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #3b82f6, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Super Predictor Analytics
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
          Advanced lottery prediction analytics and visualization dashboard
        </p>
        {loading && (
          <div style={{ color: '#3b82f6', marginTop: '10px' }}>
            🔄 Loading analytics data...
          </div>
        )}
        {error && (
          <div style={{ color: '#ef4444', marginTop: '10px' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '5px',
        marginBottom: '30px',
        borderBottom: '1px solid #374151',
        overflowX: 'auto',
        paddingBottom: '10px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as typeof activeTab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#1f2937' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#9ca3af',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{ minHeight: '600px' }}>
        {renderContent}
      </div>
    </div>
  );
});