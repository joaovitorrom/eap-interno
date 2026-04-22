# 📐 EAP Interno — Unect Jr.

Ferramenta interna para criação de **Estrutura Analítica de Projeto (EAP)** com estimativa **PERT** (Program Evaluation and Review Technique).

Permite que diretores e gerentes de projeto criem, editem e exportem orçamentos de horas de forma visual e interativa, com persistência em banco de dados SQLite.

---

## 🖥️ Screenshots

A aplicação possui dois modos de visualização:

- **Lista de Projetos** — tela inicial para gerenciar múltiplos projetos
- **Editor EAP** — editor interativo com módulos, funcionalidades e cálculo PERT automático

---

## 🛠️ Stack Tecnológica

| Camada     | Tecnologia         | Versão   | Descrição                                      |
| ---------- | ------------------ | -------- | ---------------------------------------------- |
| Frontend   | React              | 19.x     | Biblioteca de UI com componentes funcionais     |
| Bundler    | Vite               | 8.x      | Build tool ultra-rápido com HMR                 |
| Estilização | Tailwind CSS      | 4.x      | Framework CSS utility-first                     |
| Ícones     | Lucide React       | 1.x      | Ícones SVG modernos e customizáveis            |
| Backend    | Express            | 5.x      | API REST leve para persistência                 |
| Banco      | better-sqlite3     | 12.x     | SQLite embarcado — sem servidor de banco        |
| Runtime    | tsx                | 4.x      | Executa TypeScript diretamente no Node          |
| Linguagem  | TypeScript         | 6.x      | Tipagem estática para JavaScript                |

---

## 📂 Estrutura do Projeto

```
eap-interno/
├── server/                 # Backend Express + SQLite
│   ├── db.ts               # Conexão e schema do banco
│   └── index.ts            # Rotas da API REST
├── src/                    # Frontend React
│   ├── api.ts              # Cliente HTTP para a API
│   ├── App.tsx             # Componente principal
│   ├── App.css             # Estilos customizados
│   ├── index.css           # Entry point do Tailwind
│   └── main.tsx            # Ponto de entrada React
├── data/                   # Banco SQLite (gerado em runtime)
│   └── eap.db              # Arquivo do banco de dados
├── index.html              # HTML principal
├── vite.config.ts          # Configuração do Vite + Tailwind
├── package.json            # Dependências e scripts
├── tsconfig.json           # Config TypeScript raiz
├── tsconfig.app.json       # Config TS para o frontend
└── tsconfig.node.json      # Config TS para o Vite
```

---

## 📦 Dependências

### Produção

| Pacote           | Função                                        |
| ---------------- | --------------------------------------------- |
| `react`          | Renderização de UI                            |
| `react-dom`      | DOM binding do React                          |
| `lucide-react`   | Biblioteca de ícones SVG                      |
| `express`        | Servidor HTTP para API REST                   |
| `cors`           | Middleware CORS para o Express                |
| `better-sqlite3` | Driver SQLite síncrono e performático         |

### Desenvolvimento

| Pacote               | Função                                    |
| -------------------- | ----------------------------------------- |
| `vite`               | Dev server + bundler                      |
| `@vitejs/plugin-react` | Suporte React no Vite (HMR, JSX)       |
| `tailwindcss`        | Framework CSS                             |
| `@tailwindcss/vite`  | Plugin Tailwind para Vite                 |
| `tsx`                | Runner TypeScript para Node.js            |
| `typescript`         | Compilador TypeScript                     |
| `eslint`             | Linter JavaScript/TypeScript              |
| `@types/*`           | Definições de tipo para TS                |

---

## 🚀 Como Rodar

### Pré-requisitos

- **Node.js** >= 20.x (recomendado via [nvm](https://github.com/nvm-sh/nvm))
- **npm** >= 10.x

### Instalação

```bash
# Clone o repositório (se necessário)
git clone <url-do-repositorio>
cd eap-interno

# Se usa nvm, ative o Node 20+
nvm use 20

# Instale as dependências
npm install
```

### Desenvolvimento

```bash
# Inicia frontend (Vite) + backend (Express) simultaneamente
npm run dev
```

O comando acima:
1. Inicia o **servidor Express** na porta `3001` (API + SQLite)
2. Inicia o **Vite dev server** na porta `5173` (frontend com HMR)
3. O Vite faz **proxy** de `/api/*` para o backend automaticamente

Acesse: **http://localhost:5173**

### Comandos alternativos

```bash
# Apenas o frontend
npm run dev:client

# Apenas o backend (com hot-reload)
npm run dev:server

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

---

## 🗄️ Banco de Dados

O banco SQLite é criado automaticamente em `data/eap.db` na primeira execução. Ele contém 3 tabelas:

| Tabela     | Descrição                                  |
| ---------- | ------------------------------------------ |
| `projects` | Projetos com nome e timestamps             |
| `modules`  | Módulos de cada projeto (ex: "Autenticação") |
| `items`    | Funcionalidades com valores PERT (O, M, P) |

> **Não precisa de nenhum setup manual.** O schema é aplicado automaticamente ao iniciar o servidor.

O arquivo `data/eap.db` está no `.gitignore` — cada ambiente terá seu próprio banco.

---

## 📊 Fórmula PERT

A estimativa de horas é calculada com a fórmula PERT:

```
PERT = (O + 4M + P) / 6
```

Onde:
- **O** = Estimativa Otimista (melhor cenário)
- **M** = Estimativa Mais Provável
- **P** = Estimativa Pessimista (pior cenário)

O total final aplica um **buffer de 35%** sobre as horas líquidas para compor o preço.

---

## 📤 Exportação

A ferramenta suporta 3 formatos de exportação:

| Formato | Descrição                                                  |
| ------- | ---------------------------------------------------------- |
| **JSON** | Copia os dados para a área de transferência                |
| **CSV**  | Gera arquivo `.csv` compatível com Excel e Google Sheets   |
| **PDF**  | Utiliza a função de impressão do navegador                 |

---

## 🔧 API REST

| Método   | Rota                      | Descrição                    |
| -------- | ------------------------- | ---------------------------- |
| `GET`    | `/api/projects`           | Lista todos os projetos      |
| `POST`   | `/api/projects`           | Cria um novo projeto         |
| `GET`    | `/api/projects/:id`       | Busca dados completos        |
| `PUT`    | `/api/projects/:id`       | Salva módulos e itens        |
| `DELETE` | `/api/projects/:id`       | Remove projeto e seus dados  |

---

## 📝 Licença

Uso interno — Unect Jr. © 2026
