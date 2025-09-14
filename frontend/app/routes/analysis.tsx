import type { Route } from "./+types/analysis";
import NumberAnalysis from "../../src/components/NumberAnalysis";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Number Analysis" },
    { name: "description", content: "Powerball number analysis and categorization" },
  ];
}

export default function Analysis() {
  return <NumberAnalysis />;
}
