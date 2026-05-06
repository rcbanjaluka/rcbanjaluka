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
  
  while (i < lines.length && lines[i].trim() === '---') i++;
  
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '---') break;
    
    const blockMatch = line.match(/^(\w+):\s*\|\s*$/);
    if (blockMatch) {
      const key = blockMatch[1];
      i++;
      const blockLines = [];
      while (i < lines.length && (lines[i].match(/^\s{2,}/) || lines[i].trim() === '')) {
        blockLines.push(lines[i].replace(/^ {2}/, ''));
        i++;
      }
      data[key] = blockLines.join('\n').trim();
      continue;
    }
    
    const fieldMatch = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (fieldMatch) {
      data[fieldMatch[1]] = fieldMatch[2].trim();
    }
    i++;
  }
  
  return data;
}

module.exports = function() {
  // Try multiple possible paths
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
