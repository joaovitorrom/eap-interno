import Icon from './Icon';
import type { ProjectModule } from '../api';

interface PlanningPokerProps {
  projectName: string;
  data: ProjectModule[];
  onNavigateDashboard: () => void;
  onNavigateEditor: () => void;
}

// Table mapping SP → effort + price (at base R$40/h)
const SP_TABLE: { sp: number; effortMin: number; effortMax: number; priceMin: number; priceMax: number; profile: string; isEpic?: boolean }[] = [
  { sp: 1,  effortMin: 2,  effortMax: 4,  priceMin: 80,   priceMax: 160,  profile: 'Pequenos ajustes, textos ou cores.' },
  { sp: 2,  effortMin: 6,  effortMax: 10, priceMin: 240,  priceMax: 400,  profile: 'Telas simples ou CRUDs básicos.' },
  { sp: 3,  effortMin: 12, effortMax: 18, priceMin: 480,  priceMax: 720,  profile: 'Lógica intermediária ou integrações simples.' },
  { sp: 5,  effortMin: 24, effortMax: 36, priceMin: 960,  priceMax: 1440, profile: 'Funcionalidades centrais ou regras complexas.' },
  { sp: 8,  effortMin: 40, effortMax: 60, priceMin: 1600, priceMax: 2400, profile: 'Módulos inteiros (ex: checkout, chat, busca).' },
  { sp: 13, effortMin: 0,  effortMax: 0,  priceMin: 0,    priceMax: 0,    profile: 'Epic: Deve ser quebrado em histórias menores.', isEpic: true },
];

