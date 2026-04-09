const fs = require("fs");
const path = require("path");
const { classifyPath, normalizePathname, parseArgs, writeJson } = require("./url_parity_common.js");

const DEFAULT_DIST = "dist";
const DEFAULT_OUTPUT = "data/url_parity_dist.json";

function walkFiles(rootDir) {
  const files = [];

  function visit(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name === ".DS_Store" || entry.name.startsWith("._")) {
        continue;
      }

      const entryPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }

      files.push(entryPath);
    }
  }

  visit(rootDir);
  return files;
}

function toRoutePath(rootDir, filePath) {
  const relativePath = path.relative(rootDir, filePath).split(path.sep).join("/");

  if (relativePath === "index.html") {
    return "/";
  }

  if (relativePath.endsWith("/index.html")) {
    return normalizePathname(`/${relativePath.slice(0, -"/index.html".length)}/`);
  }

  return normalizePathname(`/${relativePath}`);
}

function buildDistInventory(options = {}) {
  const distDir = path.resolve(options.dist || DEFAULT_DIST);
  const outputPath = options.output || DEFAULT_OUTPUT;
  const files = walkFiles(distDir);
  const routes = files
    .map((filePath) => {
      const routePath = toRoutePath(distDir, filePath);
      const relativeFile = path.relative(distDir, filePath).split(path.sep).join("/");

      return {
        path: routePath,
        file: relativeFile,
        kind: classifyPath(routePath)
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const routePaths = Array.from(new Set(routes.map((route) => route.path))).sort();
  const result = {
    generatedAt: new Date().toISOString(),
    distDir,
    routePaths,
    routes
  };

  writeJson(outputPath, result);
  console.log(`Wrote ${outputPath}`);
  console.log(`Enumerated ${routePaths.length} unique dist paths`);

  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  buildDistInventory(args);
}

main();
