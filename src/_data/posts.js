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

function applySiteVariables(body, site) {
  return body
    .replaceAll("{{ site.url }}", site.url)
    .replaceAll("{{site.url}}", site.url)
    .replaceAll("{{ site.baseurl }}", site.baseurl)
    .replaceAll("{{site.baseurl}}", site.baseurl);
}

function relativeUrl(targetUrl, currentUrl) {
  if (!targetUrl || /^([a-z]+:)?\/\//i.test(targetUrl) || targetUrl.startsWith("#")) {
    return targetUrl;
  }

  const cleanTarget = String(targetUrl);
  const cleanCurrent = String(currentUrl || "/");
  const targetPath = cleanTarget.replace(/^\/+/, "");
  const currentPath = cleanCurrent.replace(/^\/+/, "").replace(/\/+$/, "");
  const fromPath = currentPath || ".";
  const relativePath = path.posix.relative(fromPath, targetPath || ".");
  const normalized = relativePath === "" ? "." : relativePath;

  if (cleanTarget.endsWith("/") && normalized !== "." && !normalized.endsWith("/")) {
    return `${normalized}/`;
  }

  if (cleanTarget.endsWith("/") && normalized === ".") {
    return "./";
  }

  return normalized;
}

function relativizeInternalLinks(html, permalink) {
  return html.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (_match, attr, target) => {
    const relativeTarget = relativeUrl(`/${target}`, permalink);
    return `${attr}="${relativeTarget}"`;
  });
}

function absolutizeInternalLinks(html, site) {
  return html.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (_match, attr, target) => {
    return `${attr}="${site.url}/${target}"`;
  });
}

function stripHtml(value) {
  return decodeHTML(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function renderBody(body, site, permalink) {
  const bodyWithVariables = applySiteVariables(body, site);
  const isDeliciousPost = bodyWithVariables.trimStart().startsWith('<ul class="delicious">');
  const rendered = isDeliciousPost ? bodyWithVariables : markdown.render(bodyWithVariables);
  return relativizeInternalLinks(rendered, permalink);
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
    const content = renderBody(body, site, permalink);
    const absoluteContent = absolutizeInternalLinks(content, site);
    const excerptText = stripHtml(content);

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
      content,
      absoluteContent,
      excerpt: excerptText
    };
  });

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
};
