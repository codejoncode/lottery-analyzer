import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExportData {
  [key: string]: string | number | boolean | null | undefined;
}

interface DataExporterProps {
  data: ExportData[];
  filename?: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export const DataExporter: React.FC<DataExporterProps> = ({
  data,
  filename = 'export',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');

  const exportToCSV = (data: ExportData[], filename: string) => {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Get all unique keys from the data
    const headers = Array.from(
      new Set(data.flatMap(item => Object.keys(item)))
    );

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: ExportData[], filename: string) => {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate and download file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToJSON = (data: ExportData[], filename: string) => {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (isExporting || data.length === 0) return;

    setIsExporting(true);
    onExportStart?.();

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fullFilename = `${filename}_${timestamp}`;

      switch (exportFormat) {
        case 'csv':
          exportToCSV(data, fullFilename);
          break;
        case 'xlsx':
          exportToExcel(data, fullFilename);
          break;
        case 'json':
          exportToJSON(data, fullFilename);
          break;
        default:
          throw new Error(`Unsupported export format: ${exportFormat}`);
      }

      onExportComplete?.();
    } catch (error) {
      console.error('Export failed:', error);
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="data-exporter">
      <div className="export-controls">
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx' | 'json')}
          className="format-select"
          disabled={isExporting}
        >
          <option value="csv">CSV</option>
          <option value="xlsx">Excel</option>
          <option value="json">JSON</option>
        </select>

        <button
          onClick={handleExport}
          disabled={isExporting || data.length === 0}
          className="export-button"
        >
          {isExporting ? (
            <>
              <span className="loading-spinner"></span>
              Exporting...
            </>
          ) : (
            <>
              <span className="export-icon">📊</span>
              Export Data ({data.length} rows)
            </>
          )}
        </button>
      </div>

      {data.length === 0 && (
        <div className="no-data-message">
          No data available for export
        </div>
      )}

      <style>{`
        .data-exporter {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .export-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .format-select {
          padding: 8px 12px;
          border: 1px solid #333;
          border-radius: 6px;
          background: #1a1a1a;
          color: #ffffff;
          font-size: 14px;
          min-width: 100px;
        }

        .format-select:focus {
          outline: none;
          border-color: #2563eb;
        }

        .export-button {
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

        .export-button:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .export-button:disabled {
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

        .export-icon {
          font-size: 16px;
        }

        .no-data-message {
          color: #9ca3af;
          font-size: 14px;
          text-align: center;
          padding: 16px;
          background: #111111;
          border-radius: 6px;
          border: 1px solid #333;
        }

        @media (max-width: 768px) {
          .export-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .format-select {
            flex: 1;
          }

          .export-button {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};