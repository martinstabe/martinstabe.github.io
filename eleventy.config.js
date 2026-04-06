module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ img: "img" });
  eleventyConfig.addPassthroughCopy({ slides: "slides" });
  eleventyConfig.addPassthroughCopy({ CNAME: "CNAME" });
  eleventyConfig.addPassthroughCopy({
    "googlea1fed2510060dd96.html": "googlea1fed2510060dd96.html"
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "dist"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"]
  };
};
