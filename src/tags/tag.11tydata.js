module.exports = {
  eleventyComputed: {
    title: (data) => `Tag: ${data.tag.name}`,
    permalink: (data) => `/tags/${data.tag.slug}/index.html`
  }
};
