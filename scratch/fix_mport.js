const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

const lines = page.split('\n');
const fixedLines = lines.map(line => {
  if (line.trim().startsWith('mport ')) {
    return line.replace('mport ', 'import ');
  }
  return line;
});

fs.writeFileSync('app/page.tsx', fixedLines.join('\n'));
console.log('Fixed mport errors');
