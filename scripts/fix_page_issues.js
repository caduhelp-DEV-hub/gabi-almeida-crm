const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Ensure companyData id defaults to '1' if empty
content = content.replace(
  /const \[companyData, setCompanyData\] = useState\(\{([\s\S]*?)\}\);/,
  `const [companyData, setCompanyData] = useState({$1, id: '1'});`
);

// We should also make sure fetchCompany creates it if missing? No, we inserted a default row in migration.
// If fetch returns empty it shouldn't overwrite the id '1' if we merge it.
content = content.replace(
  /setCompanyData\(data\);/g,
  `setCompanyData({ ...companyData, ...data });`
);


// 2. Remove Comandas Nav Item
const comandasNavRegex = /<button[\s\S]*?id="nav-comandas"[\s\S]*?<\/button>\s*/;
content = content.replace(comandasNavRegex, '');

// 3. Remove Comandas Section
const comandasSectionRegex = /\{currentTab === 'comandas' && \([\s\S]*?<section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">[\s\S]*?<div className="bg-white-pure rounded-3xl p-12 border border-outline-variant text-center flex flex-col items-center">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/section>\s*\)\}\s*/;
content = content.replace(comandasSectionRegex, '');


// 4. Fix Mensagens Pre-definidas View
const msgsPreRegex = /\{currentTab === 'mensagens-pre' && \([\s\S]*?<section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">[\s\S]*?<div className="max-w-4xl mx-auto space-y-6">[\s\S]*?<h1 className="font-manrope text-\[24px\] font-bold text-primary">Msgs Pre-definidas<\/h1>[\s\S]*?Novo Modelo\s*<\/button>\s*<\/div>\s*<div className="grid grid-cols-1 md:grid-cols-2 gap-4">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*\)\}/;

const newMsgsPre = `{currentTab === 'mensagens-pre' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-manrope text-[24px] font-bold text-primary">Msgs Pre-definidas</h1>
                  <p className="text-[13px] text-on-surface-variant">Respostas rápidas e modelos para envio no WhatsApp</p>
                </div>
                <button onClick={() => { setEditingMsg(null); setIsMsgModalOpen(true); }} className="bg-primary text-white-pure px-4 py-2.5 rounded-xl font-bold text-[13px] hover:opacity-90 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Novo Modelo
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mensagensPredefinidas.map(msg => (
                  <div key={msg.id} className="bg-white-pure rounded-3xl p-5 border border-outline-variant space-y-3 relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingMsg(msg); setIsMsgModalOpen(true); }} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                      <button onClick={() => deleteMsgPredefinida(msg.id)} className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                    </div>
                    <h3 className="font-bold text-[15px] text-primary pr-12">{msg.title}</h3>
                    <p className="text-[12px] text-on-surface-variant italic whitespace-pre-wrap">{msg.content}</p>
                    <span className="inline-block bg-[#ebf3fe] text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">Gatilho: {msg.trigger_type}</span>
                  </div>
                ))}
                {mensagensPredefinidas.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-12 text-on-surface-variant">
                    Nenhuma mensagem pré-definida cadastrada. Clique em "Novo Modelo" para adicionar.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}`;

if (msgsPreRegex.test(content)) {
  content = content.replace(msgsPreRegex, newMsgsPre);
} else {
  console.log("Could not find Mensagens Pre-definidas section!");
}


fs.writeFileSync(pagePath, content);
console.log('Update page applied successfully.');
