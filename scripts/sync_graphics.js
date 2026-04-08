const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const yaml = require("js-yaml");
const { decodeHTML } = require("entities");

const ROOT = path.resolve(__dirname, "..");
const GRAPHICS_PATH = path.join(ROOT, "_data", "graphics.yml");
const EXPORT_SCRIPT_PATH = path.join(__dirname, "export_graphics.R");

function readGraphicsFile() {
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

function buildGraphicId(graphic) {
  return `${graphic.story}::${graphic.flourish_id}`;
}

function loadGraphicsFromR() {
  const result = spawnSync("Rscript", [EXPORT_SCRIPT_PATH], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "Failed to export graphics from RDS.");
  }

  const parsed = JSON.parse(result.stdout);

  return parsed.map((graphic) => ({
    id: buildGraphicId(graphic),
    story: graphic.story,
    url: decodeValue(graphic.url),
    story_title: decodeValue(graphic.story_title),
    story_description: decodeValue(graphic.story_description),
    story_link: decodeValue(graphic.story_link),
    date: graphic.date,
    type: decodeValue(graphic.type),
    flourish_url: decodeValue(graphic.flourish_url),
    flourish_id: decodeValue(graphic.flourish_id),
    flourish_title: decodeValue(graphic.flourish_title),
    flourish_date: graphic.flourish_date,
    flourish_template: decodeValue(graphic.flourish_template),
    flourish_img: decodeValue(graphic.flourish_img)
  }));
}

function mergeGraphics(existingGraphics, sourceGraphics) {
  const existingById = new Map(
    existingGraphics
      .filter((graphic) => graphic && graphic.id)
      .map((graphic) => [graphic.id, graphic])
  );

  const mergedById = new Map();

  for (const graphic of sourceGraphics) {
    const existingGraphic = existingById.get(graphic.id) || {};

    mergedById.set(graphic.id, {
      ...existingGraphic,
      ...graphic,
      include: existingGraphic.include ?? true
    });
  }

  for (const graphic of existingGraphics) {
    if (!graphic || !graphic.id || mergedById.has(graphic.id)) {
      continue;
    }

    mergedById.set(graphic.id, graphic);
  }

  return [...mergedById.values()].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function main() {
  const existingGraphics = readGraphicsFile();
  const sourceGraphics = loadGraphicsFromR();
  const mergedGraphics = mergeGraphics(existingGraphics, sourceGraphics);
  const output = yaml.dump(mergedGraphics, {
    lineWidth: 1000,
    noRefs: true,
    sortKeys: false
  });

  fs.writeFileSync(GRAPHICS_PATH, output, "utf8");
  console.log(`Synced ${sourceGraphics.length} graphics into ${path.relative(ROOT, GRAPHICS_PATH)}.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
