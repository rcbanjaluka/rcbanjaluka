console.log('[TEST] predsjednik.js se izvrsava');
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

module.exports = function() {
  const possiblePaths = [
    path.join(__dirname, '../content/postavke/predsjednik.md'),
    path.join(process.cwd(), 'content/postavke/predsjednik.md'),
  ];

  let raw = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      raw = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  if (!raw) {
    console.log('[predsjednik] GREŠKA: fajl nije pronađen');
    return null;
  }

  // Izvuci YAML blok između --- separatora
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    console.log('[predsjednik] GREŠKA: nema YAML bloka');
    return null;
  }

  const yaml = match[1];
  const data = {};

  // Parsiranje višelinijskih polja (| ili > format)
  const fieldRegex = /^(\w+):\s*([|>][-+]?)\s*\r?\n([\s\S]*?)(?=^\w+:|$)/gm;
  let m;
  while ((m = fieldRegex.exec(yaml)) !== null) {
    const key = m[1];
    const style = m[2].trim();
    const block = m[3];

    if (style.startsWith('|')) {
      // Literal: čuva linije kakve jesu
      data[key] = block.split('\n').map(l => l.replace(/^ {2}/, '')).join('\n').trim();
    } else {
      // Folded (>): spaja linije u paragrafe
      const lines = block.split('\n').map(l => l.replace(/^ {2}/, ''));
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
    }
  }

  // Parsiranje jednostavnih polja (jedna linija)
  const simpleRegex = /^(\w+):\s*(?![|>])(.+)$/gm;
  while ((m = simpleRegex.exec(yaml)) !== null) {
    if (!data[m[1]]) {
      data[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }

  console.log('[predsjednik] Učitana polja:', Object.keys(data));

  if (data.poruka_sr) data.poruka_sr = textToHtml(data.poruka_sr);
  if (data.poruka_en) data.poruka_en = textToHtml(data.poruka_en);

  return data;
};
