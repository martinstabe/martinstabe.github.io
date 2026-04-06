const fs = require("fs");
const path = require("path");
const sass = require("sass");

const ROOT = path.resolve(__dirname, "..");
const INPUT_PATH = path.join(ROOT, "css", "main.scss");
const OUTPUT_PATH = path.join(ROOT, "dist", "css", "main.css");

function stripFrontMatter(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

const source = stripFrontMatter(fs.readFileSync(INPUT_PATH, "utf8"));
const result = sass.compileString(source, {
  syntax: "scss",
  loadPaths: [path.join(ROOT, "_sass"), path.join(ROOT, "css")]
});

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, result.css);
