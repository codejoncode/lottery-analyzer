import React, { useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PatternData {
  pattern: string;
  frequency: number;
  successRate: number;
  totalOccurrences: number;
}

interface PatternDistributionChartProps {
  data: PatternData[];
  title?: string;
  height?: number;
  showSuccessRate?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange';
}

const MAX_DATA_POINTS = 50;

const downsampleData = (data: PatternData[], maxPoints: number) => {
  if (data.length <= maxPoints) {
    return data;
  }

  // Sort by frequency and take top items
  const sorted = [...data].sort((a, b) => b.frequency - a.frequency);
  const topItems = sorted.slice(0, maxPoints - 1);

  // Add "Others" category for remaining items
  const othersFrequency = sorted.slice(maxPoints - 1).reduce((sum, item) => sum + item.frequency, 0);
  const othersSuccessRate = sorted.slice(maxPoints - 1).reduce((sum, item) => sum + item.successRate, 0) / Math.max(1, sorted.slice(maxPoints - 1).length);
  const othersOccurrences = sorted.slice(maxPoints - 1).reduce((sum, item) => sum + item.totalOccurrences, 0);

  return [
    ...topItems,
    {
      pattern: 'Others',
      frequency: othersFrequency,
      successRate: othersSuccessRate,
      totalOccurrences: othersOccurrences
    }
  ];
};

export const PatternDistributionChart: React.FC<PatternDistributionChartProps> = React.memo(({
  data,
  title = 'Pattern Distribution',
  height = 300,
  showSuccessRate = true,
  colorScheme = 'blue'
}) => {
  const chartRef = useRef<ChartJS<'bar'> | null>(null);

  // Memoized color map
  const colorMap = useMemo(() => ({
    blue: {
      primary: '#2563eb',
      secondary: '#60a5fa',
      background: 'rgba(37, 99, 235, 0.1)'
    },
    green: {
      primary: '#10b981',
      secondary: '#34d399',
      background: 'rgba(16, 185, 129, 0.1)'
    },
    purple: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      background: 'rgba(139, 92, 246, 0.1)'
    },
    orange: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      background: 'rgba(245, 158, 11, 0.1)'
    }
  }), []);

  const colors = useMemo(() => colorMap[colorScheme], [colorMap, colorScheme]);

  // Downsample data for performance
  const processedData = useMemo(() => downsampleData(data, MAX_DATA_POINTS), [data]);

  // Memoized chart data
  const chartData = useMemo(() => ({
    labels: processedData.map(item => item.pattern),
    datasets: [
      {
        label: 'Frequency',
        data: processedData.map(item => item.frequency),
        backgroundColor: colors.primary,
        borderColor: colors.secondary,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      ...(showSuccessRate ? [{
        label: 'Success Rate (%)',
        data: processedData.map(item => item.successRate * 100), // Convert to percentage
        backgroundColor: colors.secondary,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        yAxisID: 'y1' as const,
      }] : [])
    ],
  }), [processedData, colors, showSuccessRate]);

  // Memoized chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#ffffff',
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
          label: (context: { dataset: { label?: string }; parsed: { y: number }; datasetIndex: number }) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (context.datasetIndex === 1) {
              return `${label}: ${value.toFixed(1)}%`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        title: {
          display: true,
          text: 'Frequency',
          color: '#ffffff',
        },
      },
      ...(showSuccessRate && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          ticks: {
            color: '#9ca3af',
            callback: (tickValue: string | number, _index: number, _ticks: unknown[]) => {
              if (typeof tickValue === 'number') {
                return `${tickValue}%`;
              }
              return tickValue;
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: 'Success Rate (%)',
            color: '#ffffff',
          },
        }
      })
    },
  }), [title, showSuccessRate]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Bar ref={chartRef} data={chartData} options={options} />
      {processedData.length !== data.length && (
        <div style={{
          textAlign: 'center',
          marginTop: '10px',
          fontSize: '12px',
          color: '#f59e0b'
        }}>
          ⚡ Showing top {MAX_DATA_POINTS - 1} patterns + others for performance
        </div>
      )}
    </div>
  );
});