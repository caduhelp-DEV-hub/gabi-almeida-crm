const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');
const states = fs.readFileSync('scratch/dashboardState.js', 'utf8').split(',\n');

const stateObject = '  const dashboardState = {\n    ' + states.join(',\n    ') + '\n  };\n\n';

const insertTarget = '  if (!isAuthenticated) {';
const insertIndex = page.indexOf(insertTarget);

if (insertIndex !== -1) {
  if (!page.includes('const dashboardState = {')) {
    page = page.substring(0, insertIndex) + stateObject + page.substring(insertIndex);
    
    const wrapTarget = '  return (\n    <div className="bg-background text-on-surface font-sans overflow-hidden h-[100dvh] flex relative">';
    page = page.replace(
      wrapTarget,
      '  return (\n    <DashboardProvider value={dashboardState}>\n    <div className="bg-background text-on-surface font-sans overflow-hidden h-[100dvh] flex relative">'
    );
    
    const lastDivIndex = page.lastIndexOf('</div>\n  );');
    if (lastDivIndex !== -1) {
      page = page.substring(0, lastDivIndex) + '</div>\n    </DashboardProvider>\n  );' + page.substring(lastDivIndex + 11);
    }
    
    page = "import { DashboardProvider } from '@/contexts/DashboardContext';\n" + page;
    
    fs.writeFileSync('app/page.tsx', page);
    console.log('Injected dashboardState successfully!');
  } else {
    console.log('Already injected.');
  }
} else {
  console.log('Insert target not found.');
}
