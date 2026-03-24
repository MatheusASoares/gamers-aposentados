# Análise Completa — Gamers Aposentados
> **Data:** Março 2026 · **Base:** leitura completa do código atual

---

## ✅ O Que Já Foi Corrigido (vs. Análise Anterior)

Todos esses itens estavam no [project_analysis.md](file:///c:/Users/mathe/Desktop/gamers-aposentados/project_analysis.md) original e **já foram resolvidos**:

| Item | Status |
|---|---|
| `fs.writeFileSync` em Server Action | ✅ Removido |
| `Pool.status` era `String` | ✅ Agora é enum `PoolStatus` |
| [setFavoriteGames](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#159-166) duplicado | ✅ Refatorado para [setFavoriteGamesBase](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#95-158) |
| N+1 → `createMany` com `skipDuplicates` | ✅ Implementado |
| Token IGDB em variável de módulo | ✅ `unstable_cache` com revalidate 24h |
| Interface [IGDBGame](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/igdb.ts#7-16) tipada | ✅ Criada |
| [next.config.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/next.config.ts) remotePatterns incompleto | ✅ Google, GitHub, Vercel Blob adicionados |
| `Pool.status` lookup por string | ✅ Usando enum corretamente |
| Dashboard com queries sequenciais | ✅ `Promise.all` paralelo bem implementado |
| Auth nas API routes `/api/games` e `/api/pools` | ✅ Todas protegidas com `auth()` |

---

## 🔴 Crítico / Segurança

### 1. Sem Autorização de Ownership nas API Routes (apenas autenticação)
**Arquivos:** [/api/games/route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/games/route.ts) · [/api/pools/route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts)

As rotas PUT e DELETE verificam **se o usuário está logado**, mas não verificam **se ele é dono** do recurso. Um usuário autenticado pode editar ou deletar o jogo/pool de qualquer outro usuário via chamada direta à API.

```typescript
// ❌ Atual: só verifica isso
if (!session?.user?.id) return 401;
// Falta verificar:
// if (game.nominated_by_id !== session.user.id) return 403;
```

**Impacto:** Burla de regras de negócio. Qualquer usuário logado pode alterar/deletar dados alheios.

---

### 2. `apiPools` — [DELETE](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/games/route.ts#83-102) Deleta Cascade Manualmente e Pode Deixar Dados Órfãos
**Arquivo:** [/api/pools/route.ts#L140-L141](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts)

```typescript
await prisma.poolEntry.deleteMany({ where: { pool_id: id } });
await prisma.pool.delete({ where: { id } });
```

Se a segunda query falhar após a primeira, ficam dados órfãos. Deveria ser uma única transação, ou o schema deveria usar `onDelete: Cascade` em `PoolEntry.pool_id`.

**Fix:** Encapsular em `prisma.$transaction([...])` ou configurar `onDelete: Cascade` no [schema.prisma](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma).

---

## 🟠 Performance

### 3. Dashboard: `SELECT id FROM reviews ORDER BY RANDOM()` é Caro em Tabelas Grandes
**Arquivo:** [page.tsx#L35-L37](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/%28main%29/page.tsx)

`ORDER BY RANDOM()` faz um full-table scan + sort em memória. Para pequenas tabelas (5 reviews), sem problema agora. Mas é um padrão que vai degradar conforme o volume crescer.

**Fix de longo prazo:** `TABLESAMPLE SYSTEM` ou selecionar um índice aleatório via `Math.random() * count` no JS.

---

### 4. [pool-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts) — Busca Todos os Usuários Dentro da Transação
**Arquivo:** [pool-actions.ts#L265](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts) · [randomizer-actions.ts#L34](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts)

```typescript
const allUsers = await tx.user.findMany(); // dentro da transação
```

`findMany` sem filtro retorna **todos os usuários** do banco. Hoje são 2, mas é um padrão perigoso. Além disso, `allUsers` dentro de uma transação bloqueia o lock da transação por mais tempo.

**Fix:** Mover o `findMany` para **antes** da transação, ou usar `RANDOMIZER_PLAYER_EMAILS` (já disponível) como filtro:
```typescript
const allUsers = await prisma.user.findMany({
    where: { email: { in: RANDOMIZER_PLAYER_EMAILS } }
});
```

---

### 5. [setFavoriteGamesBase](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#95-158) — Loop com Queries Individuais (Sequential I/O)
**Arquivo:** [user-actions.ts#L111-L139](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts)

```typescript
for (const candidate of candidates) {
    let game = await prisma.game.findFirst(...); // query 1
    if (!game) game = await prisma.game.create(...); // query 2
    // Até 6 round-trips para 3 favoritos
}
```

**Fix:** Paralelizar os `findFirst` com `Promise.all`, depois fazer os [create](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts#15-59) em lote.

---

## 🟡 Qualidade de Código

### 6. `error: any` em Múltiplos Lugares — Deveria Ser `unknown`
**Arquivos:** [randomizer-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts), [pool-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts), [review-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts)

```typescript
} catch (error: any) { // ❌ suprime type safety
```

Com `error: any`, você pode acessar `error?.message` sem garantia de tipo. O correto é `unknown` + type guard:

```typescript
} catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Desconhecido";
    return { success: false, error: msg };
}
```

Alguns arquivos ([quest-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts), [user-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts)) **já fazem isso corretamente** — basta padronizar os demais.

---

### 7. [mapInputToDb](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/games/route.ts#6-16) em `/api/games` tem `questType?: any`
**Arquivo:** [/api/games/route.ts#L6](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/games/route.ts)

```typescript
const mapInputToDb = (input: Partial<...> & { questType?: any }) => { ... }
//                                                         ^^^
```

Deveria ser `questType?: QuestType` (importando o enum do Prisma).

---

### 8. [randomizer-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts) — Identifica o Vencedor por Título, Não por ID
**Arquivo:** [randomizer-actions.ts#L107](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts)

```typescript
const savedWinner = savedGames.find((g) => g.title === winnerCandidate?.nome);
//                                                ^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

Se dois jogos tiverem o mesmo título (raro mas possível), isso identifica o errado. O correto é comparar por `igdb_id`:

```typescript
const savedWinner = savedGames.find((g) => g.igdb_id === winnerId);
```

---

### 9. [review-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts) — Falta `revalidatePath` no Caminho do Perfil
**Arquivo:** [review-actions.ts#L49-L51](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts)

Ao criar ou atualizar uma review, as paths revalidadas são `/dashboard/reviews`, `/reviews` e `/`. Mas se reviews aparecem no perfil (`/profile`), essa path não está na lista. Verificar se necessário.

---

### 10. [joinQuest](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#177-199) Sem Deduplicação — Pode Falhar com Mensagem Ruim
**Arquivo:** [quest-actions.ts#L182-L190](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts)

```typescript
await prisma.gameProgress.create({ ... }); // Vai lançar P2002 se já existir
// catch retorna: "Este jogo já está na sua lista ou ocorreu um erro."
```

O erro Prisma `P2002` (unique violation) é tratado igual a qualquer outro erro. Melhor usar `upsert` (como já é feito em [updateQuestProgress](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#9-60)) ou detectar P2002 especificamente.

---

## 🔵 Schema / Dados

### 11. `hltb_time` Existe no Schema Mas Nunca É Preenchido
**Arquivo:** [schema.prisma#L99](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma)

O campo `hltb_time Int?` está no schema mas nenhuma Server Action o preenche. A [conversa de integração HLTB](file:///c:/Users/mathe/.gemini/antigravity/brain/) ficou em aberto sem resolução. Se não há plano de preencher esse campo, ele pode ser removido para simplificar o schema. Se há plano, deve-se criar a integração.

---

### 12. [Review](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts#60-93) Não Tem Restrição `@unique([user_id, game_id])`
**Arquivo:** [schema.prisma#L142-L160](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma)

A regra de "um usuário só pode ter uma review por jogo" é **somente no código** ([createReview](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts#15-59) verifica manualmente). Não existe constraint no banco. Se algo burlar a Server Action (ex: via API route), cria reviews duplicadas.

```prisma
// Adicionar ao model Review:
@@unique([user_id, game_id])
```

---

### 13. [PoolEntry](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#10-18) Permite Duplicatas do Mesmo Jogo no Mesmo Pool
**Arquivo:** [schema.prisma#L186-L201](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma)

Não existe `@@unique([pool_id, game_id])`. A proteção atual de colisão é feita via `igdb_id` no lookup do Game, mas se dois jogos diferentes da pool tiverem o mesmo `game_id` (improvável mas possível após um bug), o pool fica corrompido.

---

## 🟢 Testes

### 14. [reviews.spec.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/tests/reviews.spec.ts) Está Quase Vazio
**Arquivo:** [reviews.spec.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/tests/reviews.spec.ts) — apenas 23 linhas

Existe um arquivo de teste para reviews, mas com cobertura mínima. O fluxo principal (criar review → editar review → deletar review) não está coberto por E2E. Dado que o `EditReviewModal` foi corrigido recentemente, um teste de regressão aqui seria valioso.

---

### 15. Sem Testes para Server Actions (apenas E2E via Playwright)
Os testes existentes ([dashboard.spec.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/tests/dashboard.spec.ts), [randomizer.spec.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/tests/randomizer.spec.ts), [profile.spec.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/tests/profile.spec.ts)) testam o app via browser. Não há testes unitários para as Server Actions críticas como [saveSelections](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#80-185), [executeRoll](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#221-311) ou [createReview](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts#15-59).

**Recomendação:** Adicionar testes com `vitest` + `jest-mock-extended` para as Server Actions de maior risco.

---

## 📦 Dependências

### 16. `next-auth` Beta (`^5.0.0-beta.30`) em Produção
**Arquivo:** [package.json#L39](file:///c:/Users/mathe/Desktop/gamers-aposentados/package.json)

`next-auth@5` está em beta há meses. Há breaking changes entre betas. Verificar periodicamente se há release kandidate ou stable, e atualizar com cuidado.

---

### 17. `next: ^16.1.6` — Não é uma Versão Pública
**Arquivo:** [package.json#L38](file:///c:/Users/mathe/Desktop/gamers-aposentados/package.json)

A versão pública mais recente do Next.js é `15.x`. O range `^16.1.6` pode ser um canary/RC ou um erro de configuração. Verificar se este é o canal correto de release.

---

## Resumo por Prioridade

| # | Item | Impacto | Esforço |
|---|---|---|---|
| 1 | Auth de ownership nas API routes | 🔴 Segurança | Baixo |
| 2 | Cascade transaction no DELETE de Pool | 🔴 Integridade | Mínimo |
| 8 | Winner identificado por título (bug latente) | 🟠 Bug | Mínimo |
| 12 | `@@unique` em Review | 🟠 Integridade | Baixo |
| 4 | `findMany` de usuários dentro de transação | 🟠 Performance | Baixo |
| 6 | `error: any` → `unknown` | 🟡 Qualidade | Baixo |
| 10 | [joinQuest](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#177-199) sem deduplicação segura | 🟡 UX | Mínimo |
| 14 | Cobertura de testes em reviews | 🟡 QA | Médio |
| 11 | `hltb_time` ou integrar ou remover | 🔵 Manutenção | Médio |
| 17 | Verificar canal de release do Next.js | 🔵 Deps | Mínimo |
