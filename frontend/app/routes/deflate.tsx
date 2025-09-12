import Deflate from "../../src/components/Pick3/Deflate";

export function meta() {
  return [
    { title: "Deflate Module - Pick 3 Analysis" },
    { name: "description", content: "Compress and filter Pick 3 combinations to actionable sets" },
  ];
}

export default function DeflatePage() {
  return (
    <div>
      <nav className="bg-blue-600 text-white p-4 mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🗜️ Deflate Module</h1>
          <div className="space-x-4 text-sm">
            <a href="/" className="hover:text-blue-200">Pick 3 Home</a>
            <a href="/inspector3" className="hover:text-blue-200">Inspector 3</a>
            <a href="/analysis" className="hover:text-blue-200">Analysis</a>
            <a href="/scoring" className="hover:text-blue-200">Scoring</a>
          </div>
        </div>
      </nav>
      <Deflate />
    </div>
  );
}
