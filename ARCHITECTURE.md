# 🗺️ Arquitetura do Sistema - Gamers Aposentados

> **Visão Geral**: Plataforma web de gamificação para guilda de jogos, construída com Next.js 16 (App Router), React 19, Tailwind CSS v4 e Prisma ORM sobre PostgreSQL.

---

## 🏗️ 1. Arquitetura de Pastas e Módulos

```
gamers-aposentados/
├── .agent/                  # Configurações do Antigravity / Agentic Kit
├── .agents/                 # Agentes e habilidades (Skills) do projeto
├── docs/                    # Guia de deploy, regras de negócio e relatórios
│   ├── DEPLOYMENT_GUIDE.md  # Manual oficial de produção e contingência
│   └── business-rules.md    # Especificação das regras da guilda
├── prisma/                  # Schema da base de dados e seeds
│   ├── schema.prisma        # Modelos (User, Game, GameProgress, Review, Pool)
│   ├── seed.ts              # População inicial de testes e mock data
│   └── migrations/          # Histórico de migrações do banco
├── public/                  # Ativos estáticos e favicons
├── scripts/                 # Scripts utilitários de banco e manutenção (CLI)
│   ├── audit-games.ts       # Auditoria de jogos cadastrados
│   ├── backfill-xp.ts       # Recálculo retroativo de XP
│   ├── deduplicate.ts       # Limpeza de duplicados
│   ├── sync-prod-data.ts    # Sincronização de dados
│   ├── update-hltb-times.ts # Atualização de tempos HLTB
│   └── demo/                # Scripts de teste e demonstração de temas/níveis
├── src/                     # Código-fonte da aplicação
│   ├── app/                 # Next.js App Router (Rotas, Layouts, API Actions)
│   │   ├── (auth)/          # Rotas de Login / Autenticação
│   │   ├── api/             # Endpoints REST / NextAuth handler
│   │   └── lib/             # Lógica de negócio isolada (xp-engine.ts, etc)
│   ├── components/          # Componentes React modularizados
│   │   ├── auth/            # Formulários e botões de auth
│   │   ├── dashboard/       # Painéis e cards principais
│   │   ├── game/            # Modais e detalhes dos jogos
│   │   ├── layout/          # Navbar, Footer, Sidebar
│   │   ├── profile/         # Guarda-roupa de temas, conquistas e XP
│   │   ├── providers/       # ThemeProvider e SessionProvider (index.tsx)
│   │   └── ui/              # Componentes de UI Shadcn/Radix primitivos
│   ├── lib/                 # Utilitários globais (prisma.ts, utils.ts)
│   ├── services/            # Integração com APIs externas (IGDB, HLTB, Vercel Blob)
│   └── types/               # Tipagens TypeScript compartilhadas
├── docker-compose.yml       # Containers PostgreSQL (Staging e Agent Sandbox)
├── .env.local               # Configurações do ambiente local (Staging DB)
├── .env.agent               # Configurações do ambiente Multi-Agent Sandbox DB
└── package.json             # Dependências e scripts de execução
```

---

## 🗄️ 2. Ambientes de Banco de Dados

O projeto conta com 3 ambientes isolados de banco de dados PostgreSQL:

| Ambiente | Host / Conexão | Porta | Finalidade |
| :--- | :--- | :--- | :--- |
| **Production** | Neon Cloud (`DATABASE_URL` na Vercel) | 5432 (SSL) | Banco oficial com dados reais da guilda. |
| **Staging / Test** | Docker Local (`gamers_postgres`) | 5434 | Testes integrados manuais e QA do desenvolvedor. |
| **Agent Sandbox** | Docker Local (`gamers_postgres_agent`) | 5435 | Ambiente exclusivo para Agentes de IA testarem novas funções. |

---

## 🛠️ 3. Comandos e Scripts Úteis

### 🔹 Desenvolvimento Local
```bash
npm run dev               # Inicia o servidor local Next.js (http://localhost:3000)
npx tsc --noEmit          # Verificação de tipos estritos TypeScript
npm run build             # Build local de produção
```

### 🔹 Gestão do Banco dos Agentes (Multi-Agent Sandbox)
```bash
npm run db:agent:up       # Sobe o container Docker do banco dos agentes (porta 5435)
npm run db:agent:push     # Sincroniza o schema Prisma no banco dos agentes
npm run db:agent:seed     # Popula os dados de teste no banco dos agentes
npm run db:agent:studio   # Abre o Prisma Studio no banco dos agentes (http://localhost:5556)
```

---

## ⚙️ 4. Mecanismo de Gamificação (XP Engine)

Localizado em [`src/app/lib/xp-engine.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/xp-engine.ts):
- **XP de Quests Principais**: $\max(300, \text{HLTB} \times 15)$ XP.
- **XP de Quests Secundárias**: $\max(50, \text{HLTB} \times 10)$ XP.
- **Fórmula de Nível**: $\text{XP Requerido}(N) = \lfloor 80 \times N^{1.18} \rfloor$.
