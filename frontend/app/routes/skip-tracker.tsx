import SkipTracker from "../../src/components/Pick3/SkipTracker";

export function meta() {
  return [
    { title: "Skip Tracker - Pick 3 Analysis" },
    { name: "description", content: "Comprehensive lateness detection system for digits, pairs, and combinations" },
  ];
}

export default function SkipTrackerPage() {
  return (
    <div>
      <nav className="bg-blue-600 text-white p-4 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">⏰ Skip Tracker</h1>
          <div className="space-x-4 text-sm">
            <a href="/" className="hover:text-blue-200">Pick 3 Home</a>
            <a href="/inspector3" className="hover:text-blue-200">Inspector 3</a>
            <a href="/deflate" className="hover:text-blue-200">Deflate</a>
            <a href="/pick3-pairs" className="hover:text-blue-200">Pairs</a>
            <a href="/column-engine" className="hover:text-blue-200">Column Engine</a>
            <a href="/analysis" className="hover:text-blue-200">Analysis</a>
            <a href="/scoring" className="hover:text-blue-200">Scoring</a>
          </div>
        </div>
      </nav>
      <SkipTracker />
    </div>
  );
}
