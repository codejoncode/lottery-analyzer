import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';

interface ReportData {
  title: string;
  date: string;
  summary: {
    totalPredictions: number;
    accuracy: number;
    bestPerforming: string;
    totalProfit: number;
  };
  chartData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
  };
  predictions: Array<{
    date: string;
    prediction: string;
    actual: string;
    result: 'win' | 'loss' | 'pending';
    confidence: number;
  }>;
}

interface PDFReportProps {
  data: ReportData;
  filename?: string;
  onGenerateStart?: () => void;
  onGenerateComplete?: () => void;
  onGenerateError?: (error: Error) => void;
}

export const PDFReport: React.FC<PDFReportProps> = ({
  data,
  filename = 'prediction-report',
  onGenerateStart,
  onGenerateComplete,
  onGenerateError
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateChartImage = (chartData: ReportData['chartData']): Promise<string> => {
    return new Promise((resolve, _reject) => {
      if (!chartData || !canvasRef.current) {
        resolve('');
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      // Simple chart rendering (you can enhance this with a proper charting library)
      const width = 400;
      const height = 200;
      canvas.width = width;
      canvas.height = height;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw simple bar chart
      const maxValue = Math.max(...chartData.datasets[0].data);
      const barWidth = width / chartData.labels.length - 10;

      chartData.labels.forEach((label, index) => {
        const value = chartData.datasets[0].data[index];
        const barHeight = (value / maxValue) * (height - 40);
        const x = index * (barWidth + 10) + 5;
        const y = height - barHeight - 20;

        // Draw bar
        ctx.fillStyle = chartData.datasets[0].backgroundColor || '#2563eb';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw label
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth / 2, height - 5);

        // Draw value
        ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
      });

      resolve(canvas.toDataURL('image/png'));
    });
  };

  const generatePDF = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    onGenerateStart?.();

    try {
      const pdf = new jsPDF();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.title, 20, yPosition);
      yPosition += 15;

      // Date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${data.date}`, 20, yPosition);
      yPosition += 20;

      // Summary Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const summaryLines = [
        `Total Predictions: ${data.summary.totalPredictions}`,
        `Accuracy: ${(data.summary.accuracy * 100).toFixed(1)}%`,
        `Best Performing: ${data.summary.bestPerforming}`,
        `Total Profit: $${data.summary.totalProfit.toFixed(2)}`
      ];

      summaryLines.forEach(line => {
        pdf.text(line, 25, yPosition);
        yPosition += 8;
      });

      yPosition += 10;

      // Chart (if available)
      if (data.chartData) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Performance Chart', 20, yPosition);
        yPosition += 10;

        const chartImage = await generateChartImage(data.chartData);
        if (chartImage) {
          pdf.addImage(chartImage, 'PNG', 20, yPosition, 170, 80);
          yPosition += 90;
        }
      }

      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      // Predictions Table
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recent Predictions', 20, yPosition);
      yPosition += 10;

      // Table headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const headers = ['Date', 'Prediction', 'Actual', 'Result', 'Confidence'];
      const columnWidths = [25, 35, 35, 25, 25];
      let xPosition = 20;

      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });

      yPosition += 5;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      data.predictions.slice(0, 15).forEach(prediction => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }

        xPosition = 20;
        const rowData = [
          prediction.date,
          prediction.prediction,
          prediction.actual,
          prediction.result.toUpperCase(),
          `${prediction.confidence}%`
        ];

        rowData.forEach((cell, index) => {
          pdf.text(cell, xPosition, yPosition);
          xPosition += columnWidths[index];
        });

        yPosition += 6;
      });

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Generated by Super Predictor - Page ${i} of ${pageCount}`,
          20,
          pdf.internal.pageSize.height - 10
        );
      }

      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`${filename}_${timestamp}.pdf`);

      onGenerateComplete?.();
    } catch (error) {
      console.error('PDF generation failed:', error);
      onGenerateError?.(error as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="pdf-report">
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="generate-pdf-button"
      >
        {isGenerating ? (
          <>
            <span className="loading-spinner"></span>
            Generating PDF...
          </>
        ) : (
          <>
            <span className="pdf-icon">📄</span>
            Generate PDF Report
          </>
        )}
      </button>

      {/* Hidden canvas for chart generation */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <style>{`
        .pdf-report {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .generate-pdf-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          align-self: flex-start;
        }

        .generate-pdf-button:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .generate-pdf-button:disabled {
          background: #374151;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .pdf-icon {
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .generate-pdf-button {
            align-self: stretch;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};