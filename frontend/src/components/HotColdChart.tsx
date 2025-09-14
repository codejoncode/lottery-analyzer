import React, { useState, useEffect } from 'react';
import { HotColdAnalyzer } from '../prediction-engine/analysis/HotColdAnalyzer';
import type { Draw } from '../utils/scoringSystem';
import type { HotColdAnalysis } from '../prediction-engine/types';

interface HotColdChartProps {
  draws: Draw[];
}

const HotColdChart: React.FC<HotColdChartProps> = ({ draws }) => {
  const [hotColdAnalyzer] = useState(() => new HotColdAnalyzer(draws));
  const [selectedRange, setSelectedRange] = useState(30);
  const [hotNumbers, setHotNumbers] = useState<HotColdAnalysis[]>([]);
  const [coldNumbers, setColdNumbers] = useState<HotColdAnalysis[]>([]);
  const [heatDistribution, setHeatDistribution] = useState<{ range: string; count: number }[]>([]);

  useEffect(() => {
    updateAnalysis();
  }, [draws, selectedRange]);

  const updateAnalysis = () => {
    const hot = hotColdAnalyzer.getHotNumbers(15);
    const cold = hotColdAnalyzer.getColdNumbers(15);
    const heatDist = hotColdAnalyzer.getHeatDistribution();

    setHotNumbers(hot);
    setColdNumbers(cold);
    setHeatDistribution(heatDist);
  };

  const getHeatTextColor = (status: string): string => {
    switch (status) {
      case 'hot': return 'text-red-600';
      case 'warm': return 'text-yellow-600';
      case 'cold': return 'text-blue-600';
      case 'frozen': return 'text-gray-300';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🔥 Hot/Cold Analysis</h2>
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(Number(e.target.value))}
          className="px-3 py-2 border rounded-md"
        >
          <option value={10}>Last 10 draws</option>
          <option value={30}>Last 30 draws</option>
          <option value={50}>Last 50 draws</option>
          <option value={100}>Last 100 draws</option>
        </select>
      </div>

      {/* Heat Distribution Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Heat Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {heatDistribution.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-gray-900">{item.count}</div>
              <div className="text-sm text-gray-600">{item.range}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(item.count / Math.max(...heatDistribution.map(h => h.count))) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hot Numbers */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-red-600">🔥 Hottest Numbers</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {hotNumbers.slice(0, 15).map((number, index) => (
            <div key={index} className="text-center p-3 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="text-2xl font-bold text-red-600">{number.number}</div>
              <div className="text-xs text-red-500 mt-1">
                Heat: {number.heatScore?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                Skip: {number.skipCount || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cold Numbers */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-blue-600">🧊 Coldest Numbers</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {coldNumbers.slice(0, 15).map((number, index) => (
            <div key={index} className="text-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{number.number}</div>
              <div className="text-xs text-blue-500 mt-1">
                Heat: {number.heatScore?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                Skip: {number.skipCount || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Number Status Overview */}
      <div>
        <h3 className="text-lg font-medium mb-4">Number Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">By Status</h4>
            <div className="space-y-2">
              {['hot', 'warm', 'cold', 'frozen'].map(status => {
                const count = hotColdAnalyzer.getNumbersByStatus(status as 'hot' | 'warm' | 'cold' | 'frozen').length;
                return (
                  <div key={status} className="flex justify-between items-center">
                    <span className={`capitalize ${getHeatTextColor(status)}`}>{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Statistics</h4>
            <div className="space-y-2">
              {(() => {
                const stats = hotColdAnalyzer.getStatistics();
                return (
                  <>
                    <div className="flex justify-between">
                      <span>Average Skip:</span>
                      <span className="font-medium">{stats.averageSkipCount?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Heat:</span>
                      <span className="font-medium">{stats.averageHeatScore?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Numbers:</span>
                      <span className="font-medium">{stats.totalNumbers || 'N/A'}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotColdChart;
