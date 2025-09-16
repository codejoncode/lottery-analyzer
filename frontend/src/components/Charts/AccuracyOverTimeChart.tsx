import React, { useState, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { getOptimizedChartOptions, usePerformanceMonitor } from '../../utils/performanceUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface AccuracyData {
  timestamps: Date[];
  accuracy: number[];
  precision: number[];
  recall: number[];
  f1Score: number[];
  sampleSize: number[];
}

interface AccuracyOverTimeChartProps {
  data: AccuracyData;
  title?: string;
  height?: number;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  chartType?: 'line' | 'bar';
}

const MAX_DATA_POINTS = 1000;

const downsampleAccuracyData = (data: AccuracyData, maxPoints: number) => {
  if (data.timestamps.length <= maxPoints) {
    return data;
  }

  const step = Math.ceil(data.timestamps.length / maxPoints);
  const downsampled: AccuracyData = {
    timestamps: [],
    accuracy: [],
    precision: [],
    recall: [],
    f1Score: [],
    sampleSize: []
  };

  for (let i = 0; i < data.timestamps.length; i += step) {
    downsampled.timestamps.push(data.timestamps[i]);
    downsampled.accuracy.push(data.accuracy[i]);
    downsampled.precision.push(data.precision[i]);
    downsampled.recall.push(data.recall[i]);
    downsampled.f1Score.push(data.f1Score[i]);
    downsampled.sampleSize.push(data.sampleSize[i]);
  }

  return downsampled;
};

export const AccuracyOverTimeChart: React.FC<AccuracyOverTimeChartProps> = React.memo(({
  data,
  title = 'Prediction Accuracy Over Time',
  height = 400,
  granularity = 'day',
  chartType = 'line'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'precision' | 'recall' | 'f1Score'>('accuracy');

  // Performance monitoring
  usePerformanceMonitor('AccuracyOverTimeChart');

  // Downsample data for performance
  const processedData = useMemo(() => downsampleAccuracyData(data, MAX_DATA_POINTS), [data]);

  // Memoized utility functions
  const getGranularityUnit = useCallback((gran: string): 'hour' | 'day' | 'week' | 'month' => {
    switch (gran) {
      case 'hour': return 'hour';
      case 'day': return 'day';
      case 'week': return 'week';
      case 'month': return 'month';
      default: return 'day';
    }
  }, []);

  const getMetricData = useCallback(() => {
    switch (selectedMetric) {
      case 'accuracy': return processedData.accuracy;
      case 'precision': return processedData.precision;
      case 'recall': return processedData.recall;
      case 'f1Score': return processedData.f1Score;
      default: return processedData.accuracy;
    }
  }, [selectedMetric, processedData]);

  const getMetricLabel = useCallback(() => {
    switch (selectedMetric) {
      case 'accuracy': return 'Accuracy';
      case 'precision': return 'Precision';
      case 'recall': return 'Recall';
      case 'f1Score': return 'F1 Score';
      default: return 'Accuracy';
    }
  }, [selectedMetric]);

  const getMetricColor = useCallback(() => {
    switch (selectedMetric) {
      case 'accuracy': return '#10b981';
      case 'precision': return '#3b82f6';
      case 'recall': return '#f59e0b';
      case 'f1Score': return '#ef4444';
      default: return '#10b981';
    }
  }, [selectedMetric]);

  // Memoized chart data
  const chartData = useMemo(() => ({
    labels: processedData.timestamps,
    datasets: [
      {
        label: getMetricLabel(),
        data: getMetricData(),
        backgroundColor: chartType === 'bar' ? getMetricColor() : 'transparent',
        borderColor: getMetricColor(),
        borderWidth: 2,
        fill: chartType === 'line',
        tension: 0.4,
        pointRadius: processedData.timestamps.length > 100 ? 0 : 4,
        pointHoverRadius: 6,
        pointBackgroundColor: getMetricColor(),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  }), [processedData, chartType, getMetricLabel, getMetricData, getMetricColor]);

  // Memoized chart options with performance optimizations
  const options = useMemo(() => getOptimizedChartOptions({
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
        text: `${title} (${granularity} view)`,
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
          title: (context: { label: string }[]) => {
            const date = new Date(context[0].label);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
          },
          label: (context: { dataset: { label?: string }; parsed: { y: number } }) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${(value * 100).toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: getGranularityUnit(granularity),
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
          },
        },
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: '#9ca3af',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Score (%)',
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
              return `${(value * 100).toFixed(0)}%`;
            }
            return value;
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        min: 0,
        max: 1,
      },
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
      },
    },
  }), [title, granularity, getGranularityUnit]);  const ChartComponent = chartType === 'bar' ? Bar : Line;

  const handleMetricChange = useCallback((metric: typeof selectedMetric) => {
    setSelectedMetric(metric);
  }, []);

  // Memoized average sample size calculation
  const averageSampleSize = useMemo(() => {
    if (processedData.sampleSize.length === 0) return 0;
    return Math.round(processedData.sampleSize.reduce((a, b) => a + b, 0) / processedData.sampleSize.length);
  }, [processedData.sampleSize]);

  return (
    <div style={{ height: `${height}px`, width: '100%', padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {(['accuracy', 'precision', 'recall', 'f1Score'] as const).map(metric => (
            <button
              key={metric}
              onClick={() => handleMetricChange(metric)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedMetric === metric ? getMetricColor() : '#374151',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: selectedMetric === metric ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
              }}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {(['line', 'bar'] as const).map(type => (
            <button
              key={type}
              disabled={true}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: chartType === type ? '#6b7280' : '#374151',
                color: '#ffffff',
                cursor: 'not-allowed',
                fontSize: '12px',
                fontWeight: chartType === type ? 'bold' : 'normal',
                opacity: chartType === type ? 1 : 0.6,
                transition: 'all 0.2s ease',
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Chart
            </button>
          ))}
        </div>
      </div>
      <ChartComponent data={chartData} options={options} />
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: getMetricColor(),
            borderRadius: chartType === 'bar' ? '2px' : '50%',
            border: '2px solid #ffffff'
          }}></div>
          <span>{getMetricLabel()}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <span>Avg Sample Size: {averageSampleSize}</span>
        </div>
        {processedData.timestamps.length !== data.timestamps.length && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#f59e0b'
          }}>
            <span>⚡ Data downsampled for performance</span>
          </div>
        )}
      </div>
    </div>
  );
});