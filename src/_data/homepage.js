const getStories = require("./stories.js");
const getGraphics = require("./graphics.js");

function selectHomepageStories() {
  return getStories()
    .filter((story) => story.homepage === true && story.promo_image)
    .slice(0, 3);
}

function selectHomepageGraphics() {
  return getGraphics()
    .filter((graphic) => graphic.homepage === true)
    .map((graphic) => ({
      ...graphic,
      homepage_display_image: graphic.homepage_image || graphic.flourish_img
    }))
    .filter((graphic) => graphic.homepage_display_image)
    .slice(0, 6);
}

module.exports = function () {
  return {
    stories: selectHomepageStories(),
    graphics: selectHomepageGraphics()
  };
};
