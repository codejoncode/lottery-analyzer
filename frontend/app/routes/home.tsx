import type { Route } from "./+types/home";
import Pick3Dashboard from "../../src/components/Pick3Dashboard";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pick 3 Lottery Analyzer" },
    { name: "description", content: "Advanced Pick 3 lottery analysis and prediction system" },
  ];
}

export default function Home() {
  return (
    <div>
      <nav className="bg-blue-600 text-white p-4 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎯 Pick 3 Lottery Analyzer</h1>
          <div className="space-x-4 text-sm">
            <Link to="/" className="hover:text-blue-200 font-medium">Pick 3 Analysis</Link>
            <Link to="/inspector3" className="hover:text-blue-200">🔍 Inspector 3</Link>
            <Link to="/deflate" className="hover:text-blue-200">🗜️ Deflate</Link>
            <Link to="/analysis" className="hover:text-blue-200">Number Analysis</Link>
            <Link to="/scoring" className="hover:text-blue-200">Scoring System</Link>
            <Link to="/pick3-pairs" className="hover:text-blue-200">🔢 Pick 3 Pairs</Link>
                        <Link to="/column-engine" className="hover:text-blue-200">📊 Column Engine</Link>
            <Link to="/skip-tracker" className="hover:text-blue-200">⏰ Skip Tracker</Link>
            <Link to="/pick3-scoring" className="hover:text-blue-200">🎯 Scoring Engine</Link>
            <Link to="/pick3-backtesting" className="hover:text-blue-200">🔬 Backtesting</Link>
            <Link to="/dashboard" className="hover:text-blue-200">🎰 Dashboard</Link>
            <Link to="/predictions" className="hover:text-blue-200">🎯 Predictions</Link>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto">
        <Pick3Dashboard />
      </div>
    </div>
  );
}
