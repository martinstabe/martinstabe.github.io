const { parseArgs, readJson, writeJson } = require("./url_parity_common.js");

const DEFAULT_LIVE_INPUT = "data/url_parity_live_blog.json";
const DEFAULT_DIST_INPUT = "data/url_parity_dist.json";
const DEFAULT_OUTPUT = "data/url_parity_report.json";

function unique(values) {
  return Array.from(new Set(values)).sort();
}

function loadRequiredJson(filePath, label) {
  try {
    return readJson(filePath);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(`Missing ${label} input: ${filePath}`);
    }

    throw error;
  }
}

function buildParityReport(options = {}) {
  const liveInput = options.live || DEFAULT_LIVE_INPUT;
  const distInput = options.dist || DEFAULT_DIST_INPUT;
  const outputPath = options.output || DEFAULT_OUTPUT;
  const failOnMissing = options.failOnMissing !== "false";

  const live = loadRequiredJson(liveInput, "live");
  const dist = loadRequiredJson(distInput, "dist");
  const livePaths = unique(live.reachablePaths || []);
  const distPaths = unique(dist.routePaths || []);
  const distPathSet = new Set(distPaths);
  const livePathSet = new Set(livePaths);
  const missing = livePaths.filter((path) => !distPathSet.has(path));
  const extra = distPaths.filter((path) => !livePathSet.has(path));

  const report = {
    generatedAt: new Date().toISOString(),
    liveInput,
    distInput,
    summary: {
      livePathCount: livePaths.length,
      distPathCount: distPaths.length,
      missingCount: missing.length,
      extraCount: extra.length,
      parityPassed: missing.length === 0
    },
    missing,
    extra
  };

  writeJson(outputPath, report);
  console.log(`Wrote ${outputPath}`);
  console.log(`Live reachable paths: ${livePaths.length}`);
  console.log(`Local dist paths: ${distPaths.length}`);
  console.log(`Missing in dist: ${missing.length}`);

  if (missing.length > 0) {
    console.log(missing.slice(0, 50).join("\n"));
  }

  if (failOnMissing && missing.length > 0) {
    process.exitCode = 1;
  }

  return report;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  buildParityReport(args);
}

main();
