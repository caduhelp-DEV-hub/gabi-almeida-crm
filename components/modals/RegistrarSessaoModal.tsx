'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { PlanoTratamentoItem } from '../../lib/types';
import SignaturePad, { type SignaturePadHandle } from '../ui/SignaturePad';

export interface DadosNovaSessao {
  dataSessao: string;
  descricao: string;
  /** Fotos ja redimensionadas, em base64 (data URI), prontas para upload. */
  fotos: string[];
  realizadoPor: string;
  /** PNG em base64 da assinatura, se o cliente assinou. */
  assinaturaBase64?: string;
  /** Texto exato do termo apresentado no momento do aceite. */
  assinaturaTermo?: string;
  /** Preenchido só quando a assinatura foi conscientemente dispensada. */
  assinaturaDispensadaMotivo?: string;
}

interface RegistrarSessaoModalProps {
  item: PlanoTratamentoItem | null;
  /** Numero desta sessao (sessoes ja registradas + 1), calculado pelo chamador. */
  numeroSessao: number;
  nomeProfissionalPadrao: string;
  onClose: () => void;
  onSalvar: (dados: DadosNovaSessao) => Promise<void> | void;
}

type Passo = 'dados' | 'assinatura';

const MAX_LADO_PX = 1200;
const QUALIDADE_JPEG = 0.6;

