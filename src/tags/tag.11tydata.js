module.exports = {
  eleventyComputed: {
    browserTitle: (data) => data.tag.title,
    title: (data) => data.tag.heading,
    permalink: (data) => `${data.tag.permalink}index.html`
  }
};
