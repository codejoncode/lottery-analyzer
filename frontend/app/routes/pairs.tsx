import Pick3PairsAnalysis from "../../src/components/Pick3PairsAnalysis";

export function meta() {
  return [
    { title: "Pick 3 Pairs Analysis - Indiana Daily 3" },
    { name: "description", content: "Analyze digit pairs and patterns in Indiana Daily 3 draws" },
  ];
}

export default function Pairs() {
  return <Pick3PairsAnalysis />;
}
