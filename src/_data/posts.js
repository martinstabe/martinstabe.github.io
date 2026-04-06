const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const MarkdownIt = require("markdown-it");
const { decodeHTML } = require("entities");

const ROOT = path.resolve(__dirname, "..", "..");
const POSTS_DIR = path.join(ROOT, "_posts");

const markdown = new MarkdownIt({
  html: true,
  linkify: true
});

function parseFrontMatter(fileContents) {
  const match = fileContents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: fileContents };
  }

  return {
    data: yaml.load(match[1]) || {},
    body: match[2]
  };
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

function renderBody(body, site) {
  return markdown.render(
    body
      .replaceAll("{{ site.url }}", site.url)
      .replaceAll("{{site.url}}", site.url)
      .replaceAll("{{ site.baseurl }}", site.baseurl)
      .replaceAll("{{site.baseurl}}", site.baseurl)
  );
}

module.exports = function () {
  const site = require("./site.json");
  const entries = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();

  const posts = entries.map((fileName) => {
    const filePath = path.join(POSTS_DIR, fileName);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, body } = parseFrontMatter(raw);
    const fileDate = fileName.slice(0, 10);
    const date = data.date || fileDate;
    const permalink = data.permalink || `/${fileDate.replaceAll("-", "/")}/`;
    const tags = normalizeArray(data.tags).filter(Boolean);
    const excerptText = decodeHTML(
      body.split("<!--more-->")[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );

    return {
      ...data,
      title: decodeValue(data.title),
      author: decodeValue(data.author),
      meta: decodeValue(data.meta),
      date,
      tags,
      permalink,
      fileName,
      sourcePath: filePath,
      body,
      content: renderBody(body, site),
      excerpt: excerptText
    };
  });

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
};
