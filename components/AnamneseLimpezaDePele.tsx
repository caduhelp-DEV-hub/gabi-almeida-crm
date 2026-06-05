import React, { useRef, useState } from 'react';

interface AnamneseLimpezaProps {
  patientName: string;
  patientPhone?: string;
  onCancel: () => void;
  onSave: (data: {
    healthToggles: Record<string, boolean>;
    otherHealth: string;
    generalObs: string;
    oleosidade: string;
    acnegrau: string;
    espessura: string;
    hidratacao: string;
    fototipo: string;
    selectedSkinProblems: string[];
    signatureBase64: string;
  }) => void;
}

export default function AnamneseLimpeza({ patientName, patientPhone = '(11) 97434-5511', onCancel, onSave }: AnamneseLimpezaProps) {
  // Can add specific state here if needed
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);

  // Example toggles
  const [healthToggles, setHealthToggles] = useState<Record<string, boolean>>({});
  const [otherHealth, setOtherHealth] = useState('');
  const [generalObs, setGeneralObs] = useState('');
  const [oleosidade, setOleosidade] = useState('');
  const [acnegrau, setAcnegrau] = useState('');
  const [espessura, setEspessura] = useState('');
  const [hidratacao, setHidratacao] = useState('');
  const [fototipo, setFototipo] = useState('');
  const [selectedSkinProblems, setSelectedSkinProblems] = useState<string[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);

  const toggleHealth = (key: string) => setHealthToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const questions = [
    "Utiliza lentes de contato?", "Tem epilepsia / convulsões?",
    "Funcionamento intestinal regular?", "Tratamento facial anterior?",
    "Ingere água com frequência?", "Ingere bebida alcoólica?",
    "Exposição ao sol?", "Está no período menstrual?",
    "Boa qualidade do sono?", "Possui prótese corporal/facial?",
    "Tabagismo?", "Alterações cardíacas?",
    "Portador de marca-passo?", "Grávida?",
    "Utiliza cremes ou loções facial?", "Pratica atividade física?",
    "Utiliza anticoncepcional?", "Possui algum tipo de alergia?",
    "Possui uma boa alimentação?", "Problemas de pele?"
  ];

  const skinProblems = [
    "Millium", "Comedão", "Pápula", "Pústula", "Cistos", "Rugas", "Acromia", "Hipercromia",
    "Foliculite", "Queratose", "Cicatriz", "Atrofia", "Xantelasma", "Quelóide", "Tumor",
    "Nevo Rubi", "Nevo melanocítico", "Verruga", "Papiloma", "Efélides", "Bolhas", "Abscesso",
    "Hirsutismo", "Nódulos", "Telangiectasias", "Hipocromia", "Marcas", "Outra"
  ];

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setSignatureSaved(false);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#311059'; // primary color or dark purple
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setSignatureSaved(true);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSaved(false);
  };

  const handleSave = () => {
    if (!consentGiven) {
      alert("Por favor, confirme o termo de consentimento.");
      return;
    }
    const canvas = canvasRef.current;
    let signatureBase64 = '';
    if (canvas && signatureSaved) {
      signatureBase64 = canvas.toDataURL('image/png');
    }
    if (!signatureBase64) {
      alert("Por favor, desenhe sua assinatura no campo indicado.");
      return;
    }
    onSave({
      healthToggles,
      otherHealth,
      generalObs,
      oleosidade,
      acnegrau,
      espessura,
      hidratacao,
      fototipo,
      selectedSkinProblems,
      signatureBase64
    });
  };


  return (
    <div className="bg-surface rounded-3xl overflow-hidden w-full max-w-5xl mx-auto border border-outline-variant/50 flex flex-col font-manrope">
      
      {/* Header */}
      <div className="bg-white-pure p-6 border-b border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest rounded-full mb-3">
            Ficha Limpeza de Pele • Modelo Ágil
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">Ficha de Anamnese: Limpeza de Pele</h2>
          <p className="text-on-surface-variant text-[13px] font-medium">
            Cliente: <strong className="text-on-surface">{patientName}</strong> • Telefone: {patientPhone}
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
            <span className="bg-secondary p-1.5 px-3 rounded-full text-on-secondary font-bold text-[11px]">20 Toggles</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
            {questions.map(q => {
              const isYes = !!healthToggles[q];
              return (
                <div key={q} className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <span className="text-[13px] text-on-surface font-medium pr-2">{q}</span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setHealthToggles(prev => ({ ...prev, [q]: true }))}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all duration-300 cursor-pointer ${
                        isYes 
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-700 scale-105 shadow-sm' 
                          : 'border-outline-variant/50 text-on-surface-variant hover:bg-surface'
                      }`}
                    >
                      SIM
                    </button>
                    <button
                      type="button"
                      onClick={() => setHealthToggles(prev => ({ ...prev, [q]: false }))}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all duration-300 cursor-pointer ${
                        !isYes 
                          ? 'bg-[#ba1a1a]/10 border-[#ba1a1a] text-[#ba1a1a] scale-105 shadow-sm' 
                          : 'border-outline-variant/50 text-on-surface-variant hover:bg-surface'
                      }`}
                    >
                      NÃO
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Textarea Relevante */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6">
          <label className="block font-bold text-[13px] text-on-surface tracking-wider uppercase mb-3">Existe algum outro problema de saúde relevante que julgue necessário informar?</label>
          <textarea 
            value={otherHealth}
            onChange={(e) => setOtherHealth(e.target.value)}
            className="w-full bg-surface border border-outline-variant/50 rounded-xl p-4 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder:text-on-surface-variant/50"
            rows={3}
            placeholder="Ex: Doença autoimune leve, asma, rinite crônica..."
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Diagnóstico */}
            <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6 flex flex-col gap-6">
              <h3 className="font-bold text-[14px] text-primary tracking-wider uppercase mb-2">Diagnóstico Físico da Pele</h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-[13px] font-bold text-on-surface min-w-[100px]">Oleosidade:</span>
                <div className="flex gap-4 flex-wrap">
                  {['Alípica', 'Lipídica', 'Normal', 'Seborreica'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 text-[13px] text-on-surface-variant cursor-pointer group">
                      <input type="radio" name="oleosidade" checked={oleosidade === opt} onChange={() => setOleosidade(opt)} className="w-4 h-4 accent-primary" /> {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-[13px] font-bold text-on-surface min-w-[100px]">Acne Grau:</span>
                <div className="flex gap-4 flex-wrap">
                  {['I', 'II', 'III', 'IV'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 text-[13px] text-on-surface-variant cursor-pointer group">
                      <input type="radio" name="acnegrau" checked={acnegrau === opt} onChange={() => setAcnegrau(opt)} className="w-4 h-4 accent-primary" /> {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-[13px] font-bold text-on-surface min-w-[100px]">Espessura:</span>
                <div className="flex gap-4 flex-wrap">
                  {['Espessa', 'Fina', 'Muito Fina'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 text-[13px] text-on-surface-variant cursor-pointer group">
                      <input type="radio" name="espessura" checked={espessura === opt} onChange={() => setEspessura(opt)} className="w-4 h-4 accent-primary" /> {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-[13px] font-bold text-on-surface min-w-[100px]">Hidratação:</span>
                <div className="flex gap-4 flex-wrap">
                  {['Hidratada', 'Normal', 'Desidratada'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 text-[13px] text-on-surface-variant cursor-pointer group">
                      <input type="radio" name="hidratacao" checked={hidratacao === opt} onChange={() => setHidratacao(opt)} className="w-4 h-4 accent-primary" /> {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-[13px] font-bold text-on-surface min-w-[100px]">Fototipo:</span>
                <div className="flex gap-3 flex-wrap">
                  {['I', 'II', 'III', 'IV', 'V', 'VI'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 text-[13px] text-on-surface-variant cursor-pointer group">
                      <input type="radio" name="fototipo" checked={fototipo === opt} onChange={() => setFototipo(opt)} className="w-4 h-4 accent-primary" /> {opt}
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Divulgação & Obs */}
            <div className="flex flex-col gap-8">
              <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6 flex flex-col gap-6">
                <h3 className="font-bold text-[14px] text-primary tracking-wider uppercase mb-2">Divulgação & Observações</h3>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[13px] text-on-surface font-medium leading-relaxed">
                    Autoriza o registro e uso de fotos do antes/depois para prontuário clínico e divulgação em portfolio?
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setHealthToggles(prev => ({ ...prev, fotos: true }))}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all duration-300 cursor-pointer ${
                        healthToggles['fotos'] 
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-700 scale-105 shadow-sm' 
                          : 'border-outline-variant/50 text-on-surface-variant hover:bg-surface'
                      }`}
                    >
                      SIM
                    </button>
                    <button
                      type="button"
                      onClick={() => setHealthToggles(prev => ({ ...prev, fotos: false }))}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all duration-300 cursor-pointer ${
                        !healthToggles['fotos'] 
                          ? 'bg-[#ba1a1a]/10 border-[#ba1a1a] text-[#ba1a1a] scale-105 shadow-sm' 
                          : 'border-outline-variant/50 text-on-surface-variant hover:bg-surface'
                      }`}
                    >
                      NÃO
                    </button>
                  </div>
                </div>
                
                <div>
                   <label className="block font-bold text-[11px] text-on-surface tracking-wider uppercase mb-2">Observações Gerais (Opcional):</label>
                   <textarea 
                    value={generalObs}
                    onChange={(e) => setGeneralObs(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder:text-on-surface-variant/50"
                    rows={4}
                    placeholder="Insira detalhes adicionais sobre a sessão de limpeza de pele..."
                  ></textarea>
                </div>
              </div>
            </div>
        </div>

        {/* Lesoes */}
        <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
           <div className="p-5 border-b border-outline-variant/40 bg-surface/30">
            <h3 className="font-bold text-[14px] text-primary tracking-wider uppercase">Problemas de Pele Identificados / Lesões Clínicas na Sessão</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {skinProblems.map(problem => {
                const isChecked = selectedSkinProblems.includes(problem);
                return (
                  <label key={problem} className="flex items-center gap-2 p-2 border border-outline-variant/40 rounded-xl cursor-pointer hover:bg-surface-container-lowest transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => {
                        setSelectedSkinProblems(prev => 
                          prev.includes(problem) ? prev.filter(p => p !== problem) : [...prev, problem]
                        );
                      }}
                      className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary accent-primary" 
                    />
                    <span className="text-[13px] text-on-surface-variant group-hover:text-on-surface">{problem}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Autenticacao */}
        <div className="space-y-4">
          <h3 className="font-bold text-[14px] text-primary tracking-wider uppercase ml-1">Autenticação de Consentimento de Limpeza de Pele</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white-pure rounded-2xl border border-outline-variant/60 shadow-sm p-6 flex flex-col justify-between">
               <div>
                  <div className="inline-block bg-surface px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider text-on-surface mb-4">
                    Termo de Tratamento de Limpeza de Pele
                  </div>
                  <p className="text-[13px] text-on-surface-variant leading-relaxed text-justify">
                    Declaro que fui informado(a) minuciosamente dos benefícios, riscos e do protocolo previsto para o procedimento de Limpeza de Pele Estética. Autorizo o profissional esteta qualificado a realizar os procedimentos de extração mecânica de comedões, aplicação de loções de higienização, esfoliação e drenagem facial indicada. Relatei fielmente meu histórico de saúde e hábitos diários, aceitando as devidas responsabilidades pelo pós-procedimento.
                  </p>
               </div>
               
               <label className="mt-8 flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="w-5 h-5 rounded text-primary border-primary focus:ring-primary accent-primary mt-0.5 shrink-0" 
                  />
                  <span className="text-[13px] font-bold text-primary leading-snug">
                    Confirmo o termo de limpeza de pele e autorizo o procedimento.
                  </span>
               </label>
            </div>
            
            <div className="bg-white-pure flex flex-col">
              <div className="mb-2">
                <h4 className="font-bold text-[12px] uppercase tracking-wider text-on-surface">Assinatura Digital de Consentimento (Desenhe na tela)</h4>
                <p className="text-[11px] text-on-surface-variant mt-1">Clique/Toque e arraste para desenhar o traço oficial.</p>
              </div>
              <div className="relative flex-1 bg-white-pure border-2 border-outline-variant/50 rounded-2xl overflow-hidden min-h-[220px]">
                  <canvas 
                    ref={canvasRef}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerOut={stopDrawing}
                    className="w-full h-full cursor-crosshair relative z-10 touch-none"
                  />
                  <div className="absolute top-3 right-3 z-20">
                     <button onClick={clearCanvas} className="px-3 py-1.5 bg-surface text-on-surface text-[11px] font-bold border border-outline-variant rounded-lg hover:bg-outline-variant/20 shadow-sm transition-all cursor-pointer">
                        Limpar canva
                     </button>
                  </div>
              </div>
              <p className="text-[10px] text-on-surface-variant/70 text-center mt-3">
                 A assinatura desenhada será persistida em string Base64 PNG de modo permanente.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 pb-12">
            <button onClick={handleSave} className="px-8 py-3.5 bg-[#a322d8] hover:bg-[#861cae] text-white-pure font-bold rounded-2xl text-[15px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer">
               <span className="material-symbols-outlined text-[18px]">check</span>
               Salvar Ficha de Limpeza de Pele
            </button>
        </div>

      </div>
    </div>
  );
}
