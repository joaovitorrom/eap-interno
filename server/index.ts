import express from 'express';
import cors from 'cors';
import db from './db.js';
import crypto from 'crypto';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ─── Tipos ───────────────────────────────────────────────

interface PertItem {
  id: string;
  label: string;
  desc: string;
  pert: { o: number; m: number; p: number };
}

interface Module {
  id: string;
  title: string;
  icon: string;
  items: PertItem[];
}

// ─── Listar projetos ────────────────────────────────────

app.get('/api/projects', (_req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  res.json(projects);
});

// ─── Criar projeto ──────────────────────────────────────

app.post('/api/projects', (req, res) => {
  const id = crypto.randomUUID();
  const name = req.body.name || 'Novo Projeto Unect';
  db.prepare('INSERT INTO projects (id, name) VALUES (?, ?)').run(id, name);
  res.status(201).json({ id, name });
});

// ─── Buscar dados completos de um projeto ───────────────

app.get('/api/projects/:projectId', (req, res) => {
  const { projectId } = req.params;
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as { id: string; name: string } | undefined;
  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado' });
    return;
  }

  const modules = db.prepare(
    'SELECT * FROM modules WHERE project_id = ? ORDER BY sort_order'
  ).all(projectId) as { id: string; title: string; icon: string }[];

  const items = db.prepare(
    'SELECT * FROM items WHERE project_id = ? ORDER BY sort_order'
  ).all(projectId) as { id: string; module_id: string; label: string; description: string; pert_o: number; pert_m: number; pert_p: number }[];

  const data: Module[] = modules.map(mod => ({
    id: mod.id,
    title: mod.title,
    icon: mod.icon,
    items: items
      .filter(i => i.module_id === mod.id)
      .map(i => ({
        id: i.id,
        label: i.label,
        desc: i.description,
        pert: { o: i.pert_o, m: i.pert_m, p: i.pert_p },
      })),
  }));

  res.json({ ...project, data });
});

// ─── Salvar dados completos de um projeto (PUT) ─────────

app.put('/api/projects/:projectId', (req, res) => {
  const { projectId } = req.params;
  const { name, data } = req.body as { name: string; data: Module[] };

  const upsertProject = db.prepare(`
    INSERT INTO projects (id, name, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = CURRENT_TIMESTAMP
  `);

  const deleteModules = db.prepare('DELETE FROM modules WHERE project_id = ?');
  const deleteItems = db.prepare('DELETE FROM items WHERE project_id = ?');

  const insertModule = db.prepare(
    'INSERT INTO modules (id, project_id, title, icon, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO items (id, module_id, project_id, label, description, pert_o, pert_m, pert_p, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    upsertProject.run(projectId, name);
    deleteItems.run(projectId);
    deleteModules.run(projectId);

    data.forEach((mod: Module, modIndex: number) => {
      insertModule.run(mod.id, projectId, mod.title, mod.icon, modIndex);
      mod.items.forEach((item: PertItem, itemIndex: number) => {
        insertItem.run(
          item.id, mod.id, projectId,
          item.label, item.desc,
          Number(item.pert.o), Number(item.pert.m), Number(item.pert.p),
          itemIndex
        );
      });
    });
  });

  transaction();
  res.json({ ok: true });
});

// ─── Deletar projeto ────────────────────────────────────

app.delete('/api/projects/:projectId', (req, res) => {
  const { projectId } = req.params;
  db.prepare('DELETE FROM items WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM modules WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  res.json({ ok: true });
});

// ─── Start ──────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🗄️  Servidor EAP rodando em http://localhost:${PORT}`);
});
