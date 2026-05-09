import { useState } from 'react';
import Icon from './Icon';
import type { ProjectModule } from '../api';

interface EditorProps {
  projectName: string;
  data: ProjectModule[];
  saving: boolean;
  saveMsg: string;
  bufferPct: number;
  onBufferChange: (v: number) => void;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  onAddModule: () => void;
  onRemoveModule: (mId: string) => void;
  onUpdateModuleTitle: (mId: string, title: string) => void;
  onUpdateModuleIcon: (mId: string, icon: string) => void;
  onAddItem: (mId: string) => void;
  onRemoveItem: (mId: string, iId: string) => void;
  onUpdateItem: (mId: string, iId: string, field: string, value: string) => void;
  onNavigateReview: () => void;
  onNavigateDashboard: () => void;
  onExportCSV: () => void;
  onCopyJSON: () => void;
  isExporting: boolean;
}

/**
 * Hour options derived from the Fibonacci SP table:
 * SP 1 → 0,5–4h | SP 2 → 5–10h | SP 3 → 12–18h
 * SP 5 → 24–36h | SP 8 → 40–60h | SP 13+ → >60h (Epic)
 */
const HOUR_OPTIONS: { value: number; label: string; sp: number; epic?: boolean }[] = [
  { value: 0,    label: '—',               sp: 0 },
  // SP 1 — 30 min, 1h e 2–4h
  { value: 0.5,  label: '30min · SP 1',    sp: 1 },
  { value: 1,    label: '1h   · SP 1',     sp: 1 },
  { value: 2,    label: '2h   · SP 1',     sp: 1 },
  { value: 3,    label: '3h   · SP 1',     sp: 1 },
  { value: 4,    label: '4h   · SP 1',     sp: 1 },
  // SP 2 — todas as horas de 5h a 10h
  { value: 5,    label: '5h   · SP 2',     sp: 2 },
  { value: 6,    label: '6h   · SP 2',     sp: 2 },
  { value: 7,    label: '7h   · SP 2',     sp: 2 },
  { value: 8,    label: '8h   · SP 2',     sp: 2 },
  { value: 9,    label: '9h   · SP 2',     sp: 2 },
  { value: 10,   label: '10h  · SP 2',     sp: 2 },
  // SP 3
  { value: 12,   label: '12h  · SP 3',     sp: 3 },
  { value: 15,   label: '15h  · SP 3',     sp: 3 },
  { value: 18,   label: '18h  · SP 3',     sp: 3 },
  // SP 5
  { value: 24,   label: '24h  · SP 5',     sp: 5 },
  { value: 30,   label: '30h  · SP 5',     sp: 5 },
  { value: 36,   label: '36h  · SP 5',     sp: 5 },
  // SP 8
  { value: 40,   label: '40h  · SP 8',     sp: 8 },
  { value: 48,   label: '48h  · SP 8',     sp: 8 },
  { value: 60,   label: '60h  · SP 8',     sp: 8 },
  // Epic (SP 13+)
  { value: 80,   label: '80h  · Epic ⚠',  sp: 13, epic: true },
];

/** Maps a PERT expected-hours value to its Fibonacci Story Point */
export function hoursToSP(hours: number): number {
  if (hours <= 0)  return 0;
  if (hours <= 4)  return 1;   // 0,5h · 1h · 2h · 3h · 4h → SP 1
  if (hours <= 10) return 2;   // 5h … 10h → SP 2
  if (hours <= 18) return 3;   // 12h … 18h → SP 3
  if (hours <= 36) return 5;   // 24h … 36h → SP 5
  if (hours <= 60) return 8;   // 40h … 60h → SP 8
  return 13;                   // > 60h → Epic
}

const calculatePERT = (o: number, m: number, p: number): number => {
  const res = (Number(o) + 4 * Number(m) + Number(p)) / 6;
  if (isNaN(res)) return 0;
  // Round to 1 decimal to avoid floating-point artefacts (e.g. 1.6666...)
  return Math.round(res * 10) / 10;
};

