'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { AnamneseRespostaItem } from '../lib/types';
import { ANAMNESE_TEMPLATES, type AnamneseTemplateId } from '../lib/anamneseTemplates';
import SimNaoToggle from './ui/SimNaoToggle';
import SignaturePad, { type SignaturePadHandle } from './ui/SignaturePad';

export interface AnamneseFormPayload {
  respostas: Record<string, AnamneseRespostaItem>;
  diagnosticoFisico?: Record<string, string>;
  lesoesPele?: string[];
  autorizaFotos: boolean;
  observacoesGerais?: string;
  signatureBase64: string;
}

interface AnamneseFormProps {
  templateId: AnamneseTemplateId;
  patientName: string;
  onCancel: () => void;
  onSave: (payload: AnamneseFormPayload) => void | Promise<void>;
}

export default function AnamneseForm({ templateId, patientName, onCancel, onSave }: AnamneseFormProps) {
  const template = ANAMNESE_TEMPLATES[templateId];

  const [respostas, setRespostas] = useState<Record<string, AnamneseRespostaItem>>({});
  const [diagnosticoFisico, setDiagnosticoFisico] = useState<Record<string, string>>({});
  const [lesoesSelecionadas, setLesoesSelecionadas] = useState<string[]>([]);
  const [autorizaFotos, setAutorizaFotos] = useState<boolean | null>(null);
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [temAssinatura, setTemAssinatura] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const signatureRef = useRef<SignaturePadHandle>(null);

  const setResposta = (questionId: string, patch: Partial<AnamneseRespostaItem>) => {
    setRespostas(prev => {
      const atual: AnamneseRespostaItem = prev[questionId] || { valor: null };
      return { ...prev, [questionId]: { ...atual, ...patch } };
    });
  };

  const toggleLesao = (opcao: string) => {
    setLesoesSelecionadas(prev => (prev.includes(opcao) ? prev.filter(o => o !== opcao) : [...prev, opcao]));
  };

  const podeSalvar = useMemo(() => consentGiven && temAssinatura && !salvando, [consentGiven, temAssinatura, salvando]);

  const handleSalvar = async () => {
    if (!podeSalvar) return;
    const signatureBase64 = signatureRef.current?.toDataURL();
    if (!signatureBase64) return;

    setSalvando(true);
    try {
      await onSave({
        respostas,
        diagnosticoFisico: template.diagnosticoFisico ? diagnosticoFisico : undefined,
        lesoesPele: template.lesoesPele ? lesoesSelecionadas : undefined,
        autorizaFotos: autorizaFotos === true,
        observacoesGerais: observacoesGerais.trim() || undefined,
        signatureBase64,
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-surface rounded-3xl overflow-hidden w-full max-w-5xl mx-auto border border-outline-variant/50 flex flex-col font-manrope">
      {/* Header */}
      <div className="bg-white-pure p-6 border-b border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest rounded-full mb-3">
            Ficha de Anamnese
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">{template.titulo}</h2>
          <p className="text-on-surface-variant text-[13px] font-medium">
            Cliente: <strong className="text-on-surface">{patientName}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="px-4 py-2 border border-outline-variant text-on-surface-variant text-[13px] font-bold rounded-xl hover:bg-surface transition-colors cursor-pointer flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Voltar aos Modelos
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-error/10 text-error text-[13px] font-bold rounded-xl hover:bg-error/20 transition-colors cursor-pointer">
            Cancelar
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8 bg-surface-container-lowest">
        {/* Questionário */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-outline-variant/40 flex justify-between items-center bg-surface/30">
            <h3 className="font-bold text-[14px] text-on-surface tracking-wider uppercase">Questionário de Saúde e Hábitos</h3>
            <span className="bg-secondary p-1.5 px-3 rounded-full text-on-secondary font-bold text-[11px]">{template.questions.length} perguntas</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
            {template.questions.map(q => {
              const resposta = respostas[q.id];
              if (q.tipo === 'texto') {
                return (
                  <div key={q.id} className="flex flex-col border-b border-outline-variant/20 pb-3 md:col-span-2">
                    <label className="text-[13px] text-on-surface font-medium mb-2">{q.label}</label>
                    <input
                      type="text"
                      placeholder="Resposta (opcional)"
                      value={resposta?.observacao || ''}
                      onChange={(e) => setResposta(q.id, { observacao: e.target.value })}
                      className="w-full text-[12px] p-2.5 bg-surface border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                );
              }
              return (
                <div key={q.id} className="flex flex-col border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-on-surface font-medium pr-2">{q.label}</span>
                    <SimNaoToggle value={resposta?.valor ?? null} onChange={(v) => setResposta(q.id, { valor: v })} />
                  </div>
                  <input
                    type="text"
                    placeholder="Observação (opcional)"
                    value={resposta?.observacao || ''}
                    onChange={(e) => setResposta(q.id, { observacao: e.target.value })}
                    className="mt-3 w-full text-[12px] p-2.5 bg-surface border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnóstico Físico + Lesões de Pele (so limpeza-pele/microagulhamento) */}
        {(template.diagnosticoFisico || template.lesoesPele) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {template.diagnosticoFisico && (
              <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6 flex flex-col gap-6">
                <h3 className="font-bold text-[14px] text-primary tracking-wider uppercase mb-2">Diagnóstico Físico da Pele</h3>
                {template.diagnosticoFisico.map(grupo => (
                  <div key={grupo.key} className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-[13px] font-bold text-on-surface min-w-[100px]">{grupo.label}:</span>
                    <div className="flex gap-4 flex-wrap">
                      {grupo.options.map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 text-[13px] text-on-surface-variant cursor-pointer group">
                          <input
                            type="radio"
                            name={grupo.key}
                            checked={diagnosticoFisico[grupo.key] === opt}
                            onChange={() => setDiagnosticoFisico(prev => ({ ...prev, [grupo.key]: opt }))}
                            className="w-4 h-4 accent-primary"
                          /> {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {template.lesoesPele && (
              <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6">
                <h3 className="font-bold text-[14px] text-primary tracking-wider uppercase mb-4">{template.lesoesPele.label}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {template.lesoesPele.options.map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 text-[12px] text-on-surface-variant cursor-pointer">
                      <input type="checkbox" checked={lesoesSelecionadas.includes(opt)} onChange={() => toggleLesao(opt)} className="w-4 h-4 accent-primary rounded" /> {opt}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Observações gerais + autorização de fotos (universal) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6">
            <label className="block font-bold text-[13px] text-on-surface tracking-wider uppercase mb-3">{template.observacoesLabel}</label>
            <textarea
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              className="w-full bg-surface border border-outline-variant/50 rounded-xl p-4 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder:text-on-surface-variant/50"
              rows={3}
              placeholder={template.observacoesPlaceholder}
            ></textarea>
          </div>

          <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6 flex flex-col gap-3">
            <h3 className="font-bold text-[13px] text-on-surface tracking-wider uppercase mb-1">Autorização de Uso de Imagem</h3>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-on-surface-variant pr-2">Autoriza o uso de fotos para acompanhamento clínico?</span>
              <SimNaoToggle value={autorizaFotos} onChange={setAutorizaFotos} />
            </div>
          </div>
        </div>

        {/* Termo + Assinatura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="inline-block bg-surface px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider text-on-surface mb-4">
                {template.termoTitulo}
              </div>
              <p className="text-[12px] sm:text-[13px] text-on-surface-variant leading-relaxed text-justify">
                {template.termoTexto}
              </p>
            </div>

            <label className="mt-6 sm:mt-8 flex items-start gap-3 cursor-pointer p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="w-6 h-6 sm:w-5 sm:h-5 rounded text-primary border-primary focus:ring-primary accent-primary mt-0.5 shrink-0"
              />
              <span className="text-[12px] sm:text-[13px] font-bold text-primary leading-snug">{template.termoCheckboxLabel}</span>
            </label>
          </div>

          <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-4 sm:p-6 flex flex-col">
            <div className="mb-2">
              <h4 className="font-bold text-[12px] uppercase tracking-wider text-on-surface">Assinatura Digital de Consentimento</h4>
              <p className="text-[11px] text-on-surface-variant mt-1">Toque e arraste com o dedo ou caneta para assinar.</p>
            </div>
            <SignaturePad ref={signatureRef} onDrawnChange={setTemAssinatura} height={200} />
          </div>
        </div>
      </div>

      {/* Salvar */}
      <div className="flex justify-center sm:justify-end px-6 md:px-8 pt-2 pb-8 gap-3">
        <button
          onClick={handleSalvar}
          disabled={!podeSalvar}
          className="w-full sm:w-auto px-8 py-4 sm:py-3.5 bg-[#a322d8] hover:bg-[#861cae] disabled:opacity-40 disabled:cursor-not-allowed text-white-pure font-bold rounded-2xl text-[15px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">check</span>
          {salvando ? 'Salvando...' : `Salvar Ficha de ${template.titulo}`}
        </button>
      </div>
    </div>
  );
}
