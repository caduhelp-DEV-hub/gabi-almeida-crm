interface SimNaoToggleProps {
  value: boolean | null;
  onChange: (v: boolean) => void;
}

export default function SimNaoToggle({ value, onChange }: SimNaoToggleProps) {
  return (
    <div className="flex gap-1.5 shrink-0">
      <button type="button" onClick={() => onChange(true)}
        className={`min-h-[44px] min-w-[56px] px-3 py-2 rounded-lg text-[12px] font-bold border transition-all cursor-pointer ${
          value === true
            ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-sm'
            : 'border-outline-variant/50 text-on-surface-variant hover:bg-surface'
        }`}>
        SIM
      </button>
      <button type="button" onClick={() => onChange(false)}
        className={`min-h-[44px] min-w-[56px] px-3 py-2 rounded-lg text-[12px] font-bold border transition-all cursor-pointer ${
          value === false
            ? 'bg-[#ba1a1a]/10 border-[#ba1a1a] text-[#ba1a1a] shadow-sm'
            : 'border-outline-variant/50 text-on-surface-variant hover:bg-surface'
        }`}>
        NÃO
      </button>
    </div>
  );
}
