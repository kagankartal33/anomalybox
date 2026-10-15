import { runAutomaticQualityRegression } from "./automatic-quality-regression";
const result = runAutomaticQualityRegression();
console.log(JSON.stringify({ ...result, scope: "deterministic regression only; not a live model qualification or human calibration" }, null, 2));
if (!result.passed) process.exitCode = 1;
