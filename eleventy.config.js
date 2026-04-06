module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ img: "img" });
  eleventyConfig.addPassthroughCopy({ slides: "slides" });
  eleventyConfig.addPassthroughCopy({ CNAME: "CNAME" });
  eleventyConfig.addPassthroughCopy({
    "googlea1fed2510060dd96.html": "googlea1fed2510060dd96.html"
  });

  eleventyConfig.addFilter("displayDate", (value) => {
    if (!value) {
      return "";
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Europe/London"
    }).format(date);
  });

  eleventyConfig.addShortcode("currentYear", () => {
    return new Date().getFullYear();
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
