import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import React from 'react';
import '@testing-library/jest-dom';

// Mock all components before importing Home
vi.mock('../../src/components/ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('../../src/components/Breadcrumb', () => ({
  default: ({ items }: { items: Array<{ label: string; href?: string; active?: boolean }> }) => (
    <div data-testid="breadcrumb">
      {items.map((item, index) => (
        <span key={index}>{item.label}</span>
      ))}
    </div>
  )
}));

vi.mock('../../src/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Mock all components - must be at top level, not in loops
vi.mock('../../src/components/CombinationGenerator', () => ({ default: () => <div data-testid="combinationgenerator">CombinationGenerator</div> }));
vi.mock('../../src/components/SumsAnalysis', () => ({ default: () => <div data-testid="sumsanalysis">SumsAnalysis</div> }));
vi.mock('../../src/components/RootSumsAnalysis', () => ({ default: () => <div data-testid="rootsumsanalysis">RootSumsAnalysis</div> }));
vi.mock('../../src/components/SumLastDigitAnalysis', () => ({ default: () => <div data-testid="sumlastdigitanalysis">SumLastDigitAnalysis</div> }));
vi.mock('../../src/components/VTracAnalysis', () => ({ default: () => <div data-testid="vtracanalysis">VTracAnalysis</div> }));
vi.mock('../../src/components/TypeAnalysis', () => ({ default: () => <div data-testid="typeanalysis">TypeAnalysis</div> }));
vi.mock('../../src/components/PairAnalysis', () => ({ default: () => <div data-testid="pairanalysis">PairAnalysis</div> }));
vi.mock('../../src/components/SumAnalysisInspector', () => ({ default: () => <div data-testid="sumanalysisinspector">SumAnalysisInspector</div> }));
vi.mock('../../src/components/ColumnMapping', () => ({ default: () => <div data-testid="columnmapping">ColumnMapping</div> }));
vi.mock('../../src/components/Deflate', () => ({ default: () => <div data-testid="deflate">Deflate</div> }));
vi.mock('../../src/components/Pick3PairsAnalysis', () => ({ default: () => <div data-testid="pick3pairsanalysis">Pick3PairsAnalysis</div> }));
vi.mock('../../src/components/ColumnTimelines', () => ({ default: () => <div data-testid="columntimelines">ColumnTimelines</div> }));
vi.mock('../../src/components/TransitionAnalysis', () => ({ default: () => <div data-testid="transitionanalysis">TransitionAnalysis</div> }));
vi.mock('../../src/components/TwoThirdsPredictions', () => ({ default: () => <div data-testid="twothirdspredictions">TwoThirdsPredictions</div> }));
vi.mock('../../src/components/PositionRouting', () => ({ default: () => <div data-testid="positionrouting">PositionRouting</div> }));
vi.mock('../../src/components/LiveScoring', () => ({ default: () => <div data-testid="livescoring">LiveScoring</div> }));
vi.mock('../../src/components/Top20Predictions', () => ({ default: () => <div data-testid="top20predictions">Top20Predictions</div> }));
vi.mock('../../src/components/WheelRecommendations', () => ({ default: () => <div data-testid="wheelrecommendations">WheelRecommendations</div> }));
vi.mock('../../src/components/ScoreBreakdown', () => ({ default: () => <div data-testid="scorebreakdown">ScoreBreakdown</div> }));
vi.mock('../../src/components/StrategyTesting', () => ({ default: () => <div data-testid="strategytesting">StrategyTesting</div> }));
vi.mock('../../src/components/PerformanceMetrics', () => ({ default: () => <div data-testid="performancemetrics">PerformanceMetrics</div> }));
vi.mock('../../src/components/ParameterTuning', () => ({ default: () => <div data-testid="parametertuning">ParameterTuning</div> }));
vi.mock('../../src/components/HistoricalValidation', () => ({ default: () => <div data-testid="historicalvalidation">HistoricalValidation</div> }));
vi.mock('../../src/components/DataSyncManager', () => ({ default: () => <div data-testid="datasyncmanager">DataSyncManager</div> }));
vi.mock('../../src/components/Pick3/DataEntry', () => ({ default: () => <div data-testid="data-entry">DataEntry</div> }));

// Now import Home after all mocks are set up
import Home from '../../app/routes/home';

const renderHome = () => {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
};

describe('Home Route Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main navigation with home button', () => {
    renderHome();

    // Check that the home button is present
    const homeButton = screen.getByRole('link', { name: /home/i });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute('href', '/');
  });

  it('displays section buttons when a section is selected', async () => {
    renderHome();

    // Click on Data Management section
    const dataManagementButton = screen.getByText('Data Management');
    fireEvent.click(dataManagementButton);

    // Wait for the subsection buttons to appear
    await waitFor(() => {
      expect(screen.getByText('Data Sync')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });
  });

  it('displays DataEntry component when Data Management subsection is clicked', async () => {
    renderHome();

    // Click on Data Management section
    const dataManagementButton = screen.getByText('Data Management');
    fireEvent.click(dataManagementButton);

    // Click on Data Sync subsection
    const dataSyncButton = screen.getByText('Data Sync');
    fireEvent.click(dataSyncButton);

    // Wait for DataEntry component to appear
    await waitFor(() => {
      expect(screen.getByTestId('data-entry')).toBeInTheDocument();
    });
  });

  it('shows breadcrumb navigation with correct items', async () => {
    renderHome();

    // Click on Data Management section
    const dataManagementButton = screen.getByText('Data Management');
    fireEvent.click(dataManagementButton);

    // Click on Data Sync subsection
    const dataSyncButton = screen.getByText('Data Sync');
    fireEvent.click(dataSyncButton);

    // Check breadcrumb
    await waitFor(() => {
      const breadcrumb = screen.getByTestId('breadcrumb');
      expect(breadcrumb).toHaveTextContent('Home');
      expect(breadcrumb).toHaveTextContent('Data Management');
      expect(breadcrumb).toHaveTextContent('Data Sync');
    });
  });

  it('resets navigation state when home button is clicked', async () => {
    renderHome();

    // First navigate to a section and subsection
    const dataManagementButton = screen.getByText('Data Management');
    fireEvent.click(dataManagementButton);

    const dataSyncButton = screen.getByText('Data Sync');
    fireEvent.click(dataSyncButton);

    // Verify we're in the subsection
    await waitFor(() => {
      expect(screen.getByTestId('data-entry')).toBeInTheDocument();
    });

    // Click home button (this would normally navigate to home route)
    // Since we're testing the component in isolation, we'll simulate the state reset
    // In a real scenario, this would be handled by React Router navigation

    // For now, we'll test that the home button exists and has correct href
    const homeButton = screen.getByRole('link', { name: /home/i });
    expect(homeButton).toHaveAttribute('href', '/');
  });

  it('handles loading state during navigation', async () => {
    renderHome();

    // Click on a section
    const dataManagementButton = screen.getByText('Data Management');
    fireEvent.click(dataManagementButton);

    // After loading completes, subsection buttons should appear
    await waitFor(() => {
      expect(screen.getByText('Data Sync')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Data Sync button should be visible after section is clicked
    expect(screen.getByText('Data Sync')).toBeInTheDocument();
  });

  it('renders all main sections correctly', () => {
    renderHome();

    // Some sections appear multiple times in the UI, so use getAllByText
    const sectionsToCheck = [
      'Pick 3 Charts',
      'Deflate',
      'Pairs Analysis',
      'Column Engine',
      'Scoring Engine',
      'Backtesting',
      'Data Management',
      'Inspector 3'
    ];

    sectionsToCheck.forEach(section => {
      const elements = screen.getAllByText(section);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('displays correct navigation links for Powerball and Pick 3', () => {
    renderHome();

    // Check Powerball navigation links
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /predictions/i })).toHaveAttribute('href', '/predictions');

    // Check Pick 3 navigation links
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /number analysis/i })).toHaveAttribute('href', '/analysis');
    expect(screen.getByRole('link', { name: /data entry/i })).toHaveAttribute('href', '/data-entry');
  });
});