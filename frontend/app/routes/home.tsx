import type { Route } from "./+types/home";
import { useState } from "react";
import ErrorBoundary from "../../src/components/ErrorBoundary";
import Breadcrumb from "../../src/components/Breadcrumb";
import LoadingSpinner from "../../src/components/LoadingSpinner";
import CombinationGenerator from "../../src/components/CombinationGenerator";
import SumsAnalysis from "../../src/components/SumsAnalysis";
import RootSumsAnalysis from "../../src/components/RootSumsAnalysis";
import SumLastDigitAnalysis from "../../src/components/SumLastDigitAnalysis";
import VTracAnalysis from "../../src/components/VTracAnalysis";
import TypeAnalysis from "../../src/components/TypeAnalysis";
import PairAnalysis from "../../src/components/PairAnalysis";
import SumAnalysisInspector from "../../src/components/SumAnalysisInspector";
import ColumnMapping from "../../src/components/ColumnMapping";
import Deflate from "../../src/components/Deflate";
import Pick3PairsAnalysis from "../../src/components/Pick3PairsAnalysis";
import ColumnTimelines from "../../src/components/ColumnTimelines";
import TransitionAnalysis from "../../src/components/TransitionAnalysis";
import TwoThirdsPredictions from "../../src/components/TwoThirdsPredictions";
import PositionRouting from "../../src/components/PositionRouting";
import LiveScoring from "../../src/components/LiveScoring";
import Top20Predictions from "../../src/components/Top20Predictions";
import WheelRecommendations from "../../src/components/WheelRecommendations";
import ScoreBreakdown from "../../src/components/ScoreBreakdown";
import StrategyTesting from "../../src/components/StrategyTesting";
import PerformanceMetrics from "../../src/components/PerformanceMetrics";
import ParameterTuning from "../../src/components/ParameterTuning";
import HistoricalValidation from "../../src/components/HistoricalValidation";
import DataSyncManager from "../../src/components/DataSyncManager";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Pick 3 Lottery Analyzer" },
    { name: "description", content: "Advanced Pick 3 lottery analysis and prediction system" },
  ];
}

const sections = {
  "Pick 3 Charts": [
    "Combinations",
    "Sums Analysis", 
    "Root Sums",
    "Sum Last Digit",
    "VTrac Analysis"
  ],
  "Inspector 3": [
    "Type Analysis",
    "Pair Analysis", 
    "Sum Analysis",
    "Column Mapping"
  ],
  "Deflate": [
    "Box Consolidation",
    "Filter Application",
    "Set Reduction"
  ],
  "Pairs Analysis": [
    "10×10 Full Pairs",
    "5×9 Unique Pairs",
    "Front/Split/Back Grids",
    "Empty Column Detection"
  ],
  "Column Engine": [
    "Column Timelines",
    "Transition Analysis", 
    "Two-Thirds Predictions",
    "Position Routing"
  ],
  "Scoring Engine": [
    "Live Scoring",
    "Top 20 Predictions",
    "Wheel Recommendations",
    "Score Breakdown"
  ],
  "Backtesting": [
    "Strategy Testing",
    "Performance Metrics",
    "Parameter Tuning",
    "Historical Validation"
  ],
  "Data Management": [
    "Data Sync",
    "Analysis",
    "Statistics"
  ]
};

