import Icon from './Icon';

interface SidebarProps {
  activeView: 'dashboard' | 'editor' | 'review';
  projectName?: string;
  darkMode: boolean;
  onNavigate: (view: 'dashboard' | 'editor' | 'review') => void;
  onNewProject: () => void;
  onToggleDark: () => void;
  onOpenHelp: () => void;
}

export default function Sidebar({ activeView, projectName, darkMode, onNavigate, onNewProject, onToggleDark, onOpenHelp }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as const, icon: 'dashboard', label: 'Dashboard' },
    { id: 'editor' as const, icon: 'folder_copy', label: 'Projetos' },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col p-6 z-50 overflow-y-auto w-72 border-r bg-[#0d1117] dark:bg-[#0d1117] border-outline-variant">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-bold text-white tracking-tight">
            EAP <span className="text-primary">Architect</span>
          </div>
          <button
            onClick={onToggleDark}
            className="p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-white"
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
          >
            <Icon name={darkMode ? 'light_mode' : 'dark_mode'} size={18} />
          </button>
        </div>

        {/* Project context */}
        {projectName && (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg mb-6 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Icon name="account_tree" className="text-primary" size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{projectName}</div>
              <div className="text-xs text-slate-400">Estimativa PERT</div>
            </div>
          </div>
        )}

        {/* New button */}
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-4 rounded-lg text-xs font-medium hover:bg-primary-dim transition-all shadow-sm shadow-primary/20 focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <Icon name="add" filled size={18} />
          Nova Estimativa
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = activeView === item.id || (item.id === 'editor' && activeView === 'review');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-in-out text-left cursor-pointer ${
                isActive
                  ? 'bg-primary/10 text-primary border-r-4 border-primary'
                  : 'text-slate-400 hover:bg-white/5 hover:pl-4'
              }`}
            >
              <Icon name={item.icon} filled={isActive} className={isActive ? 'text-primary' : 'text-slate-500'} />
              <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <button
          onClick={onOpenHelp}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:pl-4 transition-all duration-300 text-sm w-full text-left cursor-pointer"
        >
          <Icon name="contact_support" className="text-slate-500" />
          <span>Central de Ajuda</span>
        </button>
      </div>
    </aside>
  );
}
