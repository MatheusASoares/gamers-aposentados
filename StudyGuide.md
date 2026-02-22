# 📚 Guia de Estudo — Gamers Aposentados

Este guia cobre as tecnologias, padrões e conceitos usados na implementação do projeto. Cada seção tem o **porquê** (por que usamos), o **o quê** (o que estudar), e um **link de referência**.

---

## 1. Next.js App Router (v16)

### Por que usamos
O App Router é a arquitetura moderna do Next.js que usa **Server Components por padrão**, permitindo que a maior parte da UI seja renderizada no servidor — melhor SEO e performance.

### O que estudar
- **Route Groups** `(main)` e `(auth)` — organizam rotas sem afetar a URL
- **Layouts** — `layout.tsx` em cada grupo de rotas compartilha UI entre páginas
- **Server Components vs Client Components** — conceito crítico
  - Server Components (padrão): podem usar `async/await`, acessam banco direto, não mandam JS ao client
  - Client Components (`"use client"`): para interatividade, hooks (`useState`, `useEffect`), event handlers
- **Server Actions** — funções `"use server"` que o client chama diretamente (usado em `actions.ts` para logout)

### Onde foi usado no projeto
- `src/app/(main)/page.tsx` — **Server Component** que faz queries Prisma diretamente
- `src/components/layout/sidebar.tsx` — **Client Component** (usa `usePathname()`)
- `src/lib/actions.ts` — **Server Action** (sign out)

### 📖 Referência
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Server & Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## 2. React Server Components (RSC)

### Por que usamos
RSCs executam no servidor, não enviam JavaScript ao browser, e podem fazer `await` direto dentro do componente.

### O que estudar
- **Regra de Ouro**: Se o componente não precisa de interatividade (cliques, estados), mantenha como Server Component
- **Serialização**: Props passadas de Server → Client Components devem ser serializáveis (no `Date`, no `function`)
- **`Promise.all()`** — Padrão para parallel data fetching (evita waterfalls)

### Onde foi usado no projeto
```tsx
// page.tsx — Server Component com parallel fetching
const [activeMainQuest, activeSideQuest, totalGames] = await Promise.all([
  prisma.game.findFirst({ where: { status: 'ACTIVE', quest_type: 'MAIN_QUEST' } }),
  prisma.game.findFirst({ where: { status: 'ACTIVE', quest_type: 'SIDE_QUEST' } }),
  prisma.game.count(),
]);
```

### 📖 Referência
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- Skill: `vercel-react-best-practices` (regra `async-parallel`)

---

## 3. Prisma ORM

### Por que usamos
ORM type-safe para PostgreSQL. Define o schema em `schema.prisma`, gera tipagens TypeScript automáticas, e maneja migrações.

### O que estudar
- **Schema**: Models, Enums, Relations (`@relation`), `@@map` para nome de tabela
- **Client**: `prisma.model.findMany()`, `findFirst()`, `count()`, `create()`, `update()`, `delete()`
- **Includes**: `include: { nominator: true }` — carrega relações
- **Singleton Pattern**: Por que usamos um singleton (`prisma.ts`) — evitar múltiplas instâncias em dev

### Onde foi usado no projeto
```prisma
model Game {
  id             String      @id @default(uuid())
  title          String
  status         GameStatus  @default(SUGGESTED)
  quest_type     QuestType
  nominated_by_id String
  nominator       User      @relation("Nominator", fields: [nominated_by_id], references: [id])
}
```

