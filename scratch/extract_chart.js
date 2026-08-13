const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Remove the local definition of ServicePieChart
const chartStart = 'const ServicePieChart = ({ data }';
const chartEnd = '  return <canvas ref={canvasRef} width={240} height={240} className="mx-auto" />;\n};';
const startIndex = page.indexOf(chartStart);
const endIndex = page.indexOf(chartEnd) + chartEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  page = page.substring(0, startIndex) + page.substring(endIndex);
  console.log('Removed local ServicePieChart');
}

// 2. Add dynamic import at the top
const dynamicImport = `import dynamic from 'next/dynamic';\nconst ServicePieChart = dynamic(() => import('@/components/dashboard/ServicePieChart'), { ssr: false });\n`;
if (!page.includes('import dynamic from')) {
  page = page.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\n" + dynamicImport);
  console.log('Added dynamic import');
}

fs.writeFileSync('app/page.tsx', page);
