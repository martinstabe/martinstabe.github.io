const getPosts = require("./posts.js");

module.exports = function () {
  const posts = getPosts();
  const tagMap = new Map();

  for (const post of posts) {
    for (const tag of post.tags || []) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }

      tagMap.get(tag).push(post);
    }
  }

  return Array.from(tagMap.entries())
    .map(([name, taggedPosts]) => ({
      name,
      slug: name,
      posts: taggedPosts.sort((a, b) => new Date(b.date) - new Date(a.date)),
      count: taggedPosts.length
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};
