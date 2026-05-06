module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("slike");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");

  // Ignore content folder as templates - only use via collections/_data
  eleventyConfig.ignores.add("content/**");

  // Collections
  eleventyConfig.addCollection("clanovi", function(collectionApi) {
    return collectionApi.getFilteredByGlob("content/clanovi/*.md")
      .sort((a, b) => {
        const nameA = (a.data.ime || "").toLowerCase();
        const nameB = (b.data.ime || "").toLowerCase();
        return nameA.localeCompare(nameB, 'sr');
      });
  });

  eleventyConfig.addCollection("vijesti", function(collectionApi) {
    return collectionApi.getFilteredByGlob("content/vijesti/*.md")
      .sort((a, b) => {
        const dateA = new Date(a.data.datum || 0);
        const dateB = new Date(b.data.datum || 0);
        return dateB - dateA;
      });
  });

  eleventyConfig.addCollection("projekti", function(collectionApi) {
    return collectionApi.getFilteredByGlob("content/projekti/*.md")
      .sort((a, b) => (a.data.redoslijed || 99) - (b.data.redoslijed || 99));
  });

  eleventyConfig.addCollection("nagrade", function(collectionApi) {
    return collectionApi.getFilteredByGlob("content/nagrade/*.md")
      .sort((a, b) => (b.data.godina || 0) - (a.data.godina || 0));
  });

  // Filters
  eleventyConfig.addFilter("initials", function(name) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
