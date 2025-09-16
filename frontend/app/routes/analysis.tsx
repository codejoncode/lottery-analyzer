import type { Route } from "./+types/analysis";
import { Pick3NumberAnalysis } from "../../src/components/Pick3NumberAnalysis";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Pick 3 Number Analysis" },
    { name: "description", content: "Comprehensive analysis of Pick 3 numbers (000-999) with patterns and statistics" },
  ];
}

export default function Analysis() {
  return <Pick3NumberAnalysis />;
}
