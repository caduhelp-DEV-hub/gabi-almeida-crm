'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { EvolutionPhoto } from '../../lib/types';

interface EditarFotoModalProps {
  foto: EvolutionPhoto | null;
  onClose: () => void;
  onSalvar: (dados: { date: string; type: EvolutionPhoto['type']; observacao: string }) => Promise<void> | void;
}

/** "DD/MM/AAAA" -> "AAAA-MM-DD" (formato que o <input type="date"> entende). */
function paraInputDate(valor: string): string {
  if (!valor) return '';
  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  return '';
}

/** "AAAA-MM-DD" -> "DD/MM/AAAA" (formato usado no restante do prontuario). */
function paraFormatoBR(valor: string): string {
  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : valor;
}

const TIPOS: EvolutionPhoto['type'][] = ['Antes', 'Depois', 'Evolução'];

export default function EditarFotoModal({ foto, onClose, onSalvar }: EditarFotoModalProps) {
  const [data, setData] = useState('');
  const [tipo, setTipo] = useState<EvolutionPhoto['type']>('Evolução');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Recarrega os campos sempre que outra foto e aberta.
  useEffect(() => {
    if (!foto) return;
    setData(paraInputDate(foto.date));
    setTipo(foto.type);
    setObservacao(foto.observacao || '');
    setSalvando(false);
  }, [foto]);

  if (!foto) return null;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);
    try {
      await onSalvar({
        date: data ? paraFormatoBR(data) : foto.date,
        type: tipo,
        observacao: observacao.trim(),
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white-pure rounded-[24px] shadow-2xl w-full max-w-[420px] max-h-[90dvh] overflow-y-auto custom-scrollbar">
        <div className="p-6 lg:p-8">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="font-manrope text-[20px] font-extrabold text-on-surface">Editar Foto</h3>
              <p className="text-[13px] text-on-surface-variant mt-1">Ajuste a data, a classificação e a observação clínica.</p>
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

          <div className="rounded-2xl overflow-hidden border border-outline-variant/60 mb-5 bg-surface">
            <Image
              width={500}
              height={300}
              unoptimized
              src={foto.url}
              alt="Foto em edição"
              className="w-full h-40 object-cover"
              sizes="(max-width: 768px) 100vw, 420px"
            />
          </div>

          <form onSubmit={submeter} className="space-y-4">
            <div>
              <label htmlFor="foto-data" className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Data da foto
              </label>
              <input
                id="foto-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">
                Deixe em branco para manter a data atual ({foto.date}).
              </p>
            </div>

            <div>
              <span className="block text-[11px] font-bold text-on-surface-variant mb-1">Classificação</span>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`touch-target py-2.5 px-2 rounded-xl border text-[12px] font-bold transition-colors ${
                      tipo === t
                        ? 'bg-primary text-white-pure border-primary'
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="foto-obs" className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Observação <span className="font-normal text-outline">(opcional)</span>
              </label>
              <textarea
                id="foto-obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ex: 3ª sessão de microagulhamento, área da testa."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-outline"
              />
              <p className="text-[10px] text-on-surface-variant mt-1 text-right">{observacao.length}/500</p>
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
                disabled={salvando}
                className="touch-target flex-1 bg-primary text-white-pure font-bold text-[13px] py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
