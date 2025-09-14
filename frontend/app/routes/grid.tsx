import type { Route } from "./+types/grid";
import GridAnalysis from "../../src/components/GridAnalysis";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Grid Analysis" },
    { name: "description", content: "Powerball grid analysis with hit tracking and pattern recognition" },
  ];
}

export default function Grid() {
  return <GridAnalysis />;
}
