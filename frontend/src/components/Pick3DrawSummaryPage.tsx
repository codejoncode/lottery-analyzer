import React, { useState, useEffect } from 'react';
import { pick3DataManager, type Pick3Draw } from '../services/Pick3DataManager';

interface Pick3DrawSummaryPageProps {
  selectedDraw?: Pick3Draw;
  onDrawSelect?: (draw: Pick3Draw) => void;
}

const Pick3DrawSummaryPage: React.FC<Pick3DrawSummaryPageProps> = ({
  selectedDraw,
  onDrawSelect
}) => {
  const [draws, setDraws] = useState<Pick3Draw[]>([]);
  const [selectedDrawData, setSelectedDrawData] = useState<Pick3Draw | undefined>(selectedDraw);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDraws();
  }, []);

  useEffect(() => {
    if (selectedDraw) {
      setSelectedDrawData(selectedDraw);
    }
  }, [selectedDraw]);

  const loadDraws = () => {
    try {
      const allDraws = pick3DataManager.getDraws();
      // Show last 50 draws, sorted by date descending
      const recentDraws = allDraws
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);
      setDraws(recentDraws);
    } catch (error) {
      console.error('Error loading Pick 3 draws:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawClick = (draw: Pick3Draw) => {
    setSelectedDrawData(draw);
    if (onDrawSelect) {
      onDrawSelect(draw);
    }
  };

  const renderDrawCard = (draw: Pick3Draw, index: number) => {
    const midday = draw.midday;
    const evening = draw.evening;

    return (
      <div
        key={index}
        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
          selectedDrawData?.date === draw.date
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleDrawClick(draw)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">{draw.date}</span>
          <div className="flex gap-2">
            {midday && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Midday</span>}
            {evening && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Evening</span>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {midday && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Midday:</span>
              <div className="flex gap-1">
                {midday.split('').map((digit, idx) => (
                  <span
                    key={idx}
                    className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold"
                  >
                    {digit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {evening && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Evening:</span>
              <div className="flex gap-1">
                {evening.split('').map((digit, idx) => (
                  <span
                    key={idx}
                    className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold"
                  >
                    {digit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetailedAnalysis = () => {
    if (!selectedDrawData) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Draw</h3>
          <p className="text-gray-600">Click on any draw from the list to see detailed analysis</p>
        </div>
      );
    }

    const midday = selectedDrawData.midday;
    const evening = selectedDrawData.evening;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Draw Analysis: {selectedDrawData.date}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {midday && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-green-700">Midday Draw</h4>
              <div className="flex gap-2 mb-3">
                {midday.split('').map((digit, idx) => (
                  <div key={idx} className="text-center">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-1">
                      {digit}
                    </div>
                    <div className="text-xs text-gray-600">
                      {idx === 0 ? 'Hundreds' : idx === 1 ? 'Tens' : 'Units'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <p>Sum: {midday.split('').reduce((sum, digit) => sum + parseInt(digit), 0)}</p>
                <p>Number: {midday}</p>
              </div>
            </div>
          )}

          {evening && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-orange-700">Evening Draw</h4>
              <div className="flex gap-2 mb-3">
                {evening.split('').map((digit, idx) => (
                  <div key={idx} className="text-center">
                    <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-1">
                      {digit}
                    </div>
                    <div className="text-xs text-gray-600">
                      {idx === 0 ? 'Hundreds' : idx === 1 ? 'Tens' : 'Units'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <p>Sum: {evening.split('').reduce((sum, digit) => sum + parseInt(digit), 0)}</p>
                <p>Number: {evening}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Total Draws</div>
              <div className="text-lg">{pick3DataManager.getDataStats().totalDraws}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Complete Draws</div>
              <div className="text-lg">{pick3DataManager.getDataStats().completeDraws}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Complete Draws</div>
              <div className="text-lg">{pick3DataManager.getDataStats().completeDraws}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Incomplete Draws</div>
              <div className="text-lg">{pick3DataManager.getDataStats().incompleteDraws}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pick 3 Draw Summary</h1>
          <p className="text-gray-600">Review recent Indiana Daily 3 draws and detailed analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Draws</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {draws.length > 0 ? (
                  draws.map((draw, index) => renderDrawCard(draw, index))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📭</div>
                    <p className="text-gray-600">No Pick 3 draws found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Use the Data Entry page to add draws or load sample data
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Analysis</h2>
              {renderDetailedAnalysis()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pick3DrawSummaryPage;