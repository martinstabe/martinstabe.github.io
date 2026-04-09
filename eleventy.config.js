const fs = require("fs");
const path = require("path");
const { encodeXML } = require("entities");

function removeReadmes(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return;
  }

  for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
    const entryPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      removeReadmes(entryPath);
      continue;
    }

    if (entry.isFile() && entry.name === "README.md") {
      fs.unlinkSync(entryPath);
    }
  }
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ img: "img" });
  eleventyConfig.addPassthroughCopy({ slides: "slides" });
  eleventyConfig.addPassthroughCopy({ CNAME: "CNAME" });
  eleventyConfig.addPassthroughCopy({
    "googlea1fed2510060dd96.html": "googlea1fed2510060dd96.html"
  });

  eleventyConfig.addFilter("displayDate", (value) => {
    if (!value) {
      return "";
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Europe/London"
    }).format(date);
  });

  eleventyConfig.addShortcode("currentYear", () => {
    return new Date().getFullYear();
  });

  eleventyConfig.addShortcode("currentDateRfc822", () => {
    return new Date().toUTCString();
  });

  eleventyConfig.addFilter("rfc822Date", (value) => {
    if (!value) {
      return "";
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toUTCString();
  });

  eleventyConfig.addFilter("xmlEscape", (value) => {
    return encodeXML(String(value ?? ""));
  });

  eleventyConfig.addFilter("relativeUrl", (targetUrl, currentUrl = "/") => {
    if (!targetUrl || /^([a-z]+:)?\/\//i.test(targetUrl) || targetUrl.startsWith("#")) {
      return targetUrl;
    }

    const cleanTarget = String(targetUrl);
    const cleanCurrent = String(currentUrl || "/");
    const targetPath = cleanTarget.replace(/^\/+/, "").replace(/\/+$/, cleanTarget.endsWith("/") ? "" : "");
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
  });

  eleventyConfig.on("eleventy.after", ({ dir }) => {
    removeReadmes(path.join(dir.output, "slides"));
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "dist"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"]
  };
};
