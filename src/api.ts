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
  created_at?: string;
  updated_at?: string;
}

const API = '/api';

export const fetchProjects = async (): Promise<Project[]> => {
  const r = await fetch(`${API}/projects`);
  return r.json();
};

export const fetchProjectData = async (id: string): Promise<{ name: string; data: ProjectModule[] }> => {
  const r = await fetch(`${API}/projects/${id}`);
  return r.json();
};

export const createProject = async (name: string): Promise<{ id: string; name: string }> => {
  const r = await fetch(`${API}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return r.json();
};

export const saveProject = async (id: string, name: string, data: ProjectModule[]): Promise<void> => {
  await fetch(`${API}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  });
};

export const deleteProject = async (id: string): Promise<void> => {
  await fetch(`${API}/projects/${id}`, { method: 'DELETE' });
};
