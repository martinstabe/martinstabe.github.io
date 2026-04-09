const fs = require("fs");
const path = require("path");

const DEFAULT_START_URL = "https://www.martinstabe.com/blog/";
const INTERNAL_HOSTS = new Set(["martinstabe.com", "www.martinstabe.com"]);
const DEFAULT_EXCLUDED_PATH_PREFIXES = ["/cdn-cgi/"];

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function isInternalHost(hostname) {
  return INTERNAL_HOSTS.has(String(hostname || "").toLowerCase());
}

function hasFileExtension(pathname) {
  const basename = path.posix.basename(pathname);
  return basename.includes(".");
}

function normalizePathname(pathname) {
  const clean = pathname || "/";

  if (clean === "/index.html") {
    return "/";
  }

  if (clean.endsWith("/index.html")) {
    return `${clean.slice(0, -"/index.html".length)}/`;
  }

  if (!hasFileExtension(clean) && !clean.endsWith("/")) {
    return `${clean}/`;
  }

  return clean;
}

function normalizeAbsoluteUrl(input) {
  const url = new URL(input);
  url.hash = "";
  url.search = "";
  return url.toString();
}

function normalizePathFromUrl(input) {
  const url = new URL(input);
  return normalizePathname(url.pathname);
}

function classifyPath(pathname) {
  if (pathname.endsWith("/")) {
    return "html";
  }

  if (pathname.endsWith(".html")) {
    return "html-file";
  }

  return "asset";
}

function extractLinksFromHtml(html) {
  const links = [];
  const hrefPattern = /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
  let match;

  while ((match = hrefPattern.exec(html))) {
    const href = match[1] || match[2];
    if (href) {
      links.push(href.trim());
    }
  }

  return links;
}

function resolveInternalUrl(target, baseUrl) {
  if (!target || target.startsWith("#") || target.startsWith("mailto:") || target.startsWith("javascript:")) {
    return null;
  }

  let resolved;

  try {
    resolved = new URL(target, baseUrl);
  } catch (_error) {
    return null;
  }

  if (!/^https?:$/i.test(resolved.protocol)) {
    return null;
  }

  if (!isInternalHost(resolved.hostname)) {
    return null;
  }

  const absoluteUrl = normalizeAbsoluteUrl(resolved.toString());
  const normalizedPath = normalizePathFromUrl(absoluteUrl);

  if (DEFAULT_EXCLUDED_PATH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
    return null;
  }

  return absoluteUrl;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

module.exports = {
  DEFAULT_START_URL,
  DEFAULT_EXCLUDED_PATH_PREFIXES,
  INTERNAL_HOSTS,
  classifyPath,
  extractLinksFromHtml,
  isInternalHost,
  normalizeAbsoluteUrl,
  normalizePathFromUrl,
  normalizePathname,
  parseArgs,
  readJson,
  resolveInternalUrl,
  writeJson
};
