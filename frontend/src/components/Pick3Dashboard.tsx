import React, { useState } from 'react';
import Pick3Overview from './Pick3Overview';
import SumsAnalysis from './SumsAnalysis';
import RootSumsAnalysis from './RootSumsAnalysis';
import VTracAnalysis from './VTracAnalysis';
import CombinationExplorer from './CombinationExplorer';
import SuperPredictorDashboard from './Pick3/SuperPredictorDashboard';

interface Pick3DashboardProps {
  className?: string;
}

const Pick3Dashboard: React.FC<Pick3DashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sums' | 'rootsums' | 'vtrac' | 'explorer' | 'superpredictor'>('overview');

  return (
    <div className={`pick3-dashboard ${className}`}>
      <div className="dashboard-header">
        <h1>Pick 3 Lottery Analysis System</h1>
        <p>Comprehensive mathematical analysis of 3-digit lottery combinations</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'sums' ? 'active' : ''}
          onClick={() => setActiveTab('sums')}
        >
          Sum Analysis
        </button>
        <button
          className={activeTab === 'rootsums' ? 'active' : ''}
          onClick={() => setActiveTab('rootsums')}
        >
          Root Sum Analysis
        </button>
        <button
          className={activeTab === 'vtrac' ? 'active' : ''}
          onClick={() => setActiveTab('vtrac')}
        >
          VTrac Analysis
        </button>
        <button
          className={activeTab === 'explorer' ? 'active' : ''}
          onClick={() => setActiveTab('explorer')}
        >
          Combination Explorer
        </button>
        <button
          className={activeTab === 'superpredictor' ? 'active' : ''}
          onClick={() => setActiveTab('superpredictor')}
        >
          🎯 Super Predictor
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && <Pick3Overview />}
        {activeTab === 'sums' && <SumsAnalysis />}
        {activeTab === 'rootsums' && <RootSumsAnalysis />}
        {activeTab === 'vtrac' && <VTracAnalysis />}
        {activeTab === 'explorer' && <CombinationExplorer />}
        {activeTab === 'superpredictor' && <SuperPredictorDashboard />}
      </div>
    </div>
  );
};

export default Pick3Dashboard;
