// Persistência via localStorage — funciona em qualquer hospedagem estática (Vercel, Netlify, etc.)

export interface PertValues {
  o: number;
  m: number;
  p: number;
}

export interface ModuleItem {
  id: string;
  label: string;
  desc: string;
  pert: PertValues;
}

export interface ProjectModule {
  id: string;
  title: string;
  icon: string;
  items: ModuleItem[];
}

export interface Project {
  id: string;
  name: string;
  total_hours?: number;
  created_at?: string;
  updated_at?: string;
}

interface StoredProject extends Project {
  data: ProjectModule[];
}

const STORAGE_KEY = 'eap_projects';

function getAll(): StoredProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(projects: StoredProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ─── API pública (mesma interface de antes) ──────────

const calculatePERT = (o: number, m: number, p: number) => {
  const res = (Number(o) + 4 * Number(m) + Number(p)) / 6;
  return isNaN(res) ? 0 : Math.round(res * 10) / 10;
};

export async function fetchProjects(): Promise<Project[]> {
  const all = getAll();
  return all
    .map(({ data, ...rest }) => {
      let total = 0;
      data.forEach(mod => {
        mod.items.forEach(item => {
          total += calculatePERT(item.pert.o, item.pert.m, item.pert.p);
        });
      });
      // apply 35% buffer
      const buffer = Math.round(total * 0.35 * 10) / 10;
      const finalHours = Math.round((total + buffer) * 10) / 10;
      return { ...rest, total_hours: finalHours };
    })
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
}

export async function fetchProjectData(id: string): Promise<{ name: string; data: ProjectModule[] }> {
  const all = getAll();
  const project = all.find(p => p.id === id);
  if (!project) throw new Error('Projeto não encontrado');
  return { name: project.name, data: project.data };
}

export async function createProject(name: string): Promise<{ id: string; name: string }> {
  const all = getAll();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  all.push({ id, name, created_at: now, updated_at: now, data: [] });
  saveAll(all);
  return { id, name };
}

export async function saveProject(id: string, name: string, data: ProjectModule[]): Promise<void> {
  const all = getAll();
  const idx = all.findIndex(p => p.id === id);
  const now = new Date().toISOString();
  if (idx >= 0) {
    all[idx] = { ...all[idx], name, data, updated_at: now };
  } else {
    all.push({ id, name, data, created_at: now, updated_at: now });
  }
  saveAll(all);
}

export async function deleteProject(id: string): Promise<void> {
  const all = getAll();
  saveAll(all.filter(p => p.id !== id));
}

export async function copyProject(id: string): Promise<Project> {
  const all = getAll();
  const project = all.find(p => p.id === id);
  if (!project) throw new Error('Projeto não encontrado');

  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Clone modules and items with fresh UUIDs
  const clonedData: ProjectModule[] = project.data.map(mod => ({
    ...mod,
    id: crypto.randomUUID(),
    items: mod.items.map(item => ({
      ...item,
      id: crypto.randomUUID(),
    }))
  }));

  const newName = `${project.name} (Cópia)`;
  const clonedProject: StoredProject = {
    id: newId,
    name: newName,
    data: clonedData,
    created_at: now,
    updated_at: now,
  };

  all.push(clonedProject);
  saveAll(all);

  let total = 0;
  clonedData.forEach(mod => {
    mod.items.forEach(item => {
      total += calculatePERT(item.pert.o, item.pert.m, item.pert.p);
    });
  });
  const buffer = Math.round(total * 0.35 * 10) / 10;
  const finalHours = Math.round((total + buffer) * 10) / 10;

  return {
    id: newId,
    name: newName,
    total_hours: finalHours,
    created_at: now,
    updated_at: now,
  };
}

// ─── Backup / Restore ────────────────────────────────

/** Serializa todos os projetos para uma string JSON (download de backup) */
export function exportAllProjectsJSON(): string {
  const all = getAll();
  return JSON.stringify({ version: 1, exported_at: new Date().toISOString(), projects: all }, null, 2);
}

/** Importa projetos de um JSON de backup, mesclando com os existentes.
 *  Projetos com o mesmo `id` serão substituídos pelo backup.
 *  Retorna o número de projetos importados.
 */
export function importProjectsJSON(json: string): number {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error('Arquivo JSON inválido.');
  }

  let incomingRaw: any[];
  if (Array.isArray(parsed)) {
    incomingRaw = parsed;
  } else if (
    parsed !== null &&
    typeof parsed === 'object' &&
    'projects' in parsed &&
    Array.isArray((parsed as Record<string, unknown>).projects)
  ) {
    incomingRaw = (parsed as { projects: any[] }).projects;
  } else if (
    parsed !== null &&
    typeof parsed === 'object' &&
    (typeof (parsed as any).project === 'string' ||
      typeof (parsed as any).name === 'string' ||
      Array.isArray((parsed as any).modules) ||
      Array.isArray((parsed as any).data))
  ) {
    // É um único projeto
    incomingRaw = [parsed];
  } else {
    throw new Error('Formato de backup ou projeto inválido.');
  }

  // Normalização e validação robusta
  const incoming: StoredProject[] = incomingRaw.map((p: any) => {
    if (typeof p !== 'object' || p === null) {
      throw new Error('Formato de projeto inválido no arquivo.');
    }
    const name = String(p.name || p.project || 'Projeto Importado');
    const id = typeof p.id === 'string' && p.id ? p.id : crypto.randomUUID();
    const created_at = typeof p.created_at === 'string' ? p.created_at : new Date().toISOString();
    const updated_at = typeof p.updated_at === 'string' ? p.updated_at : new Date().toISOString();

    const rawModules = Array.isArray(p.data) ? p.data : (Array.isArray(p.modules) ? p.modules : []);
    const data: ProjectModule[] = rawModules.map((m: any) => {
      if (typeof m !== 'object' || m === null) {
        return {
          id: crypto.randomUUID(),
          title: 'Módulo Inválido',
          icon: 'extension',
          items: []
        };
      }
      const mId = typeof m.id === 'string' && m.id ? m.id : crypto.randomUUID();
      const title = String(m.title || m.label || 'Novo Módulo');
      const icon = typeof m.icon === 'string' ? m.icon : 'extension';
      const rawItems = Array.isArray(m.items) ? m.items : [];
      
      const items: ModuleItem[] = rawItems.map((i: any) => {
        if (typeof i !== 'object' || i === null) {
          return {
            id: crypto.randomUUID(),
            label: 'Item Inválido',
            desc: '',
            pert: { o: 0, m: 0, p: 0 }
          };
        }
        const iId = typeof i.id === 'string' && i.id ? i.id : crypto.randomUUID();
        const label = String(i.label || 'Nova Funcionalidade');
        const desc = String(i.desc || i.description || '');
        const pertRaw = i.pert || {};
        const pert: PertValues = {
          o: Number(pertRaw.o ?? i.o ?? 0),
          m: Number(pertRaw.m ?? i.m ?? 0),
          p: Number(pertRaw.p ?? i.p ?? 0),
        };
        return { id: iId, label, desc, pert };
      });
      return { id: mId, title, icon, items };
    });

    return { id, name, data, created_at, updated_at };
  });

  const existing = getAll();
  const existingIds = new Set(existing.map(p => p.id));

  // Projetos que existem localmente: substituir pelo backup
  const updated = existing.map(local => {
    const fromBackup = incoming.find(b => b.id === local.id);
    return fromBackup ?? local;
  });

  // Projetos do backup que não existem localmente: inserir
  const newOnes = incoming.filter(b => !existingIds.has(b.id));

  saveAll([...updated, ...newOnes]);
  return incoming.length;
}
