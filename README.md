# 📐 EAP Interno — Unect Jr.

Ferramenta interna para criação de **Estrutura Analítica de Projeto (EAP)** com estimativa **PERT** (Program Evaluation and Review Technique).

Permite que diretores e gerentes de projeto criem, editem e exportem orçamentos de horas de forma visual e interativa, com persistência via **localStorage** no navegador.

---

## 🖥️ Visualizações

A aplicação possui dois modos de visualização:

- **Lista de Projetos** — tela inicial para gerenciar múltiplos projetos
- **Editor EAP** — editor interativo com módulos, funcionalidades e cálculo PERT automático

---

## 🛠️ Stack Tecnológica

| Camada      | Tecnologia    | Versão | Descrição                                  |
| ----------- | ------------- | ------ | ------------------------------------------ |
| Frontend    | React         | 19.x   | Biblioteca de UI com componentes funcionais |
| Bundler     | Vite          | 8.x    | Build tool ultra-rápido com HMR            |
| Estilização | Tailwind CSS  | 4.x    | Framework CSS utility-first                |
| Ícones      | Lucide React  | 1.x    | Ícones SVG modernos e customizáveis        |
| Persistência | localStorage |   —    | Dados salvos no navegador do usuário       |
| Linguagem   | TypeScript    | 6.x    | Tipagem estática para JavaScript           |

> **Nota:** O diretório `server/` contém um backend Express + SQLite opcional para uso local. Em produção (Vercel), o app funciona 100% no navegador.

---

## 📂 Estrutura do Projeto

```
eap-interno/
├── src/                    # Frontend React
│   ├── api.ts              # Camada de persistência (localStorage)
│   ├── App.tsx             # Componente principal
│   ├── App.css             # Estilos customizados
│   ├── index.css           # Entry point do Tailwind
│   └── main.tsx            # Ponto de entrada React
├── server/                 # Backend opcional (dev local)
│   ├── db.ts               # Conexão e schema SQLite
│   └── index.ts            # Rotas da API REST
├── index.html              # HTML principal
├── vite.config.ts          # Configuração do Vite + Tailwind
├── package.json            # Dependências e scripts
├── .nvmrc                  # Versão do Node (20)
├── tsconfig.json           # Config TypeScript raiz
├── tsconfig.app.json       # Config TS para o frontend
└── tsconfig.node.json      # Config TS para o Vite
```

---

## 📦 Dependências

### Produção

| Pacote         | Função                   |
| -------------- | ------------------------ |
| `react`        | Renderização de UI       |
| `react-dom`    | DOM binding do React     |
| `lucide-react` | Biblioteca de ícones SVG |

### Desenvolvimento

| Pacote                  | Função                              |
| ----------------------- | ----------------------------------- |
| `vite`                  | Dev server + bundler                |
| `@vitejs/plugin-react`  | Suporte React no Vite (HMR, JSX)   |
| `tailwindcss`           | Framework CSS                       |
| `@tailwindcss/vite`     | Plugin Tailwind para Vite           |
| `typescript`            | Compilador TypeScript               |
| `eslint`                | Linter JavaScript/TypeScript        |
| `@types/*`              | Definições de tipo para TS          |

### Opcionais (backend SQLite local)

| Pacote           | Função                                |
| ---------------- | ------------------------------------- |
| `express`        | Servidor HTTP para API REST           |
| `cors`           | Middleware CORS para o Express        |
| `better-sqlite3` | Driver SQLite síncrono e performático |
| `tsx`            | Runner TypeScript para Node.js        |

---

## 🚀 Como Rodar

### Pré-requisitos

- **Node.js** >= 20.x (recomendado via [nvm](https://github.com/nvm-sh/nvm))
- **npm** >= 10.x

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd eap-interno

# Se usa nvm, ative o Node 20+
nvm use

# Instale as dependências
npm install
```

### Desenvolvimento

```bash
# Inicia o Vite dev server (dados persistem no localStorage)
npm run dev
```

Acesse: **http://localhost:5173**

### Comandos disponíveis

```bash
# Desenvolvimento (padrão — localStorage)
npm run dev

# Desenvolvimento com backend SQLite local
npm run dev:sqlite

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

---

## 🌐 Deploy (Vercel)

O app é um **site estático** — basta conectar o repositório à Vercel:

1. Conecte o repositório no [Vercel Dashboard](https://vercel.com)
2. **Framework Preset:** Vite
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Node.js Version:** 20.x

Os dados são armazenados no **localStorage** do navegador de cada usuário.

---

## 🗄️ Persistência de Dados

| Ambiente   | Estratégia     | Descrição                                        |
| ---------- | -------------- | ------------------------------------------------ |
| Produção   | localStorage   | Dados salvos no navegador, auto-save a cada 1.5s |
| Local (opcional) | SQLite    | Backend Express com `better-sqlite3` em `data/eap.db` |

> O **auto-save** salva automaticamente após 1.5 segundos de inatividade.

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

| Formato  | Descrição                                                |
| -------- | -------------------------------------------------------- |
| **JSON** | Copia os dados para a área de transferência              |
| **CSV**  | Gera arquivo `.csv` compatível com Excel e Google Sheets |
| **PDF**  | Utiliza a função de impressão do navegador               |

---

## 📝 Licença

Uso interno — Unect Jr. © 2026
