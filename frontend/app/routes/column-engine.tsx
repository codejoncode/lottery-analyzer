import ColumnEngine from "../../src/components/Pick3/ColumnEngine";

export function meta() {
  return [
    { title: "Column Engine - Pick 3 Analysis" },
    { name: "description", content: "Revolutionary column-based prediction system revealing 2/3 of next draw data" },
  ];
}

export default function ColumnEnginePage() {
  return (
    <div>
      <nav className="bg-blue-600 text-white p-4 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">📊 Column Engine</h1>
          <div className="space-x-4 text-sm">
            <a href="/" className="hover:text-blue-200">Pick 3 Home</a>
            <a href="/inspector3" className="hover:text-blue-200">Inspector 3</a>
            <a href="/deflate" className="hover:text-blue-200">Deflate</a>
            <a href="/pick3-pairs" className="hover:text-blue-200">Pairs</a>
            <a href="/analysis" className="hover:text-blue-200">Analysis</a>
            <a href="/scoring" className="hover:text-blue-200">Scoring</a>
          </div>
        </div>
      </nav>
      <ColumnEngine />
    </div>
  );
}
