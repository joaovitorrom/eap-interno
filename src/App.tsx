import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Layout, Copy, FileSpreadsheet, Printer,
  Moon, Sun, TrendingUp, FolderOpen, Save, ChevronLeft
} from 'lucide-react';
import {
  fetchProjects, fetchProjectData, createProject, saveProject, deleteProject,
  type ProjectModule, type Project
} from './api';

const calculatePERT = (o: number, m: number, p: number) => {
  const res = (Number(o) + 4 * Number(m) + Number(p)) / 6;
  return isNaN(res) ? 0 : Math.round(res);
};

export default function App() {
  // ─── Estado ─────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Novo Projeto Unect');
  const [data, setData] = useState<ProjectModule[]>([
    {
      id: '1.0', title: 'Módulo Exemplo', icon: 'Layout',
      items: [{ id: '1.1', label: 'Funcionalidade Exemplo', pert: { o: 10, m: 20, p: 40 }, desc: 'Clique nos campos para editar.' }]
    }
  ]);
  const [darkMode, setDarkMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [view, setView] = useState<'list' | 'editor'>('list');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ─── Carregar projetos ──────────────────────────────
  useEffect(() => { void loadProjects(); }, []);

  const loadProjects = async () => {
    try { setProjects(await fetchProjects()); } catch { /* ignore */ }
  };

  const openProject = async (id: string) => {
    try {
      const p = await fetchProjectData(id);
      setCurrentProjectId(id);
      setProjectName(p.name);
      setData(p.data.length ? p.data : [{ id: '1.0', title: 'Módulo Exemplo', icon: 'Layout', items: [] }]);
      setView('editor');
    } catch { /* ignore */ }
  };

  const handleNewProject = async () => {
    try {
      const p = await createProject('Novo Projeto Unect');
      await loadProjects();
      openProject(p.id);
    } catch { /* ignore */ }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    try { await deleteProject(id); await loadProjects(); } catch { /* ignore */ }
  };

  // ─── Auto-save com debounce ─────────────────────────
  const doSave = useCallback(async () => {
    if (!currentProjectId) return;
    setSaving(true);
    try {
      await saveProject(currentProjectId, projectName, data);
      setSaveMsg('Salvo!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch { setSaveMsg('Erro ao salvar'); }
    setSaving(false);
  }, [currentProjectId, projectName, data]);

  useEffect(() => {
    if (!currentProjectId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSave, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [data, projectName, doSave, currentProjectId]);

  // ─── Manipulação ────────────────────────────────────
  const addModule = () => {
    const nextId = (data.length + 1).toFixed(1);
    setData([...data, { id: nextId, title: 'Novo Módulo', icon: 'Layout', items: [] }]);
  };

  const removeModule = (mId: string) => setData(data.filter(m => m.id !== mId));

  const addItem = (mId: string) => {
    setData(data.map(mod => {
      if (mod.id === mId) {
        const nextId = `${mod.id.split('.')[0]}.${mod.items.length + 1}`;
        return { ...mod, items: [...mod.items, { id: nextId, label: 'Nova Funcionalidade', pert: { o: 5, m: 10, p: 20 }, desc: 'Descrição aqui...' }] };
      }
      return mod;
    }));
  };

  const removeItem = (mId: string, iId: string) => {
    setData(data.map(mod => mod.id === mId ? { ...mod, items: mod.items.filter(i => i.id !== iId) } : mod));
  };

  const updateItem = (mId: string, iId: string, field: string, value: string) => {
    setData(data.map(mod => {
      if (mod.id === mId) {
        return {
          ...mod,
          items: mod.items.map(item => {
            if (item.id === iId) {
              if (field.includes('.')) {
                const [p, sub] = field.split('.');
                if (p === 'pert') {
                  return { ...item, pert: { ...item.pert, [sub]: value } };
                }
                return { ...item, [field]: value };
              }
              return { ...item, [field]: value };
            }
            return item;
          })
        };
      }
      return mod;
    }));
  };

  const updateModuleTitle = (mId: string, title: string) => {
    setData(data.map(m => m.id === mId ? { ...m, title } : m));
  };

  // ─── Exportação ─────────────────────────────────────
  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  const exportCSV = () => {
    let csv = 'Módulo ID;Módulo;ID Item;Funcionalidade;Descrição;Otimista (O);Provável (M);Pessimista (P);PERT (Líquido)\n';
    data.forEach(mod => {
      mod.items.forEach(item => {
        const pert = calculatePERT(item.pert.o, item.pert.m, item.pert.p);
        csv += `${mod.id};"${mod.title}";${item.id};"${item.label}";"${item.desc}";${item.pert.o};${item.pert.m};${item.pert.p};${pert}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EAP_Unect_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => window.print();

  // ─── Cálculos ───────────────────────────────────────
  const totalHours = data.reduce((acc, mod) =>
    acc + mod.items.reduce((sum, item) => sum + calculatePERT(item.pert.o, item.pert.m, item.pert.p), 0), 0);
  const bufferFactor = 1.35;
  const finalHours = Math.round(totalHours * bufferFactor);

  // ═══════════════════════════════════════════════════
  // RENDER: Lista de projetos
  // ═══════════════════════════════════════════════════
  if (view === 'list') {
    return (
      <div className={`min-h-screen font-[Inter,sans-serif] transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-3xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Projetos EAP</h1>
              <p className="text-slate-500 text-sm mt-1">Selecione ou crie um projeto para começar</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:scale-110 transition-all">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={handleNewProject} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                <Plus className="w-4 h-4" /> Novo Projeto
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-slate-400 text-lg font-medium">Nenhum projeto ainda</p>
              <p className="text-slate-400 text-sm mt-1">Clique em "Novo Projeto" para criar o primeiro</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.id} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all cursor-pointer" onClick={() => openProject(p.id)}>
                  <div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.updated_at ? new Date(p.updated_at).toLocaleString('pt-BR') : ''}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: Editor do projeto
  // ═══════════════════════════════════════════════════
  return (
    <div className={`min-h-screen font-[Inter,sans-serif] transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-900'}`}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break-inside-avoid { break-inside: avoid; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 no-print">
              <button onClick={() => { setView('list'); loadProjects(); }} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-110 transition-all" title="Voltar">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:scale-110 transition-all" title="Alternar Tema">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <span className="text-slate-300 dark:text-slate-700 text-xs">|</span>
              <button onClick={doSave} className="flex items-center gap-1 text-slate-500 hover:text-green-600 text-xs font-medium" title="Salvar agora">
                <Save className="w-3 h-3" /> {saving ? 'Salvando...' : saveMsg || 'Salvar'}
              </button>
              <span className="text-slate-300 dark:text-slate-700 text-xs">|</span>
              <div className="flex gap-2">
                <button onClick={copyJSON} className="flex items-center gap-1 text-slate-500 hover:text-blue-600 text-xs font-medium">
                  {isExporting ? 'Copiado!' : <><Copy className="w-3 h-3" /> JSON</>}
                </button>
                <button onClick={exportCSV} className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 text-xs font-medium">
                  <FileSpreadsheet className="w-3 h-3" /> CSV (Sheets)
                </button>
                <button onClick={exportPDF} className="flex items-center gap-1 text-slate-500 hover:text-red-500 text-xs font-medium">
                  <Printer className="w-3 h-3" /> PDF / Imprimir
                </button>
              </div>
            </div>
            <input
              className="text-4xl font-black tracking-tight outline-none border-b border-transparent focus:border-blue-300 mb-1 bg-transparent w-full"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Estrutura Analítica do Projeto - Estimativa PERT</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-6">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Horas Líquidas</p>
              <p className="text-2xl font-black tracking-tighter">{totalHours}h</p>
            </div>
            <div className="w-px h-10 bg-slate-100 dark:bg-slate-800" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-blue-500 uppercase">Preço (35% Buffer)</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{finalHours}h</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Módulos */}
          <div className="lg:col-span-2 space-y-6">
            {data.map((module) => (
              <div key={module.id} className="print-break-inside-avoid border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Layout className="w-5 h-5 text-blue-500" />
                    <input className="bg-transparent font-bold outline-none focus:text-blue-600 dark:focus:text-blue-400 w-full" value={module.title} onChange={(e) => updateModuleTitle(module.id, e.target.value)} />
                  </div>
                  <button onClick={() => removeModule(module.id)} className="no-print p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2 space-y-2">
                  {module.items.map((item) => (
                    <div key={item.id} className="group border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl p-3 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-slate-400">{item.id}</span>
                            <input className="bg-transparent font-semibold text-slate-700 dark:text-slate-300 outline-none focus:text-blue-500 w-full" value={item.label} onChange={(e) => updateItem(module.id, item.id, 'label', e.target.value)} />
                          </div>
                          <textarea className="bg-transparent text-xs text-slate-500 dark:text-slate-400 outline-none w-full resize-none h-auto overflow-hidden" value={item.desc} onChange={(e) => updateItem(module.id, item.id, 'desc', e.target.value)} rows={1} />
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-1 mr-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 px-2 no-print">
                              {(['o', 'm', 'p'] as const).map(key => (
                                <div key={key} className="flex flex-col items-center">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase">{key}</span>
                                  <input type="number" className="w-8 bg-transparent text-center text-[11px] font-bold outline-none dark:text-white" value={item.pert[key]} onChange={(e) => updateItem(module.id, item.id, `pert.${key}`, e.target.value)} />
                                </div>
                              ))}
                            </div>
                            <div className="hidden print:flex gap-2 text-[10px] text-slate-400 mr-4">
                              <span>O:{item.pert.o}</span>
                              <span>M:{item.pert.m}</span>
                              <span>P:{item.pert.p}</span>
                            </div>
                            <div className="bg-blue-600 dark:bg-blue-500 text-white font-bold text-xs px-2 py-1.5 rounded-lg shadow-sm">
                              {calculatePERT(item.pert.o, item.pert.m, item.pert.p)}h
                            </div>
                            <button onClick={() => removeItem(module.id, item.id)} className="no-print p-1.5 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={() => addItem(module.id)} className="no-print w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-200">
                    <Plus className="w-3 h-3" /> Adicionar Funcionalidade
                  </button>
                </div>
              </div>
            ))}

            <button onClick={addModule} className="no-print w-full py-4 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 bg-white dark:bg-slate-900 border-2 border-dashed border-blue-100 dark:border-slate-800 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-200 transition-all shadow-sm">
              <Plus className="w-5 h-5" /> Adicionar Novo Módulo
            </button>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 no-print">
            <div className="bg-slate-900 dark:bg-blue-950 text-white rounded-3xl p-6 shadow-xl sticky top-8">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Dica do Diretor
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed mb-6">
                Utilize o botão de <strong>Exportar CSV</strong> para levar esses dados para a planilha oficial de precificação da Unect. O formato é compatível com Excel e Google Sheets.
              </p>
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-800 dark:bg-blue-900/50 rounded-xl border border-slate-700 dark:border-blue-800">
                  <p className="font-bold text-blue-400 mb-1">Auto-Save:</p>
                  <p className="text-slate-400 italic">Os dados são salvos automaticamente no banco SQLite a cada alteração.</p>
                </div>
                <div className="p-3 bg-slate-800 dark:bg-blue-900/50 rounded-xl border border-slate-700 dark:border-blue-800">
                  <p className="font-bold text-emerald-400 mb-1">Exportação:</p>
                  <p className="text-slate-400 italic">O CSV já calcula automaticamente o PERT de cada linha para facilitar a análise na planilha.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-12 text-center text-slate-400 dark:text-slate-600 text-[10px] border-t border-slate-100 dark:border-slate-900 pt-8 uppercase tracking-[0.2em]">
          <p>Unect Jr. Framework de Gestão de Projetos - 2026</p>
        </footer>
      </div>
    </div>
  );
}
