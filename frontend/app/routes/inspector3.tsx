import Inspector3 from "../../src/components/Pick3/Inspector3";

export function meta() {
  return [
    { title: "Inspector 3 - Pick 3 Analysis" },
    { name: "description", content: "Advanced pattern analysis and classification for Pick 3 lottery numbers" },
  ];
}

export default function Inspector3Page() {
  return (
    <div>
      <nav className="bg-blue-600 text-white p-4 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🔍 Inspector 3</h1>
          <div className="space-x-4 text-sm">
            <a href="/" className="hover:text-blue-200">Pick 3 Home</a>
            <a href="/analysis" className="hover:text-blue-200">Analysis</a>
            <a href="/scoring" className="hover:text-blue-200">Scoring</a>
            <a href="/pairs" className="hover:text-blue-200">Pairs</a>
          </div>
        </div>
      </nav>
      <Inspector3 />
    </div>
  );
}
