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

function parseYamlBlock(raw) {
  const data = {};
  const lines = raw.split('\n');
  let i = 0;

  // Skip opening ---
  while (i < lines.length && lines[i].trim() === '---') i++;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '---') break;

    // Block scalar: | (literal) or > (folded) — oba podržana
    const blockMatch = line.match(/^(\w+):\s*[|>][-+]?\s*$/);
    if (blockMatch) {
      const key = blockMatch[1];
      const isFolded = line.includes('>'); // > spaja linije u jedan paragraf
      i++;
      const blockLines = [];
      while (i < lines.length && (lines[i].match(/^\s{2,}/) || lines[i].trim() === '')) {
        blockLines.push(lines[i].replace(/^ {2}/, ''));
        i++;
      }
      if (isFolded) {
        // > format: prazna linija = novi paragraf, ostalo se spaja
        let result = '';
        let paragraph = [];
        for (const bl of blockLines) {
          if (bl.trim() === '') {
            if (paragraph.length) {
              result += paragraph.join(' ') + '\n\n';
              paragraph = [];
            }
          } else {
            paragraph.push(bl.trim());
          }
        }
        if (paragraph.length) result += paragraph.join(' ');
        data[key] = result.trim();
      } else {
        // | format: čuva linije kakve jesu
        data[key] = blockLines.join('\n').trim();
      }
      continue;
    }

    // Obično polje: kljuc: vrijednost (sa ili bez navodnika)
    const fieldMatch = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (fieldMatch) {
      data[fieldMatch[1]] = fieldMatch[2].trim();
    }
    i++;
  }

  return data;
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

  if (!raw) return null;

  const data = parseYamlBlock(raw);

  if (data.poruka_sr) data.poruka_sr = textToHtml(data.poruka_sr);
  if (data.poruka_en) data.poruka_en = textToHtml(data.poruka_en);

  return data;
};
