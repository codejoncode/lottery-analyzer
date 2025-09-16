# Lottery Analyzer - AI Coding Assistant Guide

## Project Overview
This is a full-stack TypeScript lottery analysis application with React frontend and Express.js backend. The system analyzes Pick3 and Powerball lottery data using advanced statistical methods, pattern recognition, and predictive algorithms.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19 with React Router v7
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Testing**: Vitest with jsdom
- **Path Aliases**: `@/` maps to `src/`, `~/*` maps to `app/*`

### Backend (Node.js + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for live updates
- **Path Aliases**: `@/*` maps to `src/`

## Key Components & Data Flow

### Core Services (`src/services/`)
- **DataInitializationService**: Orchestrates data loading and synchronization
- **Pick3DataSyncService**: Manages data fetching, caching, and updates
- **Pick3DataManager**: Core data storage and retrieval
- **Pick3DataProcessor**: Analysis engine for patterns, predictions, and backtesting

### Data Structures
```typescript
interface Pick3Draw {
  date: string;
  midday: string;  // "123"
  evening: string; // "456"
}

interface ColumnData {
  position: number; // 0=hundreds, 1=tens, 2=units
  digit: number;
  frequency: number;
  skipCount: number;
  hotStreak: number;
}
```

## Critical Patterns & Conventions

### Lottery Analysis Algorithms
- **VTrac Mapping**: `0→5, 1→1, 2→2, 3→3, 4→4, 5→0, 6→6, 7→7, 8→8, 9→9`
- **Root Sum**: Digital root of sum (e.g., 1+2+3=6, root=6)
- **Box/Straight**: Box treats `123` same as `132`, Straight requires exact order
- **Skip Analysis**: Tracks how many draws since digit last appeared

### Component Patterns
```typescript
// Performance optimization with React.memo
export const AnalyticsDashboard: React.FC<Props> = React.memo(({ className = '' }) => {
  // Component logic
});

// State management with custom hooks
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
```

### Service Layer Pattern
```typescript
// DataManager handles storage
class Pick3DataManager {
  private draws: Pick3Draw[] = [];
  getDataStats(): { totalDraws: number; dateRange: string } {
    // Implementation
  }
}

// Processor handles analysis
class Pick3DataProcessor {
  constructor(draws: Pick3Draw[]) { /* ... */ }
  analyzePatterns(): PatternAnalysis {
    // Complex analysis logic
  }
}
```

## Development Workflows

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Start dev server
npm run build        # Production build
npm test            # Run Vitest tests
npm run lint        # ESLint check
npm run typecheck   # TypeScript check
```

### Backend Development
```bash
cd backend
npm install
npm run dev         # ts-node with watch mode
npm run build       # Compile to dist/
npm start           # Production server
```

### Data Synchronization
- **Extended Historical**: Loads 2000-present data on first run
- **Missing Data Sync**: Fills gaps in existing data
- **Latest Data Sync**: Updates with recent draws
- **Real-time Updates**: WebSocket broadcasts for live analysis

## Code Quality Standards

### TypeScript Configuration
- **Strict Mode**: Enabled in both frontend/backend
- **Path Mapping**: `@/` aliases for clean imports
- **ES2022 Target**: Modern JavaScript features
- **Source Maps**: Enabled for debugging

### ESLint Rules
- **Zero Warnings Policy**: All unused variables prefixed with `_`
- **React Best Practices**: Proper key props, effect dependencies
- **TypeScript Rules**: Strict type checking enabled

### Testing
- **Vitest**: Fast unit testing with jsdom environment
- **Test Coverage**: Critical paths fully tested
- **Mocking**: External APIs and services mocked

## Integration Points

### External Dependencies
- **Chart.js**: Data visualization with date-fns adapter
- **ML Libraries**: ml-matrix, ml-regression for statistical analysis
- **WebSocket**: Real-time data updates and predictions
- **MongoDB**: Persistent storage for predictions and analytics

### API Endpoints
```
GET  /api/v1/data/draws          # Lottery draw data
POST /api/v1/predictions         # Generate predictions
GET  /api/v1/analytics/patterns  # Pattern analysis
WS   /analytics                  # Real-time updates
```

## Common Patterns

### Error Handling
```typescript
try {
  const result = await service.processData();
  if (!result.success) {
    console.error('Processing failed:', result.errors);
    return;
  }
} catch (error) {
  console.error('Unexpected error:', error);
  // Graceful degradation
}
```

### Caching Strategy
```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cached = this.getCachedData();
if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
  return cached.data;
}
```

### Performance Optimization
- **React.memo**: For expensive re-renders
- **useMemo/useCallback**: For computed values and event handlers
- **Lazy Loading**: Components loaded on demand
- **Memory Management**: Automatic cleanup of old cached data

## File Organization

### Frontend Structure
```
src/
├── components/          # React components
│   ├── Pick3/          # Lottery-specific components
│   └── Charts/         # Visualization components
├── services/           # Business logic and API calls
├── utils/              # Pure utility functions
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

### Backend Structure
```
backend/
├── routes/             # API route handlers
├── services/           # Business logic
├── models/             # MongoDB schemas
├── middleware/         # Express middleware
└── utils/              # Utility functions
```

## Key Files to Reference

### Core Analysis Engines
- `src/utils/pick3Analyzer.ts` - Mathematical analysis algorithms
- `src/services/Pick3DataProcessor.ts` - Data processing and predictions
- `src/services/Pick3DataManager.ts` - Data storage and retrieval

### Architecture Examples
- `src/services/DataInitializationService.ts` - Service orchestration
- `src/components/AnalyticsDashboard.tsx` - Complex component with caching
- `backend/server.ts` - Server setup with WebSocket integration

### Configuration
- `frontend/tsconfig.json` - Frontend TypeScript config
- `backend/tsconfig.json` - Backend TypeScript config
- `frontend/vitest.config.ts` - Testing configuration

Remember: This codebase emphasizes mathematical accuracy, performance optimization, and real-time data processing. Always validate lottery algorithms against known mathematical principles and maintain the zero-ESLint-warnings standard.</content>
<parameter name="filePath">c:\users\jonat\documents\codejoncode\lottery-analyzer\.github\copilot-instructions.md