/** Format a number ensuring no trailing floating-point noise */
const fmt = (n: number): string => {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const moduleIcons = [
  'lock', 'database', 'api', 'web', 'palette', 'payments', 'cloud', 'analytics',
  'settings', 'notifications', 'extension', 'public', 'account_circle', 'shopping_cart',
  'build', 'verified', 'support_agent', 'view_kanban', 'schedule', 'campaign',
];

// ─── Hour Select Component ─────────────────────────────────────────────────────
interface HourSelectProps {
  label: string;
  value: number;
  isPrimary?: boolean;
  onChange: (v: string) => void;
}

function HourSelect({ label, value, isPrimary = false, onChange }: HourSelectProps) {
  const selected = HOUR_OPTIONS.find(o => o.value === value);
  const isEpic = selected?.epic ?? false;

  return (
    <div className="relative w-[110px]">
      <label
        className={`absolute -top-2 left-2 px-1 text-[10px] z-10 font-bold ${
          isEpic ? 'text-rose-400 bg-surface' :
          isPrimary ? 'text-primary bg-surface' : 'text-outline bg-surface'
        }`}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-10 rounded text-on-surface text-center text-[12px] font-semibold
          focus:outline-none focus:ring-1 bg-surface appearance-none cursor-pointer
          ${
            isEpic
              ? 'border-rose-500 border-2 focus:ring-rose-400 text-rose-400'
              : isPrimary
                ? 'border-primary border-2 focus:ring-primary'
                : 'border-outline-variant border focus:ring-primary'
          }`}
      >
        {HOUR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* custom chevron icon */}
      <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-outline-variant">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 8L1 3h10L6 8z" />
        </svg>
      </span>
    </div>
  );
}

// ─── Main Editor ───────────────────────────────────────────────────────────────
export default function Editor({
  projectName, data, saving, saveMsg, bufferPct, onBufferChange,
  onProjectNameChange, onSave, onAddModule, onRemoveModule,
  onUpdateModuleTitle, onUpdateModuleIcon, onAddItem, onRemoveItem, onUpdateItem,
  onNavigateReview, onNavigateDashboard, onExportCSV, onCopyJSON, isExporting,
}: EditorProps) {
  const [openIconSelector, setOpenIconSelector] = useState<string | null>(null);

  const totalHours = data.reduce(
    (acc, mod) => acc + mod.items.reduce((sum, item) => sum + calculatePERT(item.pert.o, item.pert.m, item.pert.p), 0),
    0,
  );
  const pct = Math.max(0, Math.min(200, bufferPct)) / 100;
  const bufferHours = Math.round(totalHours * pct * 10) / 10;
  const finalHours  = Math.round((totalHours + bufferHours) * 10) / 10;

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-28">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 md:left-72 right-0 h-16 z-40 flex justify-between items-center px-8 bg-bg/80 backdrop-blur-md border-b border-outline-variant shadow-sm no-print">
        <div className="flex items-center gap-6">
          <span className="text-lg font-black tracking-tighter text-primary md:hidden">EAP Architect</span>
          <div className="hidden md:flex space-x-1 h-16 items-center">
            <button className="text-primary border-b-2 border-primary pb-0.5 font-semibold h-full flex items-center px-3 text-sm cursor-pointer">Editor</button>
            <button onClick={onNavigateReview} className="text-on-surface-variant font-medium hover:text-primary h-full flex items-center px-3 text-sm transition-colors cursor-pointer">Revisão</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCopyJSON} className="p-2 hover:bg-surface rounded-full transition-all cursor-pointer text-on-surface-variant hover:text-primary" title="Copiar JSON">
            <Icon name={isExporting ? 'check' : 'data_object'} size={20} />
          </button>
          <button onClick={onExportCSV} className="p-2 hover:bg-surface rounded-full transition-all cursor-pointer text-on-surface-variant hover:text-primary" title="Exportar CSV">
            <Icon name="download" size={20} />
          </button>
          <button onClick={() => window.print()} className="p-2 hover:bg-surface rounded-full transition-all cursor-pointer text-on-surface-variant hover:text-primary" title="Imprimir">
            <Icon name="print" size={20} />
          </button>
          <div className="w-px h-6 bg-outline-variant/30 mx-1" />
          <button onClick={onSave} className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dim transition-all text-sm shadow-sm cursor-pointer flex items-center gap-1.5">
            <Icon name="save" size={18} />
            {saving ? 'Salvando...' : saveMsg || 'Salvar'}
          </button>
        </div>
      </nav>

      {/* Content */}
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
          <div className="flex items-center justify-between gap-4">
            <input
              className="flex-1 min-w-0 bg-transparent text-2xl sm:text-4xl font-bold text-on-surface border-none p-0 focus:outline-none focus:ring-0 placeholder-outline-variant tracking-tight"
              placeholder="Título do Projeto..."
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
            />
            {saveMsg && (
              <span className="px-3 py-1 bg-surface-high/50 text-primary rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-success block" />
                {saveMsg}
              </span>
            )}
          </div>
        </header>

        {/* Planning Poker legend — SP reference */}
        <div className="no-print bg-surface rounded-xl border border-surface-high/60 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Referência Story Points (Fibonacci)</span>
            <span className="text-[10px] text-outline">— selecione as horas nos campos O/M/P</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px]">
            {[
              { sp: 1,  hours: '30min–4h', label: 'Trivial',   color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
              { sp: 2,  hours: '5–10h',    label: 'Pequeno',   color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' },
              { sp: 3,  hours: '12–18h',   label: 'Médio',     color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
              { sp: 5,  hours: '24–36h',   label: 'Complexo',  color: 'text-violet-400 border-violet-500/30 bg-violet-500/10' },
              { sp: 8,  hours: '40–60h',   label: 'Módulo',    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
              { sp: 13, hours: '>60h',     label: 'Epic ⚠',   color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
            ].map(({ sp, hours, label, color }) => (
              <div key={sp} className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${color}`}>
                <span className="font-bold text-base">{sp}</span>
                <span className="font-mono text-[10px] opacity-80">{hours}</span>
                <span className="text-[10px] opacity-70">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modules */}
        {data.map((mod, modIndex) => {
          const modTotal   = mod.items.reduce((s, i) => s + calculatePERT(i.pert.o, i.pert.m, i.pert.p), 0);
          const modSumO    = mod.items.reduce((s, i) => s + Number(i.pert.o), 0);
          const modSumM    = mod.items.reduce((s, i) => s + Number(i.pert.m), 0);
          const modSumP    = mod.items.reduce((s, i) => s + Number(i.pert.p), 0);
          const iconName   = mod.icon || moduleIcons[modIndex % moduleIcons.length];

          return (
            <section key={mod.id} className="print-break bg-surface rounded-xl shadow-lg border border-surface-high/60 overflow-hidden relative">
              {/* Module Header */}
              <div className="bg-surface-high/30 px-6 py-4 border-b border-surface-high/60 flex justify-between items-center relative">
                <div className="flex items-center gap-3 relative">
                  <button
                    onClick={() => setOpenIconSelector(openIconSelector === mod.id ? null : mod.id)}
                    className="w-8 h-8 rounded bg-primary-container text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    title="Mudar Ícone"
                  >
                    <Icon name={iconName} size={18} />
                  </button>

                  {/* Icon Selector Popover */}
                  {openIconSelector === mod.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenIconSelector(null)} />
                      <div className="absolute top-10 left-0 z-50 bg-surface border border-outline-variant shadow-2xl rounded-xl p-3 w-64 grid grid-cols-5 gap-2">
                        {moduleIcons.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => {
                              onUpdateModuleIcon(mod.id, icon);
                              setOpenIconSelector(null);
                            }}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                              iconName === icon ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-high hover:text-primary'
                            }`}
                          >
                            <Icon name={icon} size={20} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <span className="text-lg font-bold text-on-surface-variant tabular-nums ml-2">
                    {modIndex + 1}.0
                  </span>

                  <input
                    className="bg-transparent text-lg font-semibold text-on-surface border-none p-0 focus:outline-none focus:ring-0 w-full ml-1"
                    value={mod.title}
                    onChange={(e) => onUpdateModuleTitle(mod.id, e.target.value)}
                  />
                </div>
                <button
                  onClick={() => onRemoveModule(mod.id)}
                  className="text-outline-variant hover:text-error transition-colors cursor-pointer no-print p-2 hover:bg-surface-high/50 rounded-lg"
                  title="Excluir Módulo"
                >
                  <Icon name="delete" size={20} />
                </button>
              </div>

              {/* Column Headers */}
              <div className="p-6 pb-2">
                {mod.items.length > 0 && (
                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-6 mb-3 px-4 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">
                    <div>Descrição da Funcionalidade</div>
                    <div className="w-[344px] text-center">
                      Horas O / M / P &nbsp;→&nbsp; Story Points
                    </div>
                    <div className="w-[80px] text-right">PERT (h)</div>
                  </div>
                )}

                {/* Task Rows */}
                <div className="space-y-1">
                  {mod.items.map((item, itemIndex) => {
                    const expected = calculatePERT(item.pert.o, item.pert.m, item.pert.p);
                    return (
                      <div
                        key={item.id}
                        className="group flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-6 items-start sm:items-center px-4 py-3 hover:bg-surface-high/20 transition-colors rounded-lg border border-transparent hover:border-surface-high/40"
                      >
                        {/* Task name */}
                        <div className="flex items-center gap-3 w-full">
                          <Icon name="drag_indicator" className="text-outline-variant/50 cursor-grab no-print shrink-0" size={16} />
                          <span className="text-sm font-bold text-on-surface-variant tabular-nums min-w-[28px] shrink-0">
                            {modIndex + 1}.{itemIndex + 1}
                          </span>
                          <input
                            className="flex-1 min-w-0 bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-on-surface text-sm"
                            type="text"
                            value={item.label}
                            onChange={(e) => onUpdateItem(mod.id, item.id, 'label', e.target.value)}
                          />
                        </div>

                        {/* Hour selects for O/M/P — values map to SP under the hood */}
                        <div className="w-full sm:w-[344px] flex gap-3 justify-start sm:justify-center no-print pl-9 sm:pl-0">
                          <HourSelect
                            label="O (Otimista)"
                            value={item.pert.o}
                            onChange={(v) => onUpdateItem(mod.id, item.id, 'pert.o', v)}
                          />
                          <HourSelect
                            label="M (Nominal)"
                            value={item.pert.m}
                            isPrimary
                            onChange={(v) => onUpdateItem(mod.id, item.id, 'pert.m', v)}
                          />
                          <HourSelect
                            label="P (Pessimista)"
                            value={item.pert.p}
                            onChange={(v) => onUpdateItem(mod.id, item.id, 'pert.p', v)}
                          />
                        </div>

                        {/* Expected value */}
                        <div className="w-full sm:w-[80px] flex justify-start sm:justify-end items-center gap-2 pl-9 sm:pl-0">
                          <span className="text-sm font-semibold text-on-surface bg-surface-high/50 px-3 py-1 rounded tabular-nums">
                            {fmt(expected)}
                          </span>
                          <button
                            onClick={() => onRemoveItem(mod.id, item.id)}
                            className="text-outline-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all cursor-pointer no-print"
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Task */}
                <button
                  onClick={() => onAddItem(mod.id)}
                  className="mt-3 ml-8 flex items-center gap-2 text-primary text-sm font-medium hover:underline cursor-pointer no-print"
                >
                  <Icon name="add" size={18} />
                  Adicionar Funcionalidade
                </button>
              </div>

              {/* Module Footer — O/M/P sums + subtotal */}
              {mod.items.length > 0 && (
                <div className="bg-surface-high/20 border-t border-surface-high/40 px-6 py-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Sum of O, M, P columns */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-on-surface-variant no-print">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium uppercase tracking-wider">Σ O:</span>
                        <span className="font-bold text-on-surface tabular-nums bg-surface px-2 py-0.5 rounded border border-outline-variant/40">
                          {modSumO}h
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium uppercase tracking-wider text-primary">Σ M:</span>
                        <span className="font-bold text-primary tabular-nums bg-primary-container px-2 py-0.5 rounded border border-primary/30">
                          {modSumM}h
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium uppercase tracking-wider">Σ P:</span>
                        <span className="font-bold text-on-surface tabular-nums bg-surface px-2 py-0.5 rounded border border-outline-variant/40">
                          {modSumP}h
                        </span>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-on-surface-variant">Subtotal do Módulo:</span>
                      <span className="text-on-surface font-bold tabular-nums">{fmt(modTotal)} hrs</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty module footer (no items) */}
              {mod.items.length === 0 && (
                <div className="bg-surface-high/20 border-t border-surface-high/40 px-6 py-3 flex justify-end">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-on-surface-variant">Subtotal do Módulo:</span>
                    <span className="text-on-surface font-bold tabular-nums">0 hrs</span>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* Add Module */}
        <button
          onClick={onAddModule}
          className="no-print flex justify-center border-2 border-dashed border-outline-variant/50 rounded-xl p-8 hover:bg-surface/50 hover:border-primary transition-all cursor-pointer group"
        >
          <div className="flex flex-col items-center gap-2 text-outline group-hover:text-primary transition-colors">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center group-hover:bg-primary-container group-hover:text-primary transition-colors">
              <Icon name="add_circle" size={24} />
            </div>
            <span className="text-lg font-semibold">Adicionar Novo Módulo</span>
          </div>
        </button>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="no-print fixed bottom-0 left-0 md:left-72 right-0 bg-bg/95 backdrop-blur-md border-t border-surface-high/60 shadow-lg z-30 p-3 px-4 sm:p-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-4 sm:gap-8 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] text-outline uppercase tracking-wider font-medium">Total Líquido</span>
              <span className="text-lg sm:text-xl font-bold text-on-surface tabular-nums">
                {fmt(totalHours)} <span className="text-xs text-outline-variant font-normal">hrs</span>
              </span>
            </div>
            <div className="w-px h-10 bg-outline-variant/30" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] text-outline uppercase tracking-wider font-medium">Buffer</span>
              </div>
              {/* Inline editable buffer % */}
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl font-bold text-primary tabular-nums">+{fmt(bufferHours)}</span>
                <span className="text-xs text-primary/60 font-normal">hrs</span>
                <span className="text-primary/40 mx-1 text-sm">/</span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={bufferPct}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) onBufferChange(Math.max(0, Math.min(200, v)));
                    }}
                    className="w-12 text-center text-sm font-bold text-primary bg-primary-container border border-primary/30 rounded focus:outline-none focus:ring-1 focus:ring-primary py-0.5 tabular-nums"
                  />
                  <span className="text-xs text-primary font-bold ml-0.5">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] sm:text-xs text-primary uppercase tracking-wider font-bold">Total Estimado</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary leading-none tabular-nums">
                {fmt(finalHours)} <span className="text-sm sm:text-base text-primary/60 font-normal">hrs</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