export default function Home() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSectionClick = (section: string) => {
    setIsLoading(true);
    setActiveSection(section);
    setActiveSubsection(null); // Reset subsection when changing section
    // Simulate loading delay for better UX
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleSubsectionClick = (subsection: string) => {
    setIsLoading(true);
    setActiveSubsection(subsection);
    // Simulate loading delay for better UX
    setTimeout(() => setIsLoading(false), 200);
  };

  // Generate breadcrumb items
  const getBreadcrumbItems = () => {
    const items: Array<{ label: string; href?: string; active?: boolean }> = [
      { label: 'Home', href: '/' }
    ];

    if (activeSection) {
      items.push({ label: activeSection });
    }

    if (activeSubsection) {
      items.push({ label: activeSubsection, active: true });
    }

    return items;
  };

  return (
    <ErrorBoundary>
      <div>
        <nav className="bg-blue-600 text-white p-4 mb-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">🎯 Pick 3 Lottery Analyzer</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              {Object.keys(sections).map((section) => (
                <button
                  key={section}
                  onClick={() => handleSectionClick(section)}
                  className={`hover:text-blue-200 font-medium px-3 py-1 rounded transition-colors ${
                    activeSection === section ? 'bg-blue-700' : ''
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-4">
          {activeSection && (
            <div className="mb-6">
              <Breadcrumb items={getBreadcrumbItems()} />
              <h2 className="text-xl font-semibold mb-4">{activeSection}</h2>
            <div className="flex flex-wrap gap-2">
              {sections[activeSection as keyof typeof sections].map((subsection) => (
                <button
                  key={subsection}
                  onClick={() => handleSubsectionClick(subsection)}
                  className={`px-4 py-2 rounded border ${
                    activeSubsection === subsection 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {subsection}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {activeSection && activeSubsection && (
          <div className="bg-gray-100 p-6 rounded">
            {activeSection === "Pick 3 Charts" && activeSubsection === "Combinations" && (
              <CombinationGenerator />
            )}
            {activeSection === "Pick 3 Charts" && activeSubsection === "Sums Analysis" && (
              <SumsAnalysis />
            )}
            {activeSection === "Pick 3 Charts" && activeSubsection === "Root Sums" && (
              <RootSumsAnalysis />
            )}
            {activeSection === "Pick 3 Charts" && activeSubsection === "Sum Last Digit" && (
              <SumLastDigitAnalysis />
            )}
            {activeSection === "Pick 3 Charts" && activeSubsection === "VTrac Analysis" && (
              <VTracAnalysis />
            )}
            {activeSection === "Inspector 3" && activeSubsection === "Type Analysis" && (
              <TypeAnalysis />
            )}
            {activeSection === "Inspector 3" && activeSubsection === "Pair Analysis" && (
              <PairAnalysis />
            )}
            {activeSection === "Inspector 3" && activeSubsection === "Sum Analysis" && (
              <SumAnalysisInspector />
            )}
            {activeSection === "Inspector 3" && activeSubsection === "Column Mapping" && (
              <ColumnMapping />
            )}
            {activeSection === "Deflate" && activeSubsection === "Box Consolidation" && (
              <Deflate />
            )}
            {activeSection === "Deflate" && activeSubsection === "Filter Application" && (
              <Deflate />
            )}
            {activeSection === "Deflate" && activeSubsection === "Set Reduction" && (
              <Deflate />
            )}
            {activeSection === "Pairs Analysis" && activeSubsection === "10×10 Full Pairs" && (
              <Pick3PairsAnalysis />
            )}
            {activeSection === "Pairs Analysis" && activeSubsection === "5×9 Unique Pairs" && (
              <Pick3PairsAnalysis />
            )}
            {activeSection === "Pairs Analysis" && activeSubsection === "Front/Split/Back Grids" && (
              <Pick3PairsAnalysis />
            )}
            {activeSection === "Pairs Analysis" && activeSubsection === "Empty Column Detection" && (
              <Pick3PairsAnalysis />
            )}
            {activeSection === "Column Engine" && activeSubsection === "Column Timelines" && (
              <ColumnTimelines />
            )}
            {activeSection === "Column Engine" && activeSubsection === "Transition Analysis" && (
              <TransitionAnalysis />
            )}
            {activeSection === "Column Engine" && activeSubsection === "Two-Thirds Predictions" && (
              <TwoThirdsPredictions />
            )}
            {activeSection === "Column Engine" && activeSubsection === "Position Routing" && (
              <PositionRouting />
            )}
            {activeSection === "Scoring Engine" && activeSubsection === "Live Scoring" && (
              <LiveScoring />
            )}
            {activeSection === "Scoring Engine" && activeSubsection === "Top 20 Predictions" && (
              <Top20Predictions />
            )}
            {activeSection === "Scoring Engine" && activeSubsection === "Wheel Recommendations" && (
              <WheelRecommendations />
            )}
            {activeSection === "Scoring Engine" && activeSubsection === "Score Breakdown" && (
              <ScoreBreakdown />
            )}
            {activeSection === "Backtesting" && activeSubsection === "Strategy Testing" && (
              <StrategyTesting />
            )}
            {activeSection === "Backtesting" && activeSubsection === "Performance Metrics" && (
              <PerformanceMetrics />
            )}
            {activeSection === "Backtesting" && activeSubsection === "Parameter Tuning" && (
              <ParameterTuning />
            )}
            {activeSection === "Backtesting" && activeSubsection === "Historical Validation" && (
              <HistoricalValidation />
            )}
            {activeSection === "Data Management" && activeSubsection === "Data Sync" && (
              <DataSyncManager />
            )}
            {activeSection === "Data Management" && activeSubsection === "Analysis" && (
              <DataSyncManager />
            )}
            {activeSection === "Data Management" && activeSubsection === "Statistics" && (
              <DataSyncManager />
            )}
            {!(activeSection === "Pick 3 Charts" && (activeSubsection === "Combinations" || activeSubsection === "Sums Analysis" || activeSubsection === "Root Sums" || activeSubsection === "Sum Last Digit" || activeSubsection === "VTrac Analysis")) &&
             !(activeSection === "Inspector 3" && (activeSubsection === "Type Analysis" || activeSubsection === "Pair Analysis" || activeSubsection === "Sum Analysis" || activeSubsection === "Column Mapping")) &&
             !(activeSection === "Deflate" && (activeSubsection === "Box Consolidation" || activeSubsection === "Filter Application" || activeSubsection === "Set Reduction")) &&
             !(activeSection === "Pairs Analysis" && (activeSubsection === "10×10 Full Pairs" || activeSubsection === "5×9 Unique Pairs" || activeSubsection === "Front/Split/Back Grids" || activeSubsection === "Empty Column Detection")) &&
             !(activeSection === "Column Engine" && (activeSubsection === "Column Timelines" || activeSubsection === "Transition Analysis" || activeSubsection === "Two-Thirds Predictions" || activeSubsection === "Position Routing")) &&
             !(activeSection === "Scoring Engine" && (activeSubsection === "Live Scoring" || activeSubsection === "Top 20 Predictions" || activeSubsection === "Wheel Recommendations" || activeSubsection === "Score Breakdown")) &&
             !(activeSection === "Backtesting" && (activeSubsection === "Strategy Testing" || activeSubsection === "Performance Metrics" || activeSubsection === "Parameter Tuning" || activeSubsection === "Historical Validation")) &&
             !(activeSection === "Data Management" && (activeSubsection === "Data Sync" || activeSubsection === "Analysis" || activeSubsection === "Statistics")) && (
              <>
                <h3 className="text-lg font-medium mb-4">{activeSubsection}</h3>
                <p className="text-gray-600">
                  Content for {activeSubsection} in {activeSection} will be displayed here.
                  This is a placeholder - the actual component will be integrated next.
                </p>
              </>
            )}
          </div>
        )}
        
        {!activeSection && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Pick 3 Lottery Analyzer</h2>
            <p className="text-gray-600 mb-6">
              Select a section from the navigation above to explore different analysis tools and features.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(sections).map((section) => (
                <div 
                  key={section}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSectionClick(section)}
                >
                  <h3 className="font-semibold mb-2">{section}</h3>
                  <p className="text-sm text-gray-600">
                    {sections[section as keyof typeof sections].length} available options
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner message="Loading analysis..." />
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}
