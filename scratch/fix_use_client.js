const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');

// Remove 'use client'; if it exists
const filteredLines = lines.filter(l => l.trim() !== "'use client';" && l.trim() !== '"use client";');

// Re-add it at the very top
const newContent = "'use client';\n" + filteredLines.join('\n');
fs.writeFileSync('app/page.tsx', newContent);
console.log('Fixed use client directive');
