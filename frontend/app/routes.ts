import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("analysis", "routes/analysis.tsx"),
  route("pairs", "routes/pairs.tsx"),
  route("triples", "routes/triples.tsx"),
  route("grid", "routes/grid.tsx"),
  route("skip", "routes/skip.tsx"),
  route("combinations", "routes/combinations.tsx"),
  route("scoring", "routes/scoring.tsx"),
  route("predictions", "routes/predictions.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("draw-summary", "routes/draw-summary.tsx"),
  route("inspector3", "routes/inspector3.tsx"),
  route("deflate", "routes/deflate.tsx"),
  route("pick3-pairs", "routes/pick3-pairs.tsx"),
  route("column-engine", "routes/column-engine.tsx"),
  route("skip-tracker", "routes/skip-tracker.tsx"),
  route("pick3-scoring", "routes/pick3-scoring.tsx"),
  route("column-analysis", "routes/column-analysis.tsx"),
  route("data-entry", "routes/data-entry.tsx"),
] satisfies RouteConfig;
