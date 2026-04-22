import { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import Review from './components/Review';
import HelpModal from './components/HelpModal';
import {
  fetchProjects, fetchProjectData, createProject, saveProject, deleteProject,
  type Project, type ProjectModule,
} from './api';

type View = 'dashboard' | 'editor' | 'review';

const calculatePERT = (o: number, m: number, p: number) => {
  const res = (Number(o) + 4 * Number(m) + Number(p)) / 6;
  return isNaN(res) ? 0 : Math.round(res * 10) / 10;
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [data, setData] = useState<ProjectModule[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('eap_theme') !== 'light');
  const [helpOpen, setHelpOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ─── Theme toggle ────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('eap_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ─── Load projects on mount ──────────────────────
  useEffect(() => { void loadProjects(); }, []);

  async function loadProjects() {
    setProjects(await fetchProjects());
  }

  // ─── Auto-save ───────────────────────────────────
  const doSave = useCallback(async (id: string, name: string, d: ProjectModule[]) => {
    if (!id) return;
    setSaving(true);
    try {
      await saveProject(id, name, d);
      setSaveMsg('Salvo!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch { setSaveMsg('Erro ao salvar'); }
    setSaving(false);
  }, []);

  function triggerAutoSave(name: string, d: ProjectModule[]) {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void doSave(projectId, name, d), 1500);
  }

  // ─── Actions ─────────────────────────────────────
  async function handleNewProject() {
    const { id, name } = await createProject('Novo Projeto Unect');
    await loadProjects();
    setProjectId(id);
    setProjectName(name);
    setData([{
      id: crypto.randomUUID(),
      title: 'Módulo Exemplo',
      icon: 'lock',
      items: [],
    }]);
    setView('editor');
    void doSave(id, name, []);
  }

  async function handleOpenProject(id: string) {
    const { name, data: d } = await fetchProjectData(id);
    setProjectId(id);
    setProjectName(name);
    setData(d);
    setView('editor');
  }

  async function handleDeleteProject(id: string) {
    await deleteProject(id);
    await loadProjects();
  }

  function handleProjectNameChange(name: string) {
    setProjectName(name);
    triggerAutoSave(name, data);
  }

  function handleAddModule() {
    const updated = [...data, {
      id: crypto.randomUUID(),
      title: 'Novo Módulo',
      icon: 'extension',
      items: [],
    }];
    setData(updated);
    triggerAutoSave(projectName, updated);
  }

  function handleRemoveModule(mId: string) {
    const updated = data.filter(m => m.id !== mId);
    setData(updated);
    triggerAutoSave(projectName, updated);
  }

  function handleUpdateModuleTitle(mId: string, title: string) {
    const updated = data.map(m => m.id === mId ? { ...m, title } : m);
    setData(updated);
    triggerAutoSave(projectName, updated);
  }

  function handleUpdateModuleIcon(mId: string, icon: string) {
    const updated = data.map(m => m.id === mId ? { ...m, icon } : m);
    setData(updated);
    triggerAutoSave(projectName, updated);
  }

  function handleAddItem(mId: string) {
    const updated = data.map(m => m.id !== mId ? m : {
      ...m,
      items: [...m.items, {
        id: crypto.randomUUID(),
        label: 'Nova Funcionalidade',
        desc: '',
        pert: { o: 0, m: 0, p: 0 },
      }],
    });
    setData(updated);
    triggerAutoSave(projectName, updated);
  }

  function handleRemoveItem(mId: string, iId: string) {
    const updated = data.map(m => m.id !== mId ? m : {
      ...m,
      items: m.items.filter(i => i.id !== iId),
    });
    setData(updated);
    triggerAutoSave(projectName, updated);
  }

  function handleUpdateItem(mId: string, iId: string, field: string, value: string) {
    const updated = data.map(m => m.id !== mId ? m : {
      ...m,
      items: m.items.map(i => {
        if (i.id !== iId) return i;
        if (field === 'label') return { ...i, label: value };
        if (field === 'desc') return { ...i, desc: value };
        if (field.startsWith('pert.')) {
          const key = field.split('.')[1] as 'o' | 'm' | 'p';
          return { ...i, pert: { ...i.pert, [key]: Number(value) || 0 } };
        }
        return i;
      }),
    });
    setData(updated);
    triggerAutoSave(projectName, updated);
  }

  // ─── Export ──────────────────────────────────────
  function handleCopyJSON() {
    const payload = { project: projectName, modules: data };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  }

  function handleExportCSV() {
    const BOM = '\uFEFF';
    const lines = ['Módulo;Funcionalidade;O;M;P;PERT'];
    let totalPERT = 0;

    data.forEach((m, mIdx) => {
      m.items.forEach((i, iIdx) => {
        const pert = calculatePERT(i.pert.o, i.pert.m, i.pert.p);
        totalPERT += pert;
        const title = m.title.replace(/"/g, "'");
        const label = i.label.replace(/"/g, "'");
        const pertStr = pert.toString().replace('.', ',');
        lines.push(`"${mIdx + 1}.0 ${title}";"${mIdx + 1}.${iIdx + 1} ${label}";${i.pert.o};${i.pert.m};${i.pert.p};${pertStr}`);
      });
    });

    const buffer = Math.round(totalPERT * 0.35 * 10) / 10;
    const finalHours = Math.round((totalPERT + buffer) * 10) / 10;
    
    lines.push('');
    lines.push(`"";"";"";"";"Subtotal Líquido";${totalPERT.toString().replace('.', ',')}`);
    lines.push(`"";"";"";"";"Buffer (35%)";${buffer.toString().replace('.', ',')}`);
    lines.push(`"";"";"";"";"Total Estimado";${finalHours.toString().replace('.', ',')}`);

    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${projectName.replace(/\s+/g, '_')}_EAP.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function handleNavigate(target: View) {
    if (target === 'dashboard') {
      void loadProjects();
      setView('dashboard');
    } else {
      setView(target);
    }
  }

  // ─── Render ──────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeView={view}
        projectName={view !== 'dashboard' ? projectName : undefined}
        darkMode={darkMode}
        onNavigate={handleNavigate}
        onNewProject={handleNewProject}
        onToggleDark={() => setDarkMode(!darkMode)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <div className="flex-1 md:ml-72 flex flex-col">
        {view === 'dashboard' && (
          <Dashboard
            projects={projects}
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {view === 'editor' && (
          <Editor
            projectName={projectName}
            data={data}
            saving={saving}
            saveMsg={saveMsg}
            onProjectNameChange={handleProjectNameChange}
            onSave={() => void doSave(projectId, projectName, data)}
            onAddModule={handleAddModule}
            onRemoveModule={handleRemoveModule}
            onUpdateModuleTitle={handleUpdateModuleTitle}
            onUpdateModuleIcon={handleUpdateModuleIcon}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onUpdateItem={handleUpdateItem}
            onNavigateReview={() => setView('review')}
            onNavigateDashboard={() => handleNavigate('dashboard')}
            onExportCSV={handleExportCSV}
            onCopyJSON={handleCopyJSON}
            isExporting={isExporting}
          />
        )}

        {view === 'review' && (
          <Review
            projectName={projectName}
            data={data}
            onNavigateEditor={() => setView('editor')}
            onExportCSV={handleExportCSV}
            onCopyJSON={handleCopyJSON}
            isExporting={isExporting}
          />
        )}
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
