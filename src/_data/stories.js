const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { decodeHTML } = require("entities");

const ROOT = path.resolve(__dirname, "..", "..");
const STORIES_PATH = path.join(ROOT, "_data", "stories.yml");

function readStories() {
  if (!fs.existsSync(STORIES_PATH)) {
    return [];
  }

  const raw = fs.readFileSync(STORIES_PATH, "utf8");
  const parsed = yaml.load(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function decodeValue(value) {
  return typeof value === "string" ? decodeHTML(value) : value;
}

module.exports = function () {
  return readStories()
    .filter((story) => story && story.include !== false && story.guid && story.title && story.link && story.pubDate)
    .map((story) => {
      return {
        ...story,
        guid: String(story.guid),
        title: decodeValue(story.title),
        description: decodeValue(story.description),
        link: decodeValue(story.link),
        pubDate: story.pubDate
      };
    })
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
};
