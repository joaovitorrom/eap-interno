import Icon from './Icon';
import type { ProjectModule } from '../api';

interface ReviewProps {
  projectName: string;
  data: ProjectModule[];
  onNavigateEditor: () => void;
  onExportCSV: () => void;
  onCopyJSON: () => void;
  isExporting: boolean;
}

const calculatePERT = (o: number, m: number, p: number): number => {
  const res = (Number(o) + 4 * Number(m) + Number(p)) / 6;
  if (isNaN(res)) return 0;
  return Math.round(res * 10) / 10;
};

/** Format a number with exactly 1 decimal when needed, no trailing noise */
const fmt = (n: number): string => {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const calculateVariance = (o: number, p: number) => {
  const v = Math.pow((Number(p) - Number(o)) / 6, 2);
  return isNaN(v) ? 0 : Math.round(v * 100) / 100;
};

export default function Review({ projectName, data, onNavigateEditor, onExportCSV, onCopyJSON, isExporting }: ReviewProps) {
  // Flatten data for WBS table
  type WBSRow = { isModule: boolean; wbsId: string; label: string; o: number; m: number; p: number; expected: number; variance: number };
  const rows: WBSRow[] = [];

  data.forEach((mod, mi) => {
    const modExpected = mod.items.reduce((s, i) => s + calculatePERT(i.pert.o, i.pert.m, i.pert.p), 0);
    const modVariance = mod.items.reduce((s, i) => s + calculateVariance(i.pert.o, i.pert.p), 0);
    rows.push({ isModule: true, wbsId: `${mi + 1}.0`, label: mod.title, o: 0, m: 0, p: 0, expected: Math.round(modExpected * 10) / 10, variance: Math.round(modVariance * 100) / 100 });
    mod.items.forEach((item, ii) => {
      rows.push({
        isModule: false,
        wbsId: `${mi + 1}.${ii + 1}`,
        label: item.label,
        o: item.pert.o,
        m: item.pert.m,
        p: item.pert.p,
        expected: calculatePERT(item.pert.o, item.pert.m, item.pert.p),
        variance: calculateVariance(item.pert.o, item.pert.p),
      });
    });
  });

  const totalExpected = rows.filter(r => !r.isModule).reduce((s, r) => s + r.expected, 0);
  const totalVariance = rows.filter(r => !r.isModule).reduce((s, r) => s + r.variance, 0);
  const stdDev = Math.round(Math.sqrt(totalVariance) * 100) / 100;
  const bufferHours = Math.round(totalExpected * 0.35 * 10) / 10;
  const finalHours = Math.round((totalExpected + bufferHours) * 10) / 10;

  // 95% confidence interval
  const lower95 = Math.round((totalExpected - 1.96 * stdDev) * 10) / 10;
  const upper95 = Math.round((totalExpected + 1.96 * stdDev) * 10) / 10;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 md:left-72 right-0 h-16 z-40 flex justify-between items-center px-8 bg-bg/80 backdrop-blur-md border-b border-outline-variant shadow-sm no-print">
        <div className="flex items-center gap-6">
          <span className="text-lg font-black tracking-tighter text-primary md:hidden">EAP Architect</span>
          <div className="hidden md:flex space-x-1 h-16 items-center">
            <button onClick={onNavigateEditor} className="text-on-surface-variant font-medium hover:text-primary h-full flex items-center px-3 text-sm transition-colors cursor-pointer">Editor</button>
            <button className="text-primary border-b-2 border-primary pb-0.5 font-semibold h-full flex items-center px-3 text-sm cursor-pointer">Revisão</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onExportCSV} className="flex items-center gap-1.5 bg-surface text-on-surface-variant px-3 py-2 rounded-lg text-xs font-medium hover:bg-surface-high transition-all border border-outline-variant/50 cursor-pointer">
            <Icon name="download" size={16} />
            Download CSV
          </button>
          <button onClick={onCopyJSON} className="flex items-center gap-1.5 bg-surface text-on-surface-variant px-3 py-2 rounded-lg text-xs font-medium hover:bg-surface-high transition-all border border-outline-variant/50 cursor-pointer">
            <Icon name={isExporting ? 'check' : 'data_object'} size={16} />
            Exportar JSON
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-primary-dim transition-all shadow-sm cursor-pointer">
            <Icon name="print" size={16} />
            Imprimir PDF
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-8 pt-24 max-w-6xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">{projectName} — Revisão WBS</h1>
          <p className="text-sm text-on-surface-variant">
            Gerado em: {new Date().toLocaleDateString('pt-BR')} • Revisão 1.0
          </p>
        </div>

        {/* WBS Table */}
        <div className="bg-surface rounded-xl border border-surface-high/60 overflow-hidden shadow-lg print-break">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-high/60">
                <th className="text-left px-6 py-4 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium w-16">WBS ID</th>
                <th className="text-left px-4 py-4 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">Descrição da Tarefa</th>
                <th className="text-center px-4 py-4 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium w-16">OPT (O)</th>
                <th className="text-center px-4 py-4 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium w-16">NOM (M)</th>
                <th className="text-center px-4 py-4 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium w-16">PES (P)</th>
                <th className="text-right px-4 py-4 text-[11px] text-primary uppercase tracking-wider font-bold w-20">EXP (TE)</th>
                <th className="text-right px-6 py-4 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium w-20">VAR (σ²)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.wbsId}
                  className={`border-b border-surface-high/20 ${row.isModule ? 'bg-surface-high/10' : 'hover:bg-surface-high/10'}`}
                >
                  <td className={`px-6 py-3 tabular-nums ${row.isModule ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                    {row.wbsId}
                  </td>
                  <td className={`px-4 py-3 ${row.isModule ? 'font-bold text-on-surface' : 'text-on-surface pl-8'}`}>
                    {row.label}
                  </td>
                  <td className="text-center px-4 py-3 text-on-surface-variant tabular-nums">{row.isModule ? '–' : row.o}</td>
                  <td className="text-center px-4 py-3 text-on-surface-variant tabular-nums">{row.isModule ? '–' : row.m}</td>
                  <td className="text-center px-4 py-3 text-on-surface-variant tabular-nums">{row.isModule ? '–' : row.p}</td>
                  <td className="text-right px-4 py-3 text-primary font-semibold tabular-nums">{fmt(row.expected)}</td>
                  <td className="text-right px-6 py-3 text-on-surface-variant tabular-nums">{fmt(row.variance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-break">
          <div className="bg-surface rounded-xl p-6 border border-surface-high/60 shadow-lg">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium mb-3">Duração Total (TE)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-on-surface tabular-nums">{fmt(finalHours)}</span>
              <span className="text-on-surface-variant text-sm">Horas</span>
            </div>
            <div className="mt-2 text-xs text-outline">Inclui buffer de 35% ({fmt(bufferHours)}h)</div>
          </div>

          <div className="bg-surface rounded-xl p-6 border border-surface-high/60 shadow-lg">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium mb-3">Variância do Projeto (V)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-on-surface tabular-nums">{fmt(totalVariance)}</span>
              <span className="text-on-surface-variant text-sm">σ²</span>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-6 border border-primary/30 shadow-lg">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium mb-3">Desvio Padrão (Σ)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary tabular-nums">{fmt(stdDev)}</span>
              <span className="text-on-surface-variant text-sm">Horas</span>
            </div>
            <div className="mt-3 text-xs text-outline bg-bg/50 rounded-lg p-2">
              95% Intervalo de Confiança: {fmt(lower95)} – {fmt(upper95)} Horas
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
