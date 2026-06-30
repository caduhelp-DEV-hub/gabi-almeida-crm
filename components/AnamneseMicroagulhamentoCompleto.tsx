import React, { useRef, useState, useEffect, useCallback } from 'react';

interface Props {
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  onCancel: () => void;
  onSave: (data: any) => void;
}

const AREAS = [
  'Face (Rejuvenescimento)', 'Cicatriz de Acne', 'Melasma', 'Manchas',
  'Linhas Finas e Rugas', 'Flacidez', 'Poros Dilatados',
  'Barba', 'Couro Cabeludo', 'Sobrancelhas',
];

const SAUDE_QUESTIONS = [
  { key: 'doenca',       label: 'Doença diagnosticada',              hasDetail: true },
  { key: 'medicamentos', label: 'Uso de medicamentos contínuos',     hasDetail: true },
  { key: 'alergias',    label: 'Alergias',                           hasDetail: true },
  { key: 'diabetes',    label: 'Diabetes',                           hasDetail: false },
  { key: 'autoimune',   label: 'Doença autoimune',                   hasDetail: false },
  { key: 'coagulacao',  label: 'Distúrbio de coagulação',           hasDetail: false },
  { key: 'queloide',    label: 'Tendência a queloides',              hasDetail: false },
  { key: 'gestante',    label: 'Gestante ou amamentando',            hasDetail: false },
];

const DERMATO_QUESTIONS = [
  { key: 'acneAtiva',            label: 'Acne ativa' },
  { key: 'herpesRecorrente',     label: 'Herpes recorrente' },
  { key: 'lesaoAtiva',           label: 'Lesão / ferida / infecção / inflamação na área' },
  { key: 'microagulhAnterior',   label: 'Microagulhamento anterior' },
];

const PROCED_ANTERIORES = ['Limpeza de Pele', 'Peeling', 'Laser', 'Botox', 'Preenchimento'];
const COSMETICOS = ['Ácido Retinóico', 'Ácido Glicólico', 'Ácido Salicílico', 'Hidroquinona', 'Vitamina C', 'Clareadores', 'Minoxidil'];
const TRAT_QUEDA = ['Não', 'Minoxidil', 'Finasterida', 'Dutasterida'];
const ESTIMULANTES = ['Não', 'Minoxidil'];
const OBJETIVOS_BARBA = ['Estimular crescimento', 'Corrigir falhas', 'Aumentar densidade', 'Fortalecer fios'];

function SimNaoToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
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

