import React from 'react';

interface DespesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  newDespesa: {
    descricao: string;
    valor: string;
    data: string;
    status: string;
    categoria: string;
  };
  setNewDespesa: (val: any) => void;
  addDespesa: (e: React.FormEvent) => void;
}

export default function DespesaModal({
  isOpen,
  onClose,
  newDespesa,
  setNewDespesa,
  addDespesa
}: DespesaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white-pure rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors bg-surface-container-lowest rounded-full p-2">
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
  );
}
