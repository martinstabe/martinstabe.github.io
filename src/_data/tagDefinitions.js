const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { decodeHTML } = require("entities");

const ROOT = path.resolve(__dirname, "..", "..");
const TAGS_DIR = path.join(ROOT, "tags");

function parseFrontMatter(fileContents) {
  const match = fileContents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return {};
  }

  try {
    return yaml.load(match[1]) || {};
  } catch (_error) {
    const result = {};
    let currentListKey = null;

    for (const rawLine of match[1].split(/\r?\n/)) {
      if (!rawLine.trim()) {
        continue;
      }

      const listMatch = rawLine.match(/^\s*-\s*(.+)\s*$/);
      if (listMatch && currentListKey) {
        if (!Array.isArray(result[currentListKey])) {
          result[currentListKey] = [];
        }

        result[currentListKey].push(listMatch[1]);
        continue;
      }

      const entryMatch = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!entryMatch) {
        currentListKey = null;
        continue;
      }

      const [, key, value] = entryMatch;
      if (value === "") {
        result[key] = [];
        currentListKey = key;
        continue;
      }

      result[key] = value;
      currentListKey = null;
    }

    return result;
  }
}

function normalizeArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function decodeValue(value) {
  return typeof value === "string" ? decodeHTML(value) : value;
}

function ensureWrappedSlashes(value) {
  const trimmed = String(value || "").replace(/^\/+|\/+$/g, "");
  return `/${trimmed}/`;
}

function stripTagPrefix(title, fallbackTag) {
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) {
    return fallbackTag;
  }

  return cleanTitle.replace(/^Tag:\s*/i, "") || fallbackTag;
}

function createDefinition(data, fallbackTag) {
  const tag = decodeValue(data.tag || fallbackTag);
  const title = decodeValue(data.title) || `Tag: ${tag}`;
  const displayTitle = stripTagPrefix(title, tag);
  const permalink = ensureWrappedSlashes(data.permalink || `/tags/${tag}/`);
  const slug = permalink.replace(/^\/+|\/+$/g, "");
  const aliases = Array.from(
    new Set(
      [tag]
        .concat(normalizeArray(data.aliases))
        .map(decodeValue)
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );

  return {
    tag,
    title,
    displayTitle,
    heading: `Tag: ${displayTitle}`,
    permalink,
    slug,
    aliases
  };
}

module.exports = function () {
  const byAlias = {};
  const definitions = fs
    .readdirSync(TAGS_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((fileName) => {
      const filePath = path.join(TAGS_DIR, fileName);
      const raw = fs.readFileSync(filePath, "utf8");
      const data = parseFrontMatter(raw);
      const fallbackTag = path.basename(fileName, ".md");
      const definition = createDefinition(data, fallbackTag);

      for (const alias of definition.aliases) {
        byAlias[alias] = definition;
      }

      return definition;
    });

  return {
    all: definitions,
    byAlias
  };
};
