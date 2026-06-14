const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add despesas state
const despesaStateRegex = /const \[despesas, setDespesas\]/;
if (!despesaStateRegex.test(content)) {
  const stateInsertPoint = /const \[currentTab, setCurrentTab\] = useState[^;]+;/;
  content = content.replace(stateInsertPoint, `$&
  
  const [despesas, setDespesas] = useState<{id: string, descricao: string, valor: number, data: string, categoria: string, status: string}[]>([]);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [newDespesa, setNewDespesa] = useState({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: 'Outros', status: 'Pago' });
`);
}

// 2. Add fetchDespesas inside loadData
const loadDataRegex = /const loadData = async \(\) => \{([\s\S]*?)fetchCompany\(\);/;
if (loadDataRegex.test(content) && !content.includes('fetchDespesas()')) {
  content = content.replace(loadDataRegex, `$1
    const fetchDespesas = async () => {
      const { data, error } = await supabase.from('despesas').select('*').order('data', { ascending: false });
      if (!error && data) setDespesas(data);
    };
    fetchDespesas();
    fetchCompany();`);
}

// 3. Add CRUD logic before the return statement
const crudInsertPoint = /return \(\s*<div className="bg-background text-on-surface font-sans overflow-hidden/;
if (!content.includes('addDespesa')) {
  content = content.replace(crudInsertPoint, `
  const addDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('despesas').insert({
      descricao: newDespesa.descricao,
      valor: parseFloat(newDespesa.valor.replace(',', '.')),
      data: newDespesa.data,
      categoria: newDespesa.categoria,
      status: newDespesa.status
    }).select();
    
    if (error) {
      showAlert('Erro ao adicionar despesa: ' + error.message);
    } else if (data) {
      setDespesas([data[0], ...despesas]);
      setIsDespesaModalOpen(false);
      setNewDespesa({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: 'Outros', status: 'Pago' });
      showAlert('Despesa cadastrada com sucesso!');
    }
  };

  const deleteDespesa = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;
    const { error } = await supabase.from('despesas').delete().eq('id', id);
    if (error) {
      showAlert('Erro ao excluir despesa: ' + error.message);
    } else {
      setDespesas(despesas.filter(d => d.id !== id));
      showAlert('Despesa excluída com sucesso!');
    }
  };

  $&`);
}

// 4. Update the Despesas Section
const despesasSectionRegex = /\{currentTab === 'despesas' && \([\s\S]*?<section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">[\s\S]*?<div className="bg-white-pure rounded-3xl p-6 border border-outline-variant text-center py-16">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/section>\s*\)\}/;

const newDespesasSection = `{currentTab === 'despesas' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-manrope text-[24px] font-bold text-primary">Despesas</h1>
                  <p className="text-[13px] text-on-surface-variant">Controle de saídas, aluguéis, materiais e despesas fixas</p>
                </div>
                <button onClick={() => setIsDespesaModalOpen(true)} className="bg-primary text-white-pure px-4 py-2.5 rounded-xl font-bold text-[13px] hover:opacity-90 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Nova Despesa
                </button>
              </div>
              <div className="bg-white-pure rounded-3xl border border-outline-variant overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-container-lowest border-b border-outline-variant">
                    <tr>
                      <th className="px-6 py-4 font-bold text-primary">Descrição</th>
                      <th className="px-6 py-4 font-bold text-primary">Data</th>
                      <th className="px-6 py-4 font-bold text-primary">Valor</th>
                      <th className="px-6 py-4 font-bold text-primary">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {despesas.map(d => (
                      <tr key={d.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-primary">{d.descricao}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-error font-bold">R$ {d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4">
                           <span className={\`inline-block px-2 py-1 rounded-md text-[10px] font-bold \${d.status === 'Pago' ? 'bg-[#ebf3fe] text-blue-800' : 'bg-[#fff9eb] text-amber-800'}\`}>
                             {d.status || 'Pendente'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => deleteDespesa(d.id)} className="text-on-surface-variant hover:text-error transition-colors p-1">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {despesas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-[48px] text-error/30 mb-4 block">monetization_on</span>
                          <p className="font-manrope font-bold text-[15px]">Nenhuma despesa cadastrada</p>
                          <p className="text-[12px] mt-1">Registre suas contas para apurar o lucro líquido nos resumos financeiros.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}`;

if (despesasSectionRegex.test(content)) {
  content = content.replace(despesasSectionRegex, newDespesasSection);
}

// 5. Add Modal HTML inside the <div className="bg-background ..."> wrapper
const modalInsertPoint = /\{isMobileMenuOpen && \(/;
if (!content.includes('Modal Nova Despesa')) {
  content = content.replace(modalInsertPoint, `
      {/* Modal Nova Despesa */}
      {isDespesaModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white-pure rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsDespesaModalOpen(false)} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors bg-surface-container-lowest rounded-full p-2">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h2 className="text-[24px] font-black text-primary font-manrope mb-2">Nova Despesa</h2>
            <p className="text-[13px] text-on-surface-variant mb-6 leading-relaxed">Cadastre uma nova conta, aluguel ou gasto em materiais.</p>
            <form onSubmit={addDespesa} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Descrição</label>
                <input required value={newDespesa.descricao} onChange={e => setNewDespesa({...newDespesa, descricao: e.target.value})} placeholder="Ex: Energia Elétrica, Aluguel..." className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-outline" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Valor (R$)</label>
                  <input required value={newDespesa.valor} onChange={e => setNewDespesa({...newDespesa, valor: e.target.value})} placeholder="0,00" type="number" step="0.01" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Data</label>
                  <input required value={newDespesa.data} onChange={e => setNewDespesa({...newDespesa, data: e.target.value})} type="date" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Status</label>
                  <select value={newDespesa.status} onChange={e => setNewDespesa({...newDespesa, status: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Categoria</label>
                  <select value={newDespesa.categoria} onChange={e => setNewDespesa({...newDespesa, categoria: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="Fixa">Fixa (Aluguel, Luz)</option>
                    <option value="Insumos">Insumos/Materiais</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-white-pure font-bold text-[14px] py-3.5 rounded-xl hover:opacity-90 transition-opacity mt-4 flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check</span>
                Adicionar Despesa
              </button>
            </form>
          </div>
        </div>
      )}
      
      $&`);
}

fs.writeFileSync(pagePath, content);
console.log('Update applied');
