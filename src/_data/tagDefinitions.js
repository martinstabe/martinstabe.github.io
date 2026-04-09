const definitionsData = require("./tag-definitions.json");
const { decodeHTML } = require("entities");

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

function createDefinition(data) {
  const tag = decodeValue(data.tag);
  const title = decodeValue(data.title) || `Tag: ${tag}`;
  const commentary = decodeValue(data.commentary);
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
    commentary,
    displayTitle,
    heading: `Tag: ${displayTitle}`,
    permalink,
    slug,
    aliases
  };
}

module.exports = function () {
  const byAlias = {};
  const definitions = definitionsData.map((entry) => createDefinition(entry));

  for (const definition of definitions) {
    for (const alias of definition.aliases) {
      byAlias[alias] = definition;
    }
  }

  return {
    all: definitions,
    byAlias
  };
};
