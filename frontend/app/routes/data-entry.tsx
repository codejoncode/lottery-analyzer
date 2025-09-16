import DataEntry from "../../src/components/Pick3/DataEntry";
import { Link } from "react-router";

export function meta() {
  return [
    { title: "Data Entry - Indiana Daily 3" },
    { name: "description", content: "Manually enter Indiana Daily 3 lottery draw data" },
  ];
}

export default function DataEntryPage() {
  return (
    <div>
      <nav className="bg-blue-600 text-white p-4 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">📝 Indiana Daily 3 Data Entry</h1>
          <div className="space-x-4 text-sm">
            <Link to="/" className="hover:text-blue-200">Home</Link>
            <Link to="/analysis" className="hover:text-blue-200">Analysis</Link>
            <Link to="/inspector3" className="hover:text-blue-200">Inspector 3</Link>
            <Link to="/deflate" className="hover:text-blue-200">Deflate</Link>
            <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
            <Link to="/predictions" className="hover:text-blue-200">Predictions</Link>
            <Link to="/scoring" className="hover:text-blue-200">Scoring</Link>
            <Link to="/combinations" className="hover:text-blue-200">Combinations</Link>
            <Link to="/pairs" className="hover:text-blue-200">Pairs</Link>
            <Link to="/triples" className="hover:text-blue-200">Triples</Link>
            <Link to="/grid" className="hover:text-blue-200">Grid</Link>
            <Link to="/skip" className="hover:text-blue-200">Skip</Link>
            <Link to="/column-engine" className="hover:text-blue-200">Column Engine</Link>
            <Link to="/skip-tracker" className="hover:text-blue-200">Skip Tracker</Link>
            <Link to="/pick3-scoring" className="hover:text-blue-200">Pick3 Scoring</Link>
            <Link to="/pick3-backtesting" className="hover:text-blue-200">Backtesting</Link>
            <Link to="/column-analysis" className="hover:text-blue-200">Column Analysis</Link>
            <Link to="/draw-summary" className="hover:text-blue-200">Draw Summary</Link>
            <Link to="/pick3-pairs" className="hover:text-blue-200">Pick3 Pairs</Link>
          </div>
        </div>
      </nav>
      <DataEntry />
    </div>
  );
}