### 📖 Referência
- [Prisma Docs](https://www.prisma.io/docs)
- [Best Practices for Prisma Client](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices)

---

## 4. NextAuth v5 (Auth.js)

### Por que usamos
Framework de autenticação para Next.js. Configuramos o Credentials provider com bcrypt para hash de senhas.

### O que estudar
- **Providers**: `Credentials` (email/senha com bcrypt) — pode expandir para Google, Discord etc.
- **`auth()`**: Função que retorna a sessão no server side
- **Middleware**: `middleware.ts` protege rotas que precisam de login
- **`auth.config.ts`**: Configuração separada para Edge Runtime (middleware roda no Edge)
- **Zod validation**: Validação do input antes de processar

### Onde foi usado no projeto
```tsx
// header.tsx — pega a sessão no server
const session = await auth();
const user = session?.user;
```

### 📖 Referência
- [Auth.js (NextAuth v5) Docs](https://authjs.dev/)
- [Next.js Authentication Tutorial](https://nextjs.org/learn/dashboard-app/adding-authentication)

---

## 5. Tailwind CSS v4

### Por que usamos
Framework utility-first para CSS. A v4 traz o novo `@theme` directive e suporte nativo a CSS layers.

### O que estudar
- **`@theme`** — Define design tokens (fonts)
- **`@layer base`** — CSS variables para light/dark mode (`--primary`, `--background`, etc.)
- **`darkMode: "class"`** — Controla dark mode via classe `dark` no `<html>`
- **Design Tokens como CSS Variables**: `hsl(var(--primary))` — permite trocar tema facilmente
- **Responsive**: `md:`, `lg:` — breakpoints para layout responsivo
- **Hover/Transitions**: `hover:scale-105`, `transition-all`, `group-hover:`

### Onde foi usado no projeto
```css
/* globals.css */
.glass-card {
    background: rgba(24, 24, 27, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid hsl(240 3.7% 15.9%);
}
```

### 📖 Referência
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Tailwind v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

---

## 6. shadcn/ui

### Por que usamos
Não é uma biblioteca — são componentes copiados para o seu projeto. Usa Radix UI por baixo para acessibilidade e `class-variance-authority` para variantes.

### O que estudar
- **Filosofia**: Você é dono do código (não é um `npm install`)
- **CVA** (`class-variance-authority`): Define variantes de componentes (ex: `Button` com `variant="ghost"`)
- **Radix UI**: Primitivas acessíveis (Dialog, Dropdown, etc.) — headless por padrão
- **`cn()` utility**: Merge de classes com `clsx` + `tailwind-merge`

### Componentos usados no projeto
- `Button`, `Card`, `Badge`, `Input`, `Label`, `Separator`, `Avatar`

### 📖 Referência
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [CVA (class-variance-authority)](https://cva.style/docs)

---

## 7. Padrões de Arquitetura

### O que estudar

| Padrão | Onde | Por quê |
|--------|------|---------|
| **Parallel Data Fetching** | `page.tsx` (`Promise.all`) | Evita waterfalls — busca dados em paralelo |
| **Component Composition** | Dashboard (Hero + Bar + Grid + Feed) | Componentes pequenos e focados |
| **Server vs Client Split** | `page.tsx` (server) → `Sidebar` (client) | Minimiza JavaScript no browser |
| **Route Groups** | `(main)` vs `(auth)` | Layouts diferentes sem afetar URL |
| **Singleton Pattern** | `prisma.ts` | Evita múltiplas conexões ao banco em dev |
| **Glass-morphism** | `glass-card` class | Efeito visual com `backdrop-filter: blur()` |

---

## 8. CSS Avançado & Design

### O que estudar
- **Glass morphism**: `backdrop-filter: blur()` + `background: rgba()` + borda sutil
- **Neon glow**: `box-shadow` com cor primária e spread
- **CSS Animations**: `@keyframes fadeInUp`, `animation-delay` para staggered entrance
- **Gradientes**: `bg-gradient-to-r from-X via-Y to-Z` — para overlays em imagens
- **HSL Colors**: `hsl(283 92% 50%)` — mais fácil de manipular que hex

### 📖 Referência
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/animation)

---

## 9. TypeScript

### O que estudar
- **Interfaces**: `interface Game { ... }` — define contratos
- **Type Guards**: `if (!game)` — narrowing
- **Union Types**: `type GameStatus = 'SUGGESTED' | 'ACTIVE' | ...`
- **Generics**: Usado internamente pelo Prisma e Next.js
- **Non-null assertion / Optional chaining**: `game?.nominator?.display_name ?? 'Fallback'`

### 📖 Referência
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

## 10. Ferramentas de Desenvolvimento

| Ferramenta | Uso |
|------------|-----|
| **Prisma Studio** | `npx prisma studio` — GUI para ver/editar dados |
| **Docker Compose** | `docker-compose up` — sobe PostgreSQL local |
| **Next.js Dev Server** | `npm run dev` — hot reload |
| **ESLint** | `npm run lint` — verifica qualidade do código |

---

## 🗺️ Ordem Recomendada de Estudo

1. **TypeScript** — base de tudo
2. **React** (hooks, components, state) — fundamento
3. **Next.js App Router** — como o projeto está estruturado
4. **Tailwind CSS** — como o estilo é aplicado
5. **Prisma** — como os dados são modelados e acessados
6. **NextAuth** — como o login funciona
7. **shadcn/ui** — como os componentes são construídos
8. **CSS Avançado** — glassmorphism, animações, gradientes
9. **Padrões de Arquitetura** — como tudo se conecta

---

> **Dica:** A melhor forma de aprender é modificar o código existente. Tente:
> - Adicionar uma nova stat card ao Dashboard
> - Mudar a cor primária no `globals.css` e ver como o tema inteiro muda
> - Criar uma nova rota em `(main)/` e ver como o layout é aplicado automaticamente

---

## 11. API Routes (Route Handlers) & Integração com APIs Externas (IGDB)

### Por que usamos
Quando tentamos chamar uma Server Action que faz `fetch` para uma API externa (como a Twitch/IGDB) diretamente dentro de um Client Component (como o Autocomplete de busca), o Next.js às vezes pode tentar serializar event handlers ou sofrer conflitos com o Edge Runtime, resultando no erro: `Error: Event handlers cannot be passed to Client Component props`. 

Para resolver isso com estabilidade máxima, criamos uma Rota de API tradicional (`app/api/igdb/route.ts`). O Client Component faz um `fetch('/api/igdb')` via HTTP normal, isolando o frontend do backend de verdade.

### O que estudar
- **Route Handlers (`route.ts`)**: Equivalente às antigas API Routes (`pages/api`). Suportam `GET`, `POST`, `PUT`, etc.
- **Request & NextResponse**: Objetos padrão da Web API usados para ler corpo e enviar JSON.
- **Autenticação Server-to-Server**: O IGDB requer um Bearer Token da Twitch (OAuth2 Client Credentials). O servidor Next.js gera e armazena esse token em cache na memória (`src/app/lib/igdb.ts`), tirando a carga do front-end.
- **Nuances de APIs de Terceiros (Omit by Default & Hierarchy)**: APIs como a do IGDB frequentemente "escondem" (omitem) propriedades quando elas assumem valores padrão. 
  - Exemplo: O Jogo Base é a categoria `0`. Se um jogo é um jogo base, o JSON do IGDB na pesquisa vem sem o campo `category` inteiro em vez de mandar `category: 0`.
  - Exceções e Edge Cases: Para filtrar efetivamente apenas jogos base (excluindo DLCs, remasters ou compilados), não se pode depender de um único campo; o filtro precisa validar a ausência de propriedades hierárquicas como `parent_game` e `version_parent`, além de verificar o próprio `game_type`.

### Onde foi usado no projeto
```typescript
// app/api/igdb/route.ts
export async function POST(request: Request) {
    const { query } = await request.json();
    const results = await searchGamesIGDB(query); // Abstrai o fetch externo complexo
    return NextResponse.json(results);
}
```

### 📖 Referência
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [IGDB API Documentation (Game Category Enum)](https://api-docs.igdb.com/#game-enums)
