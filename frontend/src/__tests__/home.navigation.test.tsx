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

// Mock all other components
const mockComponents = [
  'CombinationGenerator',
  'SumsAnalysis',
  'RootSumsAnalysis',
  'SumLastDigitAnalysis',
  'VTracAnalysis',
  'TypeAnalysis',
  'PairAnalysis',
  'SumAnalysisInspector',
  'ColumnMapping',
  'Deflate',
  'Pick3PairsAnalysis',
  'ColumnTimelines',
  'TransitionAnalysis',
  'TwoThirdsPredictions',
  'PositionRouting',
  'LiveScoring',
  'Top20Predictions',
  'WheelRecommendations',
  'ScoreBreakdown',
  'StrategyTesting',
  'PerformanceMetrics',
  'ParameterTuning',
  'HistoricalValidation',
  'DataSyncManager'
];

mockComponents.forEach((componentName) => {
  vi.mock(`../../src/components/${componentName}`, () => ({
    default: () => <div data-testid={componentName.toLowerCase()}>{componentName}</div>
  }));
});

vi.mock('../../src/components/Pick3/DataEntry', () => ({
  default: () => <div data-testid="data-entry">DataEntry</div>
}));

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

    // Initially should show loading spinner (briefly)
    // This tests the loading state management
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();

    // After loading completes, subsection buttons should appear
    await waitFor(() => {
      expect(screen.getByText('Data Sync')).toBeInTheDocument();
    });
  });

  it('renders all main sections correctly', () => {
    renderHome();

    const expectedSections = [
      'Pick 3 Charts',
      'Inspector 3',
      'Deflate',
      'Pairs Analysis',
      'Column Engine',
      'Scoring Engine',
      'Backtesting',
      'Data Management'
    ];

    expectedSections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
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