# 🛡️ Relatório Completo de Auditoria de Bugs, Segurança e Performance

> **Projeto:** Gamers Aposentados  
> **Auditor Técnico:** `@debugger` & `@backend-specialist`  
> **Data:** 06 de Novembro de 2026  
> **Status Geral do Build:** ✅ TypeScript (0 erros) | ⚠️ ESLint (0 erros, 57 warnings)

---

## 📑 Sumário

1. [🚨 1. Bugs Críticos & Erros de Lógica (Critical Bugs)](#-1-bugs-críticos--erros-de-lógica-critical-bugs)
2. [🔒 2. Vulnerabilidades e Falhas de Segurança (Security Issues)](#-2-vulnerabilidades-e-falhas-de-segurança-security-issues)
3. [⚡ 3. Problemas de Performance & Concorrência (Performance)](#-3-problemas-de-performance--concorrência-performance)
4. [🧹 4. Qualidade de Código & Tipagem TypeScript (Code Quality)](#-4-qualidade-de-código--tipagem-typescript-code-quality)
5. [💡 5. Recomendações e Códigos de Correção (Actionable Fixes)](#-5-recomendações-e-códigos-de-correção-actionable-fixes)

---

## 🚨 1. Bugs Críticos & Erros de Lógica (Critical Bugs)

### 1.1 Injeção Automática de Novos Cadastros na Guilda dos Fundadores
* **Arquivo:** [`src/app/lib/actions.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/actions.ts#L58-L70)
* **Severidade:** 🔴 **Crítica (Violação de Multi-Tenancy)**
* **Linhas:** 58 a 70
* **Descrição do Problema:**  
  Na Server Action `register()`, qualquer usuário que se cadastra via formulário (e-mail e senha) é automaticamente forçado como membro ativo da guilda dos Fundadores ("Aposentados"):
  ```typescript
  const founderGuild = await prisma.guild.findFirst({
      where: { slug: { in: getFounderGuildSlugs() } },
  });
  if (founderGuild) {
      await prisma.guildMember.create({
          data: {
              guild_id: founderGuild.id,
              user_id: user.id,
              role: "MEMBER",
              is_active: true,
          },
      });
  }
  ```
* **Impacto:** Novos usuários não passam pelo onboarding nem criam/entram em suas próprias guildas; eles são inseridos diretamente dentro da guilda pessoal de Matheus e Lucas.

---

### 1.2 Bloqueio Cruzado no Randomizer via Fallback para "Aposentados"
* **Arquivo:** [`src/app/lib/quest-actions.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#L220-L223)
* **Severidade:** 🔴 **Crítica (Conflito entre Guildas)**
* **Linhas:** 220 a 223 e 251 a 257
* **Descrição do Problema:**  
  A função `getRandomizerStatus()` valida se o sorteio de um tipo de quest pode acontecer. Se `targetGuildId` não for passado pelo chamador, ela recorre a:
  ```typescript
  let guildId = targetGuildId;
  if (!guildId) {
      const founderGuild = await prisma.guild.findFirst({
          where: { slug: { in: ["fundadores", "aposentados"] } },
      });
      guildId = founderGuild?.id;
  }
  ```
  Além disso, se a guilda não tiver membros com `is_active: true`, há fallback para `RANDOMIZER_PLAYER_EMAILS` (Matheus e Lucas).
* **Impacto:** Se membros da guilda "Legendários" acessarem a tela de sorteio sem um parâmetro explícito, a lógica verifica se a guilda "Aposentados" tem quests ativas. Se sim, bloqueia o sorteio dos Legendários!

---

### 1.3 Filtro de Nomes Hardcoded Ocultando Membros no Histórico de Quests
* **Arquivo:** [`src/app/lib/history-actions.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/history-actions.ts#L106-L125)
* **Severidade:** 🔴 **Crítica (Invisibilidade de Dados)**
* **Linhas:** 106 a 125
* **Descrição do Problema:**  
  Em `getQuestHistoryByYear()`, ao formatar o progresso dos jogadores nas quests concluídas/fechadas, há um filtro estático com strings de nomes:
  ```typescript
  playerProgress = winner.progress
      .filter((p) => {
          const email = (p.user.email || "").toLowerCase();
          const name = (p.user.name || p.user.username || "").toLowerCase();
          return (
              email.includes("matheus") ||
              email.includes("lucas") ||
              name.includes("matheus") ||
              name.includes("lucas") ||
              name.includes("fmaniacs") ||
              name.includes("ocobraljhonson") ||
              name.includes("test")
          );
      })
  ```
* **Impacto:** Jogadores de outras guildas (ex: Kaleb e Cleber) têm seus status completamente removidos dos cards de histórico, dando a falsa impressão de que ninguém jogou a quest da guilda deles.

---

### 1.4 Vazamento de Jogos Incompletos entre Guildas no Randomizer
* **Arquivo:** [`src/app/lib/pool-actions.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L554-L577)
* **Severidade:** 🟡 **Alta (Vazamento de Dados)**
* **Linhas:** 554 a 577
* **Descrição do Problema:**  
  A função `getPastIncompleteGames()` consulta o banco de dados de maneira totalmente global sem filtrar por guilda ou membros:
  ```typescript
  export async function getPastIncompleteGames() {
      const games = await prisma.game.findMany({
          where: {
              progress: {
                  some: {
                      status: { in: ["DROPPED", "SUGGESTED"] },
                  },
              },
          },
      });
  }
  ```
* **Impacto:** Sugestões e jogos abandonados por membros de uma guilda aparecem disponíveis para sorteio como "jogos incompletos anteriores" em guildas de outras pessoas.

---

## 🔒 2. Vulnerabilidades e Falhas de Segurança (Security Issues)

### 2.1 [RESOLVIDO] Ingestão Desprotegida de Lotes em APIs de Deals (DDoS / Payload Exhaustion)
* **Arquivos:**
  - [`src/app/api/deals/favorites/route.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/deals/favorites/route.ts)
  - [`src/app/api/deals/owned/route.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/deals/owned/route.ts)
* **Status:** ✅ **Resolvido e Coberto por Testes Automatizados** (`tests/deals-batch-payload-security.spec.ts`)
* **Solução:**
  - Validação rigorosa via Zod (`BatchSyncSchema`) limitando o lote a no máximo 100 itens (`.max(100)`).
  - Substituição do loop sequencial N+1 `upsert` por `createMany({ skipDuplicates: true })` em operação SQL atômica única.
  - Deduplicação em memória antes do envio ao banco.
  - Rejeição imediata com HTTP 400 em caso de payload excedente ou malformado.
* **Severidade:** 🟡 **Média (Segurança de Recursos)**
* **Descrição:**  
  O parâmetro `syncItems` aceita qualquer array JSON sem limite máximo de tamanho (`max-length`) nem esquema Zod de validação.
  Além disso, o processamento itera via `for...of` com `await prisma.upsert()` sequencial para cada item (N+1 queries).
* **Impacto:** Uma requisição com 2.000 itens trava a execução da Serverless Function por timeout e consome todas as conexões livres do pool Postgres Neon.

---

### 2.2 [RESOLVIDO] Exposição Irrestrita de Todos os Potes e Candidatos via GET `/api/pools`
* **Arquivo:** [`src/app/api/pools/route.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts)
* **Status:** ✅ **Resolvido e Coberto por Testes Automatizados** (`tests/pools-api-security.spec.ts`)
* **Solução:**
  - Autenticação obrigatória via `auth()`.
  - Escopo estrito por guilda ativa (`where: { guild_id: activeGuild.id }`), preservando potes legados para a guilda dos Fundadores.
  - Consulta direta por ID de outra guilda retorna `404 Not Found` (anti-enumeração).

---

### 2.3 [RESOLVIDO] Bloqueio de Líderes de Outras Guildas na API de Pools
* **Arquivo:** [`src/app/api/pools/route.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts)
* **Status:** ✅ **Resolvido e Coberto por Testes Automatizados** (`tests/pools-api-security.spec.ts`)
* **Solução:**
  - Substituída a verificação hardcoded `isRandomizerPlayer` por autorização dinâmica baseada em cargos (RBAC: `LEADER` ou `ADMIN`) da guilda do usuário/pote.
  - No `POST`, o campo `guild_id` é obrigatoriamente preenchido com a guilda ativa do líder criador.
  - Membros comuns (`MEMBER`) recebem `403 Forbidden` ao tentar criar ou sortear potes.

---

## ⚡ 3. Problemas de Performance & Concorrência (Performance)

### 3.1 [RESOLVIDO] Cascading Renders em Efeitos de Componentes React
* **Arquivos:**
  - [`src/components/deals/TopDealsCarousel.tsx`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/deals/TopDealsCarousel.tsx)
  - [`src/components/providers/theme-provider.tsx`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/providers/theme-provider.tsx)
* **Status:** ✅ **Resolvido e Validado via ESLint / Testes**
* **Solução:**
  - Em `TopDealsCarousel.tsx`, o `setState` síncrono que marcava `loading: true` foi substituído por `useRef<Set<number>>` para rastrear requisições em voo sem disparar re-renderizações e sem invalidar o memo de ordenação.
  - Em `theme-provider.tsx`, a sincronização com o tema da sessão foi protegida com `useRef` para execução idempotente e com `queueMicrotask` para retirar a atualização do ciclo de renderização síncrono, resolvendo também o aviso de dependência ausente (`react-hooks/exhaustive-deps`).

---

### 3.2 Dependências Omitidas em React Hooks
* **Arquivo:** [`src/components/contracts/NoticeBoardMuralClient.tsx`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/contracts/NoticeBoardMuralClient.tsx#L126)
* **Severidade:** 🟢 **Baixa (Estabilidade)**
* **Descrição:**  
  O hook `useEffect` na linha 126 omite as referências de drag-and-drop (`mainLaneDrag.ref` e `sideLaneDrag.ref`), o que pode causar perda de listeners ao alternar telas ou redimensionar viewports.

---

## 🧹 4. Qualidade de Código & Tipagem TypeScript (Code Quality)

### 4.1 Uso Recorrente do Tipo `any` em Serviços Críticos
* **Arquivo:** [`src/services/deals/dealsOracleService.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/services/deals/dealsOracleService.ts#L687) (Linhas 687, 804, 944)
* **Severidade:** 🟢 **Baixa (Tipagem)**
* **Descrição:**  
  O motor de inteligência e recomendação do Oráculo de Deals possui 3 pontos utilizando explicitamente `any` para manipular respostas de preços e metadados de lojas da ITAD/Steam.

---

## 💡 5. Recomendações e Códigos de Correção (Actionable Fixes)

### Correção 1: Remoção de Injeção em Fundadores em `src/app/lib/actions.ts`
```typescript
// Remover as linhas 58 a 70.
// Usuário criado de forma limpa:
const user = await prisma.user.create({
    data: {
        username,
        email,
        password: hashedPassword,
    },
});

// Sem auto-associação forçada. O usuário é encaminhado para criar ou entrar numa guilda.
```

---

### Correção 2: Guild Scoping Dinâmico em `src/app/lib/quest-actions.ts`
```typescript
export async function getRandomizerStatus(
    questType: "MAIN_QUEST" | "SIDE_QUEST",
    targetGuildId?: string
) {
    try {
        let guildId = targetGuildId;
        if (!guildId) {
            const { getActiveGuild } = await import("@/app/lib/guild-actions");
            const activeGuild = await getActiveGuild();
            guildId = activeGuild?.id;
        }

        if (!guildId) {
            return { locked: false };
        }
        // ...
```

---

### Correção 3: Filtro Baseado em Membros da Guilda em `src/app/lib/history-actions.ts`
```typescript
// Obter os IDs de membros da guilda à qual o pool pertence
const guildUserIds = new Set(pool.guild_id ? (await prisma.guildMember.findMany({
    where: { guild_id: pool.guild_id },
    select: { user_id: true }
})).map(m => m.user_id) : []);

let playerProgress: PlayerProgress[] = [];
if (winner) {
    playerProgress = winner.progress
        .filter((p) => {
            if (guildUserIds.size > 0) {
                return guildUserIds.has(p.user_id);
            }
            return true;
        })
        .map((p) => ({
            userId: p.user.id,
            userName: p.user.name || p.user.username || "Unknown",
            status: p.status,
            progress_percentage: p.progress_percentage,
        }));
}
```

---

### Correção 4: Isolamento de Jogos Incompletos em `src/app/lib/pool-actions.ts`
```typescript
export async function getPastIncompleteGames(guildId?: string) {
    try {
        let targetGuildId = guildId;
        if (!targetGuildId) {
            const activeGuild = await getActiveGuild();
            targetGuildId = activeGuild?.id;
        }

        const memberIds = targetGuildId ? (await prisma.guildMember.findMany({
            where: { guild_id: targetGuildId },
            select: { user_id: true }
        })).map(m => m.user_id) : [];

        const games = await prisma.game.findMany({
            where: {
                progress: {
                    some: {
                        status: { in: ["DROPPED", "SUGGESTED"] },
                        ...(memberIds.length > 0 ? { user_id: { in: memberIds } } : {}),
                    },
                },
            },
            include: {
                progress: {
                    where: memberIds.length > 0 ? { user_id: { in: memberIds } } : undefined,
                    include: { user: true },
                },
            },
        });
        return { success: true, games };
    } catch (err) {
        return { success: false, games: [] };
    }
}
```
