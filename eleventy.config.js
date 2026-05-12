const fs = require('fs');
const path = require('path');

function textToHtml(text) {
  if (!text) return '';
  return text
    .trim()
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function parseYamlFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const lines = yaml.split('\n');
  const data = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Provjeri da li linija počinje novim poljem: kljuc: ...
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!keyMatch) { i++; continue; }

    const key = keyMatch[1];
    const rest = keyMatch[2].trim();

    if (rest === '|' || rest === '|-' || rest === '|+' ||
        rest === '>' || rest === '>-' || rest === '>+') {
      // Višelinijski blok — čitaj sve dok ne naiđemo na novi kljuc: na početku reda
      const isFolded = rest.startsWith('>');
      i++;
      const blockLines = [];
      while (i < lines.length) {
        const nextLine = lines[i];
        // Ako počinje novim poljem (word: format, bez uvlačenja), zaustavi se
        if (/^\w+:\s/.test(nextLine) || /^\w+:$/.test(nextLine)) break;
        // Skini uvlačenje od 2 razmaka ako postoji
        blockLines.push(nextLine.replace(/^ {2}/, ''));
        i++;
      }

      if (isFolded) {
        // > format: prazna linija = novi paragraf, ostale linije se spajaju
        const paragraphs = [];
        let para = [];
        for (const bl of blockLines) {
          if (bl.trim() === '') {
            if (para.length) { paragraphs.push(para.join(' ')); para = []; }
          } else {
            para.push(bl.trim());
          }
        }
        if (para.length) paragraphs.push(para.join(' '));
        data[key] = paragraphs.join('\n\n');
      } else {
        // | format: čuva linije kakve jesu
        data[key] = blockLines.join('\n').trim();
      }
    } else {
      // Jednostavno polje na jednoj liniji
      data[key] = rest.replace(/^["']|["']$/g, '').trim();
      i++;
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
    console.log('[predsjednik] poruka_sr RAW:', JSON.stringify(data.poruka_sr ? data.poruka_sr.substring(0, 200) : null));
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
        const parts = (ime) => (ime || "").trim().split(" ");
        const lastA = parts(a.data.ime).slice(-1)[0] || "";
        const lastB = parts(b.data.ime).slice(-1)[0] || "";
        return lastA.localeCompare(lastB, 'hr', { sensitivity: 'base' });
      });
  });
  eleventyConfig.addCollection("uprava", function(collectionApi) {
    const redosljed = [
      "Predsjednik 2025–2026",
      "Zamjenik predsjednika",
      "Dolazeći predsjednik",
      "Prethodni predsjednik",
      "Sekretar",
      "Blagajnik"
    ];
    return collectionApi.getFilteredByGlob("content/clanovi/*.md")
      .filter(a => redosljed.includes(a.data.uloga_sr))
      .sort((a, b) => {
        return redosljed.indexOf(a.data.uloga_sr) - redosljed.indexOf(b.data.uloga_sr);
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
  eleventyConfig.addFilter("datumFormat", function(datum) {
  if (!datum) return "";
  const d = new Date(datum);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
