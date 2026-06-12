import { useState } from 'react';
import Icon from './Icon';
import type { ProjectModule } from '../api';

interface PricingProps {
  projectName: string;
  data: ProjectModule[];
  bufferPct: number;
  onBufferChange: (v: number) => void;
  onNavigateDashboard: () => void;
  onNavigateEditor: () => void;
}

// Fibonacci SP → effort range (hours)
const SP_TABLE: {
  sp: number;
  effortMin: number;
  effortMax: number;
  effortLabel?: string;   // optional override for display (e.g. "0,5h")
  profile: string;
  isEpic?: boolean;
}[] = [
  { sp: 1,  effortMin: 0.5, effortMax: 0.5, effortLabel: '30 min',        profile: 'Correções pontuais ou micro-ajustes.' },
  { sp: 1,  effortMin: 1,   effortMax: 1,   effortLabel: '1h',             profile: 'Tarefas muito pequenas e bem definidas.' },
  { sp: 1,  effortMin: 2,   effortMax: 4,   profile: 'Pequenos ajustes, textos ou cores.' },
  { sp: 2,  effortMin: 5,   effortMax: 10,  profile: 'Telas simples ou CRUDs básicos.' },
  { sp: 3,  effortMin: 12,  effortMax: 18,  profile: 'Lógica intermediária ou integrações simples.' },
  { sp: 5,  effortMin: 24,  effortMax: 36,  profile: 'Funcionalidades centrais ou regras complexas.' },
  { sp: 8,  effortMin: 40,  effortMax: 60,  profile: 'Módulos inteiros (ex: checkout, chat, busca).' },
  { sp: 13, effortMin: 0,   effortMax: 0,   profile: 'Epic: Deve ser quebrado em histórias menores.', isEpic: true },
];

