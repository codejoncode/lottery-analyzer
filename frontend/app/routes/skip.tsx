import type { Route } from "./+types/skip";
import SkipAnalysis from "../../src/components/SkipAnalysis";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Skip Analysis" },
    { name: "description", content: "Comprehensive skip analysis and trend tracking for Powerball numbers" },
  ];
}

export default function Skip() {
  return <SkipAnalysis />;
}
