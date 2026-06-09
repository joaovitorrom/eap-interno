import { useState, useRef } from 'react';
import Icon from './Icon';
import type { Project } from '../api';

interface DashboardProps {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onCopyProject: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<{ count: number }>;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function Dashboard({ projects, onOpenProject, onNewProject, onDeleteProject, onCopyProject, onExportBackup, onImportBackup }: DashboardProps) {
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleCopy(id: string) {
    try {
      await onCopyProject(id);
      showToast('success', 'Projeto copiado com sucesso!');
    } catch {
      showToast('error', 'Erro ao copiar projeto.');
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { count } = await onImportBackup(file);
      showToast('success', `${count} projeto${count !== 1 ? 's' : ''} importado${count !== 1 ? 's' : ''} com sucesso!`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao importar backup.');
    } finally {
      e.target.value = '';
    }
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-5xl font-bold text-on-surface mb-2 tracking-tight">
            Projetos
          </h1>
          <p className="text-base text-on-surface-variant">
            Gerencie suas estimativas PERT e estruturas analíticas de projeto.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-outline"
              placeholder="Buscar projetos..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Import backup */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar backup JSON"
            className="hidden md:flex items-center gap-2 border border-outline-variant text-on-surface-variant py-2.5 px-4 rounded-lg text-xs font-medium hover:bg-surface hover:text-primary hover:border-primary transition-all cursor-pointer"
          >
            <Icon name="upload" size={16} />
            Importar
          </button>

          {/* Export backup */}
          <button
            onClick={onExportBackup}
            title="Exportar todos os projetos como backup JSON"
            className="hidden md:flex items-center gap-2 border border-outline-variant text-on-surface-variant py-2.5 px-4 rounded-lg text-xs font-medium hover:bg-surface hover:text-primary hover:border-primary transition-all cursor-pointer"
          >
            <Icon name="download" size={16} />
            Backup
          </button>

          <button
            onClick={onNewProject}
            className="hidden md:flex items-center gap-2 bg-primary text-white py-2.5 px-5 rounded-lg text-xs font-medium hover:bg-primary-dim transition-all shadow-sm shadow-primary/20 cursor-pointer"
          >
            <Icon name="add" filled size={18} />
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all animate-fade-in ${
            toast.type === 'success'
              ? 'bg-surface border-emerald-500/40 text-emerald-400'
              : 'bg-surface border-rose-500/40 text-rose-400'
          }`}
        >
          <Icon name={toast.type === 'success' ? 'check_circle' : 'error'} size={18} />
          {toast.msg}
        </div>
      )}

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center mb-6">
            <Icon name="folder_off" className="text-outline" size={40} />
          </div>
          <p className="text-on-surface-variant text-lg font-medium mb-1">
            {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          </p>
          <p className="text-outline text-sm mb-6">
            {search ? 'Tente outra busca' : 'Crie seu primeiro orçamento EAP'}
          </p>
          {!search && (
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 bg-primary text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-primary-dim transition-all cursor-pointer"
            >
              <Icon name="add" filled size={18} />
              Criar Projeto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <div
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="group bg-surface rounded-xl p-6 border border-outline-variant shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)] transition-all duration-300 cursor-pointer flex flex-col h-full relative"
            >
              {/* Icon + Status */}
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-surface-high/50 rounded-lg text-primary">
                  <Icon name="account_tree" size={24} />
                </div>
                <span className="px-2.5 py-1 bg-surface-high/50 text-on-surface-variant rounded text-[10px] font-bold tracking-wider uppercase">
                  Ativo
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors">
                {project.name}
              </h3>

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-outline-variant/30 flex justify-between items-end">
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-outline uppercase tracking-wider mb-1 font-medium">Atualizado</span>
                    <span className="text-xs text-on-surface-variant font-medium">{timeAgo(project.updated_at)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-outline uppercase tracking-wider mb-1 font-medium">Estimativa</span>
                    <span className="text-xs text-primary font-bold">{project.total_hours || 0} hrs</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      void handleCopy(project.id); 
                    }}
                    title="Copiar projeto"
                    className="p-2 text-outline-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-primary/10 cursor-pointer"
                  >
                    <Icon name="content_copy" size={18} />
                  </button>
                  <button
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      if (confirm('Tem certeza de que deseja excluir este projeto?')) {
                        onDeleteProject(project.id); 
                      }
                    }}
                    title="Excluir projeto"
                    className="p-2 text-outline-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-error/10 cursor-pointer"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
