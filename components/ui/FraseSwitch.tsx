'use client';

import React from 'react';

interface FraseSwitchProps {
  ativo: boolean;
  onChange: (ativo: boolean) => void;
  /** Texto ao lado do botão. Padrão: "Ligada" / "Desligada". */
  rotulos?: [string, string];
}

/** Liga/desliga uma frase do bot (mesmo visual dos outros interruptores de Configurações). */
export default function FraseSwitch({ ativo, onChange, rotulos = ['Ligada', 'Desligada'] }: FraseSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!ativo)}
      aria-pressed={ativo}
      className="flex items-center gap-2 shrink-0"
    >
      <span className={`text-[11px] font-bold ${ativo ? 'text-emerald-700' : 'text-on-surface-variant'}`}>{ativo ? rotulos[0] : rotulos[1]}</span>
      <span className={`relative w-10 h-6 rounded-full transition-colors ${ativo ? 'bg-emerald-500' : 'bg-outline-variant/60'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white-pure rounded-full shadow transition-transform ${ativo ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </button>
  );
}
