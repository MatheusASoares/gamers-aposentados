# 🚀 Guia de Tecnologias & Blueprint de Replicação

> **Manual de Arquitetura, Dependências e Setup para Novos Projetos**  
> **Base de Referência:** Gamers Aposentados  
> **Versão:** 1.0  
> **Objetivo:** Documentar todo o ecossistema tecnológico, justificativas de escolha, configurações de build e o passo a passo prático para clonar este setup em uma nova aplicação.

---

## 📑 Índice

1. [Matriz Geral da Stack](#1-matriz-geral-da-stack)
2. [Detalhamento por Camadas](#2-detalhamento-por-camadas)
   - [2.1 Core & Framework](#21-core--framework)
   - [2.2 Frontend & Design System](#22-frontend--design-system)
   - [2.3 Banco de Dados & ORM](#23-banco-de-dados--orm)
   - [2.4 Autenticação & Segurança](#24-autenticação--segurança)
   - [2.5 Inteligência Artificial & APIs Externas](#25-inteligência-artificial--apis-externas)
   - [2.6 Testes, QA & Qualidade de Código](#26-testes-qa--qualidade-de-código)
   - [2.7 DevOps, Ambientes & Infraestrutura](#27-devops-ambientes--infraestrutura)
3. [Diagrama de Arquitetura](#3-diagrama-de-arquitetura)
4. [Matriz de Variáveis de Ambiente (.env)](#4-matriz-de-variáveis-de-ambiente-env)
5. [Passo a Passo: Como Inicializar do Zero](#5-passo-a-passo-como-inicializar-do-zero)
6. [Boas Práticas & Padrões Notáveis Deste Projeto](#6-boas-práticas--padrões-notáveis-deste-projeto)

---

## 1. Matriz Geral da Stack

| Camada | Tecnologia | Versão | Função Principal |
| :--- | :--- | :--- | :--- |
| **Framework Web** | Next.js | `16.1.x` (App Router) | SSR, React Server Components (RSC), Server Actions e Route Handlers. |
| **Biblioteca UI** | React | `19.2.x` | Renderização declarativa, concorrência e transições nativas. |
| **Compilação** | React Compiler | `1.0.0` | Memoização automática de componentes sem `useMemo`/`useCallback` manuais. |
| **Linguagem** | TypeScript | `5.x` | Tipagem estrita ponta a ponta e aliases com path mapping (`@/*`). |
| **Estilos** | Tailwind CSS | `v4` (`@tailwindcss/postcss`) | CSS utilitário de alta performance sem overhead de build. |
| **Design System** | Radix UI + Shadcn UI | New York Style (zinc) | Componentes acessíveis headless (`Dialog`, `Dropdown`, `Tabs`, `Avatar`, etc.). |
| **Utilitários CSS** | `clsx` + `tailwind-merge` + `cva` | Moderno | Resolução de conflitos de classes e variantes dinâmicas. |
| **Ícones** | `lucide-react` + `react-icons` | `0.563.x` / `5.7.x` | SVGs vetoriais leves e otimizados. |
| **Banco de Dados** | PostgreSQL | `15-alpine` | Banco relacional com suporte a JSONB, enums e integridade referencial. |
| **ORM** | Prisma ORM | `6.x` | Modelagem declarativa, client tipado e migrações rastreáveis. |
| **Autenticação** | NextAuth.js (Auth.js) | `5.0.0-beta.30` | Sessão JWT stateless com Credentials (`bcryptjs`) e Google OAuth. |
| **Inteligência Artificial** | Google Gemini SDK | `@google/genai` (`2.5-flash`) | IA com Search Grounding em tempo real e JSON Schema estrito. |
| **Armazenamento / CDN** | Vercel Blob | `@vercel/blob` | Armazenamento seguro de fotos de perfil e capturas de tela. |
| **Testes E2E** | Playwright | `1.58.x` | Testes de fluxos críticos de usuário com subida automática do dev server. |
| **Contêineres** | Docker & Docker Compose | `3.8` | Bancos isolados locais (Dev/Staging e Agent Sandbox). |

---

## 2. Detalhamento por Camadas

### 2.1 Core & Framework
* **Next.js 16 (App Router)**:
  * Agrupamento de rotas por contexto: `(auth)` para login/registro e `(main)` para o dashboard e páginas da aplicação.
  * Server Actions para mutações de dados com revalidação automática de cache (`revalidatePath`).
  * Route Handlers REST em `src/app/api` para integrações webhooks e clientes externos.
* **React 19 & React Compiler**:
  * Otimização automática em tempo de build ativada em `next.config.ts` (`reactCompiler: true`), dispensando memoizações repetitivas no código.
* **TypeScript**:
  * `tsconfig.json` rigoroso com `"moduleResolution": "bundler"`, `"strict": true` e alias `@/*` apontando para `./src/*`.

### 2.2 Frontend & Design System
* **Tailwind CSS v4**:
  * Integrado com o plugin `@tailwindcss/postcss`.
  * Cores e variáveis semânticas baseadas em HSL no `globals.css` (tokens de `background`, `foreground`, `primary`, `destructive`, etc.).
* **Radix UI Primitives**:
  * Primitivos de acessibilidade: `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-avatar`, `@radix-ui/react-slot`.
* **Tema Dinâmico Multicamadas**:
  * Provedor de contexto customizado (`ThemeProvider`) que sincroniza a preferência visual do usuário entre o atributo `data-theme` da tag `<html>`, `localStorage`, `cookies` e a sessão persistida no banco.

### 2.3 Banco de Dados & ORM
* **Prisma ORM (v6)**:
  * Schema centralizado em `prisma/schema.prisma`.
  * Relacionamentos modelados com integridade referencial (`Cascade` / `SetNull`).
  * Enums de regras de negócio nativos no PostgreSQL.
* **Estratégia Multi-Ambiente**:
  * **Produção**: Neon Cloud PostgreSQL Serverless com connection pooling.
  * **Staging / Local**: PostgreSQL via Docker Compose (`porta 5434`).
  * **Agent Sandbox**: Instância Docker isolada (`porta 5435`) para testes automatizados por agentes de IA ou scripts de migração exploratória sem interferir no banco de desenvolvimento.

### 2.4 Autenticação & Segurança
* **NextAuth v5 (Auth.js)**:
  * Sessão sem estado (Stateless JWT) com duração de 30 dias e revalidação diária.
  * Múltiplos provedores:
    * `CredentialsProvider` com hash seguro via `bcryptjs`.
    * `GoogleProvider` para login federado de um clique.
  * Extensão de tipos (`next-auth.d.ts`) para incluir atributos do usuário na sessão (role, tokens, temas equipados).
  * Proteção global via callbacks de autorização em `auth.config.ts`, emitindo status `401` para requisições de API não autorizadas.

### 2.5 Inteligência Artificial & APIs Externas
* **Google Gemini 2.5 Flash**:
  * SDK `@google/genai`.
  * Recursos aplicados:
    1. **Search Grounding** (`tools: [{ googleSearch: {} }]`): Permite à IA buscar informações atualizadas na web em tempo real (ex.: estimativa de tempo de campanha do HowLongToBeat).
    2. **Structured JSON Output**: Retorno estrito baseado em esquema tipado para estruturação de missões e objetivos.
* **IGDB & Twitch OAuth**:
  * Autenticação via `client_credentials` com cache de token via `unstable_cache` por 24 horas.
  * Consultas Apicalypse sanitizadas contra injeção de parâmetros.
* **Steam Storefront & IsThereAnyDeal (ITAD)**:
  * APIs REST de busca e detalhamento de preços regionais (USD / BRL).
  * Comparação automática de ofertas e cálculo de Menor Preço Histórico (*All-Time Low*).
  * Cache em memória customizado (`dealsCache`) com TTL controlado.
* **Câmbio USD/BRL em Cascata**:
  * Mecanismo de failover sequencial: AwesomeAPI $\to$ ExchangeRate-API $\to$ Frankfurter API $\to$ Taxa Fixa de Contingência.
* **Vercel Blob Storage**:
  * Upload seguro de imagens com validação binária de cabeçalhos (*Magic Bytes*) para impedir o envio de scripts executáveis camuflados de imagens.

### 2.6 Testes, QA & Qualidade de Código
* **Playwright E2E**:
  * Suíte configurada em `playwright.config.ts` executando diretamente sobre o build/servidor local (`npm run dev`).
* **Zod**:
  * Validação runtime em todas as fronteiras da aplicação: requisições de API, Server Actions e dados externos de terceiros.
* **Linters & Formatadores**:
  * ESLint 9 + Prettier integrado ao `prettier-plugin-tailwindcss` para padronização de formatação automática em commits.

### 2.7 DevOps, Ambientes & Infraestrutura
* **Docker Compose**: Orquestração local dos bancos PostgreSQL.
* **Vercel Platform**: Deploy serverless com Vercel Blob e Speed Insights configurados.
* **TSX**: Executor TypeScript para scripts utilitários, migrações pontuais e seeds do banco.

---

## 3. Diagrama de Arquitetura

```mermaid
flowchart TD
    subgraph Client ["🖥️ Camada de Apresentação (Frontend)"]
        UI["Next.js 16 App Router\n(React 19 + Tailwind v4 + Radix/Shadcn)"]
        Theme["Theme Engine (data-theme)"]
    end

    subgraph Core ["⚙️ Camada de Aplicação (Backend Next.js)"]
        Auth["NextAuth v5 (JWT + RBAC)"]
        Actions["Server Actions & API Routes"]
        PrismaClient["Prisma ORM Client"]
        GeminiService["Gemini 2.5 Flash + Grounding"]
        DealsService["Deals & Currency Cascade Engine"]
        BlobService["Upload Handler + Magic Bytes"]
    end

    subgraph Data ["🗄️ Camada de Persistência"]
        PG_Prod["Neon PostgreSQL (Produção)"]
        PG_Local["Docker PostgreSQL (Staging / Dev)"]
        PG_Agent["Docker PostgreSQL (Sandbox Agentes)"]
    end

    subgraph External ["🌐 Serviços de Terceiros & APIs"]
        Twitch["Twitch OAuth (Tokens)"]
        IGDB["IGDB v4 (Catálogo de Jogos)"]
        GoogleAI["Google AI Studio (Gemini)"]
        Steam["Steam Storefront API"]
        ITAD["IsThereAnyDeal API"]
        Awesome["AwesomeAPI / Câmbio"]
        VercelBlob["Vercel Blob Storage CDN"]
    end

    UI --> Auth
    UI --> Actions
    Theme --> UI

    Actions --> PrismaClient
    Actions --> GeminiService
    Actions --> DealsService
    Actions --> BlobService

    PrismaClient --> PG_Prod
    PrismaClient --> PG_Local
    PrismaClient --> PG_Agent

    Auth --> PrismaClient
    GeminiService --> GoogleAI
    DealsService --> Steam
    DealsService --> ITAD
    DealsService --> Awesome
    BlobService --> VercelBlob
    Actions --> Twitch
    Actions --> IGDB
```

---

## 4. Matriz de Variáveis de Ambiente (.env)

| Variável | Provedor / Serviço | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL (Neon / Docker) | String de conexão com pooling de conexões e SSL em produção. |
| `AUTH_SECRET` | NextAuth.js v5 | Segredo criptográfico para assinatura de tokens JWT e cookies. |
| `NEXTAUTH_URL` | NextAuth.js v5 | URL base canônica da aplicação (`http://localhost:3000` em dev). |
| `AUTH_GOOGLE_ID` | Google Cloud Console | Client ID para login social Google OAuth. |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console | Client Secret para login social Google OAuth. |
| `GEMINI_API_KEY` | Google AI Studio | Chave de acesso ao modelo Gemini 2.5 Flash. |
| `IGDB_CLIENT_ID` | Twitch Developers | ID da aplicação no portal Twitch para acesso ao IGDB. |
| `IGDB_CLIENT_SECRET` | Twitch Developers | Segredo da aplicação no portal Twitch. |
| `ITAD_API_KEY` | IsThereAnyDeal | Chave de consulta de preços históricos e promoções. |
| `BLOB_READ_WRITE_TOKEN`| Vercel Blob | Token de leitura/escrita no storage de arquivos. |

---

## 5. Passo a Passo: Como Inicializar do Zero

### Passo 1: Criar o Projeto Next.js
```bash
npx create-next-app@latest meu-novo-projeto \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd meu-novo-projeto
```

### Passo 2: Instalar as Dependências de Produção
```bash
# UI, Ícones e Utilitários
npm install @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs \
  clsx tailwind-merge class-variance-authority tailwindcss-animate lucide-react react-icons date-fns zod

# Autenticação e Segurança
npm install next-auth@beta @auth/prisma-adapter bcryptjs

# Banco de Dados
npm install @prisma/client pg dotenv

# Inteligência Artificial e Storage
npm install @google/genai @vercel/blob @vercel/speed-insights
```

### Passo 3: Instalar as Dependências de Desenvolvimento
```bash
npm install -D @types/bcryptjs @types/node tsx prisma \
  @playwright/test playwright babel-plugin-react-compiler \
  prettier prettier-plugin-tailwindcss eslint-config-prettier

# Instalar o binário do Chromium para o Playwright
npx playwright install chromium
```

### Passo 4: Configurar o Docker Compose (`docker-compose.yml`)
```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: app_postgres
    environment:
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: app_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Suba o container com:
```bash
docker compose up -d
```

### Passo 5: Inicializar o Prisma ORM
```bash
npx prisma init --datasource-provider postgresql
```

Atualize o `.env` com a URL do banco local:
```env
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/app_db?schema=public"
AUTH_SECRET="gere-um-segredo-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Execute a primeira migração:
```bash
npx prisma migrate dev --name init
```

### Passo 6: Ativar o React Compiler em `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
```

---

## 6. Boas Práticas & Padrões Notáveis Deste Projeto

1. **Validação de Arquivos por Magic Bytes**:
   * Nunca confie apenas na extensão (`.jpg`, `.png`) enviada pelo navegador. Leia os primeiros bytes do buffer no backend para garantir a assinatura real do arquivo antes de enviá-lo ao CDN.
2. **Resiliência Multi-Provedor com Failover**:
   * Para serviços de missão crítica que dependem de terceiros (como cotações de câmbio), implemente cascata com múltiplos provedores públicos e valor de contingência offline estático para prevenir paradas totais da aplicação.
3. **Cache de Tokens Externos com `unstable_cache`**:
   * Tokens OAuth de serviço (como Twitch/IGDB) devem ser armazenados em cache com TTL de 24 horas usando tags do Next.js, evitando chamadas repetitivas e risco de estouro de rate limit.
4. **Isolamento de Banco para Ambientes de Teste / IA**:
   * Manter um banco de dados de sandbox separado para scripts pesados e agentes de IA protege a integridade dos dados de desenvolvimento e produção.
5. **Zero Token Cost em LLMs**:
   * Antes de acionar modelos de IA para tarefas de enriquecimento de dados, consulte o banco local. Se o dado já existir, devolva-o imediatamente sem gastar tokens de API.