/** Redimensiona a imagem (lado maior <= 1200px) e devolve um data URI JPEG. */
function redimensionarImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_LADO_PX) {
          height *= MAX_LADO_PX / width;
          width = MAX_LADO_PX;
        } else if (height > MAX_LADO_PX) {
          width *= MAX_LADO_PX / height;
          height = MAX_LADO_PX;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', QUALIDADE_JPEG));
      };
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function paraFormatoBR(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export default function RegistrarSessaoModal({
  item,
  numeroSessao,
  nomeProfissionalPadrao,
  onClose,
  onSalvar,
}: RegistrarSessaoModalProps) {
  const [passo, setPasso] = useState<Passo>('dados');
  const [dataSessao, setDataSessao] = useState(hojeISO());
  const [descricao, setDescricao] = useState('');
  const [realizadoPor, setRealizadoPor] = useState(nomeProfissionalPadrao);
  const [fotos, setFotos] = useState<string[]>([]);
  const [processandoFotos, setProcessandoFotos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [temAssinatura, setTemAssinatura] = useState(false);
  const [dispensandoAssinatura, setDispensandoAssinatura] = useState(false);
  const [motivoDispensa, setMotivoDispensa] = useState('');

  const assinaturaRef = useRef<SignaturePadHandle>(null);

  // Recarrega os campos sempre que outro item/sessao e aberto.
  useEffect(() => {
    if (!item) return;
    setPasso('dados');
    setDataSessao(hojeISO());
    setDescricao('');
    setRealizadoPor(nomeProfissionalPadrao);
    setFotos([]);
    setSalvando(false);
    setTemAssinatura(false);
    setDispensandoAssinatura(false);
    setMotivoDispensa('');
  }, [item, nomeProfissionalPadrao]);

  if (!item) return null;

  const adicionarFotos = async (arquivos: FileList | null) => {
    if (!arquivos || arquivos.length === 0) return;
    setProcessandoFotos(true);
    try {
      const redimensionadas = await Promise.all(Array.from(arquivos).map(redimensionarImagem));
      setFotos((prev) => [...prev, ...redimensionadas]);
    } catch {
      // Falha ao ler uma imagem local nao deve travar o registro da sessao.
    } finally {
      setProcessandoFotos(false);
    }
  };

  const removerFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const termoConsentimento =
    `Declaro estar ciente e de acordo com o atendimento "${item.servicoNome}" ` +
    `(sessão ${numeroSessao} de ${item.quantidade}), realizado em ${paraFormatoBR(dataSessao)}` +
    (realizadoPor ? ` por ${realizadoPor}` : '') + '.';

  const avancarParaAssinatura = (e: React.FormEvent) => {
    e.preventDefault();
    setPasso('assinatura');
  };

  const finalizar = async (assinaturaBase64?: string, dispensaMotivo?: string) => {
    if (salvando) return;
    setSalvando(true);
    try {
      await onSalvar({
        dataSessao,
        descricao: descricao.trim(),
        fotos,
        realizadoPor: realizadoPor.trim(),
        assinaturaBase64,
        assinaturaTermo: assinaturaBase64 ? termoConsentimento : undefined,
        assinaturaDispensadaMotivo: dispensaMotivo,
      });
    } finally {
      setSalvando(false);
    }
  };

  const confirmarComAssinatura = () => {
    const base64 = assinaturaRef.current?.toDataURL();
    if (!base64) return;
    finalizar(base64, undefined);
  };

  const confirmarSemAssinatura = () => {
    const motivo = motivoDispensa.trim();
    if (!motivo) return;
    finalizar(undefined, motivo);
  };

  return (
    <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white-pure rounded-[24px] shadow-2xl w-full max-w-[480px] max-h-[90dvh] overflow-y-auto custom-scrollbar">
        <div className="p-6 lg:p-8">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="font-manrope text-[20px] font-extrabold text-on-surface">
                {passo === 'dados' ? 'Registrar Sessão' : 'Assinatura do Cliente'}
              </h3>
              <p className="text-[13px] text-on-surface-variant mt-1">
                {item.servicoNome} — Sessão {numeroSessao}/{item.quantidade}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="touch-target text-on-surface-variant hover:text-primary transition-colors bg-surface-container-lowest rounded-full p-2 flex items-center justify-center"
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {passo === 'dados' && (
            <form onSubmit={avancarParaAssinatura} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sessao-data" className="block text-[11px] font-bold text-on-surface-variant mb-1">
                    Data do atendimento
                  </label>
                  <input
                    id="sessao-data"
                    type="date"
                    required
                    value={dataSessao}
                    onChange={(e) => setDataSessao(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="sessao-profissional" className="block text-[11px] font-bold text-on-surface-variant mb-1">
                    Realizado por
                  </label>
                  <input
                    id="sessao-profissional"
                    type="text"
                    value={realizadoPor}
                    onChange={(e) => setRealizadoPor(e.target.value)}
                    placeholder="Nome do profissional"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sessao-descricao" className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Descrição do atendimento <span className="font-normal text-outline">(opcional — vira um Protocolo no prontuário)</span>
                </label>
                <textarea
                  id="sessao-descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Ex: Aplicação de toxina botulínica, região frontal, 20 unidades. Cliente relatou..."
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-outline"
                />
                <p className="text-[10px] text-on-surface-variant mt-1 text-right">{descricao.length}/500</p>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Fotos do atendimento <span className="font-normal text-outline">(opcional — vão para a Galeria de Acompanhamento)</span>
                </span>

                {fotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {fotos.map((foto, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden border border-outline-variant/60 aspect-square">
                        <Image width={200} height={200} unoptimized src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" sizes="120px" />
                        <button
                          type="button"
                          onClick={() => removerFoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-error/90 flex items-center justify-center"
                          aria-label={`Remover foto ${i + 1}`}
                        >
                          <span className="material-symbols-outlined text-[14px] text-white-pure">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="touch-target flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer text-[12px] font-bold">
                  <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                  {processandoFotos ? 'Processando...' : 'Adicionar foto(s)'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={processandoFotos}
                    className="hidden"
                    onChange={(e) => {
                      adicionarFotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="touch-target flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-[13px] hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoFotos}
                  className="touch-target flex-1 bg-primary text-white-pure font-bold text-[13px] py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-60"
                >
                  Avançar para Assinatura
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </form>
          )}

          {passo === 'assinatura' && (
            <div className="space-y-4">
              <p className="text-[12px] text-on-surface-variant bg-surface-container-lowest rounded-xl p-3 leading-relaxed">
                {termoConsentimento}
              </p>

              <SignaturePad ref={assinaturaRef} onDrawnChange={setTemAssinatura} />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => assinaturaRef.current?.clear()}
                  className="touch-target py-2.5 px-4 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-[12px] hover:bg-surface-container transition-colors"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setPasso('dados')}
                  className="touch-target py-2.5 px-4 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-[12px] hover:bg-surface-container transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={confirmarComAssinatura}
                  disabled={!temAssinatura || salvando}
                  className="touch-target flex-1 bg-primary text-white-pure font-bold text-[13px] py-2.5 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  {salvando ? 'Salvando...' : 'Confirmar Assinatura'}
                </button>
              </div>

              <div className="pt-2 border-t border-outline-variant/50">
                {!dispensandoAssinatura ? (
                  <button
                    type="button"
                    onClick={() => setDispensandoAssinatura(true)}
                    className="text-[12px] text-on-surface-variant underline hover:text-primary transition-colors"
                  >
                    Cliente não está presente para assinar
                  </button>
                ) : (
                  <div className="space-y-2 pt-1">
                    <label htmlFor="motivo-dispensa" className="block text-[11px] font-bold text-on-surface-variant">
                      Motivo (obrigatório para registrar sem assinatura)
                    </label>
                    <input
                      id="motivo-dispensa"
                      type="text"
                      required
                      value={motivoDispensa}
                      onChange={(e) => setMotivoDispensa(e.target.value)}
                      placeholder="Ex: cliente já foi embora, atendimento sendo registrado depois."
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setDispensandoAssinatura(false); setMotivoDispensa(''); }}
                        className="touch-target py-2 px-3 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-[12px] hover:bg-surface-container transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={confirmarSemAssinatura}
                        disabled={!motivoDispensa.trim() || salvando}
                        className="touch-target flex-1 py-2 px-3 rounded-xl border border-error text-error font-bold text-[12px] hover:bg-error/10 transition-colors disabled:opacity-50"
                      >
                        {salvando ? 'Salvando...' : 'Registrar sem Assinatura'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
