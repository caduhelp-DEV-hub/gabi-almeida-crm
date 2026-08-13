const fs = require('fs');
let page = fs.readFileSync('app/page.tsx', 'utf8');

// Replace standard imports with dynamic imports
const replacements = [
  { old: "import AnamneseLimpezaDePele from '../components/AnamneseLimpezaDePele';", new: "const AnamneseLimpezaDePele = dynamic(() => import('../components/AnamneseLimpezaDePele'), { ssr: false });" },
  { old: "import AnamneseMicroagulhamento from '../components/AnamneseMicroagulhamento';", new: "const AnamneseMicroagulhamento = dynamic(() => import('../components/AnamneseMicroagulhamento'), { ssr: false });" },
  { old: "import AnamneseMicroagulhamentoCompleto from '../components/AnamneseMicroagulhamentoCompleto';", new: "const AnamneseMicroagulhamentoCompleto = dynamic(() => import('../components/AnamneseMicroagulhamentoCompleto'), { ssr: false });" },
  { old: "import VendaSkincareModule from '../components/VendaSkincareModule';", new: "const VendaSkincareModule = dynamic(() => import('../components/VendaSkincareModule'), { ssr: false });" },
  { old: "import PlanoTratamentoModule from '../components/PlanoTratamentoModule';", new: "const PlanoTratamentoModule = dynamic(() => import('../components/PlanoTratamentoModule'), { ssr: false });" },
  { old: "import DocumentViewerModal from '../components/DocumentViewerModal';", new: "const DocumentViewerModal = dynamic(() => import('../components/DocumentViewerModal'), { ssr: false });" },
  { old: "import ChangePasswordModal from '../components/modals/ChangePasswordModal';", new: "const ChangePasswordModal = dynamic(() => import('../components/modals/ChangePasswordModal'), { ssr: false });" },
];

replacements.forEach(r => {
  page = page.replace(r.old, r.new);
});

if (!page.includes("import dynamic from 'next/dynamic';")) {
  page = "import dynamic from 'next/dynamic';\n" + page;
}

fs.writeFileSync('app/page.tsx', page);
console.log('Dynamic imports added!');
