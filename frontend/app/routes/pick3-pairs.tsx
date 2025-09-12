import PairsAnalysis from "../../src/components/Pick3/PairsAnalysis";

export function meta() {
  return [
    { title: "Pairs Analysis - Pick 3" },
    { name: "description", content: "Comprehensive pair tracking and analysis for Pick 3 lottery combinations" },
  ];
}

export default function PairsAnalysisPage() {
  return (
    <div>
      <nav className="bg-blue-600 text-white p-4 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🔢 Pairs Analysis</h1>
          <div className="space-x-4 text-sm">
            <a href="/" className="hover:text-blue-200">Pick 3 Home</a>
            <a href="/inspector3" className="hover:text-blue-200">Inspector 3</a>
            <a href="/deflate" className="hover:text-blue-200">Deflate</a>
            <a href="/analysis" className="hover:text-blue-200">Analysis</a>
            <a href="/scoring" className="hover:text-blue-200">Scoring</a>
          </div>
        </div>
      </nav>
      <PairsAnalysis />
    </div>
  );
}
