import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceData {
  date: string;
  accuracy: number;
  predictions: number;
  profit: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title?: string;
  height?: number;
  showExport?: boolean;
  onExport?: (imageData: string) => void;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  title = 'Prediction Performance',
  height = 300,
  showExport = false,
  onExport
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  const chartData = {
    labels: data.map(item => new Date(item.date)),
    datasets: [
      {
        label: 'Accuracy (%)',
        data: data.map(item => item.accuracy),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Predictions Count',
        data: data.map(item => item.predictions),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
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
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.datasetIndex === 0) {
              label += context.parsed.y.toFixed(1) + '%';
            } else {
              label += context.parsed.y;
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'MMM dd',
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Accuracy (%)',
          color: '#2563eb',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: function(value: any) {
            return value + '%';
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Predictions',
          color: '#10b981',
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  const handleExport = () => {
    if (chartRef.current && onExport) {
      const imageData = chartRef.current.toBase64Image();
      onExport(imageData);
    }
  };

  return (
    <div className="performance-chart">
      <div className="chart-container" style={{ height: `${height}px` }}>
        <Line
          ref={chartRef}
          data={chartData}
          options={options}
        />
      </div>

      {showExport && (
        <div className="chart-actions">
          <button
            onClick={handleExport}
            className="export-chart-button"
          >
            <span className="export-icon">📊</span>
            Export Chart
          </button>
        </div>
      )}

      <style>{`
        .performance-chart {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #333;
        }

        .chart-container {
          position: relative;
          width: 100%;
        }

        .chart-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #333;
        }

        .export-chart-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .export-chart-button:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .export-icon {
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .performance-chart {
            padding: 12px;
          }

          .chart-actions {
            justify-content: center;
          }

          .export-chart-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};