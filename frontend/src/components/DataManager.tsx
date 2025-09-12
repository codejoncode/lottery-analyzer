import React, { useState, useRef } from 'react';
import {
  validateDrawData,
  exportDrawData,
  importDrawData,
  suggestDataRepairs,
  type DataValidationResult,
  type DataExportOptions
} from '../utils/dataLoader';
import type { Draw } from '../utils/scoringSystem';

interface DataManagerProps {
  draws: Draw[];
  onDataUpdate: (newDraws: Draw[]) => void;
}

const DataManager: React.FC<DataManagerProps> = ({ draws, onDataUpdate }) => {
  const [validationResult, setValidationResult] = useState<DataValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<DataExportOptions>({
    format: 'csv',
    includeMetadata: true,
    compress: false
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleValidateData = async () => {
    setIsValidating(true);
    try {
      const result = validateDrawData(draws);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const options: DataExportOptions = {
        ...exportOptions,
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined
      };

      const data = exportDrawData(draws, options);
      const blob = new Blob([data], {
        type: options.format === 'csv' ? 'text/csv' : 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `powerball-data-${new Date().toISOString().split('T')[0]}.${options.format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const importedDraws = await importDrawData(file);
      if (importedDraws.length > 0) {
        onDataUpdate([...draws, ...importedDraws]);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const clearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      onDataUpdate([]);
      setValidationResult(null);
    }
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (count: number) => {
    if (count === 0) return 'text-green-600';
    if (count <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">� Data Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleValidateData}
            disabled={isValidating}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isValidating ? '� Validating...' : '🔍 Validate Data'}
          </button>
          <button
            onClick={handleExportData}
            disabled={isExporting || draws.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isExporting ? '📤 Exporting...' : '� Export Data'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {isImporting ? '📥 Importing...' : '📁 Import Data'}
          </button>
          <button
            onClick={clearData}
            disabled={draws.length === 0}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            🗑️ Clear Data
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.json"
        onChange={handleImportData}
        className="hidden"
      />

      {/* Data Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{draws.length.toLocaleString()}</div>
          <div className="text-sm text-blue-800">Total Draws</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {draws.length > 0 ? new Date(Math.min(...draws.map(d => new Date(d.date).getTime()))).toLocaleDateString() : 'N/A'}
          </div>
          <div className="text-sm text-green-800">Earliest Date</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {draws.length > 0 ? new Date(Math.max(...draws.map(d => new Date(d.date).getTime()))).toLocaleDateString() : 'N/A'}
          </div>
          <div className="text-sm text-purple-800">Latest Date</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">
            {draws.length > 0 ? Math.round(draws.length / ((new Date().getTime() - new Date(Math.min(...draws.map(d => new Date(d.date).getTime()))).getTime()) / (1000 * 60 * 60 * 24 * 365))) : 0}
          </div>
          <div className="text-sm text-orange-800">Draws/Year</div>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">� Validation Results</h3>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className={`p-4 rounded-lg ${getStatusColor(validationResult.isValid)}`}>
              <div className="text-lg font-medium">
                {validationResult.isValid ? '✅ Valid' : '❌ Invalid'}
              </div>
              <div className="text-sm">Data Status</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className={`text-lg font-medium ${getSeverityColor(validationResult.errors.length)}`}>
                {validationResult.errors.length}
              </div>
              <div className="text-sm">Errors</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className={`text-lg font-medium ${getSeverityColor(validationResult.warnings.length)}`}>
                {validationResult.warnings.length}
              </div>
              <div className="text-sm">Warnings</div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-red-800 font-medium mb-2">❌ Errors ({validationResult.errors.length})</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  {validationResult.errors.slice(0, 10).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {validationResult.errors.length > 10 && (
                    <li className="italic">... and {validationResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-yellow-800 font-medium mb-2">⚠️ Warnings ({validationResult.warnings.length})</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  {validationResult.warnings.slice(0, 10).map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                  {validationResult.warnings.length > 10 && (
                    <li className="italic">... and {validationResult.warnings.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Repair Suggestions */}
            {suggestDataRepairs(validationResult).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-blue-800 font-medium mb-2">💡 Repair Suggestions</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  {suggestDataRepairs(validationResult).map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import/Export Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">📤 Import/Export Data</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Export Options</h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'csv' | 'json' }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeMetadata"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="includeMetadata" className="text-sm">Include metadata (sum, parity, etc.)</label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Import Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Import Data</h4>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-sm mb-2">Supported Formats:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CSV: Date,White Balls,Red Ball,Power Play</li>
                  <li>• JSON: Array of draw objects</li>
                  <li>• TXT: Same format as CSV</li>
                </ul>
              </div>

              {isImporting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-blue-800">Importing data...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManager;
