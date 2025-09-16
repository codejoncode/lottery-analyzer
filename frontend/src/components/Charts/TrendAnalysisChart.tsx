import React, { useMemo } from 'react';
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

interface TrendData {
  actual: { x: number; y: number }[];
  predicted: { x: number; y: number }[];
  regression: { x: number; y: number }[];
  confidence: {
    upper: { x: number; y: number }[];
    lower: { x: number; y: number }[];
  };
}

interface TrendAnalysisChartProps {
  data: TrendData;
  title?: string;
  height?: number;
  showRegression?: boolean;
  showConfidence?: boolean;
  maxDataPoints?: number;
}

// Data downsampling function for performance
const downsampleData = (data: { x: number; y: number }[], maxPoints: number) => {
  if (data.length <= maxPoints) return data;

  const step = Math.floor(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
};

export const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = React.memo(({
  data,
  title = 'Trend Analysis with Forecasting',
  height = 400,
  showRegression = true,
  showConfidence = true,
  maxDataPoints = 1000
}) => {
  // Memoize downsampled data to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    const downsampledActual = downsampleData(data.actual, maxDataPoints);
    const downsampledPredicted = downsampleData(data.predicted, maxDataPoints);
    const downsampledRegression = downsampleData(data.regression, maxDataPoints);
    const downsampledUpper = downsampleData(data.confidence.upper, maxDataPoints);
    const downsampledLower = downsampleData(data.confidence.lower, maxDataPoints);

    return {
      actual: downsampledActual,
      predicted: downsampledPredicted,
      regression: downsampledRegression,
      confidence: {
        upper: downsampledUpper,
        lower: downsampledLower
      }
    };
  }, [data.actual, data.predicted, data.regression, data.confidence.upper, data.confidence.lower, maxDataPoints]);

  // Memoize chart data configuration
  const chartData = useMemo(() => ({
    datasets: [
      {
        label: 'Actual Data',
        data: processedData.actual,
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointRadius: processedData.actual.length > 500 ? 0 : 4,
        pointHoverRadius: 6,
        showLine: false,
        fill: false,
      },
      {
        label: 'Predicted Values',
        data: processedData.predicted,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        borderWidth: 2,
        pointRadius: processedData.predicted.length > 500 ? 0 : 4,
        pointHoverRadius: 6,
        showLine: false,
        fill: false,
      },
      ...(showRegression ? [{
        label: 'Regression Line',
        data: processedData.regression,
        backgroundColor: 'transparent',
        borderColor: '#f59e0b',
        borderWidth: 3,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      }] : []),
      ...(showConfidence ? [
        {
          label: 'Upper Confidence',
          data: processedData.confidence.upper,
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.5)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        },
        {
          label: 'Lower Confidence',
          data: processedData.confidence.lower,
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.5)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        }
      ] : []),
    ],
  }), [processedData, showRegression, showConfidence]);

  // Memoize chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'nearest' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        enabled: true,
        mode: 'nearest' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: 'Time Period',
        },
      },
      y: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Value',
        },
      },
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  }), [title]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
});