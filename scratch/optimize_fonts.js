const fs = require('fs');
let layout = fs.readFileSync('app/layout.tsx', 'utf8');

const importFont = `import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
`;

layout = layout.replace("import './globals.css';", importFont + "\nimport './globals.css';");

// Remove the external links for fonts
layout = layout.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\s*/g, '');
layout = layout.replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossOrigin="anonymous" \/>\s*/g, '');
layout = layout.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Manrope.*?rel="stylesheet" \/>\s*/g, '');

// Update body class
layout = layout.replace('<body className="font-sans antialiased text-on-surface bg-background"', '<body className={`${jakarta.variable} ${manrope.variable} font-sans antialiased text-on-surface bg-background`}');

fs.writeFileSync('app/layout.tsx', layout);
console.log('Fonts optimized!');
