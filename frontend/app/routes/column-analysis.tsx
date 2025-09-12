import { ColumnAnalysisPage } from "../../src/components/ColumnAnalysisPage";

export function meta() {
  return [
    { title: "Column Analysis - Powerball Analyzer" },
    { name: "description", content: "Detailed positional analysis of Powerball numbers and patterns" },
  ];
}

export default function ColumnAnalysis() {
  return <ColumnAnalysisPage />;
}
