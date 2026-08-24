import React from 'react';
import Image from 'next/image';
import type { PatientDocument, AnamneseDocumentoConteudo } from '../lib/types';
import { ANAMNESE_TEMPLATES } from '../lib/anamneseTemplates';

interface DocumentViewerModalProps {
  document: PatientDocument;
  onClose: () => void;
}

function BadgeSimNao({ valor }: { valor: boolean | null | undefined }) {
  if (valor === null || valor === undefined) {
    return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-surface text-on-surface-variant border border-outline-variant/40">—</span>;
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${valor ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'}`}>
      {valor ? 'SIM' : 'NÃO'}
    </span>
  );
}

/** Ficha gerada pelo motor generico (AnamneseForm), formato atual. */
function AnamneseNova({ conteudo }: { conteudo: AnamneseDocumentoConteudo }) {
  const template = ANAMNESE_TEMPLATES[conteudo.templateId];
  if (!template) return null;

  return (
    <div className="space-y-6">
      <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5">
        <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-4">Questionário: {template.titulo}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {template.questions.map(q => {
            const resposta = conteudo.respostas?.[q.id];
            return (
              <div key={q.id} className="flex flex-col border-b border-outline-variant/10 pb-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[12px] text-on-surface font-medium pr-2">{q.label}</span>
                  {q.tipo !== 'texto' && <BadgeSimNao valor={resposta?.valor} />}
                </div>
                {resposta?.observacao && (
                  <p className="text-[11px] text-on-surface-variant mt-1 italic">"{resposta.observacao}"</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {(template.diagnosticoFisico || template.lesoesPele) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {template.diagnosticoFisico && (
            <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5 space-y-3">
              <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-2">Diagnóstico Físico da Pele</h4>
              {template.diagnosticoFisico.map(grupo => (
                <p key={grupo.key} className="text-[12px] text-on-surface-variant">
                  {grupo.label}: <strong className="text-on-surface">{conteudo.diagnosticoFisico?.[grupo.key] || 'Não informado'}</strong>
                </p>
              ))}
            </div>
          )}
          <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5">
            <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-3">Divulgação & Observações</h4>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-on-surface-variant">Autoriza fotos:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${conteudo.autorizaFotos ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {conteudo.autorizaFotos ? 'Autorizado' : 'Não Autorizado'}
              </span>
            </div>
            {conteudo.observacoesGerais && (
              <div className="mt-3">
                <p className="text-[11px] font-bold text-on-surface uppercase tracking-wide">{template.observacoesLabel}</p>
                <p className="text-[12px] text-on-surface-variant mt-1 bg-white-pure p-3 rounded-xl border border-outline-variant/30 italic">
                  "{conteudo.observacoesGerais}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {template.lesoesPele && conteudo.lesoesPele && conteudo.lesoesPele.length > 0 && (
        <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5">
          <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-3">{template.lesoesPele.label}</h4>
          <div className="flex flex-wrap gap-2">
            {conteudo.lesoesPele.map((item) => (
              <span key={item} className="bg-white-pure border border-outline-variant/50 text-on-surface-variant px-3 py-1 rounded-xl text-[11px] font-semibold">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {!template.diagnosticoFisico && conteudo.observacoesGerais && (
        <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5">
          <p className="text-[11px] font-bold text-on-surface uppercase tracking-wide">{template.observacoesLabel}</p>
          <p className="text-[12px] text-on-surface-variant mt-1 bg-white-pure p-3 rounded-xl border border-outline-variant/30 italic">
            "{conteudo.observacoesGerais}"
          </p>
        </div>
      )}
    </div>
  );
}

/** Formato antigo da ficha "Microagulhamento Completo", ja retirada -- leitura minima so pra nao mostrar em branco. */
function AnamneseLegadoCompleto({ conteudo }: { conteudo: Record<string, any> }) {
  const grupos: Array<[string, Record<string, boolean>]> = [
    ['Saúde', conteudo.saude || {}],
    ['Dermatológico', conteudo.dermato || {}],
  ];
  return (
    <div className="space-y-6">
      {grupos.map(([titulo, respostas]) => (
        Object.keys(respostas).length > 0 && (
          <div key={titulo} className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5">
            <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-4">{titulo}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(respostas).map(([chave, valor]) => (
                <div key={chave} className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                  <span className="text-[12px] text-on-surface font-medium pr-2">{chave}</span>
                  <BadgeSimNao valor={valor as boolean} />
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

/** Formato antigo das 2 fichas simples ja retiradas (Limpeza de Pele / Microagulhamento). */
function AnamneseLegadoSimples({ content }: { content: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5">
        <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-4">Questionário de Saúde e Hábitos</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(content.healthToggles || {}).map(([question, value]) => (
            <div key={question} className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
              <span className="text-[12px] text-on-surface font-medium pr-2">{question}</span>
              <BadgeSimNao valor={value as boolean} />
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
    </div>
  );
}

export default function DocumentViewerModal({ document: doc, onClose }: DocumentViewerModalProps) {
  const content = (doc.content || {}) as any;
  const isAnamnese = doc.type === 'Anamnese' && !!doc.content;
  const isNovo = isAnamnese && !!content.templateId;
  const isLegadoCompleto = isAnamnese && !isNovo && (!!content.saude || !!content.dermato);
  const isLegadoSimples = isAnamnese && !isNovo && !isLegadoCompleto;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in font-manrope">
      <div className="bg-white-pure sm:rounded-3xl w-full max-w-3xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/50 flex flex-col">

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-outline-variant/50 flex items-center justify-between sticky top-0 bg-white-pure z-10">
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
        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {isAnamnese ? (
            <div className="space-y-6">
              {isNovo && <AnamneseNova conteudo={content as AnamneseDocumentoConteudo} />}
              {isLegadoCompleto && <AnamneseLegadoCompleto conteudo={content} />}
              {isLegadoSimples && <AnamneseLegadoSimples content={content} />}

              {doc.signatureBase64 && (
                <div className="bg-surface/30 rounded-2xl border border-outline-variant/40 p-5 text-center">
                  <h4 className="font-bold text-[12px] uppercase tracking-wider text-primary mb-3 text-left">Assinatura Digital de Consentimento</h4>
                  <div className="inline-block bg-white-pure border-2 border-outline-variant/50 rounded-2xl p-4 max-w-sm mx-auto">
                    <Image
                      src={doc.signatureBase64}
                      alt="Assinatura Digital"
                      width={500}
                      height={140}
                      unoptimized
                      className="max-h-[140px] w-auto mx-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-outline/40">picture_as_pdf</span>
              <div className="space-y-1">
                <p className="font-bold text-on-surface text-[14px]">Visualização de Documento</p>
                <p className="text-[12px] text-on-surface-variant max-w-md mx-auto">
                  Este documento de tipo <strong>{doc.type}</strong> está armazenado no prontuário do cliente.
                </p>
              </div>
              <div className="inline-block bg-primary/5 border border-primary/20 p-4 rounded-xl text-[11px] text-primary text-left max-w-md">
                <p>Status: {doc.signed ? 'Assinado' : 'Pendente de assinatura'}</p>
                <p>Data: {doc.date}</p>
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
