import Icon from './Icon';
import type { ProjectModule } from '../api';

interface EditorProps {
  projectName: string;
  data: ProjectModule[];
  saving: boolean;
  saveMsg: string;
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

const calculatePERT = (o: number, m: number, p: number) => {
  const res = (Number(o) + 4 * Number(m) + Number(p)) / 6;
  return isNaN(res) ? 0 : Math.round(res * 10) / 10;
};

const moduleIcons = [
  'lock', 'database', 'api', 'web', 'palette', 'payments', 'cloud', 'analytics', 
  'settings', 'notifications', 'extension', 'public', 'account_circle', 'shopping_cart',
  'build', 'verified', 'support_agent', 'view_kanban', 'schedule', 'campaign'
];

import { useState } from 'react';

export default function Editor({
  projectName, data, saving, saveMsg,
  onProjectNameChange, onSave, onAddModule, onRemoveModule,
  onUpdateModuleTitle, onUpdateModuleIcon, onAddItem, onRemoveItem, onUpdateItem,
  onNavigateReview, onNavigateDashboard, onExportCSV, onCopyJSON, isExporting,
}: EditorProps) {
  const [openIconSelector, setOpenIconSelector] = useState<string | null>(null);

  const totalHours = data.reduce((acc, mod) =>
    acc + mod.items.reduce((sum, item) => sum + calculatePERT(item.pert.o, item.pert.m, item.pert.p), 0), 0);
  const bufferHours = Math.round(totalHours * 0.35 * 10) / 10;
  const finalHours = Math.round((totalHours + bufferHours) * 10) / 10;

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
      <main className="flex-1 p-8 pt-24 max-w-5xl mx-auto w-full flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <button 
            onClick={onNavigateDashboard} 
            className="flex items-center gap-2 text-primary text-xs font-medium uppercase tracking-wider mb-1 cursor-pointer hover:underline text-left w-fit"
          >
            <Icon name="arrow_back" size={14} />
            <span>Voltar ao Dashboard</span>
          </button>
          <div className="flex items-center justify-between">
            <input
              className="flex-1 bg-transparent text-4xl font-bold text-on-surface border-none p-0 focus:outline-none focus:ring-0 placeholder-outline-variant tracking-tight"
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

        {/* Modules */}
        {data.map((mod, modIndex) => {
          const modTotal = mod.items.reduce((s, i) => s + calculatePERT(i.pert.o, i.pert.m, i.pert.p), 0);
          const iconName = mod.icon || moduleIcons[modIndex % moduleIcons.length];

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
                        {moduleIcons.map(icon => (
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
                  <div className="grid grid-cols-[1fr_auto_auto] gap-6 mb-3 px-4 text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">
                    <div>Descrição da Funcionalidade</div>
                    <div className="w-[260px] text-center">Estimativas PERT (Horas)</div>
                    <div className="w-[80px] text-right">Esperado</div>
                  </div>
                )}

                {/* Task Rows */}
                <div className="space-y-1">
                  {mod.items.map((item, itemIndex) => {
                    const expected = calculatePERT(item.pert.o, item.pert.m, item.pert.p);
                    return (
                      <div key={item.id} className="group grid grid-cols-[1fr_auto_auto] gap-6 items-center px-4 py-3 hover:bg-surface-high/20 transition-colors rounded-lg border border-transparent hover:border-surface-high/40">
                        {/* Task name */}
                        <div className="flex items-center gap-3">
                          <Icon name="drag_indicator" className="text-outline-variant/50 cursor-grab no-print" size={16} />
                          <span className="text-sm font-bold text-on-surface-variant tabular-nums min-w-[28px]">
                            {modIndex + 1}.{itemIndex + 1}
                          </span>
                          <input
                            className="flex-1 bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-on-surface text-sm"
                            type="text"
                            value={item.label}
                            onChange={(e) => onUpdateItem(mod.id, item.id, 'label', e.target.value)}
                          />
                        </div>

                        {/* PERT Inputs O/M/P */}
                        <div className="w-[260px] flex gap-3 justify-center no-print">
                          {(['o', 'm', 'p'] as const).map((key) => (
                            <div key={key} className="relative w-20">
                              <label className={`absolute -top-2 left-2 px-1 text-[10px] z-10 ${
                                key === 'm' ? 'text-primary font-bold bg-surface' : 'text-outline bg-surface'
                              }`}>
                                {key.toUpperCase()}
                              </label>
                              <input
                                type="number"
                                className={`w-full h-10 rounded text-on-surface text-center text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary bg-surface ${
                                  key === 'm' ? 'border-primary border-2' : 'border-outline-variant border'
                                }`}
                                value={item.pert[key]}
                                onChange={(e) => onUpdateItem(mod.id, item.id, `pert.${key}`, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Expected value */}
                        <div className="w-[80px] flex justify-end items-center gap-2">
                          <span className="text-sm font-semibold text-on-surface bg-surface-high/50 px-3 py-1 rounded">
                            {expected}
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

              {/* Module Subtotal */}
              <div className="bg-surface-high/20 border-t border-surface-high/40 px-6 py-3 flex justify-end">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-on-surface-variant">Subtotal do Módulo:</span>
                  <span className="text-on-surface font-bold">{modTotal} hrs</span>
                </div>
              </div>
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
      <div className="no-print fixed bottom-0 left-0 md:left-72 right-0 bg-bg/95 backdrop-blur-md border-t border-surface-high/60 shadow-lg z-30 p-4 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex gap-8 items-center">
            <div className="flex flex-col">
              <span className="text-[11px] text-outline uppercase tracking-wider font-medium">Total Líquido</span>
              <span className="text-xl font-bold text-on-surface tabular-nums">
                {totalHours} <span className="text-xs text-outline-variant font-normal">hrs</span>
              </span>
            </div>
            <div className="w-px h-10 bg-outline-variant/30" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-outline uppercase tracking-wider font-medium">Buffer</span>
                <span className="bg-primary-container text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">35%</span>
              </div>
              <span className="text-xl font-bold text-primary tabular-nums">
                +{bufferHours} <span className="text-xs text-primary/60 font-normal">hrs</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-primary uppercase tracking-wider font-bold">Total Estimado</span>
              <span className="text-3xl font-bold text-primary leading-none tabular-nums">
                {finalHours} <span className="text-base text-primary/60 font-normal">hrs</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
