const fs = require('fs');
const path = require('path');

module.exports = function() {
  const filePath = path.join(__dirname, '../content/postavke/predsjednik.md');
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  const data = {};
  match[1].split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) data[m[1]] = m[2].trim();
  });

  // Get body content (after frontmatter)
  const bodyMatch = raw.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
  if (bodyMatch) {
    data.body = bodyMatch[1].trim();
  }

  return data;
};
