'use client';

import { ANAMNESE_CATEGORIAS, ANAMNESE_TEMPLATES, type AnamneseTemplateId } from '../../lib/anamneseTemplates';

interface SelecionarAnamneseModalProps {
  onSelect: (id: AnamneseTemplateId) => void;
  onClose: () => void;
}

export default function SelecionarAnamneseModal({ onSelect, onClose }: SelecionarAnamneseModalProps) {
  return (
    <div
      className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white-pure rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant/50 flex items-center justify-between">
          <div>
            <h3 className="font-manrope text-[20px] font-extrabold text-on-surface">Escolher Modelo de Anamnese</h3>
            <p className="text-[13px] text-on-surface-variant mt-1">A ficha muda de acordo com o procedimento realizado.</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface hover:bg-outline-variant/30 flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {ANAMNESE_CATEGORIAS.map(categoria => (
            <div key={categoria.id}>
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-outline mb-3">{categoria.label}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoria.templateIds.map(id => {
                  const template = ANAMNESE_TEMPLATES[id];
                  return (
                    <button
                      key={id}
                      onClick={() => onSelect(id)}
                      className="text-left p-4 rounded-2xl border border-outline-variant/60 bg-surface hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <span className="font-bold text-[13px] text-on-surface">{template.titulo}</span>
                      <span className="text-[10px] font-bold text-on-surface-variant bg-white-pure border border-outline-variant/50 px-2 py-1 rounded-full shrink-0">
                        {template.questions.length} perguntas
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
