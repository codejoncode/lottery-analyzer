import React, { useState } from 'react';

interface EducationalContentProps {
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

const EducationalContent: React.FC<EducationalContentProps> = ({ currentStep = 0, onStepChange }) => {
  const [activeTab, setActiveTab] = useState<'methodology' | 'tutorials' | 'transparency'>('methodology');

  const methodologySteps = [
    {
      title: '🎯 Understanding Lottery Prediction',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Lottery prediction isn't about predicting the future with certainty, but about making statistically informed decisions based on historical patterns.
          </p>
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Key Concept: Partial Certainty</h4>
            <p className="text-blue-800 text-sm">
              Instead of trying to predict all 6 numbers perfectly (1 in 292 million chance), we focus on predicting subsets with higher probability:
            </p>
            <ul className="text-blue-800 text-sm mt-2 space-y-1">
              <li>• 3 of 5 white balls (much higher probability)</li>
              <li>• Sum ranges based on historical trends</li>
              <li>• Hot/cold number patterns</li>
              <li>• Positional and frequency analysis</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: '🔥 Hot/Cold Analysis',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Numbers can be classified as "hot" (recently drawn frequently) or "cold" (not drawn recently). This helps identify patterns in number selection.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-md">
              <h4 className="font-medium text-red-900 mb-2">🔥 Hot Numbers</h4>
              <ul className="text-red-800 text-sm space-y-1">
                <li>• Drawn frequently in recent draws</li>
                <li>• Higher probability of appearing soon</li>
                <li>• Often part of winning combinations</li>
                <li>• Good for inclusion in predictions</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">🧊 Cold Numbers</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Not drawn recently</li>
                <li>• Due for appearance (regression to mean)</li>
                <li>• Can create "surprise" combinations</li>
                <li>• Useful for diversification</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '📍 Draw Location Analysis',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Lottery draws follow patterns in their sum totals and distribution. Understanding these patterns helps constrain the prediction space.
          </p>
          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="font-medium text-green-900 mb-2">Sum Range Analysis</h4>
            <p className="text-green-800 text-sm mb-3">
              Historical draw sums typically fall within predictable ranges:
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Typical Range:</span> 120-180
              </div>
              <div>
                <span className="font-medium">Average Sum:</span> ~150
              </div>
              <div>
                <span className="font-medium">Low Frequency:</span> &lt; 120
              </div>
              <div>
                <span className="font-medium">High Frequency:</span> &gt; 180
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '🧮 Scoring System',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Our composite scoring system evaluates combinations based on multiple factors to identify the most promising predictions.
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium">Recurrence Score</span>
              <span className="text-sm text-gray-600">How often numbers appear</span>
              <span className="text-blue-600 font-bold">25%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium">Skip Score</span>
              <span className="text-sm text-gray-600">Recent appearance patterns</span>
              <span className="text-green-600 font-bold">20%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium">Pair Score</span>
              <span className="text-sm text-gray-600">Common number pairs</span>
              <span className="text-purple-600 font-bold">30%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium">Location Score</span>
              <span className="text-sm text-gray-600">Sum range alignment</span>
              <span className="text-orange-600 font-bold">25%</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const tutorials = [
    {
      title: '🎯 Getting Started',
      steps: [
        'Load historical draw data using the Data Manager',
        'Run initial analysis to understand patterns',
        'Generate your first set of predictions',
        'Review and understand the scoring breakdown'
      ]
    },
    {
      title: '🔧 Using Filters',
      steps: [
        'Set sum range (120-180 recommended)',
        'Choose odd/even balance (2-4 odds typical)',
        'Select high/low distribution',
        'Apply skip count filters (0-3 skips)',
        'Generate filtered predictions'
      ]
    },
    {
      title: '📊 Understanding Results',
      steps: [
        'Review top-scoring combinations',
        'Analyze score breakdown for each prediction',
        'Check hot/cold number distribution',
        'Validate against historical patterns',
        'Make informed selection decisions'
      ]
    }
  ];

  const renderMethodology = () => (
    <div className="space-y-6">
      {methodologySteps.map((step, index) => (
        <div key={index} className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
            <span className="text-sm text-gray-500">Step {index + 1}</span>
          </div>
          {step.content}
        </div>
      ))}
    </div>
  );

  const renderTutorials = () => (
    <div className="space-y-6">
      {tutorials.map((tutorial, index) => (
        <div key={index} className="border rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{tutorial.title}</h3>
          <ol className="space-y-3">
            {tutorial.steps.map((step, stepIndex) => (
              <li key={stepIndex} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  {stepIndex + 1}
                </span>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );

  const renderTransparency = () => (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🔍 Algorithm Transparency</h3>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">How Predictions Are Generated</h4>
            <ol className="text-gray-700 text-sm space-y-2">
              <li>1. <strong>Data Analysis:</strong> Historical patterns are analyzed for frequency, skips, and trends</li>
              <li>2. <strong>Filter Application:</strong> User-defined filters reduce the possible combination space</li>
              <li>3. <strong>Smart Generation:</strong> Combinations are generated using combinatorial algorithms</li>
              <li>4. <strong>Scoring:</strong> Each combination receives a composite score based on multiple factors</li>
              <li>5. <strong>Ranking:</strong> Combinations are sorted by score and presented to the user</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Statistical Foundation</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Based on historical frequency analysis (not random guessing)</li>
              <li>• Uses statistical measures like standard deviation and correlation</li>
              <li>• Incorporates regression to mean principles</li>
              <li>• Validates predictions against historical data through backtesting</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-md">
            <h4 className="font-medium text-yellow-900 mb-2">Limitations & Expectations</h4>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• Cannot guarantee wins (lottery is inherently random)</li>
              <li>• Improves odds through statistical analysis, not magic</li>
              <li>• Performance depends on quality and quantity of historical data</li>
              <li>• Regular backtesting helps refine and improve predictions</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-md">
            <div className="text-2xl font-bold text-green-600">15-20%</div>
            <div className="text-sm text-green-800">Expected 2+ Number Hits</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-md">
            <div className="text-2xl font-bold text-blue-600">3-5%</div>
            <div className="text-sm text-blue-800">Expected 3+ Number Hits</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-md">
            <div className="text-2xl font-bold text-purple-600">&lt; 1%</div>
            <div className="text-sm text-purple-800">Expected 4+ Number Hits</div>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-4">
          These are statistical expectations based on historical backtesting. Actual results may vary.
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📚 Educational Resources</h2>
        <div className="text-sm text-gray-600">
          Learn how the system works
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'methodology', name: '🎯 Methodology', description: 'How the system works' },
            { id: 'tutorials', name: '📋 Tutorials', description: 'Step-by-step guides' },
            { id: 'transparency', name: '🔍 Transparency', description: 'Algorithm details' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'methodology' && renderMethodology()}
        {activeTab === 'tutorials' && renderTutorials()}
        {activeTab === 'transparency' && renderTransparency()}
      </div>
    </div>
  );
};

export default EducationalContent;