function SectionHeader({ number, title, sub }: { number: string; title: string; sub?: string }) {
  return (
    <div className="p-5 border-b border-outline-variant/40 bg-surface/30">
      <h3 className="font-bold text-[14px] text-on-surface tracking-wider uppercase">
        {number}. {title}
      </h3>
      {sub && <p className="text-[11px] text-on-surface-variant mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnamneseMicroagulhamentoCompleto({
  patientName, patientPhone = '', patientEmail = '', onCancel, onSave,
}: Props) {
  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);

  // Seção 1 – Dados pessoais
  const [dataNascimento, setDataNascimento] = useState('');
  const [profissao, setProfissao] = useState('');
  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toISOString().split('T')[0]);

  // Seção 2 – Áreas
  const [areasTratadas, setAreasTratadas] = useState<string[]>([]);
  const [areaOutro, setAreaOutro] = useState('');

  // Seção 3 – Queixa
  const [queixaPrincipal, setQueixaPrincipal] = useState('');

  // Seção 4 – Histórico saúde
  const [saude, setSaude] = useState<Record<string, boolean | null>>({});
  const [saudeDetalhes, setSaudeDetalhes] = useState<Record<string, string>>({});

  // Seção 5 – Histórico dermatológico
  const [dermato, setDermato] = useState<Record<string, boolean | null>>({});
  const [procedAnteriores, setProcedAnteriores] = useState<string[]>([]);
  const [procedOutro, setProcedOutro] = useState('');

  // Seção 6 – Avaliação capilar
  const [calvicieHist, setCalvicieHist] = useState<boolean | null>(null);
  const [tempoQueda, setTempoQueda] = useState('');
  const [intensidadeQueda, setIntensidadeQueda] = useState('');
  const [falhasLocalizadas, setFalhasLocalizadas] = useState<boolean | null>(null);
  const [diagnosticoAlopecia, setDiagnosticoAlopecia] = useState<boolean | null>(null);
  const [diagnosticoAlopeciaDetalhe, setDiagnosticoAlopeciaDetalhe] = useState('');
  const [tratamentoQueda, setTratamentoQueda] = useState<string[]>([]);
  const [tratamentoOutro, setTratamentoOutro] = useState('');

  // Seção 7 – Barba / Sobrancelhas
  const [objetivoBarba, setObjetivoBarba] = useState<string[]>([]);
  const [objetivoOutro, setObjetivoOutro] = useState('');
  const [tempoFalhas, setTempoFalhas] = useState('');
  const [estimulante, setEstimulante] = useState<string[]>([]);
  const [estimulanteOutro, setEstimulanteOutro] = useState('');
  const [alopeciaBarbaSobr, setAlopeciaBarbaSobr] = useState<boolean | null>(null);

  // Seção 8 – Cosméticos
  const [cosmeticosUsados, setCosmeticosUsados] = useState<string[]>([]);
  const [cosmeticosOutro, setCosmeticosOutro] = useState('');
  const [isotretinoina, setIsotretinoina] = useState<boolean | null>(null);

  // Seção 9 – Hábitos
  const [agua, setAgua] = useState('');
  const [fuma, setFuma] = useState<boolean | null>(null);
  const [alcool, setAlcool] = useState<boolean | null>(null);
  const [protSolar, setProtSolar] = useState<boolean | null>(null);

  // Seção 10 – Avaliação profissional
  const [fototipo, setFototipo] = useState('');
  const [tipoPele, setTipoPele] = useState('');
  const [grauAlopecia, setGrauAlopecia] = useState('');
  const [obsClinicas, setObsClinicas] = useState('');

  // Seção 11 – Foto
  const [fotoAutorizacao, setFotoAutorizacao] = useState<boolean | null>(null);

  // Consentimento
  const [consentGiven, setConsentGiven] = useState(false);

  // Condicionais
  const idade = dataNascimento
    ? Math.floor((Date.now() - new Date(dataNascimento).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;
  const showCapilar = areasTratadas.includes('Couro Cabeludo');
  const showBarba = areasTratadas.includes('Barba') || areasTratadas.includes('Sobrancelhas');

  // ── Canvas ──────────────────────────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    tmp.getContext('2d')?.drawImage(canvas, 0, 0);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(container.clientWidth * dpr);
    canvas.height = Math.round(container.clientHeight * dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, container.clientWidth, container.clientHeight);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    const container = canvasContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);
    const onOrient = () => setTimeout(resizeCanvas, 150);
    window.addEventListener('orientationchange', onOrient);
    return () => { ro.disconnect(); window.removeEventListener('orientationchange', onOrient); };
  }, [resizeCanvas]);

  const getXY = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getXY(e);
    isDrawingRef.current = true;
    setIsDrawing(true);
    setSignatureSaved(false);
    ctx.strokeStyle = '#311059';
    ctx.lineWidth = e.pointerType === 'pen' ? 2.5 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { x, y } = getXY(e);
    if (e.pointerType === 'pen' && e.pressure > 0) ctx.lineWidth = 1 + e.pressure * 3;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawing(false);
    setSignatureSaved(true);
    try { canvasRef.current?.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setSignatureSaved(false);
  };

  // ── Helpers de toggle ───────────────────────────────────────────────────────
  const toggleArr = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  // ── Salvar ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (areasTratadas.length === 0 && !areaOutro.trim()) {
      alert('Selecione ao menos uma área a ser tratada.');
      return;
    }
    if (!consentGiven) {
      alert('Por favor, confirme o termo de consentimento.');
      return;
    }
    const canvas = canvasRef.current;
    const signatureBase64 = canvas && signatureSaved ? canvas.toDataURL('image/png') : '';
    if (!signatureBase64) {
      alert('Por favor, desenhe sua assinatura no campo indicado.');
      return;
    }
    onSave({
      dataNascimento, profissao, dataAvaliacao, idade,
      areasTratadas, areaOutro,
      queixaPrincipal,
      saude, saudeDetalhes,
      dermato, procedAnteriores, procedOutro,
      capilar: showCapilar
        ? { calvicieHist, tempoQueda, intensidadeQueda, falhasLocalizadas, diagnosticoAlopecia, diagnosticoAlopeciaDetalhe, tratamentoQueda, tratamentoOutro }
        : null,
      barbasobr: showBarba
        ? { objetivoBarba, objetivoOutro, tempoFalhas, estimulante, estimulanteOutro, alopeciaBarbaSobr }
        : null,
      cosmeticosUsados, cosmeticosOutro, isotretinoina,
      habitos: { agua, fuma, alcool, protSolar },
      avalProf: { fototipo, tipoPele, grauAlopecia, obsClinicas },
      fotoAutorizacao,
      signatureBase64,
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-surface rounded-3xl overflow-hidden w-full max-w-5xl mx-auto border border-outline-variant/50 flex flex-col font-manrope">

      {/* Header */}
      <div className="bg-white-pure p-6 border-b border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest rounded-full mb-3">
            Microagulhamento Completo
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">
            Anamnese para Microagulhamento
          </h2>
          <p className="text-on-surface-variant text-[13px] font-medium">
            Cliente: <strong className="text-on-surface">{patientName}</strong>
            {patientPhone && ` • Tel: ${patientPhone}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 border border-outline-variant text-on-surface-variant text-[13px] font-bold rounded-xl hover:bg-surface transition-colors cursor-pointer flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Voltar aos Modelos
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 bg-error/10 text-error text-[13px] font-bold rounded-xl hover:bg-error/20 transition-colors cursor-pointer">
            Cancelar
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8 bg-surface-container-lowest">

        {/* ── 1. DADOS PESSOAIS ──────────────────────────────────────────────── */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <SectionHeader number="1" title="Dados Pessoais" />
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Nome</label>
              <input value={patientName} readOnly
                className="p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-[13px] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Telefone</label>
              <input value={patientPhone} readOnly
                className="p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-[13px] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">E-mail</label>
              <input value={patientEmail} readOnly
                className="p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-[13px] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Data de Nascimento</label>
              <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)}
                className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Idade</label>
              <input value={idade !== null ? `${idade} anos` : ''} readOnly
                className="p-2.5 bg-surface border border-outline-variant/50 rounded-xl text-[13px] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Profissão</label>
              <input type="text" value={profissao} onChange={e => setProfissao(e.target.value)}
                placeholder="Sua profissão"
                className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Data da Avaliação</label>
              <input type="date" value={dataAvaliacao} onChange={e => setDataAvaliacao(e.target.value)}
                className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* ── 2. ÁREA A SER TRATADA ──────────────────────────────────────────── */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <SectionHeader number="2" title="Área a ser Tratada" />
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {AREAS.map(area => (
                <label key={area}
                  className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                    areasTratadas.includes(area)
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant/40 hover:bg-surface-container-lowest'
                  }`}>
                  <input type="checkbox" checked={areasTratadas.includes(area)}
                    onChange={() => setAreasTratadas(p => toggleArr(p, area))}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-[13px] text-on-surface">{area}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Outro</label>
              <input type="text" value={areaOutro} onChange={e => setAreaOutro(e.target.value)}
                placeholder="Especifique outra área..."
                className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary max-w-xs" />
            </div>
          </div>
        </div>

        {/* ── 3. QUEIXA PRINCIPAL ────────────────────────────────────────────── */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6">
          <label className="block font-bold text-[14px] text-on-surface tracking-wider uppercase mb-3">
            3. Queixa Principal
          </label>
          <textarea value={queixaPrincipal} onChange={e => setQueixaPrincipal(e.target.value)} rows={4}
            placeholder="Descreva o principal objetivo ou queixa do tratamento..."
            className="w-full bg-surface border border-outline-variant/50 rounded-xl p-4 text-[13px] outline-none focus:border-primary resize-none placeholder:text-on-surface-variant/50" />
        </div>

        {/* ── 4. HISTÓRICO DE SAÚDE ──────────────────────────────────────────── */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <SectionHeader number="4" title="Histórico de Saúde" />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
            {SAUDE_QUESTIONS.map(q => (
              <div key={q.key} className="flex flex-col border-b border-outline-variant/20 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-on-surface font-medium">{q.label}</span>
                  <SimNaoToggle
                    value={saude[q.key] ?? null}
                    onChange={v => setSaude(p => ({ ...p, [q.key]: v }))}
                  />
                </div>
                {saude[q.key] === true && q.hasDetail && (
                  <input type="text" placeholder="Qual?"
                    value={saudeDetalhes[q.key] || ''}
                    onChange={e => setSaudeDetalhes(p => ({ ...p, [q.key]: e.target.value }))}
                    className="mt-2 w-full text-[12px] p-2.5 bg-surface border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. HISTÓRICO DERMATOLÓGICO ─────────────────────────────────────── */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <SectionHeader number="5" title="Histórico Dermatológico" />
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-10">
              {DERMATO_QUESTIONS.map(q => (
                <div key={q.key} className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <span className="text-[13px] text-on-surface font-medium">{q.label}</span>
                  <SimNaoToggle
                    value={dermato[q.key] ?? null}
                    onChange={v => setDermato(p => ({ ...p, [q.key]: v }))}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block font-bold text-[12px] uppercase text-on-surface-variant tracking-wider mb-3">
                Procedimentos Estéticos Anteriores
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PROCED_ANTERIORES.map(p => (
                  <label key={p}
                    className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition-all ${
                      procedAnteriores.includes(p)
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/40 hover:bg-surface'
                    }`}>
                    <input type="checkbox" checked={procedAnteriores.includes(p)}
                      onChange={() => setProcedAnteriores(prev => toggleArr(prev, p))}
                      className="w-4 h-4 accent-primary" />
                    <span className="text-[13px] text-on-surface">{p}</span>
                  </label>
                ))}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Outros</label>
                  <input type="text" value={procedOutro} onChange={e => setProcedOutro(e.target.value)}
                    placeholder="Especifique..."
                    className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. AVALIAÇÃO CAPILAR (condicional) ────────────────────────────── */}
        {showCapilar && (
          <div className="bg-white-pure rounded-2xl border border-primary/30 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-primary/20 bg-primary/5">
              <h3 className="font-bold text-[14px] text-primary tracking-wider uppercase">
                6. Avaliação Capilar — Couro Cabeludo
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-10">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <span className="text-[13px] text-on-surface font-medium">Histórico familiar de calvície</span>
                  <SimNaoToggle value={calvicieHist} onChange={setCalvicieHist} />
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <span className="text-[13px] text-on-surface font-medium">Falhas localizadas</span>
                  <SimNaoToggle value={falhasLocalizadas} onChange={setFalhasLocalizadas} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-bold text-on-surface">Tempo desde percepção da queda</span>
                <div className="flex flex-wrap gap-4">
                  {['Menos de 6 meses', '6 meses a 1 ano', 'Mais de 1 ano'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tempoQueda" checked={tempoQueda === opt} onChange={() => setTempoQueda(opt)}
                        className="w-4 h-4 accent-primary" />
                      <span className="text-[13px] text-on-surface-variant">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-bold text-on-surface">Intensidade da queda</span>
                <div className="flex flex-wrap gap-4">
                  {['Leve', 'Moderada', 'Intensa'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="intensidadeQueda" checked={intensidadeQueda === opt} onChange={() => setIntensidadeQueda(opt)}
                        className="w-4 h-4 accent-primary" />
                      <span className="text-[13px] text-on-surface-variant">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-outline-variant/20 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-on-surface">Diagnóstico de alopecia</span>
                  <SimNaoToggle value={diagnosticoAlopecia} onChange={setDiagnosticoAlopecia} />
                </div>
                {diagnosticoAlopecia === true && (
                  <input type="text" placeholder="Qual diagnóstico?"
                    value={diagnosticoAlopeciaDetalhe}
                    onChange={e => setDiagnosticoAlopeciaDetalhe(e.target.value)}
                    className="mt-1 w-full text-[12px] p-2.5 bg-surface border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary" />
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-outline-variant/20 pt-4">
                <span className="text-[13px] font-bold text-on-surface">Tratamento atual para queda</span>
                <div className="flex flex-wrap gap-3">
                  {TRAT_QUEDA.map(t => (
                    <label key={t}
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition-all ${
                        tratamentoQueda.includes(t)
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/40 hover:bg-surface'
                      }`}>
                      <input type="checkbox" checked={tratamentoQueda.includes(t)}
                        onChange={() => setTratamentoQueda(p => toggleArr(p, t))}
                        className="w-4 h-4 accent-primary" />
                      <span className="text-[13px] text-on-surface">{t}</span>
                    </label>
                  ))}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Outro</label>
                    <input type="text" value={tratamentoOutro} onChange={e => setTratamentoOutro(e.target.value)}
                      placeholder="Especifique..."
                      className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. AVALIAÇÃO BARBA / SOBRANCELHAS (condicional) ───────────────── */}
        {showBarba && (
          <div className="bg-white-pure rounded-2xl border border-primary/30 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-primary/20 bg-primary/5">
              <h3 className="font-bold text-[14px] text-primary tracking-wider uppercase">
                7. Avaliação de Barba e Sobrancelhas
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex flex-col gap-3">
                <span className="text-[13px] font-bold text-on-surface">Objetivo do tratamento</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {OBJETIVOS_BARBA.map(o => (
                    <label key={o}
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition-all ${
                        objetivoBarba.includes(o)
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/40 hover:bg-surface'
                      }`}>
                      <input type="checkbox" checked={objetivoBarba.includes(o)}
                        onChange={() => setObjetivoBarba(p => toggleArr(p, o))}
                        className="w-4 h-4 accent-primary" />
                      <span className="text-[13px] text-on-surface">{o}</span>
                    </label>
                  ))}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Outro</label>
                    <input type="text" value={objetivoOutro} onChange={e => setObjetivoOutro(e.target.value)}
                      placeholder="Especifique..."
                      className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">
                  Tempo de percepção das falhas
                </label>
                <input type="text" value={tempoFalhas} onChange={e => setTempoFalhas(e.target.value)}
                  placeholder="Ex: 2 anos"
                  className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary max-w-xs" />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[13px] font-bold text-on-surface">Estimulante de crescimento em uso</span>
                <div className="flex flex-wrap gap-3">
                  {ESTIMULANTES.map(e => (
                    <label key={e}
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition-all ${
                        estimulante.includes(e)
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/40 hover:bg-surface'
                      }`}>
                      <input type="checkbox" checked={estimulante.includes(e)}
                        onChange={() => setEstimulante(p => toggleArr(p, e))}
                        className="w-4 h-4 accent-primary" />
                      <span className="text-[13px] text-on-surface">{e}</span>
                    </label>
                  ))}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Outro</label>
                    <input type="text" value={estimulanteOutro} onChange={e => setEstimulanteOutro(e.target.value)}
                      placeholder="Especifique..."
                      className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
                <span className="text-[13px] font-medium text-on-surface">
                  Histórico de alopecia em barba / sobrancelhas
                </span>
                <SimNaoToggle value={alopeciaBarbaSobr} onChange={setAlopeciaBarbaSobr} />
              </div>
            </div>
          </div>
        )}

        {/* ── 8. COSMÉTICOS E ATIVOS ────────────────────────────────────────── */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <SectionHeader number="8" title="Uso de Cosméticos e Ativos" />
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {COSMETICOS.map(c => (
                <label key={c}
                  className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition-all ${
                    cosmeticosUsados.includes(c)
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant/40 hover:bg-surface'
                  }`}>
                  <input type="checkbox" checked={cosmeticosUsados.includes(c)}
                    onChange={() => setCosmeticosUsados(p => toggleArr(p, c))}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-[13px] text-on-surface">{c}</span>
                </label>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">Outros</label>
                <input type="text" value={cosmeticosOutro} onChange={e => setCosmeticosOutro(e.target.value)}
                  placeholder="Especifique..."
                  className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary" />
              </div>
            </div>

            <div className="border-t border-outline-variant/20 pt-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-on-surface">
                  Uso de Isotretinoína (Roacutan) nos últimos 6 meses
                </span>
                <SimNaoToggle value={isotretinoina} onChange={setIsotretinoina} />
              </div>
              {isotretinoina === true && (
                <div className="p-4 bg-amber-50 border border-amber-400 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0">warning</span>
                  <div>
                    <p className="text-[13px] font-bold text-amber-800">ATENÇÃO — CONTRAINDICAÇÃO</p>
                    <p className="text-[12px] text-amber-700 mt-1">
                      Uso de isotretinoína nos últimos 6 meses é contraindicação para microagulhamento.
                      Avaliar clinicamente antes de prosseguir com o procedimento.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 9. HÁBITOS DE VIDA ────────────────────────────────────────────── */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <SectionHeader number="9" title="Hábitos de Vida" />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-4">
              <span className="text-[13px] font-bold text-on-surface">Consumo diário de água</span>
              <div className="flex flex-wrap gap-4">
                {['Menos de 1 litro', '1 a 2 litros', 'Mais de 2 litros'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="agua" checked={agua === opt} onChange={() => setAgua(opt)}
                      className="w-4 h-4 accent-primary" />
                    <span className="text-[13px] text-on-surface-variant">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <span className="text-[13px] font-medium text-on-surface">Fuma</span>
              <SimNaoToggle value={fuma} onChange={setFuma} />
            </div>
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <span className="text-[13px] font-medium text-on-surface">Consome álcool</span>
              <SimNaoToggle value={alcool} onChange={setAlcool} />
            </div>
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <span className="text-[13px] font-medium text-on-surface">Usa protetor solar diariamente</span>
              <SimNaoToggle value={protSolar} onChange={setProtSolar} />
            </div>
          </div>
        </div>

        {/* ── 10. AVALIAÇÃO PROFISSIONAL ────────────────────────────────────── */}
        <div className="bg-white-pure rounded-2xl border border-secondary/40 shadow-sm overflow-hidden">
          <SectionHeader number="10" title="Avaliação Profissional" sub="Preenchimento exclusivo da profissional" />
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-bold text-on-surface">Fototipo de Fitzpatrick</span>
                <div className="flex flex-wrap gap-3">
                  {['I', 'II', 'III', 'IV', 'V', 'VI'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="fototipoPro" checked={fototipo === opt} onChange={() => setFototipo(opt)}
                        className="w-4 h-4 accent-primary" />
                      <span className="text-[13px] text-on-surface-variant">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-bold text-on-surface">Tipo de pele</span>
                <div className="flex flex-wrap gap-3">
                  {['Normal', 'Seca', 'Oleosa', 'Mista', 'Sensível'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="tipoPele" checked={tipoPele === opt} onChange={() => setTipoPele(opt)}
                        className="w-4 h-4 accent-primary" />
                      <span className="text-[13px] text-on-surface-variant">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {showCapilar && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">
                  Grau de alopecia
                </label>
                <input type="text" value={grauAlopecia} onChange={e => setGrauAlopecia(e.target.value)}
                  placeholder="Ex: Hamilton-Norwood III"
                  className="p-2.5 bg-white border border-outline-variant/50 rounded-xl text-[13px] outline-none focus:border-primary max-w-xs" />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider">
                Observações Clínicas
              </label>
              <textarea value={obsClinicas} onChange={e => setObsClinicas(e.target.value)} rows={4}
                placeholder="Insira observações clínicas relevantes..."
                className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3 text-[13px] outline-none focus:border-primary resize-none placeholder:text-on-surface-variant/50" />
            </div>
          </div>
        </div>

        {/* ── 11. REGISTRO FOTOGRÁFICO ──────────────────────────────────────── */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6">
          <h3 className="font-bold text-[14px] text-on-surface tracking-wider uppercase mb-4">
            11. Registro Fotográfico
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-on-surface leading-relaxed max-w-[70%]">
              Autoriza o registro e uso de fotos do antes/depois para prontuário clínico e divulgação em portfólio?
            </span>
            <SimNaoToggle value={fotoAutorizacao} onChange={setFotoAutorizacao} />
          </div>
        </div>

        {/* ── 12. TERMO + ASSINATURA ────────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="font-bold text-[14px] text-primary tracking-wider uppercase ml-1">
            12. Termo de Consentimento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="inline-block bg-surface px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider text-on-surface mb-4">
                  Termo de Consentimento — Microagulhamento
                </div>
                <p className="text-[12px] sm:text-[13px] text-on-surface-variant leading-relaxed text-justify">
                  Declaro que fui devidamente informado(a) sobre o procedimento de Microagulhamento
                  (Indução Percutânea de Colágeno), incluindo seus benefícios, riscos, contraindicações e
                  cuidados pós-procedimento. Confirmo que todas as informações prestadas nesta ficha são
                  verdadeiras e completas. Autorizo a realização do procedimento na(s) área(s) indicada(s),
                  estando ciente de que podem ocorrer reações temporárias como vermelhidão, edema,
                  sensibilidade e descamação. Comprometo-me a seguir as orientações pré e pós-procedimento
                  fornecidas pela profissional. Em caso de omissão ou informação incorreta nesta ficha, eximo
                  a profissional de responsabilidades decorrentes.
                </p>
              </div>
              <label className="mt-6 sm:mt-8 flex items-start gap-3 cursor-pointer p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                <input type="checkbox" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)}
                  className="w-6 h-6 sm:w-5 sm:h-5 rounded accent-primary mt-0.5 shrink-0" />
                <span className="text-[12px] sm:text-[13px] font-bold text-primary leading-snug">
                  Li e concordo com o termo de consentimento acima. <span className="text-error">*</span>
                </span>
              </label>
            </div>

            <div className="bg-white-pure flex flex-col">
              <div className="mb-2">
                <h4 className="font-bold text-[12px] uppercase tracking-wider text-on-surface">Assinatura Digital</h4>
                <p className="text-[11px] text-on-surface-variant mt-1">Toque e arraste com o dedo ou caneta para assinar.</p>
              </div>
              <div ref={canvasContainerRef}
                className="relative bg-white-pure border-2 rounded-2xl overflow-hidden"
                style={{ minHeight: '200px', height: '220px', touchAction: 'none' }}>
                <canvas ref={canvasRef}
                  onPointerDown={startDrawing} onPointerMove={draw}
                  onPointerUp={stopDrawing} onPointerLeave={stopDrawing}
                  className="absolute inset-0 w-full h-full cursor-crosshair"
                  style={{ touchAction: 'none' }} />
                {!isDrawing && !signatureSaved && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center pointer-events-none select-none">
                    <span className="material-symbols-outlined text-4xl text-outline/40">draw</span>
                    <p className="text-[11px] text-outline/60 mt-1 font-medium">Assine aqui com o dedo ou caneta</p>
                  </div>
                )}
                {signatureSaved && (
                  <div className="absolute top-2 right-2 pointer-events-none">
                    <span className="material-symbols-outlined text-emerald-500 text-[20px]">verified</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-on-surface-variant/70">Assinatura persistida em Base64 PNG.</p>
                <button onClick={clearCanvas} type="button"
                  className="px-3 py-1.5 bg-surface text-on-surface text-[11px] font-bold border border-outline-variant rounded-lg hover:bg-outline-variant/20 shadow-sm transition-all cursor-pointer flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botão salvar */}
        <div className="flex justify-center sm:justify-end pt-4 pb-12">
          <button onClick={handleSave}
            className="w-full sm:w-auto px-8 py-4 sm:py-3.5 bg-[#a322d8] hover:bg-[#861cae] text-white-pure font-bold rounded-2xl text-[15px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">check</span>
            Salvar Ficha de Microagulhamento Completa
          </button>
        </div>

      </div>
    </div>
  );
}
