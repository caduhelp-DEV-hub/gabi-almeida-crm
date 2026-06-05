import React from 'react';

interface PatientDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  signed: boolean;
  signatureBase64?: string;
  content?: any;
}

interface DocumentViewerModalProps {
  document: PatientDocument;
  onClose: () => void;
}

export default function DocumentViewerModal({ document: doc, onClose }: DocumentViewerModalProps) {
  const isAnamnese = doc.type === 'Anamnese' && doc.content;
  const content = doc.content || {};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-manrope">
      <div className="bg-white-pure rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/50 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/50 flex items-center justify-between sticky top-0 bg-white-pure z-10">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-primary/10 text-primary rounded-xl">
              <span className="material-symbols-outlined text-[24px]">description</span>
            </span>
            <div>
              <h3 className="font-extrabold text-[16px] text-on-surface line-clamp-1">{doc.name}</h3>
              <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                Tipo: <strong className="text-primary">{doc.type}</strong> • Data: {doc.date} • Tamanho: {doc.size}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-surface hover:bg-outline-variant/30 flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {isAnamnese ? (
            <div className="space-y-6">
              {/* Questionário */}
              <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5">
                <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-4">Questionário de Saúde e Hábitos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(content.healthToggles || {}).map(([question, value]) => (
                    <div key={question} className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                      <span className="text-[12px] text-on-surface font-medium pr-2">{question}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${value ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'}`}>
                        {value ? 'SIM' : 'NÃO'}
                      </span>
                    </div>
                  ))}
                </div>
                {content.otherHealth && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/30">
                    <p className="text-[11px] font-bold text-on-surface uppercase tracking-wide">Outras observações de saúde:</p>
                    <p className="text-[12px] text-on-surface-variant mt-1 bg-white-pure p-3 rounded-xl border border-outline-variant/30 italic">
                      "{content.otherHealth}"
                    </p>
                  </div>
                )}
              </div>

              {/* Diagnóstico Físico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5 space-y-3">
                  <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-2">Diagnóstico Físico da Pele</h4>
                  <p className="text-[12px] text-on-surface-variant">Oleosidade: <strong className="text-on-surface">{content.oleosidade || 'Não informada'}</strong></p>
                  <p className="text-[12px] text-on-surface-variant">Acne Grau: <strong className="text-on-surface">{content.acnegrau || 'Não informado'}</strong></p>
                  <p className="text-[12px] text-on-surface-variant">Espessura: <strong className="text-on-surface">{content.espessura || 'Não informada'}</strong></p>
                  <p className="text-[12px] text-on-surface-variant">Hidratação: <strong className="text-on-surface">{content.hidratacao || 'Não informada'}</strong></p>
                  <p className="text-[12px] text-on-surface-variant">Fototipo: <strong className="text-on-surface">{content.fototipo || 'Não informado'}</strong></p>
                </div>

                <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5">
                  <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-3">Divulgação & Observações</h4>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[12px] text-on-surface-variant">Autoriza fotos:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${content.healthToggles?.fotos ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {content.healthToggles?.fotos ? 'Autorizado' : 'Não Autorizado'}
                    </span>
                  </div>
                  {content.generalObs && (
                    <div className="mt-3">
                      <p className="text-[11px] font-bold text-on-surface uppercase tracking-wide">Obs Gerais:</p>
                      <p className="text-[12px] text-on-surface-variant mt-1 bg-white-pure p-3 rounded-xl border border-outline-variant/30 italic">
                        "{content.generalObs}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lesões Clínicas */}
              {content.selectedSkinProblems && content.selectedSkinProblems.length > 0 && (
                <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5">
                  <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-3">Problemas de Pele / Lesões Identificadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.selectedSkinProblems.map((prob: string) => (
                      <span key={prob} className="bg-white-pure border border-outline-variant/50 text-on-surface-variant px-3 py-1 rounded-xl text-[11px] font-semibold">
                        {prob}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Assinatura */}
              {doc.signatureBase64 && (
                <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5 text-center">
                  <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-3 text-left">Assinatura Digital de Consentimento</h4>
                  <div className="inline-block bg-white-pure border-2 border-outline-variant/50 rounded-2xl p-4 max-w-sm mx-auto">
                    <img 
                      src={doc.signatureBase64} 
                      alt="Assinatura Digital" 
                      className="max-h-[140px] w-auto mx-auto object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-on-surface-variant/80 mt-2">
                    Documento autenticado via ICP-Brasil ID #{doc.id}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-outline/40">picture_as_pdf</span>
              <div className="space-y-1">
                <p className="font-bold text-on-surface text-[14px]">Visualização Segura de Documento</p>
                <p className="text-[12px] text-on-surface-variant max-w-md mx-auto">
                  Este documento de tipo <strong>{doc.type}</strong> está armazenado de forma criptografada e em conformidade com as diretivas da LGPD.
                </p>
              </div>
              <div className="inline-block bg-primary/5 border border-primary/20 p-4 rounded-xl text-[11px] text-primary text-left max-w-md">
                <strong>Certificado Digital ICP-Brasil:</strong>
                <p className="mt-1">ID da Transação: {doc.id}</p>
                <p>Status da Assinatura: {doc.signed ? 'Assinatura Digital Válida' : 'Assinatura Pendente'}</p>
                <p>Carimbo de tempo oficial: {doc.date}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/50 flex justify-end gap-3 sticky bottom-0 bg-white-pure z-10">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-surface hover:bg-outline-variant/20 text-on-surface-variant font-bold rounded-xl text-[13px] border border-outline-variant transition-colors cursor-pointer"
          >
            Fechar Visualizador
          </button>
        </div>

      </div>
    </div>
  );
}
