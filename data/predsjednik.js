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
  // Handle block scalar (|) fields manually
  const data = {};
  const lines = raw.split('\n');
  let i = 0;
  
  // Skip --- 
  while (i < lines.length && lines[i].trim() === '---') i++;
  
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '---') break;
    
    // Check for block scalar field (key: |)
    const blockMatch = line.match(/^(\w+):\s*\|\s*$/);
    if (blockMatch) {
      const key = blockMatch[1];
      const indent = line.match(/^(\s*)/)[1].length + 2;
      i++;
      const blockLines = [];
      while (i < lines.length && (lines[i].match(/^\s{2,}/) || lines[i].trim() === '')) {
        blockLines.push(lines[i].replace(/^ {2}/, ''));
        i++;
      }
      data[key] = blockLines.join('\n').trim();
      continue;
    }
    
    // Regular field (key: "value" or key: value)
    const fieldMatch = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (fieldMatch) {
      data[fieldMatch[1]] = fieldMatch[2].trim();
    }
    i++;
  }
  
  return data;
}

module.exports = function() {
  const filePath = path.join(__dirname, '../content/postavke/predsjednik.md');
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = parseYamlBlock(raw);
  
  // Convert text to HTML paragraphs
  if (data.poruka_sr) data.poruka_sr = textToHtml(data.poruka_sr);
  if (data.poruka_en) data.poruka_en = textToHtml(data.poruka_en);

  return data;
};