const SP_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0:  { bg: 'bg-outline-variant/10', text: 'text-outline',        border: 'border-outline-variant/20' },
  1:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  2:  { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/30' },
  3:  { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/30' },
  5:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/30' },
  8:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  13: { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/30' },
};

const calculatePERT = (o: number, m: number, p: number): number => {
  const res = (Number(o) + 4 * Number(m) + Number(p)) / 6;
  return isNaN(res) ? 0 : Math.round(res * 10) / 10;
};

function hoursToSP(hours: number): number {
  if (hours <= 0)  return 0;   // Sem horas = 0 SP
  if (hours <= 4)  return 1;   // 0,5h · 1h · 2h · 3h · 4h → SP 1
  if (hours <= 10) return 2;   // 5h … 10h → SP 2
  if (hours <= 18) return 3;
  if (hours <= 36) return 5;
  if (hours <= 60) return 8;
  return 13;
}

const fmt = (n: number): string => {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Pricing({
  projectName, data, bufferPct, onBufferChange, onNavigateDashboard, onNavigateEditor,
}: PricingProps) {
  const [hourlyRate, setHourlyRate] = useState(() => {
    const saved = localStorage.getItem('pricing_hourly_rate');
    return saved ? parseFloat(saved) : 40;
  });
  const [rateInput, setRateInput] = useState(() => {
    const saved = localStorage.getItem('pricing_hourly_rate');
    return saved || '40';
  });

  // Multiplier choices persisted in localStorage
  const [prazoSelect, setPrazoSelect] = useState(() => {
    return localStorage.getItem('pricing_prazo_select') || 'normal';
  });
  const [complexSelect, setComplexSelect] = useState(() => {
    return localStorage.getItem('pricing_complex_select') || 'normal';
  });
  const [porteSelect, setPorteSelect] = useState(() => {
    return localStorage.getItem('pricing_porte_select') || 'pf';
  });

  // Multiplier values persisted in localStorage
  interface PrazoMults {
    normal: number;
    reduzido: number;
    muito: number;
    extremamente: number;
  }
  const [prazoMultipliers, setPrazoMultipliers] = useState<PrazoMults>(() => {
    const saved = localStorage.getItem('pricing_prazo_mults');
    return saved ? JSON.parse(saved) : {
      normal: 1.00,
      reduzido: 1.35,
      muito: 1.86,
      extremamente: 3.00
    };
  });

  // --- FIX: String inputs decoupled from numeric multiplier state ---
  // This prevents mid-typing values (e.g. "1.") from corrupting the multiplier
  // and breaking PDF export values.
  const [prazoInputs, setPrazoInputs] = useState<Record<keyof PrazoMults, string>>(() => ({
    normal:       String(JSON.parse(localStorage.getItem('pricing_prazo_mults') || 'null')?.normal       ?? 1.00),
    reduzido:     String(JSON.parse(localStorage.getItem('pricing_prazo_mults') || 'null')?.reduzido     ?? 1.35),
    muito:        String(JSON.parse(localStorage.getItem('pricing_prazo_mults') || 'null')?.muito        ?? 1.86),
    extremamente: String(JSON.parse(localStorage.getItem('pricing_prazo_mults') || 'null')?.extremamente ?? 3.00),
  }));

  interface ComplexMults {
    normal: number;
    complexo: number;
    muito: number;
  }
  const [complexMultipliers, setComplexMultipliers] = useState<ComplexMults>(() => {
    const saved = localStorage.getItem('pricing_complex_mults');
    return saved ? JSON.parse(saved) : {
      normal: 1.00,
      complexo: 1.30,
      muito: 1.60
    };
  });
  const [complexInputs, setComplexInputs] = useState<Record<keyof ComplexMults, string>>(() => ({
    normal:   String(JSON.parse(localStorage.getItem('pricing_complex_mults') || 'null')?.normal   ?? 1.00),
    complexo: String(JSON.parse(localStorage.getItem('pricing_complex_mults') || 'null')?.complexo ?? 1.30),
    muito:    String(JSON.parse(localStorage.getItem('pricing_complex_mults') || 'null')?.muito    ?? 1.60),
  }));

  interface PorteMults {
    pf: number;
    me: number;
    pequeno: number;
    medio: number;
    grande: number;
  }
  const [porteMultipliers, setPorteMultipliers] = useState<PorteMults>(() => {
    const saved = localStorage.getItem('pricing_porte_mults');
    return saved ? JSON.parse(saved) : {
      pf: 0.00,
      me: 0.00,
      pequeno: 0.00,
      medio: 0.10,
      grande: 0.20
    };
  });
  const [porteInputs, setPorteInputs] = useState<Record<keyof PorteMults, string>>(() => ({
    pf:      String(JSON.parse(localStorage.getItem('pricing_porte_mults') || 'null')?.pf      ?? 0.00),
    me:      String(JSON.parse(localStorage.getItem('pricing_porte_mults') || 'null')?.me      ?? 0.00),
    pequeno: String(JSON.parse(localStorage.getItem('pricing_porte_mults') || 'null')?.pequeno ?? 0.00),
    medio:   String(JSON.parse(localStorage.getItem('pricing_porte_mults') || 'null')?.medio   ?? 0.10),
    grande:  String(JSON.parse(localStorage.getItem('pricing_porte_mults') || 'null')?.grande  ?? 0.20),
  }));

  // Action helpers to update states and localStorage
  const updatePrazoSelect = (val: string) => {
    setPrazoSelect(val);
    localStorage.setItem('pricing_prazo_select', val);
  };
  const updateComplexSelect = (val: string) => {
    setComplexSelect(val);
    localStorage.setItem('pricing_complex_select', val);
  };
  const updatePorteSelect = (val: string) => {
    setPorteSelect(val);
    localStorage.setItem('pricing_porte_select', val);
  };

  // Commit helpers: only update the numeric state on blur/enter
  const applyPrazoMult = (key: keyof PrazoMults, raw: string) => {
    const n = parseFloat(raw.replace(',', '.'));
    const val = isNaN(n) ? prazoMultipliers[key] : Math.round(n * 1000) / 1000;
    const updated = { ...prazoMultipliers, [key]: val };
    setPrazoMultipliers(updated);
    setPrazoInputs(prev => ({ ...prev, [key]: String(val) }));
    localStorage.setItem('pricing_prazo_mults', JSON.stringify(updated));
  };
  const applyComplexMult = (key: keyof ComplexMults, raw: string) => {
    const n = parseFloat(raw.replace(',', '.'));
    const val = isNaN(n) ? complexMultipliers[key] : Math.round(n * 1000) / 1000;
    const updated = { ...complexMultipliers, [key]: val };
    setComplexMultipliers(updated);
    setComplexInputs(prev => ({ ...prev, [key]: String(val) }));
    localStorage.setItem('pricing_complex_mults', JSON.stringify(updated));
  };
  const applyPorteMult = (key: keyof PorteMults, raw: string) => {
    const n = parseFloat(raw.replace(',', '.'));
    const val = isNaN(n) ? porteMultipliers[key] : Math.round(n * 1000) / 1000;
    const updated = { ...porteMultipliers, [key]: val };
    setPorteMultipliers(updated);
    setPorteInputs(prev => ({ ...prev, [key]: String(val) }));
    localStorage.setItem('pricing_porte_mults', JSON.stringify(updated));
  };

  const currentPrazoMult = prazoMultipliers[prazoSelect as keyof PrazoMults] ?? 1.0;
  const currentComplexMult = complexMultipliers[complexSelect as keyof ComplexMults] ?? 1.0;
  const currentPorteMult = porteMultipliers[porteSelect as keyof PorteMults] ?? 0.0;

  // Combining the multipliers
  // Prazo * Complexidade * (1 + Porte)
  const multiplierFactor = currentPrazoMult * currentComplexMult * (1 + currentPorteMult);

  // Compute totals from PERT hours
  const totalPERT = data.reduce(
    (acc, mod) => acc + mod.items.reduce((s, i) => s + calculatePERT(i.pert.o, i.pert.m, i.pert.p), 0),
    0,
  );
  const buffer     = Math.round(totalPERT * (bufferPct / 100) * 10) / 10;
  const totalHours  = Math.round((totalPERT + buffer) * 10) / 10;

  const basePrice   = Math.round(totalHours * hourlyRate * 100) / 100;
  const totalPrice  = Math.round(basePrice * multiplierFactor * 100) / 100;
  // Preço mínimo = horas PERT brutas × valor/hora (sem buffer de horas, sem multiplicadores)
  // Assim representa o custo base real antes de qualquer margem.
  const minPrice    = Math.round(totalPERT * hourlyRate * 100) / 100;

  // Per-module breakdown
  const modules = data.map((mod) => {
    const items = mod.items.map((item) => {
      const expected = calculatePERT(item.pert.o, item.pert.m, item.pert.p);
      const sp = hoursToSP(expected);
      // Min: custo base puro sem nenhuma margem
      const itemMinPrice = Math.round(expected * hourlyRate * 100) / 100;
      // Max: com buffer de horas (usa bufferPct configurado, não 1.35 fixo)
      const itemMaxPrice = Math.round(expected * (1 + bufferPct / 100) * hourlyRate * multiplierFactor * 100) / 100;
      return { ...item, expected, sp, itemMinPrice, itemMaxPrice };
    });
    const modHours     = items.reduce((s, i) => s + i.expected, 0);
    const modBuf       = Math.round(modHours * (bufferPct / 100) * 10) / 10;
    const modTotal     = Math.round((modHours + modBuf) * 10) / 10;
    const modPrice     = Math.round(modTotal * hourlyRate * multiplierFactor * 100) / 100;
    // modMinPrice: custo base do módulo sem buffer e sem multiplicadores
    const modMinPrice  = Math.round(modHours * hourlyRate * 100) / 100;
    const modSP        = items.reduce((s, i) => s + i.sp, 0);
    return { ...mod, items, modHours, modBuf, modTotal, modPrice, modMinPrice, modSP };
  });

  function applyRate() {
    const n = parseFloat(rateInput.replace(',', '.'));
    if (!isNaN(n) && n > 0) {
      const val = Math.round(n * 100) / 100;
      setHourlyRate(val);
      localStorage.setItem('pricing_hourly_rate', String(val));
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-36">
      {/* ── Top Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 md:left-72 right-0 h-16 z-40 flex justify-between items-center px-8 bg-bg/80 backdrop-blur-md border-b border-outline-variant shadow-sm no-print">
        <div className="flex items-center gap-6">
          <span className="text-lg font-black tracking-tighter text-primary md:hidden">EAP Architect</span>
          <div className="hidden md:flex space-x-1 h-16 items-center">
            <button onClick={onNavigateDashboard} className="text-on-surface-variant font-medium hover:text-primary h-full flex items-center px-3 text-sm transition-colors cursor-pointer">
              Dashboard
            </button>
            <button onClick={onNavigateEditor} className="text-on-surface-variant font-medium hover:text-primary h-full flex items-center px-3 text-sm transition-colors cursor-pointer">
              Editor
            </button>
            <button className="text-primary border-b-2 border-primary pb-0.5 font-semibold h-full flex items-center px-3 text-sm cursor-pointer">
              Precificação
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 hover:bg-surface rounded-full transition-all cursor-pointer text-on-surface-variant hover:text-primary"
            title="Imprimir"
          >
            <Icon name="print" size={20} />
          </button>
        </div>
      </nav>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-8 pt-24 max-w-5xl mx-auto w-full flex flex-col gap-8">

        {/* ── PDF-only Header ─────────────────────────────────────────── */}
        <div className="hidden print:block">
          {/* Title bar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', borderBottom:'2px solid #1d4ed8', paddingBottom:'10px', marginBottom:'18px' }}>
            <div>
              <div style={{ fontSize:'20px', fontWeight:800, color:'#0f172a', lineHeight:1.2 }}>{projectName}</div>
              <div style={{ fontSize:'11px', color:'#475569', marginTop:'2px' }}>Proposta de Precificação — EAP Architect</div>
            </div>
            <div style={{ fontSize:'10px', color:'#475569', textAlign:'right' }}>
              Gerado em {new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
            </div>
          </div>

          {/* Multiplier config row */}
          <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
            {[
              { label:'Valor / Hora', value: fmtBRL(hourlyRate), sub: '' },
              { label:'Prazo', value: prazoSelect === 'normal' ? 'Normal' : prazoSelect === 'reduzido' ? 'Reduzido' : prazoSelect === 'muito' ? 'Muito Reduzido' : 'Extr. Reduzido', sub: `×${fmt(currentPrazoMult)}` },
              { label:'Complexidade', value: complexSelect === 'normal' ? 'Normal' : complexSelect === 'complexo' ? 'Complexo' : 'Muito Complexo', sub: `×${fmt(currentComplexMult)}` },
              { label:'Porte do Cliente', value: porteSelect === 'pf' ? 'Pessoa Física' : porteSelect === 'me' ? 'Microemp.' : porteSelect === 'pequeno' ? 'Pequeno' : porteSelect === 'medio' ? 'Médio' : 'Grande', sub: `+${fmt(currentPorteMult * 100)}%` },
              { label:'Fator Total', value: `×${fmt(multiplierFactor)}`, sub: `Buffer: ${bufferPct}%`, highlight: true },
            ].map((c, i) => (
              <div key={i} style={{ flex:1, border:'1px solid #cbd5e1', borderRadius:'8px', padding:'8px 10px', background: c.highlight ? '#dbeafe' : '#f8fafc' }}>
                <div style={{ fontSize:'8px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'3px' }}>{c.label}</div>
                <div style={{ fontSize: c.highlight ? '14px' : '12px', fontWeight:700, color: c.highlight ? '#1d4ed8' : '#0f172a' }}>{c.value}</div>
                {c.sub && <div style={{ fontSize:'9px', color:'#64748b', marginTop:'1px' }}>{c.sub}</div>}
              </div>
            ))}
          </div>

          {/* Financial summary row */}
          <div style={{ display:'flex', gap:'0', border:'2px solid #1d4ed8', borderRadius:'10px', overflow:'hidden', marginBottom:'18px' }}>
            {[
              { label:'Horas Líquidas (PERT)', value: `${fmt(totalPERT)}h`, sub:'sem buffer', color:'#0f172a' },
              { label:`Total c/ Buffer (${bufferPct}%)`, value: `${fmt(totalHours)}h`, sub:`+${fmt(buffer)}h`, color:'#0f172a' },
              { label:'Preço Mínimo', value: fmtBRL(minPrice), sub:'sem buffer, sem mult.', color:'#0f172a' },
              { label:'Valor Total Recomendado', value: fmtBRL(totalPrice), sub:`c/ buffer e multiplicadores`, color:'#1d4ed8', big: true },
            ].map((c, i) => (
              <div key={i} style={{ flex: c.big ? 1.4 : 1, padding:'12px 14px', borderLeft: i > 0 ? '1px solid #bfdbfe' : 'none', background: c.big ? '#eff6ff' : '#fff', textAlign: c.big ? 'right' : 'left' }}>
                <div style={{ fontSize:'8px', fontWeight:700, color: c.big ? '#1d4ed8' : '#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' }}>{c.label}</div>
                <div style={{ fontSize: c.big ? '18px' : '14px', fontWeight:800, color: c.color, fontVariantNumeric:'tabular-nums' }}>{c.value}</div>
                <div style={{ fontSize:'9px', color:'#94a3b8', marginTop:'2px' }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Module pricing table */}
          <div style={{ fontSize:'11px', fontWeight:700, color:'#0f172a', marginBottom:'8px' }}>Precificação por Módulo</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'10px', marginBottom:'20px' }}>
            <thead>
              <tr style={{ background:'#f1f5f9', borderBottom:'1px solid #cbd5e1' }}>
                <th style={{ textAlign:'left', padding:'6px 10px', color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>Módulo</th>
                <th style={{ textAlign:'right', padding:'6px 10px', color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>Horas Líq.</th>
                <th style={{ textAlign:'right', padding:'6px 10px', color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>c/ Buffer</th>
                <th style={{ textAlign:'right', padding:'6px 10px', color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>Preço Mín.</th>
                <th style={{ textAlign:'right', padding:'6px 10px', color:'#1d4ed8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>Preço Rec.</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod, i) => (
                <tr key={mod.id} style={{ borderBottom:'1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ padding:'6px 10px', fontWeight:600, color:'#0f172a' }}>{i + 1}. {mod.title}</td>
                  <td style={{ padding:'6px 10px', textAlign:'right', color:'#475569', fontVariantNumeric:'tabular-nums' }}>{fmt(mod.modHours)}h</td>
                  <td style={{ padding:'6px 10px', textAlign:'right', color:'#475569', fontVariantNumeric:'tabular-nums' }}>{fmt(mod.modTotal)}h</td>
                  <td style={{ padding:'6px 10px', textAlign:'right', color:'#0f172a', fontVariantNumeric:'tabular-nums' }}>{fmtBRL(mod.modMinPrice)}</td>
                  <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700, color:'#1d4ed8', fontVariantNumeric:'tabular-nums' }}>{fmtBRL(mod.modPrice)}</td>
                </tr>
              ))}
              <tr style={{ borderTop:'2px solid #1d4ed8', background:'#eff6ff' }}>
                <td style={{ padding:'7px 10px', fontWeight:800, color:'#0f172a' }}>TOTAL</td>
                <td style={{ padding:'7px 10px', textAlign:'right', fontWeight:700, color:'#0f172a', fontVariantNumeric:'tabular-nums' }}>{fmt(totalPERT)}h</td>
                <td style={{ padding:'7px 10px', textAlign:'right', fontWeight:700, color:'#0f172a', fontVariantNumeric:'tabular-nums' }}>{fmt(totalHours)}h</td>
                <td style={{ padding:'7px 10px', textAlign:'right', fontWeight:700, color:'#0f172a', fontVariantNumeric:'tabular-nums' }}>{fmtBRL(minPrice)}</td>
                <td style={{ padding:'7px 10px', textAlign:'right', fontWeight:800, color:'#1d4ed8', fontVariantNumeric:'tabular-nums' }}>{fmtBRL(totalPrice)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ fontSize:'8px', color:'#94a3b8', marginBottom:'8px' }}>
            Fórmula Total: Horas c/ buffer ({fmt(totalHours)}h) × R$ {fmt(hourlyRate)}/h × fator {fmt(multiplierFactor)} (prazo ×{fmt(currentPrazoMult)} · complexidade ×{fmt(currentComplexMult)} · porte +{fmt(currentPorteMult * 100)}%) | Mínimo: {fmt(totalPERT)}h × R$ {fmt(hourlyRate)}/h (sem buffer, sem mult.)
          </div>
        </div>

        {/* Header */}
        <header className="flex flex-col gap-2 print:hidden">
          <button
            onClick={onNavigateDashboard}
            className="flex items-center gap-2 text-primary text-xs font-medium uppercase tracking-wider mb-1 cursor-pointer hover:underline text-left w-fit"
          >
            <Icon name="arrow_back" size={14} />
            <span>Voltar ao Dashboard</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
            {projectName} <span className="text-primary">— Precificação</span>
          </h1>
          <p className="text-sm text-on-surface-variant">
            Baseado nas horas estimadas (PERT + buffer) e nos multiplicadores de prazo, complexidade e tipo de cliente.
          </p>
        </header>

        {/* ── Hourly Rate Configurator ──────────────────────────────── */}
        <section className="bg-surface rounded-xl border border-surface-high/60 shadow-lg p-6 no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
                <Icon name="payments" size={18} className="text-primary" />
                Valor por Hora
              </div>
              <p className="text-xs text-on-surface-variant">
                Altere o valor/hora e todos os cálculos serão atualizados automaticamente.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-sm">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  onBlur={applyRate}
                  onKeyDown={(e) => e.key === 'Enter' && applyRate()}
                  className="pl-10 pr-4 py-3 bg-bg border-2 border-primary/50 focus:border-primary rounded-lg text-on-surface font-bold text-lg w-36 focus:outline-none focus:ring-0 text-right tabular-nums"
                  placeholder="40,00"
                />
              </div>
              <button
                onClick={applyRate}
                className="bg-primary text-white px-5 py-3 rounded-lg font-semibold text-sm hover:bg-primary-dim transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Icon name="calculate" size={18} />
                Calcular
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="mt-5 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-on-surface-variant font-medium">Presets comuns:</span>
            {[10, 20, 30, 40].map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRateInput(String(r));
                  setHourlyRate(r);
                  localStorage.setItem('pricing_hourly_rate', String(r));
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer ${
                  hourlyRate === r
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-high/30 text-on-surface-variant border-outline-variant/40 hover:bg-surface-high hover:text-on-surface'
                }`}
              >
                R$ {r}/h
              </button>
            ))}
            <span className="text-xs text-outline ml-2">ou insira um valor personalizado no campo acima</span>
          </div>
        </section>

        {/* ── Pricing Multipliers Configurator ──────────────────────── */}
        <section className="bg-surface rounded-xl border border-surface-high/60 shadow-lg p-6 no-print">
          <div className="flex items-center gap-2.5 mb-4 border-b border-surface-high/40 pb-3">
            <Icon name="tune" className="text-primary" size={22} />
            <div>
              <h2 className="text-base font-bold text-on-surface">Multiplicadores de Precificação</h2>
              <p className="text-xs text-on-surface-variant">Selecione o cenário do projeto e personalize os valores dos fatores se necessário.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Prazo */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="schedule" size={16} className="text-primary" />
                Prazo de Entrega
              </label>
              <select
                value={prazoSelect}
                onChange={(e) => updatePrazoSelect(e.target.value)}
                className="w-full p-2.5 bg-bg border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="normal">Normal (100% prazo)</option>
                <option value="reduzido">Reduzido (85% prazo)</option>
                <option value="muito">Muito Reduzido (70% prazo)</option>
                <option value="extremamente">Extremamente Reduzido (50% prazo)</option>
              </select>

              <div className="space-y-2 mt-1.5 p-3 bg-surface-high/15 rounded-lg text-xs border border-outline-variant/30">
                <span className="font-semibold text-on-surface-variant block mb-1">Ajustar Fatores (Prazo):</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['normal','reduzido','muito','extremamente'] as const).map((k) => (
                    <div key={k} className="flex flex-col gap-1">
                      <span className="text-[9px] text-outline uppercase font-medium">
                        {k === 'normal' ? 'Normal (100%)' : k === 'reduzido' ? 'Reduzido (85%)' : k === 'muito' ? 'Muito Red. (70%)' : 'Extr. Red. (50%)'}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={prazoInputs[k]}
                        onChange={(e) => setPrazoInputs(prev => ({ ...prev, [k]: e.target.value }))}
                        onBlur={() => applyPrazoMult(k, prazoInputs[k])}
                        onKeyDown={(e) => e.key === 'Enter' && applyPrazoMult(k, prazoInputs[k])}
                        className="p-1 px-2 bg-bg border border-outline-variant/60 rounded text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Complexidade */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="psychology" size={16} className="text-primary" />
                Complexidade
              </label>
              <select
                value={complexSelect}
                onChange={(e) => updateComplexSelect(e.target.value)}
                className="w-full p-2.5 bg-bg border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="normal">Normal</option>
                <option value="complexo">Complexo</option>
                <option value="muito">Muito complexo</option>
              </select>

              <div className="space-y-2 mt-1.5 p-3 bg-surface-high/15 rounded-lg text-xs border border-outline-variant/30">
                <span className="font-semibold text-on-surface-variant block mb-1">Ajustar Fatores (Complexidade):</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal','complexo','muito'] as const).map((k) => (
                    <div key={k} className="flex flex-col gap-1">
                      <span className="text-[9px] text-outline uppercase font-medium">
                        {k === 'normal' ? 'Normal' : k === 'complexo' ? 'Complexo' : 'Muito C.'}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={complexInputs[k]}
                        onChange={(e) => setComplexInputs(prev => ({ ...prev, [k]: e.target.value }))}
                        onBlur={() => applyComplexMult(k, complexInputs[k])}
                        onKeyDown={(e) => e.key === 'Enter' && applyComplexMult(k, complexInputs[k])}
                        className="p-1 px-2 bg-bg border border-outline-variant/60 rounded text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Porte do Cliente */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="business" size={16} className="text-primary" />
                Porte do Cliente
              </label>
              <select
                value={porteSelect}
                onChange={(e) => updatePorteSelect(e.target.value)}
                className="w-full p-2.5 bg-bg border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="pf">Pessoa Física</option>
                <option value="me">Microeempreendor</option>
                <option value="pequeno">Pequeno Porte</option>
                <option value="medio">Médio Porte</option>
                <option value="grande">Grande Porte</option>
              </select>

              <div className="space-y-2 mt-1.5 p-3 bg-surface-high/15 rounded-lg text-xs border border-outline-variant/30">
                <span className="font-semibold text-on-surface-variant block mb-1">Ajustar Fatores (Porte):</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['pf','me','pequeno','medio'] as const).map((k) => (
                    <div key={k} className="flex flex-col gap-1">
                      <span className="text-[9px] text-outline uppercase font-medium">
                        {k === 'pf' ? 'PF' : k === 'me' ? 'Micro' : k === 'pequeno' ? 'Pequeno' : 'Médio (+10%)'}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={porteInputs[k]}
                        onChange={(e) => setPorteInputs(prev => ({ ...prev, [k]: e.target.value }))}
                        onBlur={() => applyPorteMult(k, porteInputs[k])}
                        onKeyDown={(e) => e.key === 'Enter' && applyPorteMult(k, porteInputs[k])}
                        className="p-1 px-2 bg-bg border border-outline-variant/60 rounded text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[9px] text-outline uppercase font-medium">Grande (+20%)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={porteInputs.grande}
                      onChange={(e) => setPorteInputs(prev => ({ ...prev, grande: e.target.value }))}
                      onBlur={() => applyPorteMult('grande', porteInputs.grande)}
                      onKeyDown={(e) => e.key === 'Enter' && applyPorteMult('grande', porteInputs.grande)}
                      className="p-1 px-2 bg-bg border border-outline-variant/60 rounded text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Summary Cards ─────────────────────────────────────────── */}
        <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net hours */}
          <div className="bg-surface rounded-xl p-5 border border-surface-high/60 shadow-lg flex flex-col gap-2">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">Horas Líquidas</span>
            <span className="text-3xl font-bold text-on-surface tabular-nums">{fmt(totalPERT)}<span className="text-base text-on-surface-variant font-normal ml-1">h</span></span>
            <span className="text-xs text-outline">Σ PERT s/ buffer</span>
          </div>
          {/* Buffer — editable % */}
          <div className="bg-surface rounded-xl p-5 border border-primary/20 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">Buffer</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={bufferPct === 0 ? '' : bufferPct}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      onBufferChange(0);
                      return;
                    }
                    const v = parseInt(val, 10);
                    if (!isNaN(v)) onBufferChange(Math.max(0, Math.min(200, v)));
                  }}
                  className="w-12 text-center text-xs font-bold text-primary bg-primary-container border border-primary/30 rounded focus:outline-none focus:ring-1 focus:ring-primary py-0.5 tabular-nums"
                />
                <span className="text-xs text-primary font-bold">%</span>
              </div>
            </div>
            <span className="text-3xl font-bold text-primary tabular-nums">+{fmt(buffer)}<span className="text-base text-primary/60 font-normal ml-1">h</span></span>
            <span className="text-xs text-outline">Margem de segurança</span>
          </div>
          {/* Total hours */}
          <div className="bg-surface rounded-xl p-5 border border-surface-high/60 shadow-lg flex flex-col gap-2">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">Total de Horas</span>
            <span className="text-3xl font-bold text-on-surface tabular-nums">{fmt(totalHours)}<span className="text-base text-on-surface-variant font-normal ml-1">h</span></span>
            <span className="text-xs text-outline">Líquido + buffer</span>
          </div>
          {/* Value/hour */}
          <div className="bg-primary/10 rounded-xl p-5 border border-primary/30 shadow-lg flex flex-col gap-2">
            <span className="text-[10px] text-primary uppercase tracking-wider font-bold">Valor / Hora</span>
            <span className="text-3xl font-bold text-primary tabular-nums">{fmtBRL(hourlyRate)}</span>
            <span className="text-xs text-primary/60">Atualizado</span>
          </div>
        </div>

        {/* Price range hero */}
        <div className="no-print bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 shadow-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs text-primary uppercase tracking-widest font-bold mb-2">Faixa de Preço do Projeto</div>
            <div className="text-4xl sm:text-5xl font-bold text-on-surface tabular-nums">
              {fmtBRL(minPrice)}
            </div>
            <div className="text-on-surface-variant text-sm mt-1">Mínimo (sem buffer, sem multiplicadores)</div>
          </div>
          <div className="text-4xl text-on-surface-variant font-light hidden sm:block">—</div>
          <div className="text-right">
            <div className="text-xs text-primary uppercase tracking-widest font-bold mb-2">Valor Total Recomendado</div>
            <div className="text-4xl sm:text-5xl font-bold text-primary tabular-nums">
              {fmtBRL(totalPrice)}
            </div>
            <div className="text-primary/60 text-xs mt-1 block">
              Com buffer e multiplicadores ({fmt(totalHours)}h × {fmtBRL(hourlyRate)} × {fmt(multiplierFactor)})
            </div>
            <div className="text-[10px] text-primary/80 mt-1 font-semibold uppercase tracking-wider">
              Cenário: Prazo (x{fmt(currentPrazoMult)}) • Complexidade (x{fmt(currentComplexMult)}) • Cliente (+{fmt(currentPorteMult * 100)}%)
            </div>
          </div>
        </div>

        {/* ── Per-Module Breakdown ──────────────────────────────────── */}
        <section className="bg-surface rounded-xl border border-surface-high/60 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-high/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <Icon name="account_tree" size={18} className="text-primary" />
            </div>
            <div>
              <div className="font-bold text-on-surface text-sm">Detalhamento por Módulo</div>
              <div className="text-xs text-on-surface-variant">Custo de cada módulo e suas histórias</div>
            </div>
          </div>

          {modules.length === 0 && (
            <div className="p-10 text-center text-on-surface-variant">
              <Icon name="account_tree" size={40} className="opacity-20 mb-3" />
              <p>Nenhum módulo disponível.</p>
              <button onClick={onNavigateEditor} className="text-primary text-sm mt-2 hover:underline cursor-pointer">
                Criar módulos no Editor →
              </button>
            </div>
          )}

          {modules.map((mod, modIndex) => (
            <div key={mod.id} className="border-b border-surface-high/30 last:border-0">
              {/* Module row */}
              <div className="flex items-center justify-between px-6 py-4 bg-surface-high/10">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-primary-container text-primary flex items-center justify-center">
                    <Icon name={mod.icon || 'extension'} size={15} />
                  </div>
                  <span className="font-bold text-on-surface">{modIndex + 1}.0 {mod.title}</span>
                  <span className="text-xs text-on-surface-variant hidden sm:block">({fmt(mod.modTotal)}h c/ buffer)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <span className="font-semibold text-on-surface tabular-nums">{mod.modSP} SP</span>
                    <span>•</span>
                    <span className="tabular-nums">{fmt(mod.modHours)}h líquidas</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary text-base tabular-nums">{fmtBRL(mod.modPrice)}</span>
                    <span className="text-[10px] text-on-surface-variant tabular-nums">mín. {fmtBRL(mod.modMinPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Item rows */}
              {mod.items.map((item, itemIndex) => {
                const colors = SP_COLORS[item.sp] ?? SP_COLORS[13];
                const isEpicItem = item.sp >= 13;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-6 py-3 border-t border-surface-high/20 ${isEpicItem ? 'bg-rose-500/5' : 'hover:bg-surface-high/10'} transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-on-surface-variant tabular-nums w-8 shrink-0">{modIndex + 1}.{itemIndex + 1}</span>
                      <span className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold border shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
                        {item.sp}
                      </span>
                      <span className={`text-sm truncate ${isEpicItem ? 'text-rose-300' : 'text-on-surface'}`}>
                        {item.label}
                        {isEpicItem && <span className="ml-2 text-[10px] font-bold text-rose-400 uppercase">(Epic)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-on-surface-variant tabular-nums hidden sm:block">
                        {isEpicItem ? '—' : `${item.expected}h`}
                      </span>
                      {isEpicItem ? (
                        <span className="text-xs font-semibold text-rose-400">Quebrar HU</span>
                      ) : (
                        <div className="text-right">
                          <div className="text-xs text-on-surface-variant tabular-nums">{fmtBRL(item.itemMinPrice)} – {fmtBRL(item.itemMaxPrice)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {mod.items.length === 0 && (
                <div className="px-6 py-3 text-xs text-outline border-t border-surface-high/20">Nenhuma HU neste módulo.</div>
              )}
            </div>
          ))}
        </section>

        {/* ── Fibonacci Reference ───────────────────────────────────── */}
        <section className="bg-surface rounded-xl border border-surface-high/60 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-high/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <Icon name="table_chart" size={18} className="text-primary" />
            </div>
            <div>
              <div className="font-bold text-on-surface text-sm">Tabela de Referência (Valor/hora atual: {fmtBRL(hourlyRate)} c/ multiplicadores)</div>
              <div className="text-xs text-on-surface-variant">Faixas de preço com multiplicadores aplicados (fator atual: x{fmt(multiplierFactor)})</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-high/40">
                  <th className="text-left px-5 py-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">SP</th>
                  <th className="text-left px-5 py-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Esforço Médio</th>
                  <th className="text-left px-5 py-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Preço Mín.</th>
                  <th className="text-left px-5 py-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Preço Máx.</th>
                  <th className="text-left px-5 py-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium hidden sm:table-cell">Perfil</th>
                </tr>
              </thead>
              <tbody>
                {SP_TABLE.map((row, idx) => {
                  const colors = SP_COLORS[row.sp];
                  const dynMin = row.isEpic ? null : Math.round(row.effortMin * hourlyRate * multiplierFactor);
                  const dynMax = row.isEpic ? null : Math.round(row.effortMax * hourlyRate * multiplierFactor);
                  const effortDisplay = row.isEpic
                    ? <span className="text-rose-400">—</span>
                    : row.effortLabel
                      ? row.effortLabel
                      : row.effortMin === row.effortMax
                        ? `${row.effortMin}h`
                        : `${row.effortMin}h – ${row.effortMax}h`;
                  return (
                    <tr key={idx} className={`border-b border-surface-high/20 ${row.isEpic ? 'bg-rose-500/5' : 'hover:bg-surface-high/10'}`}>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {row.sp}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant tabular-nums">
                        {effortDisplay}
                      </td>
                      <td className="px-5 py-3 font-semibold text-on-surface tabular-nums">
                        {dynMin !== null ? fmtBRL(dynMin) : <span className="text-rose-400">N/A</span>}
                      </td>
                      <td className="px-5 py-3 font-semibold text-on-surface tabular-nums">
                        {dynMax !== null ? fmtBRL(dynMax) : <span className="text-rose-400">N/A</span>}
                      </td>
                      <td className={`px-5 py-3 text-xs hidden sm:table-cell ${row.isEpic ? 'text-rose-400 font-semibold' : 'text-on-surface-variant'}`}>
                        {row.profile}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ── Sticky Footer ───────────────────────────────────────────── */}
      <div className="no-print fixed bottom-0 left-0 md:left-72 right-0 bg-bg/95 backdrop-blur-md border-t border-surface-high/60 shadow-lg z-30 p-3 px-4 sm:p-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-4 sm:gap-8 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] text-outline uppercase tracking-wider font-medium">Horas Estimadas</span>
              <span className="text-lg sm:text-xl font-bold text-on-surface tabular-nums">
                {fmt(totalHours)} <span className="text-xs text-outline-variant font-normal">hrs</span>
              </span>
            </div>
            <div className="w-px h-10 bg-outline-variant/30" />
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] text-outline uppercase tracking-wider font-medium">Valor/Hora</span>
              <span className="text-lg sm:text-xl font-bold text-on-surface tabular-nums">
                {fmtBRL(hourlyRate)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] sm:text-xs text-primary uppercase tracking-wider font-bold">Total do Projeto</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary leading-none tabular-nums">
                {fmtBRL(totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
