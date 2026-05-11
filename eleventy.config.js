const fs = require('fs');
const path = require('path');
 
function textToHtml(text) {
  if (!text) return '';
  return text
    .trim()
    .split(/\n\n+/)
    .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}
 
function parseYamlFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
 
  const yaml = match[1];
  const data = {};
 
  // Višelinijska polja (| ili > format)
  const fieldRegex = /^(\w+):\s*([|>][-+]?)\s*\r?\n([\s\S]*?)(?=^\w+:|$)/gm;
  let m;
  while ((m = fieldRegex.exec(yaml)) !== null) {
    const key = m[1];
    const isFolded = m[2].trim().startsWith('>');
    const block = m[3];
    const lines = block.split('\n').map(l => l.replace(/^ {2}/, ''));
 
    if (isFolded) {
      let result = '';
      let para = [];
      for (const line of lines) {
        if (line.trim() === '') {
          if (para.length) { result += para.join(' ') + '\n\n'; para = []; }
        } else {
          para.push(line.trim());
        }
      }
      if (para.length) result += para.join(' ');
      data[key] = result.trim();
    } else {
      data[key] = lines.join('\n').trim();
    }
  }
 
  // Jednostavna polja (jedna linija)
  const simpleRegex = /^(\w+):\s*(?![|>])(.+)$/gm;
  while ((m = simpleRegex.exec(yaml)) !== null) {
    if (!data[m[1]]) {
      data[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
 
  return data;
}
 
module.exports = function(eleventyConfig) {
 
  // ── PREDSJEDNIK global data ──
  eleventyConfig.addGlobalData("predsjednik", function() {
    const filePath = path.join(process.cwd(), 'content/postavke/predsjednik.md');
    console.log('[predsjednik] Tražim fajl na:', filePath);
    if (!fs.existsSync(filePath)) {
      console.log('[predsjednik] GREŠKA: fajl nije pronađen');
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = parseYamlFrontmatter(raw);
    if (!data) {
      console.log('[predsjednik] GREŠKA: YAML parsiranje neuspješno');
      return null;
    }
    if (data.poruka_sr) data.poruka_sr = textToHtml(data.poruka_sr);
    if (data.poruka_en) data.poruka_en = textToHtml(data.poruka_en);
    console.log('[predsjednik] Uspješno učitano:', Object.keys(data));
    return data;
  });
 
  // Copy static assets
  eleventyConfig.addPassthroughCopy("slike");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
 
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
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
 
