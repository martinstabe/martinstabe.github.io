const {
  DEFAULT_START_URL,
  classifyPath,
  extractLinksFromHtml,
  normalizeAbsoluteUrl,
  normalizePathFromUrl,
  parseArgs,
  resolveInternalUrl,
  writeJson
} = require("./url_parity_common.js");

const DEFAULT_OUTPUT = "data/url_parity_live_blog.json";

async function crawlLiveSite(options = {}) {
  const startUrl = normalizeAbsoluteUrl(options.startUrl || DEFAULT_START_URL);
  const outputPath = options.output || DEFAULT_OUTPUT;
  const userAgent = options.userAgent || "martinstabe-parity-check/1.0";
  const limit = options.limit ? Number(options.limit) : Infinity;
  const progressEvery = options.progressEvery ? Number(options.progressEvery) : 100;
  const queue = [startUrl];
  const seen = new Set([startUrl]);
  const entries = [];

  for (let index = 0; index < queue.length && index < limit; index += 1) {
    const currentUrl = queue[index];
    const response = await fetch(currentUrl, {
      redirect: "follow",
      headers: {
        "user-agent": userAgent
      }
    });

    const finalUrl = normalizeAbsoluteUrl(response.url);
    const finalPath = normalizePathFromUrl(finalUrl);
    const contentType = response.headers.get("content-type") || "";
    const isHtml = /\btext\/html\b/i.test(contentType);
    const body = isHtml ? await response.text() : "";
    const links = isHtml ? extractLinksFromHtml(body) : [];
    const discoveredInternalUrls = [];

    for (const link of links) {
      const resolved = resolveInternalUrl(link, finalUrl);

      if (!resolved) {
        continue;
      }

      discoveredInternalUrls.push(resolved);

      if (!seen.has(resolved)) {
        seen.add(resolved);
        queue.push(resolved);
      }
    }

    entries.push({
      requestedUrl: currentUrl,
      finalUrl,
      requestedPath: normalizePathFromUrl(currentUrl),
      finalPath,
      status: response.status,
      ok: response.ok,
      redirected: finalUrl !== currentUrl,
      contentType,
      kind: classifyPath(finalPath),
      isHtml,
      discoveredInternalUrls
    });

    if (progressEvery > 0 && (index + 1) % progressEvery === 0) {
      console.log(`Crawled ${index + 1} URLs so far`);
    }
  }

  const reachableEntries = entries.filter((entry) => entry.ok);
  const reachablePaths = Array.from(new Set(reachableEntries.map((entry) => entry.finalPath))).sort();
  const htmlPaths = reachableEntries
    .filter((entry) => entry.isHtml)
    .map((entry) => entry.finalPath);

  const result = {
    generatedAt: new Date().toISOString(),
    startUrl,
    limit: Number.isFinite(limit) ? limit : null,
    crawledUrls: entries.length,
    reachablePaths,
    htmlPaths: Array.from(new Set(htmlPaths)).sort(),
    entries
  };

  writeJson(outputPath, result);
  console.log(`Wrote ${outputPath}`);
  console.log(`Crawled ${entries.length} internal URLs`);
  console.log(`Reachable paths: ${reachablePaths.length}`);

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await crawlLiveSite(args);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
