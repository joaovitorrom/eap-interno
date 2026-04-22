# 📐 Unect EAP & PERT Estimator

Ferramenta premium para criação de **Estrutura Analítica de Projeto (EAP)** com estimativa **PERT** (Program Evaluation and Review Technique), desenvolvida para a **Unect Jr.**

O sistema permite que diretores e gerentes de projeto orcem horas de forma visual, profissional e precisa, com suporte a exportação avançada e design system adaptável.

---

## ✨ Funcionalidades Principais

### 🎨 Design System de Elite
- **Dark & Light Mode Native**: Suporte total a temas claro e escuro com transições suaves e tokens semânticos.
- **Interface Premium**: Inspirada em design systems modernos (Stitch), com foco em legibilidade e experiência do usuário (UX).
- **Ambient Patterns**: Fundo dinâmico com padrões SVG que se adaptam ao tema.

### 🧠 Motor de Estimativa PERT
- **Cálculo Ponderado**: Implementação fiel da fórmula `(O + 4M + P) / 6`.
- **Análise de Incerteza**: Visualização de Desvio Padrão e Variância na aba de Revisão.
- **Buffer de Segurança**: Aplicação automática de **35% de margem** sobre o total líquido.
- **WBS Indexing**: Numeração automática em cascata (ex: 1.0, 1.1, 2.0) para organização hierárquica.

### 🛠️ Ferramentas de Gestão
- **Dashboard Inteligente**: Cards de projeto com visualização instantânea de horas totais e status de atualização.
- **Customização de Módulos**: Escolha entre mais de 20 ícones para categorizar seus módulos de projeto.
- **Central de Ajuda**: Modal interativo explicando a metodologia EAP e as métricas do PERT.
- **Auto-Save**: Salvamento automático no `localStorage` a cada 1.5s de inatividade.

### 📤 Exportação Profissional
- **CSV Otimizado (Excel BR)**: Exportação com separador `;`, decimais com `,`, codificação UTF-8 BOM e resumo de totais no rodapé.
- **Cópia JSON**: Estrutura de dados pronta para integração ou backup.
- **Modo Impressão**: Layout CSS específico para gerar PDFs limpos e profissionais.

---

## 🛠️ Stack Tecnológica

| Camada      | Tecnologia    | Descrição                                  |
| ----------- | ------------- | ------------------------------------------ |
| **Frontend**| React 19      | UI reativa com Hooks e Componentes Funcionais|
| **Bundler** | Vite 8        | Build tool de ultra-performance             |
| **Estilos** | Tailwind v4   | Framework CSS com tokens semânticos nativos |
| **Ícones**  | Google Icons  | Material Symbols via componente dinâmico    |
| **Tipagem** | TypeScript 6  | Segurança e robustez no desenvolvimento     |

---

## 🚀 Como Iniciar

### Pré-requisitos
- **Node.js** >= 20.x
- **npm** >= 10.x

### Instalação e Execução
```bash
# Clone e entre na pasta
git clone <url-do-repositorio>
cd eap-interno

# Instale as dependências
npm install

# Inicie o modo desenvolvimento
npm run dev
```
Acesse em: **http://localhost:5173**

---

## 📊 Metodologia PERT

A estimativa de horas utiliza a técnica de três pontos:
1. **Otimista (O)**: Melhor cenário possível.
2. **Mais Provável (M)**: Cenário realista.
3. **Pessimista (P)**: Pior cenário (riscos materializados).

**Fórmula:** `E = (O + 4M + P) / 6`

A ferramenta também calcula o **Desvio Padrão** `(P - O) / 6` para oferecer um intervalo de confiança sobre a entrega do projeto.

---

## 📂 Estrutura de Pastas

```
eap-interno/
├── src/
│   ├── components/         # Componentes UI (Sidebar, Dashboard, Editor, etc.)
│   ├── api.ts              # Camada de dados e lógica PERT
│   ├── App.tsx             # Orquestrador de estado e rotas
│   └── index.css           # Design System (Tailwind v4 + Variáveis)
├── server/                 # Backend opcional (SQLite)
├── public/                 # Assets estáticos
└── data/                   # Banco de dados local (se usando SQLite)
```

---

## 📝 Licença

Uso exclusivo interno — **Unect Jr.** © 2026
