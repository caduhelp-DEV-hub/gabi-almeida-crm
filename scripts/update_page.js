const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Change default tab
content = content.replace(
  "const [currentTab, setCurrentTab] = useState<'dashboard' | 'agenda' | 'clientes' | 'financeiro' | 'usuarios' | 'cadastro-cliente' | 'servicos' | 'estoque'>('dashboard');",
  "const [currentTab, setCurrentTab] = useState<'dashboard' | 'agenda' | 'clientes' | 'financeiro' | 'usuarios' | 'cadastro-cliente' | 'servicos' | 'estoque'>('agenda');"
);

// 2. Remove nav-dashboard button
content = content.replace(/<button\s+id="nav-dashboard"[\s\S]*?<\/button>\s*/, '');

// 3. Remove Dashboard block
content = content.replace(/{\/\* 3\. Main Dashboard Tab Canvas \*\/}[\s\S]*?(?={\/\* 4\. Agenda Tab Canvas \*\/})/g, '');

// 4. Update overlay and sidebar layout
content = content.replace(
  "{false && isMobileMenuOpen && (",
  "{isMobileMenuOpen && ("
);
content = content.replace(
  "className={`sidebar fixed lg:relative left-0 top-0 h-full w-72 flex flex-col border-r border-outline-variant bg-surface-container-low backdrop-blur-md z-40 transition-transform duration-300 ${isMobileMenuOpen ? 'open translate-x-0' : '-translate-x-full lg:translate-x-0'}`}",
  "className={`sidebar fixed left-0 top-0 h-full w-72 flex flex-col border-r border-outline-variant bg-surface-container-low backdrop-blur-md z-40 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}"
);

fs.writeFileSync('app/page.tsx', content, 'utf8');
console.log('Modificações concluídas com sucesso');
