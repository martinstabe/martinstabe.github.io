const getPosts = require("./posts.js");
const getTagDefinitions = require("./tagDefinitions.js");

module.exports = function () {
  const posts = getPosts();
  const { byAlias } = getTagDefinitions();
  const tagMap = new Map();

  for (const post of posts) {
    for (const rawTag of post.tags || []) {
      const definition = byAlias[rawTag] || {
        tag: rawTag,
        title: `Tag: ${rawTag}`,
        displayTitle: rawTag,
        heading: `Tag: ${rawTag}`,
        permalink: `/tags/${rawTag}/`,
        slug: `tags/${rawTag}`,
        aliases: [rawTag]
      };
      const key = definition.permalink;

      if (!tagMap.has(key)) {
        tagMap.set(key, {
          ...definition,
          posts: [],
          rawTags: new Set()
        });
      }

      const tagEntry = tagMap.get(key);

      if (!tagEntry.posts.some((entry) => entry.permalink === post.permalink)) {
        tagEntry.posts.push(post);
      }

      tagEntry.rawTags.add(rawTag);
    }
  }

  return Array.from(tagMap.values())
    .map((tag) => ({
      ...tag,
      rawTags: Array.from(tag.rawTags).sort(),
      posts: tag.posts.sort((a, b) => new Date(b.date) - new Date(a.date)),
      count: tag.posts.length
    }))
    .sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
};
