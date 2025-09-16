import { Pick3ColumnAnalysisPage } from "../../src/components/Pick3ColumnAnalysisPage";

export function meta() {
  return [
    { title: "Pick 3 Column Analysis - Lottery Analyzer" },
    { name: "description", content: "Detailed positional analysis of Pick 3 numbers across hundreds, tens, and units positions" },
  ];
}

export default function ColumnAnalysis() {
  return <Pick3ColumnAnalysisPage />;
}
