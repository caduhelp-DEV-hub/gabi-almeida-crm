const fs = require('fs');
let lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
const start = lines.findIndex((l, i) => i > 120 && l.trim() === 'mapUserToBackend,');
if (start !== -1) {
  let end = start;
  while(end < lines.length && !lines[end].includes("} from '../lib/types';")) {
    end++;
  }
  end++;
  console.log('Removing lines ' + start + ' to ' + (end-1));
  lines.splice(start, end - start);
  fs.writeFileSync('app/page.tsx', lines.join('\n'));
}
