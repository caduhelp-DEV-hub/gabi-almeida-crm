'use client';

import React from 'react';
import type { DefMensagemTela, MensagemFluxoConfig } from '../lib/types';
import { atualizarFrase, fraseAtiva, textoDaFrase, variaveisFaltando } from '../lib/mensagensBot';
import FraseSwitch from './ui/FraseSwitch';

/** Liga/desliga uma frase que tem campo de texto próprio na tela (boas-vindas, lembrete, aviso final...). */
export function InterruptorFrase({ chave, valor, onChange }: { chave: string; valor: Record<string, MensagemFluxoConfig>; onChange: (proximo: Record<string, MensagemFluxoConfig>) => void }) {
  return <FraseSwitch ativo={valor[chave]?.ativo !== false} onChange={(a) => onChange(atualizarFrase(valor, chave, { ativo: a }))} />;
}

interface FrasesAtendimentoProps {
  catalogo: DefMensagemTela[];
  valor: Record<string, MensagemFluxoConfig>;
  onChange: (proximo: Record<string, MensagemFluxoConfig>) => void;
}

/**
 * Todas as frases que o robô fala durante o atendimento (menu, agendar, remarcar,
 * cancelar...), agrupadas. Dá pra editar o texto e, nas frases que o cliente
 * consegue viver sem (rodapés, dicas, cortesias), desligar. A lista vem do próprio
 * bot (catálogo publicado no banco), então nunca fica diferente do que ele fala.
 */
export default function FrasesAtendimento({ catalogo, valor, onChange }: FrasesAtendimentoProps) {
  const editaveis = catalogo.filter((d) => !d.legado);
  const grupos = [...new Set(editaveis.map((d) => d.grupo))];

  return (
    <div className="space-y-2">
      <div>
        <p className="font-bold text-[13px] text-on-surface">Frases do atendimento</p>
        <p className="text-[11px] text-on-surface-variant">
          Edite o texto de qualquer frase do robô ou desligue as opcionais. O que você não mexer continua no texto padrão. Variáveis como <strong>[lista]</strong> ou <strong>[data]</strong> são preenchidas pelo robô; se você apagar uma obrigatória, aquela frase volta ao texto padrão.
        </p>
      </div>

      {editaveis.length === 0 ? (
        <p className="text-[12px] text-on-surface-variant bg-surface rounded-xl border border-outline-variant/60 p-3">
          A lista de frases ainda não foi publicada pelo robô. Ela aparece aqui assim que o robô reiniciar com a versão nova.
        </p>
      ) : (
        grupos.map((grupo) => {
          const itens = editaveis.filter((d) => d.grupo === grupo);
          const desligadas = itens.filter((d) => !fraseAtiva(d, valor[d.chave])).length;
          const editadas = itens.filter((d) => valor[d.chave]?.texto !== undefined).length;
          return (
            <details key={grupo} className="rounded-xl border border-outline-variant/60 bg-surface">
              <summary className="cursor-pointer select-none p-3 flex items-center justify-between gap-2">
                <span className="font-bold text-[13px] text-on-surface">{grupo}</span>
                <span className="text-[11px] text-on-surface-variant">
                  {itens.length} frases{editadas ? ` · ${editadas} editada(s)` : ''}{desligadas ? ` · ${desligadas} desligada(s)` : ''}
                </span>
              </summary>
              <div className="p-3 pt-0 space-y-4">
                {itens.map((d) => {
                  const config = valor[d.chave];
                  const ativa = fraseAtiva(d, config);
                  const texto = textoDaFrase(d, config);
                  const faltando = variaveisFaltando(d, texto);
                  return (
                    <div key={d.chave} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <label className="font-bold text-[12px] text-on-surface-variant">{d.rotulo}</label>
                        {d.opcional ? (
                          <FraseSwitch ativo={ativa} onChange={(a) => onChange(atualizarFrase(valor, d.chave, { ativo: a }))} />
                        ) : (
                          <span className="text-[10px] text-on-surface-variant shrink-0">essencial (só editar)</span>
                        )}
                      </div>
                      <textarea
                        value={texto}
                        disabled={!ativa}
                        onChange={(e) => onChange(atualizarFrase(valor, d.chave, { texto: e.target.value }, d.padrao))}
                        rows={Math.min(8, Math.max(2, texto.split('\n').length + 1))}
                        className={`w-full p-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium font-sans text-[13px] ${ativa ? '' : 'opacity-50'}`}
                      />
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-[10px] text-on-surface-variant">
                          {d.variaveis.length ? `Variáveis: ${d.variaveis.map((v) => `[${v}]`).join(' ')}` : 'Sem variáveis'}
                          {d.obrigatorias.length ? ` · obrigatória(s): ${d.obrigatorias.map((v) => `[${v}]`).join(' ')}` : ''}
                        </p>
                        {config?.texto !== undefined && (
                          <button
                            type="button"
                            onClick={() => onChange(atualizarFrase(valor, d.chave, { texto: undefined }))}
                            className="text-[11px] font-bold text-primary hover:underline shrink-0"
                          >
                            Restaurar texto padrão
                          </button>
                        )}
                      </div>
                      {ativa && faltando.length > 0 && (
                        <p className="text-[11px] font-bold text-error">
                          Falta {faltando.map((v) => `[${v}]`).join(' ')} neste texto: o robô vai usar o texto padrão desta frase.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })
      )}
    </div>
  );
}
