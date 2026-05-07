import { useState } from 'react';
import Icon from './Icon';
import type { ProjectModule } from '../api';

interface PricingProps {
  projectName: string;
  data: ProjectModule[];
  onNavigateDashboard: () => void;
  onNavigateEditor: () => void;
}

// Fibonacci SP → effort range (hours)
const SP_TABLE: {
  sp: number;
  effortMin: number;
  effortMax: number;
  profile: string;
  isEpic?: boolean;
}[] = [
  { sp: 1,  effortMin: 2,  effortMax: 4,  profile: 'Pequenos ajustes, textos ou cores.' },
  { sp: 2,  effortMin: 6,  effortMax: 10, profile: 'Telas simples ou CRUDs básicos.' },
  { sp: 3,  effortMin: 12, effortMax: 18, profile: 'Lógica intermediária ou integrações simples.' },
  { sp: 5,  effortMin: 24, effortMax: 36, profile: 'Funcionalidades centrais ou regras complexas.' },
  { sp: 8,  effortMin: 40, effortMax: 60, profile: 'Módulos inteiros (ex: checkout, chat, busca).' },
  { sp: 13, effortMin: 0,  effortMax: 0,  profile: 'Epic: Deve ser quebrado em histórias menores.', isEpic: true },
];

const SP_COLORS: Record<number, { bg: string; text: string; border: string }> = {
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
  if (hours <= 0)  return 1;
  if (hours <= 4)  return 1;
  if (hours <= 10) return 2;
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
  projectName, data, onNavigateDashboard, onNavigateEditor,
}: PricingProps) {
  const [hourlyRate, setHourlyRate] = useState(40);
  const [rateInput, setRateInput] = useState('40');

  // Compute totals from PERT hours
  const totalPERT = data.reduce(
    (acc, mod) => acc + mod.items.reduce((s, i) => s + calculatePERT(i.pert.o, i.pert.m, i.pert.p), 0),
    0,
  );
  const buffer = Math.round(totalPERT * 0.35 * 10) / 10;
  const totalHours = Math.round((totalPERT + buffer) * 10) / 10;
  const totalPrice = Math.round(totalHours * hourlyRate * 100) / 100;
  const minPrice   = Math.round(totalPERT * hourlyRate * 100) / 100;

  // Per-module breakdown
  const modules = data.map((mod) => {
    const items = mod.items.map((item) => {
      const expected = calculatePERT(item.pert.o, item.pert.m, item.pert.p);
      const sp = hoursToSP(expected);
      const spRow = SP_TABLE.find(r => r.sp === sp) ?? SP_TABLE[0];
      const itemMinPrice = Math.round(expected * hourlyRate * 100) / 100;
      const itemMaxPrice = Math.round(expected * 1.35 * hourlyRate * 100) / 100;
      return { ...item, expected, sp, spRow, itemMinPrice, itemMaxPrice };
    });
    const modHours     = items.reduce((s, i) => s + i.expected, 0);
    const modBuf       = Math.round(modHours * 0.35 * 10) / 10;
    const modTotal     = Math.round((modHours + modBuf) * 10) / 10;
    const modPrice     = Math.round(modTotal * hourlyRate * 100) / 100;
    const modSP        = items.reduce((s, i) => s + i.sp, 0);
    return { ...mod, items, modHours, modBuf, modTotal, modPrice, modSP };
  });

  function applyRate() {
    const n = parseFloat(rateInput.replace(',', '.'));
    if (!isNaN(n) && n > 0) setHourlyRate(Math.round(n * 100) / 100);
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

        {/* Header */}
        <header className="flex flex-col gap-2">
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
            Baseado nas horas estimadas (PERT + buffer 35%) e no valor/hora configurável
          </p>
        </header>

        {/* ── Hourly Rate Configurator ──────────────────────────────── */}
        <section className="bg-surface rounded-xl border border-surface-high/60 shadow-lg p-6">
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
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="text-xs text-on-surface-variant mr-1 self-center">Presets:</span>
            {[40, 60, 80, 100, 120, 150].map((r) => (
              <button
                key={r}
                onClick={() => { setRateInput(String(r)); setHourlyRate(r); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  hourlyRate === r
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-high/30 text-on-surface-variant border-outline-variant/40 hover:bg-surface-high hover:text-on-surface'
                }`}
              >
                R$ {r}/h
              </button>
            ))}
          </div>
        </section>

        {/* ── Summary Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net hours */}
          <div className="bg-surface rounded-xl p-5 border border-surface-high/60 shadow-lg flex flex-col gap-2">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">Horas Líquidas</span>
            <span className="text-3xl font-bold text-on-surface tabular-nums">{fmt(totalPERT)}<span className="text-base text-on-surface-variant font-normal ml-1">h</span></span>
            <span className="text-xs text-outline">Σ PERT s/ buffer</span>
          </div>
          {/* Buffer */}
          <div className="bg-surface rounded-xl p-5 border border-surface-high/60 shadow-lg flex flex-col gap-2">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">Buffer (35%)</span>
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
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 shadow-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs text-primary uppercase tracking-widest font-bold mb-2">Faixa de Preço do Projeto</div>
            <div className="text-4xl sm:text-5xl font-bold text-on-surface tabular-nums">
              {fmtBRL(minPrice)}
            </div>
            <div className="text-on-surface-variant text-sm mt-1">Mínimo (sem buffer)</div>
          </div>
          <div className="text-4xl text-on-surface-variant font-light hidden sm:block">—</div>
          <div className="text-right">
            <div className="text-xs text-primary uppercase tracking-widest font-bold mb-2">Valor Total Recomendado</div>
            <div className="text-4xl sm:text-5xl font-bold text-primary tabular-nums">
              {fmtBRL(totalPrice)}
            </div>
            <div className="text-primary/60 text-sm mt-1">Com buffer de 35% ({fmt(totalHours)}h × {fmtBRL(hourlyRate)})</div>
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
                  <span className="font-bold text-primary text-base tabular-nums">{fmtBRL(mod.modPrice)}</span>
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
              <div className="font-bold text-on-surface text-sm">Tabela de Referência (Valor/hora atual: {fmtBRL(hourlyRate)})</div>
              <div className="text-xs text-on-surface-variant">Faixas de preço calculadas com base no valor/hora configurado</div>
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
                {SP_TABLE.map((row) => {
                  const colors = SP_COLORS[row.sp];
                  const dynMin = row.isEpic ? null : Math.round(row.effortMin * hourlyRate);
                  const dynMax = row.isEpic ? null : Math.round(row.effortMax * hourlyRate);
                  return (
                    <tr key={row.sp} className={`border-b border-surface-high/20 ${row.isEpic ? 'bg-rose-500/5' : 'hover:bg-surface-high/10'}`}>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {row.sp}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant tabular-nums">
                        {row.isEpic ? <span className="text-rose-400">—</span> : `${row.effortMin}h – ${row.effortMax}h`}
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
