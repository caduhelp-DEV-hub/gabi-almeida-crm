const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add states
const statesToAdd = `
  const [editingTimelineItemId, setEditingTimelineItemId] = useState<string | null>(null);
  const [editingTimelineText, setEditingTimelineText] = useState('');
  const [clearedNotifications, setClearedNotifications] = useState(false);
  const [mensagensPredefinidas, setMensagensPredefinidas] = useState<any[]>([]);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<any | null>(null);
`;
content = content.replace(/(const \[currentTab, setCurrentTab\] = useState.*?;\n)/s, `$1${statesToAdd}`);

// 2. Fetch messages in loadData
const loadDataRegex = /(const { data: usersData, error: usersError } = await supabase\s*\.from\('users'\)\s*\.select\('\*'\);)/s;
const loadMsgsCode = `
      const { data: msgsData } = await supabase.from('mensagens_predefinidas').select('*').order('created_at', { ascending: false });
      if (msgsData) setMensagensPredefinidas(msgsData);
`;
content = content.replace(loadDataRegex, `${loadMsgsCode}\n      $1`);

// 3. Add timeline and msg functions
const functionsToAdd = `
  const deleteTimelineItem = async (patientId: string, itemId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este protocolo?')) return;
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      const newHistorico = patient.historico.filter(item => item.id !== itemId);
      const { error } = await supabase.from('clientes').update({ historico: newHistorico }).eq('id', patientId);
      if (error) throw error;
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, historico: newHistorico } : p));
      if (selectedPatient?.id === patientId) setSelectedPatient({ ...selectedPatient, historico: newHistorico });
    } catch (err: any) {
      showAlert('Erro ao excluir: ' + err.message);
    }
  };

  const saveTimelineItem = async (patientId: string, itemId: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      const newHistorico = patient.historico.map(item => item.id === itemId ? { ...item, description: editingTimelineText } : item);
      const { error } = await supabase.from('clientes').update({ historico: newHistorico }).eq('id', patientId);
      if (error) throw error;
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, historico: newHistorico } : p));
      if (selectedPatient?.id === patientId) setSelectedPatient({ ...selectedPatient, historico: newHistorico });
      setEditingTimelineItemId(null);
    } catch (err: any) {
      showAlert('Erro ao atualizar: ' + err.message);
    }
  };

  const saveMsgPredefinida = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const trigger_type = formData.get('trigger_type') as string;
    const contentText = formData.get('content') as string;
    
    try {
      if (editingMsg?.id) {
        const { data, error } = await supabase.from('mensagens_predefinidas').update({ title, trigger_type, content: contentText }).eq('id', editingMsg.id).select();
        if (error) throw error;
        setMensagensPredefinidas(prev => prev.map(m => m.id === editingMsg.id ? data[0] : m));
        showAlert('Mensagem atualizada com sucesso!');
      } else {
        const { data, error } = await supabase.from('mensagens_predefinidas').insert([{ title, trigger_type, content: contentText }]).select();
        if (error) throw error;
        setMensagensPredefinidas(prev => [data[0], ...prev]);
        showAlert('Mensagem criada com sucesso!');
      }
      setIsMsgModalOpen(false);
    } catch (err: any) {
      showAlert('Erro ao salvar mensagem: ' + err.message);
    }
  };

  const deleteMsgPredefinida = async (id: string) => {
    if (!window.confirm('Excluir esta mensagem?')) return;
    try {
      const { error } = await supabase.from('mensagens_predefinidas').delete().eq('id', id);
      if (error) throw error;
      setMensagensPredefinidas(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      showAlert('Erro ao excluir: ' + err.message);
    }
  };
`;
// Insert before useEffect loadData
content = content.replace(/(const fetchInitialData = async \(\) => {)/, `${functionsToAdd}\n  $1`);

// 4. Update critical alerts
const criticalAlertsRegex = /(const criticalAlerts = \[)(.*?)(\];)/s;
const newCriticalAlerts = `
  const todayStr = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
  const todaysAppointments = appointments.filter(a => a.data === todayStr && a.status !== 'Finalizado');
  
  const criticalAlerts = clearedNotifications ? [] : [
    ...inventory.filter(i => i.quantity <= i.minQuantity).map(i => ({
      id: \`inv-\${i.id}\`,
      type: 'inventory',
      title: 'Estoque Baixo: ' + i.name,
      text: \`Apenas \${i.quantity} \${i.unit} restantes no estoque.\`,
      icon: 'inventory_2',
      alertClass: 'bg-primary/5 border-primary text-on-surface'
    })),
    ...todaysAppointments.map(a => ({
      id: \`appt-\${a.id}\`,
      type: 'appointment',
      title: 'Agendamento Hoje',
      text: \`\${a.hora} - \${a.clienteNome} (\${a.procedimento})\`,
      icon: 'event',
      alertClass: 'bg-secondary/5 border-secondary text-on-surface'
    }))
  ];
`;
content = content.replace(criticalAlertsRegex, newCriticalAlerts);

// 5. Update timeline UI
const timelineItemRegex = /(<div className="flex justify-between items-center mb-1 flex-wrap gap-2">[\s\S]*?<h4 className="font-manrope text-\[13px\] font-bold text-on-surface">\{item.title\}<\/h4>[\s\S]*?<span className="text-\[11px\] text-on-surface-variant font-medium">\{item.date\}<\/span>[\s\S]*?<\/div>)([\s\S]*?)(<p className="text-\[12px\] text-on-surface-variant leading-relaxed mt-1">\{item.description\}<\/p>)/;
const newTimelineItem = `$1
                                <div className="absolute right-4 top-4 flex gap-2">
                                  <button onClick={() => { setEditingTimelineItemId(item.id); setEditingTimelineText(item.description); }} className="text-on-surface-variant hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button onClick={() => deleteTimelineItem(selectedPatient.id, item.id)} className="text-on-surface-variant hover:text-error transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                                {editingTimelineItemId === item.id ? (
                                  <div className="mt-2 space-y-2">
                                    <textarea 
                                      className="w-full bg-white-pure border border-outline-variant rounded-xl p-3 text-[13px] text-on-surface focus:outline-none focus:border-primary resize-none" 
                                      rows={3} 
                                      value={editingTimelineText}
                                      onChange={(e) => setEditingTimelineText(e.target.value)}
                                    ></textarea>
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => setEditingTimelineItemId(null)} className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container rounded-lg">Cancelar</button>
                                      <button onClick={() => saveTimelineItem(selectedPatient.id, item.id)} className="px-3 py-1.5 text-[11px] font-bold bg-primary text-white-pure hover:opacity-90 rounded-lg">Salvar</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[12px] text-on-surface-variant leading-relaxed mt-1">{item.description}</p>
                                )}`;
content = content.replace(timelineItemRegex, newTimelineItem);

// 6. Update notification dropdown
const notifDropdownRegex = /(<div className="absolute right-0 mt-4 w-80 bg-white-pure rounded-3xl shadow-xl border border-outline-variant\/30 overflow-hidden z-50 animate-fade-in origin-top-right">)(\s*)(<div className="p-3 border-b border-outline-variant\/30">)/;
const newNotifDropdown = `$1$2<div className="p-3 border-b border-outline-variant/30 flex justify-between items-center">
                          <span className="text-[14px] font-bold text-on-surface font-manrope">Notificações</span>
                          {criticalAlerts.length > 0 && <button onClick={() => setClearedNotifications(true)} className="text-[11px] text-primary font-bold hover:underline">Limpar</button>}
                        </div>`;
content = content.replace(/(<div className="p-3 border-b border-outline-variant\/30">\s*<h3 className="font-manrope text-\[14px\] font-bold text-on-surface">Notificações<\/h3>\s*<\/div>)/, `<div className="p-3 border-b border-outline-variant/30 flex justify-between items-center">
                          <span className="text-[14px] font-bold text-on-surface font-manrope">Notificações</span>
                          {criticalAlerts.length > 0 && <button onClick={() => setClearedNotifications(true)} className="text-[11px] text-primary font-bold hover:underline">Limpar</button>}
                        </div>`);


// 7. Update Msgs Pre-definidas View
const msgsViewRegex = /(\{currentTab === 'mensagens-pre' && \([\s\S]*?<button onClick=\{\(\) => )showAlert\('Função de cadastrar modelo em desenvolvimento\.'\)([\s\S]*?<\/button>\s*<\/div>\s*<div className="grid grid-cols-1 md:grid-cols-2 gap-4">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>\s*\})/;

const newMsgsView = `$1setIsMsgModalOpen(true); setEditingMsg(null);$2
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
$4`;
content = content.replace(msgsViewRegex, newMsgsView);


// 8. Add modal for Msgs Predefinidas at the end before closing divs
const msgModalCode = `
      {/* Modal Mensagem Predefinida */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={() => setIsMsgModalOpen(false)}>
          <div className="bg-[#f7f3f0] rounded-3xl border border-outline-variant w-full max-w-lg overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-white-pure">
              <h2 className="font-manrope text-[20px] font-bold text-primary">{editingMsg ? 'Editar Modelo' : 'Novo Modelo de Mensagem'}</h2>
              <button onClick={() => setIsMsgModalOpen(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={saveMsgPredefinida} className="p-6 space-y-5 bg-white-pure">
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Título do Modelo</label>
                <input required name="title" defaultValue={editingMsg?.title || ''} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors" placeholder="Ex: Pós-Procedimento D+15" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Gatilho</label>
                <select required name="trigger_type" defaultValue={editingMsg?.trigger_type || 'Agenda'} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors">
                  <option value="Agenda">Agenda (Lembrete)</option>
                  <option value="Pós-Procedimento">Pós-Procedimento</option>
                  <option value="Aniversário">Aniversário</option>
                  <option value="Inativo">Cliente Inativo</option>
                  <option value="Livre">Mensagem Livre</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Conteúdo da Mensagem</label>
                <textarea required name="content" defaultValue={editingMsg?.content || ''} rows={5} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" placeholder="Olá [nome]! Confirmamos..."></textarea>
                <p className="text-[10px] text-on-surface-variant mt-2">Dica: Use [nome], [data], [hora], [procedimento] como variáveis dinâmicas se sua integração WhatsApp suportar.</p>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsMsgModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-[14px] text-on-surface hover:bg-surface-container transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white-pure py-3.5 rounded-xl font-bold text-[14px] hover:opacity-90 transition-opacity">Salvar Modelo</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;
content = content.replace(/(      \{isNewUserModalOpen && \()/s, `${msgModalCode}\n$1`);

fs.writeFileSync(pagePath, content);
console.log('Update page successful.');
