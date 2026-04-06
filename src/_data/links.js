const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { decodeHTML } = require("entities");

const ROOT = path.resolve(__dirname, "..", "..");
const LINKS_PATH = path.join(ROOT, "_data", "links.yml");

function flattenDocuments(documents) {
  return documents.flatMap((doc) => {
    if (!doc) {
      return [];
    }

    return Array.isArray(doc) ? doc : [doc];
  });
}

function decodeValue(value) {
  return typeof value === "string" ? decodeHTML(value) : value;
}

module.exports = function () {
  const documents = [];

  yaml.loadAll(fs.readFileSync(LINKS_PATH, "utf8"), (doc) => {
    documents.push(doc);
  });

  return flattenDocuments(documents)
    .map((link) => ({
      ...link,
      publication: decodeValue(link.publication),
      title: decodeValue(link.title),
      permalink: decodeValue(link.permalink),
      post_content: decodeValue(link.post_content)
    }))
    .sort((a, b) => new Date(b.post_date) - new Date(a.post_date));
};
