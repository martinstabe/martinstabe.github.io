const getPosts = require("./posts.js");
const getTagDefinitions = require("./tagDefinitions.js");

function createFallbackDefinition(rawTag) {
  return {
    tag: rawTag,
    title: `Tag: ${rawTag}`,
    commentary: null,
    parent: null,
    parentTag: null,
    parentPermalink: null,
    displayTitle: rawTag,
    heading: `Tag: ${rawTag}`,
    permalink: `/tags/${rawTag}/`,
    slug: `tags/${rawTag}`,
    aliases: [rawTag]
  };
}

function uniquePosts(posts) {
  const seen = new Set();
  const result = [];

  for (const post of posts) {
    if (seen.has(post.permalink)) {
      continue;
    }

    seen.add(post.permalink);
    result.push(post);
  }

  return result;
}

module.exports = function () {
  const posts = getPosts();
  const { all, byAlias } = getTagDefinitions();
  const tagMap = new Map();

  for (const definition of all) {
    tagMap.set(definition.permalink, {
      ...definition,
      directPosts: [],
      posts: [],
      rawTags: new Set(),
      childrenPermalinks: new Set()
    });
  }

  for (const post of posts) {
    for (const rawTag of post.tags || []) {
      const definition = byAlias[rawTag] || createFallbackDefinition(rawTag);
      const key = definition.permalink;

      if (!tagMap.has(key)) {
        tagMap.set(key, {
          ...definition,
          directPosts: [],
          posts: [],
          rawTags: new Set()
        });
      }

      const tagEntry = tagMap.get(key);

      if (!tagEntry.directPosts.some((entry) => entry.permalink === post.permalink)) {
        tagEntry.directPosts.push(post);
      }

      tagEntry.rawTags.add(rawTag);
    }
  }

  for (const tagEntry of tagMap.values()) {
    if (tagEntry.parentPermalink && tagMap.has(tagEntry.parentPermalink)) {
      tagMap.get(tagEntry.parentPermalink).childrenPermalinks.add(tagEntry.permalink);
    }
  }

  const memo = new Map();

  function collectPostsForTag(permalink, stack = []) {
    if (memo.has(permalink)) {
      return memo.get(permalink);
    }

    if (stack.includes(permalink)) {
      throw new Error(`Tag hierarchy cycle detected: ${stack.concat(permalink).join(" -> ")}`);
    }

    const tagEntry = tagMap.get(permalink);
    const nestedStack = stack.concat(permalink);
    let postsForTag = [...(tagEntry.directPosts || [])];

    for (const childPermalink of tagEntry.childrenPermalinks || []) {
      postsForTag = postsForTag.concat(collectPostsForTag(childPermalink, nestedStack));
    }

    const deduped = uniquePosts(postsForTag).sort((a, b) => new Date(b.date) - new Date(a.date));
    memo.set(permalink, deduped);
    return deduped;
  }

  return Array.from(tagMap.values())
    .map((tag) => ({
      ...tag,
      directCount: tag.directPosts.length,
      childTags: Array.from(tag.childrenPermalinks)
        .map((permalink) => tagMap.get(permalink))
        .filter(Boolean)
        .map((entry) => ({
          tag: entry.tag,
          displayTitle: entry.displayTitle,
          permalink: entry.permalink
        }))
        .sort((a, b) => a.displayTitle.localeCompare(b.displayTitle)),
      rawTags: Array.from(tag.rawTags).sort(),
      posts: collectPostsForTag(tag.permalink),
      count: collectPostsForTag(tag.permalink).length
    }))
    .sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
};
