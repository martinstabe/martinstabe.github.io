const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { decodeHTML } = require("entities");

const ROOT = path.resolve(__dirname, "..", "..");
const GRAPHICS_PATH = path.join(ROOT, "_data", "graphics.yml");

function readGraphics() {
  if (!fs.existsSync(GRAPHICS_PATH)) {
    return [];
  }

  const raw = fs.readFileSync(GRAPHICS_PATH, "utf8");
  const parsed = yaml.load(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function decodeValue(value) {
  return typeof value === "string" ? decodeHTML(value) : value;
}

function getTimeValue(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function dedupeByFlourishImage(graphics) {
  const byImage = new Map();
  const withoutImage = [];

  for (const graphic of graphics) {
    if (!graphic.flourish_img) {
      withoutImage.push(graphic);
      continue;
    }

    const existing = byImage.get(graphic.flourish_img);

    if (!existing || getTimeValue(graphic.date) < getTimeValue(existing.date)) {
      byImage.set(graphic.flourish_img, graphic);
    }
  }

  return withoutImage.concat(Array.from(byImage.values()));
}

module.exports = function () {
  const graphics = readGraphics()
    .filter((graphic) => {
      return (
        graphic &&
        graphic.include !== false &&
        graphic.id &&
        graphic.url &&
        graphic.story_title &&
        graphic.date &&
        graphic.flourish_id
      );
    })
    .map((graphic) => {
      const storyDescription = decodeValue(graphic.story_description);
      const commentary = decodeValue(graphic.commentary);

      return {
        ...graphic,
        id: String(graphic.id),
        url: decodeValue(graphic.url),
        story_title: decodeValue(graphic.story_title),
        story_description: storyDescription,
        commentary,
        displayDescription: commentary || storyDescription,
        story_link: decodeValue(graphic.story_link),
        type: decodeValue(graphic.type),
        flourish_url: decodeValue(graphic.flourish_url),
        flourish_id: decodeValue(graphic.flourish_id),
        flourish_title: decodeValue(graphic.flourish_title),
        flourish_template: decodeValue(graphic.flourish_template),
        flourish_img: decodeValue(graphic.flourish_img),
        homepage_image: decodeValue(graphic.homepage_image),
        date: graphic.date,
        flourish_date: graphic.flourish_date
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return dedupeByFlourishImage(graphics).sort((a, b) => new Date(b.date) - new Date(a.date));
};
