import React, { useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RiskData {
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

interface RiskAssessmentChartProps {
  data: RiskData;
  title?: string;
  height?: number;
}

const MAX_DATA_POINTS = 200;

const downsampleData = (data: RiskData, maxPoints: number) => {
  if (data.labels.length <= maxPoints) {
    return data;
  }

  const step = Math.ceil(data.labels.length / maxPoints);
  const downsampled: RiskData = {
    labels: [],
    riskLevels: [],
    confidenceIntervals: {
      upper: [],
      lower: []
    },
    thresholds: data.thresholds
  };

  for (let i = 0; i < data.labels.length; i += step) {
    downsampled.labels.push(data.labels[i]);
    downsampled.riskLevels.push(data.riskLevels[i]);
    downsampled.confidenceIntervals.upper.push(data.confidenceIntervals.upper[i]);
    downsampled.confidenceIntervals.lower.push(data.confidenceIntervals.lower[i]);
  }

  return downsampled;
};

export const RiskAssessmentChart: React.FC<RiskAssessmentChartProps> = React.memo(({
  data,
  title = 'Risk Assessment Analysis',
  height = 400
}) => {
  // Downsample data for performance
  const processedData = useMemo(() => downsampleData(data, MAX_DATA_POINTS), [data]);

  // Memoized utility functions
  const getRiskLevel = useCallback((value: number): string => {
    if (value >= processedData.thresholds.high) return 'High Risk';
    if (value >= processedData.thresholds.medium) return 'Medium Risk';
    if (value >= processedData.thresholds.low) return 'Low Risk';
    return 'Very Low Risk';
  }, [processedData.thresholds]);

  const getRiskColor = useCallback((level: string): string => {
    switch (level) {
      case 'High Risk': return '#dc2626';
      case 'Medium Risk': return '#f59e0b';
      case 'Low Risk': return '#10b981';
      case 'Very Low Risk': return '#3b82f6';
      default: return '#6b7280';
    }
  }, []);

  // Memoized max value calculation
  const maxValue = useMemo(() => {
    const allValues = [
      ...processedData.riskLevels,
      ...processedData.confidenceIntervals.upper
    ];
    return Math.max(...allValues) * 1.1;
  }, [processedData]);

  // Memoized chart data
  const chartData = useMemo(() => ({
    labels: processedData.labels,
    datasets: [
      {
        label: 'Risk Level',
        data: processedData.riskLevels,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: processedData.labels.length > 50 ? 2 : 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Upper Confidence',
        data: processedData.confidenceIntervals.upper,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        tension: 0.4,
      },
      {
        label: 'Lower Confidence',
        data: processedData.confidenceIntervals.lower,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  }), [processedData]);

  // Memoized chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: title,
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: { y: number } }) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Confidence')) {
              return `${label}: ${value.toFixed(2)}`;
            }
            return `${label}: ${value.toFixed(2)} (${getRiskLevel(value)})`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Prediction Period',
          color: '#9ca3af',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Risk Level',
          color: '#9ca3af',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: number | string) => {
            if (typeof value === 'number') {
              return value.toFixed(1);
            }
            return value;
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        min: 0,
        max: maxValue,
      },
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
      },
    },
  }), [title, maxValue, getRiskLevel]);

  return (
    <div style={{ height: `${height}px`, width: '100%', padding: '20px' }}>
      <Line data={chartData} options={options} />
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        {['Very Low Risk', 'Low Risk', 'Medium Risk', 'High Risk'].map(level => (
          <div key={level} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: getRiskColor(level),
              borderRadius: '50%',
              border: '2px solid #ffffff'
            }}></div>
            <span>{level}</span>
          </div>
        ))}
      </div>
      {processedData.labels.length !== data.labels.length && (
        <div style={{
          textAlign: 'center',
          marginTop: '10px',
          fontSize: '12px',
          color: '#f59e0b'
        }}>
          ⚡ Data downsampled for performance
        </div>
      )}
    </div>
  );
});