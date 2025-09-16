import Pick3DrawSummaryPage from "../../src/components/Pick3DrawSummaryPage";

export function meta() {
  return [
    { title: "Pick 3 Draw Summary - Indiana Daily 3" },
    { name: "description", content: "Review recent Indiana Daily 3 draws and detailed analysis" },
  ];
}

export default function DrawSummary() {
  return <Pick3DrawSummaryPage />;
}
