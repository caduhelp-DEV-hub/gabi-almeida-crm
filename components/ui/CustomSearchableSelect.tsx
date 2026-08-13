import React, { useState, useRef, useEffect } from 'react';

const CustomSearchableSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: {label: string, value: string}[], placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`w-full p-2.5 bg-surface rounded-xl border ${isOpen ? 'border-primary ring-1 ring-primary/40' : 'border-outline-variant/60'} flex justify-between items-center cursor-text text-[13px] font-medium transition-all`}
        onClick={() => setIsOpen(true)}
      >
        <input 
          type="text"
          className="w-full bg-transparent focus:outline-none placeholder:text-on-surface-variant/50"
          placeholder={placeholder}
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => { setIsOpen(true); setSearch(''); }}
        />
        <button type="button" className="outline-none focus:outline-none" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); setSearch(''); }}>
          <span className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`}>arrow_drop_down</span>
        </button>
      </div>
      {isOpen && (
        <div className="absolute z-[70] top-full left-0 w-full mt-1.5 bg-white-pure border border-outline-variant shadow-xl rounded-xl max-h-56 overflow-y-auto custom-scrollbar animate-fade-in">
          {filtered.length === 0 ? (
            <div className="p-4 text-on-surface-variant text-[12px] italic text-center">Nenhum resultado...</div>
          ) : (
            filtered.map((o, i) => (
              <div 
                key={i} 
                className="p-3 hover:bg-primary/10 cursor-pointer text-[13px] font-medium border-b border-outline-variant/30 last:border-0 text-on-surface transition-colors"
                onClick={() => {
                  onChange(o.value);
                  setSearch('');
                  setIsOpen(false);
                }}
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSearchableSelect;
