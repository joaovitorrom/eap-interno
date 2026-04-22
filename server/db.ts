import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '..', 'data', 'eap.db');

// Garante que o diretório existe
import fs from 'fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Habilita WAL para melhor performance
db.pragma('journal_mode = WAL');

// Cria as tabelas se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Novo Projeto Unect',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS modules (
    id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Novo Módulo',
    icon TEXT NOT NULL DEFAULT 'Layout',
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id, project_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT 'Nova Funcionalidade',
    description TEXT NOT NULL DEFAULT '',
    pert_o INTEGER NOT NULL DEFAULT 5,
    pert_m INTEGER NOT NULL DEFAULT 10,
    pert_p INTEGER NOT NULL DEFAULT 20,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id, module_id, project_id),
    FOREIGN KEY (module_id, project_id) REFERENCES modules(id, project_id) ON DELETE CASCADE
  );
`);

export default db;
