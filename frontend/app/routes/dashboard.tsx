import AnalysisDashboard from "../../src/components/AnalysisDashboard";
import { sampleDraws } from "../../src/prediction-engine/demo";

export default function Dashboard() {
  return <AnalysisDashboard draws={sampleDraws} />;
}
