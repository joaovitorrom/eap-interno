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
  const parsed: unknown = JSON.parse(json);

  // Suporta dois formatos:
  // 1. { version, projects: [...] }  — gerado por exportAllProjectsJSON
  // 2. Array direto de StoredProject  — compatibilidade futura
  let incoming: StoredProject[];
  if (Array.isArray(parsed)) {
    incoming = parsed as StoredProject[];
  } else if (
    parsed !== null &&
    typeof parsed === 'object' &&
    'projects' in parsed &&
    Array.isArray((parsed as Record<string, unknown>).projects)
  ) {
    incoming = (parsed as { projects: StoredProject[] }).projects;
  } else {
    throw new Error('Formato de backup inválido.');
  }

  // Validação mínima de schema
  for (const p of incoming) {
    if (typeof p.id !== 'string' || typeof p.name !== 'string' || !Array.isArray(p.data)) {
      throw new Error('Arquivo de backup corrompido ou em formato desconhecido.');
    }
  }

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
