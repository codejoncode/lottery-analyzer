import type { Route } from "./+types/grid";
import Pick3GridAnalysis from "../../src/components/Pick3GridAnalysis";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Pick 3 Grid Analysis" },
    { name: "description", content: "Pick 3 grid analysis with hit tracking and pattern recognition for numbers 000-999" },
  ];
}

export default function Grid() {
  return <Pick3GridAnalysis />;
}