const SP_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  2:  { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/30' },
  3:  { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/30' },
  5:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/30' },
  8:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  13: { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/30' },
};

/** Derive a Story Point value from PERT expected hours */
function hoursToSP(hours: number): number {
  if (hours <= 0)  return 1;
  if (hours <= 4)  return 1;
  if (hours <= 10) return 2;
  if (hours <= 18) return 3;
  if (hours <= 36) return 5;
  if (hours <= 60) return 8;
  return 13;
}

const calculatePERT = (o: number, m: number, p: number): number => {
  const res = (Number(o) + 4 * Number(m) + Number(p)) / 6;
  return isNaN(res) ? 0 : Math.round(res * 10) / 10;
};

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PlanningPoker({
  projectName, data, onNavigateDashboard, onNavigateEditor,
}: PlanningPokerProps) {
  // Build per-item SP and per-module totals
  const modules = data.map((mod) => {
    const items = mod.items.map((item) => {
      const expected = calculatePERT(item.pert.o, item.pert.m, item.pert.p);
      const sp = hoursToSP(expected);
      return { ...item, expected, sp };
    });
    const totalSP = items.reduce((s, i) => s + i.sp, 0);
    return { ...mod, items, totalSP };
  });

  const grandTotalSP = modules.reduce((s, m) => s + m.totalSP, 0);
  const epicItems = modules.flatMap((m) => m.items.filter((i) => i.sp >= 13));

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-32">
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
              Planning Poker
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
            {projectName} <span className="text-primary">— Planning Poker</span>
          </h1>
          <p className="text-sm text-on-surface-variant">
            Story Points derivados das estimativas PERT (Fibonacci: 1, 2, 3, 5, 8, 13+)
          </p>
        </header>

        {/* Fibonacci Reference Table */}
        <section className="bg-surface rounded-xl border border-surface-high/60 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-high/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <Icon name="table_chart" size={18} className="text-primary" />
            </div>
            <div>
              <div className="font-bold text-on-surface text-sm">Tabela de Referência Fibonacci</div>
              <div className="text-xs text-on-surface-variant">Valor hora base: R$ 40,00</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-high/40">
                  <th className="text-left px-4 py-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">SP</th>
                  <th className="text-left px-4 py-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Esforço Estimado</th>
                  <th className="text-left px-4 py-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Faixa de Preço (R$40/h)</th>
                  <th className="text-left px-4 py-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Perfil da Tarefa</th>
                </tr>
              </thead>
              <tbody>
                {SP_TABLE.map((row) => {
                  const colors = SP_COLORS[row.sp];
                  return (
                    <tr key={row.sp} className={`border-b border-surface-high/20 ${row.isEpic ? 'bg-rose-500/5' : 'hover:bg-surface-high/10'}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-base border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {row.sp}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant tabular-nums">
                        {row.isEpic ? <span className="text-rose-400 font-semibold">—</span> : `${row.effortMin}h – ${row.effortMax}h`}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant tabular-nums">
                        {row.isEpic ? <span className="text-rose-400 font-semibold">N/A</span> : `${fmtBRL(row.priceMin)} – ${fmtBRL(row.priceMax)}`}
                      </td>
                      <td className={`px-4 py-3 text-sm ${row.isEpic ? 'text-rose-400 font-semibold' : 'text-on-surface'}`}>
                        {row.profile}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Epic Warning */}
        {epicItems.length > 0 && (
          <div className="flex items-start gap-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
              <Icon name="warning" size={22} className="text-rose-400" />
            </div>
            <div>
              <div className="font-bold text-rose-400 mb-1">
                {epicItems.length} História{epicItems.length > 1 ? 's' : ''} classificada{epicItems.length > 1 ? 's' : ''} como Epic (≥ 13 SP)
              </div>
              <p className="text-sm text-on-surface-variant">
                As histórias abaixo devem ser quebradas em histórias menores antes de entrarem no sprint.
              </p>
              <ul className="mt-3 space-y-1">
                {epicItems.map((item) => (
                  <li key={item.id} className="text-sm text-rose-300 flex items-center gap-2">
                    <Icon name="subdirectory_arrow_right" size={14} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Modules */}
        {modules.map((mod, modIndex) => {
          const isEpicModule = mod.totalSP >= 13;
          return (
            <section key={mod.id} className="bg-surface rounded-xl shadow-lg border border-surface-high/60 overflow-hidden">
              {/* Module Header */}
              <div className="bg-surface-high/30 px-6 py-4 border-b border-surface-high/60 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-container text-primary flex items-center justify-center">
                    <Icon name={mod.icon || 'extension'} size={18} />
                  </div>
                  <span className="text-sm font-bold text-on-surface-variant tabular-nums">{modIndex + 1}.0</span>
                  <span className="text-lg font-bold text-on-surface">{mod.title}</span>
                </div>
                {/* Module SP total */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant hidden sm:block">Total do módulo:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm border ${
                    isEpicModule
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-primary-container text-primary border-primary/20'
                  }`}>
                    <Icon name="poker_chip" size={15} />
                    {mod.totalSP} SP
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 sm:p-6 space-y-2">
                {mod.items.length === 0 && (
                  <p className="text-sm text-outline text-center py-4">Nenhuma HU neste módulo.</p>
                )}
                {mod.items.map((item, itemIndex) => {
                  const colors = SP_COLORS[item.sp] ?? SP_COLORS[13];
                  const isEpicItem = item.sp >= 13;
                  const spRow = SP_TABLE.find(r => r.sp === item.sp);
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-colors ${
                        isEpicItem
                          ? 'bg-rose-500/5 border-rose-500/20'
                          : 'bg-surface-high/10 border-surface-high/30 hover:bg-surface-high/20'
                      }`}
                    >
                      {/* Label */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-on-surface-variant tabular-nums shrink-0">
                          {modIndex + 1}.{itemIndex + 1}
                        </span>
                        <span className="text-sm text-on-surface truncate">{item.label}</span>
                        {isEpicItem && (
                          <span className="shrink-0 text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30 uppercase tracking-wide">
                            Epic
                          </span>
                        )}
                      </div>

                      {/* Right: hours + SP card */}
                      <div className="flex items-center gap-3 shrink-0 pl-6 sm:pl-0">
                        <span className="text-xs text-on-surface-variant tabular-nums hidden sm:block">
                          {item.expected > 0 ? `${item.expected}h PERT` : '—'}
                        </span>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-base ${colors.bg} ${colors.text} ${colors.border}`}>
                          <Icon name="style" size={16} />
                          {item.sp} SP
                        </div>
                        {/* Effort/price tooltip chip */}
                        {!isEpicItem && spRow && (
                          <span className="hidden sm:block text-[10px] text-on-surface-variant bg-surface-high/50 px-2 py-1 rounded border border-outline-variant/30">
                            {spRow.effortMin}–{spRow.effortMax}h
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant gap-4">
            <Icon name="style" size={48} className="opacity-20" />
            <p className="text-lg font-medium">Nenhum módulo no projeto.</p>
            <button onClick={onNavigateEditor} className="text-primary text-sm hover:underline cursor-pointer">
              Adicionar módulos no Editor →
            </button>
          </div>
        )}
      </main>

      {/* ── Sticky Footer ───────────────────────────────────────────── */}
      <div className="no-print fixed bottom-0 left-0 md:left-72 right-0 bg-bg/95 backdrop-blur-md border-t border-surface-high/60 shadow-lg z-30 p-3 px-4 sm:p-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-4 sm:gap-8 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] text-outline uppercase tracking-wider font-medium">HUs Mapeadas</span>
              <span className="text-lg sm:text-xl font-bold text-on-surface tabular-nums">
                {data.reduce((s, m) => s + m.items.length, 0)} <span className="text-xs text-outline-variant font-normal">itens</span>
              </span>
            </div>
            <div className="w-px h-10 bg-outline-variant/30" />
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] text-outline uppercase tracking-wider font-medium">Módulos</span>
              <span className="text-lg sm:text-xl font-bold text-on-surface tabular-nums">
                {data.length} <span className="text-xs text-outline-variant font-normal">módulos</span>
              </span>
            </div>
            {epicItems.length > 0 && (
              <>
                <div className="w-px h-10 bg-outline-variant/30" />
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] text-rose-400 uppercase tracking-wider font-medium">Epics (quebrar)</span>
                  <span className="text-lg sm:text-xl font-bold text-rose-400 tabular-nums">
                    {epicItems.length} <span className="text-xs text-rose-400/60 font-normal">itens</span>
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] sm:text-xs text-primary uppercase tracking-wider font-bold">Total Story Points</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary leading-none tabular-nums">
                {grandTotalSP} <span className="text-sm sm:text-base text-primary/60 font-normal">SP</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
