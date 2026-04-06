const fs = require("fs");
const https = require("https");
const path = require("path");
const yaml = require("js-yaml");
const { decodeHTML } = require("entities");

const FEED_URL = "https://www.ft.com/martin-stabe?format=rss";
const ROOT = path.resolve(__dirname, "..");
const STORIES_PATH = path.join(ROOT, "_data", "stories.yml");

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume();
          resolve(fetchText(response.headers.location));
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Request failed with status ${response.statusCode}`));
          return;
        }

        response.setEncoding("utf8");
        let body = "";

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          resolve(body);
        });
      })
      .on("error", reject);
  });
}

function readStoriesFile() {
  if (!fs.existsSync(STORIES_PATH)) {
    return [];
  }

  const raw = fs.readFileSync(STORIES_PATH, "utf8");
  const parsed = yaml.load(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function unwrapCdata(value) {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function extractTag(block, tagName) {
  const escapedName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escapedName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedName}>`, "i"));

  if (!match) {
    return "";
  }

  return decodeHTML(unwrapCdata(match[1]).trim());
}

function parseFeed(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return items
    .map((match) => {
      const block = match[1];
      const guid = extractTag(block, "guid");
      const title = extractTag(block, "title");
      const description = extractTag(block, "description");
      const link = extractTag(block, "link");
      const pubDate = extractTag(block, "pubDate");

      if (!guid || !title || !link || !pubDate) {
        return null;
      }

      return {
        guid,
        title,
        description,
        link,
        pubDate
      };
    })
    .filter(Boolean);
}

function mergeStories(existingStories, feedStories) {
  const existingByGuid = new Map(
    existingStories
      .filter((story) => story && story.guid)
      .map((story) => [story.guid, story])
  );

  const mergedByGuid = new Map();

  for (const story of feedStories) {
    const existingStory = existingByGuid.get(story.guid) || {};

    mergedByGuid.set(story.guid, {
      ...existingStory,
      ...story,
      include: existingStory.include ?? true
    });
  }

  for (const story of existingStories) {
    if (!story || !story.guid || mergedByGuid.has(story.guid)) {
      continue;
    }

    mergedByGuid.set(story.guid, story);
  }

  return [...mergedByGuid.values()].sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
}

async function main() {
  const existingStories = readStoriesFile();
  const xml = await fetchText(FEED_URL);
  const feedStories = parseFeed(xml);
  const mergedStories = mergeStories(existingStories, feedStories);
  const output = yaml.dump(mergedStories, {
    lineWidth: 1000,
    noRefs: true,
    sortKeys: false
  });

  fs.writeFileSync(STORIES_PATH, output, "utf8");
  console.log(`Synced ${feedStories.length} feed stories into ${path.relative(ROOT, STORIES_PATH)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
