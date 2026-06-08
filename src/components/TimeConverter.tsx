import { useState, useEffect } from 'react';
import Icon from './Icon';

interface TimeConverterProps {
  onNavigateDashboard: () => void;
  initialHours?: number;
  hpd: string;
  onHpdChange: (val: string) => void;
}

// ─── helpers ───────────────────────────────────────────────────────────────────
const fmt1 = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

const fmt2 = (n: number): string => {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
};

const plural = (n: number, sing: string, plur: string) =>
  Math.round(n) === 1 ? sing : plur;

const HOUR_PRESETS = [2, 4, 6, 8];

// ─── Result Card ───────────────────────────────────────────────────────────────
interface ResultCardProps {
  icon: string;
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  sub?: string;
}

function ResultCard({ icon, label, value, unit, accent = false, sub }: ResultCardProps) {
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-3 border shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 ${
        accent
          ? 'bg-primary/10 border-primary/30'
          : 'bg-surface border-surface-high/60'
      }`}
    >
      {/* Header row: icon + label */}
      <div className="flex items-center gap-2">
        <span
          className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${
            accent ? 'bg-primary/20 text-primary' : 'bg-surface-high text-on-surface-variant'
          }`}
        >
          <Icon name={icon} size={18} />
        </span>
        <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant leading-tight">
          {label}
        </span>
      </div>

      {/* Value row: number wraps below if too wide */}
      <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${accent ? 'text-primary' : 'text-on-surface'}`}>
        <span className="text-4xl font-extrabold tabular-nums leading-none break-all">
          {value}
        </span>
        <span className="text-sm font-medium text-on-surface-variant">{unit}</span>
      </div>

      {sub && (
        <p className="text-xs text-outline leading-relaxed">{sub}</p>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TimeConverter({ onNavigateDashboard, initialHours, hpd, onHpdChange }: TimeConverterProps) {
  const [hours, setHours] = useState<string>(() => {
    if (initialHours !== undefined) {
      return String(initialHours);
    }
    return localStorage.getItem('converter_manual_hours') || '';
  });

  useEffect(() => {
    if (initialHours !== undefined) {
      setHours(String(initialHours));
    }
  }, [initialHours]);

  const handleHoursChange = (val: string) => {
    setHours(val);
    if (initialHours === undefined) {
      localStorage.setItem('converter_manual_hours', val);
    }
  };

  const totalHours  = parseFloat(hours) || 0;
  const hoursPerDay = parseFloat(hpd)   || 8;
  const safeDivisor = hoursPerDay > 0 ? hoursPerDay : 8;

  // Conversion constants (working calendar)
  const DAYS_PER_WEEK   = 5;
  const WEEKS_PER_MONTH = 4;
  const MONTHS_PER_YEAR = 12;

  const days   = totalHours / safeDivisor;
  const weeks  = days  / DAYS_PER_WEEK;
  const months = weeks / WEEKS_PER_MONTH;
  const years  = months / MONTHS_PER_YEAR;

  // Natural-language breakdown
  const fullYears  = Math.floor(years);
  const remMonths  = Math.floor((years - fullYears) * MONTHS_PER_YEAR);
  const remWeeks   = Math.floor(
    ((years - fullYears) * MONTHS_PER_YEAR - remMonths) * WEEKS_PER_MONTH,
  );
  const remDays    = Math.round(
    (years - fullYears) * MONTHS_PER_YEAR * WEEKS_PER_MONTH * DAYS_PER_WEEK
    - remMonths * WEEKS_PER_MONTH * DAYS_PER_WEEK
    - remWeeks  * DAYS_PER_WEEK,
  );

  const hasResult = totalHours > 0 && hoursPerDay > 0;

  const parts: string[] = [];
  if (fullYears > 0) parts.push(`${fullYears} ${plural(fullYears, 'ano', 'anos')}`);
  if (remMonths > 0) parts.push(`${remMonths} ${plural(remMonths, 'mês', 'meses')}`);
  if (remWeeks  > 0) parts.push(`${remWeeks} ${plural(remWeeks,  'semana', 'semanas')}`);
  if (remDays   > 0) parts.push(`${remDays} ${plural(remDays,   'dia',    'dias')}`);
  const breakdown = parts.length ? parts.join(', ') : '0 dias';

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20">

      {/* ── Top Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 md:left-72 right-0 h-16 z-40 flex justify-between items-center px-4 sm:px-8 bg-bg/80 backdrop-blur-md border-b border-outline-variant shadow-sm no-print">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-tighter text-primary md:hidden">EAP Architect</span>
          <div className="hidden md:flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <Icon name="schedule" size={18} className="text-primary" />
            </span>
            <span className="text-base font-semibold text-on-surface">Conversor de Horas</span>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="p-2 hover:bg-surface rounded-full transition-all cursor-pointer text-on-surface-variant hover:text-primary no-print"
          title="Imprimir"
        >
          <Icon name="print" size={20} />
        </button>
      </nav>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-8 pt-24 pb-10 max-w-3xl mx-auto w-full flex flex-col gap-8">

        {/* Page header */}
        <header className="flex flex-col gap-2 print:hidden">
          <button
            onClick={onNavigateDashboard}
            className="flex items-center gap-2 text-primary text-xs font-medium uppercase tracking-wider mb-1 cursor-pointer hover:underline text-left w-fit no-print"
          >
            <Icon name="arrow_back" size={14} />
            <span>Voltar ao Dashboard</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            Conversor de <span className="text-primary">Horas</span>
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-lg">
            Informe o total de horas estimadas e a jornada diária para converter automaticamente
            em dias úteis, semanas, meses e anos de trabalho.
          </p>
        </header>

        {/* ── Input card ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-surface-high/60 shadow-lg p-5 sm:p-8 flex flex-col gap-6 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Total hours */}
            <div className="flex flex-col gap-2">
              <label htmlFor="total-hours-input" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Total de Horas Estimadas
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">
                  <Icon name="timer" size={18} />
                </span>
                <input
                  id="total-hours-input"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Ex: 320"
                  value={hours}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  className="w-full h-14 pl-11 pr-10 rounded-xl bg-bg border border-outline-variant text-on-surface text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all tabular-nums"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-outline font-medium pointer-events-none">hrs</span>
              </div>
            </div>

            {/* Hours per day */}
            <div className="flex flex-col gap-2">
              <label htmlFor="hours-per-day-input" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Horas Trabalhadas por Dia
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">
                  <Icon name="work_history" size={18} />
                </span>
                <input
                  id="hours-per-day-input"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  placeholder="Ex: 8"
                  value={hpd}
                  onChange={(e) => onHpdChange(e.target.value)}
                  className="w-full h-14 pl-11 pr-16 rounded-xl bg-bg border border-outline-variant text-on-surface text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all tabular-nums"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-outline font-medium pointer-events-none">hrs/dia</span>
              </div>

              {/* Quick-fill presets */}
              <div className="flex gap-2 flex-wrap">
                {HOUR_PRESETS.map((h) => (
                  <button
                    key={h}
                    onClick={() => onHpdChange(String(h))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      hpd === String(h)
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assumptions legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-outline border-t border-outline-variant/20 pt-4">
            <span>📅 5 dias úteis / semana</span>
            <span>📆 4 semanas / mês</span>
            <span>🗓️ 12 meses / ano</span>
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────────────────── */}
        {hasResult ? (
          <>
            {/* Cards: 2-col on sm, 4-col on lg */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <ResultCard
                icon="today"
                label="Dias Úteis"
                value={fmt1(days)}
                unit={plural(days, 'dia', 'dias')}
                sub={`${fmt1(hoursPerDay)} hrs/dia`}
              />
              <ResultCard
                icon="date_range"
                label="Semanas"
                value={fmt2(weeks)}
                unit={plural(weeks, 'semana', 'semanas')}
                sub="5 dias/semana"
              />
              <ResultCard
                icon="calendar_month"
                label="Meses"
                value={fmt2(months)}
                unit={plural(months, 'mês', 'meses')}
                sub="4 semanas/mês"
              />
              <ResultCard
                icon="event"
                label="Anos"
                value={fmt2(years)}
                unit={plural(years, 'ano', 'anos')}
                sub="12 meses/ano"
                accent
              />
            </div>

            {/* Natural-language summary */}
            <div className="bg-surface-high/20 border border-surface-high/50 rounded-2xl p-5 sm:p-6 flex items-start gap-4">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Icon name="auto_awesome" size={20} className="text-primary" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Resumo por extenso
                </p>
                <p className="text-on-surface font-medium text-sm leading-relaxed">
                  <strong className="text-primary">{fmt1(totalHours)} horas</strong> equivalem a aproximadamente{' '}
                  <strong className="text-on-surface">{breakdown}</strong> de trabalho,
                  considerando uma jornada de{' '}
                  <strong className="text-primary">{fmt1(hoursPerDay)} horas/dia</strong>.
                </p>
              </div>
            </div>

            {/* Proportional bar */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">
                Distribuição proporcional
              </span>
              <div className="w-full h-4 rounded-full bg-surface-high/50 overflow-hidden flex">
                {years >= 1 && (
                  <div
                    className="h-full bg-primary/80 transition-all duration-500 shrink-0"
                    style={{ width: `${Math.min((fullYears / Math.max(years, 1)) * 100, 100)}%` }}
                    title={`${fullYears} ano(s)`}
                  />
                )}
                {remMonths > 0 && (
                  <div
                    className="h-full bg-primary/50 transition-all duration-500 shrink-0"
                    style={{ width: `${(remMonths / 12) * Math.min(100, 100 - (fullYears / Math.max(years, 1)) * 100)}%` }}
                    title={`${remMonths} mês(es)`}
                  />
                )}
                {remWeeks > 0 && (
                  <div
                    className="h-full bg-primary/30 shrink-0"
                    style={{ width: `${(remWeeks / (WEEKS_PER_MONTH * MONTHS_PER_YEAR)) * 100}%` }}
                    title={`${remWeeks} semana(s)`}
                  />
                )}
                <div className="h-full bg-surface-high flex-1" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/80 inline-block" /> Anos</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/50 inline-block" /> Meses</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/30 inline-block" /> Semanas</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-surface-high inline-block border border-outline-variant/40" /> Dias</span>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-outline">
            <div className="w-20 h-20 rounded-full bg-surface-high/40 flex items-center justify-center">
              <Icon name="schedule" size={36} className="text-outline-variant" />
            </div>
            <p className="text-sm font-medium text-on-surface-variant">
              Informe o total de horas para ver a conversão
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
