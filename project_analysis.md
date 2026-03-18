# Análise do Projeto — Gamers Aposentados

## 🔴 Crítico (Bugs / Riscos em Produção)

### 1. `fs.writeFileSync` em Server Action de Produção
**Arquivo:** [randomizer-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts#L150-L158)

Há um `require('fs').writeFileSync('prisma-error-dump.txt', ...)` dentro do bloco `catch` da função [saveRandomizerRoll](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts#17-163). Isso:
- **Quebra na Vercel** — o ambiente serverless não tem acesso ao sistema de arquivos local.
- É código de debug que **nunca deveria ir para produção**.

```diff
- const fs = require("fs");
- fs.writeFileSync("prisma-error-dump.txt", String(error) + ...);
+ // Remover completamente — o console.error acima já loga o erro.
```

---

### 2. API Routes Públicas Sem Autenticação
**Arquivos:** [/api/games/route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/games/route.ts), [/api/pools/route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts)

Os endpoints POST, PUT e DELETE dessas routes não verificam se o usuário está autenticado. Qualquer pessoa que descubra a URL pode criar/editar/deletar jogos e pools diretamente.

---

### 3. Token IGDB em Variável de Módulo (Reseta a cada deploy)
**Arquivo:** [igdb.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/igdb.ts#L5-L6)

```typescript
let cachedToken: string | null = null; // Variável de módulo — perdida a cada cold start
```

Em serverless (Vercel), cada invocação pode ser um cold start novo. O cache em memória é ineficaz e resulta em chamadas desnecessárias ao endpoint OAuth da Twitch.

**Solução:** Usar uma tabela simples no banco ou `process.env` para cache, ou usar a abordagem de `cache()` do Next.js.

---

## 🟡 Qualidade de Código

### 4. Duplicação Total: [setFavoriteGames](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#95-151) vs [setFavoriteGamesOfYear](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#152-214)
**Arquivo:** [user-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#L95-L213)

As funções [setFavoriteGames](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#95-151) e [setFavoriteGamesOfYear](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#152-214) são **funcionalmente idênticas** — mesma lógica de upsert de jogo, mesma validação, diferem apenas no campo `favoriteGames` vs `favoriteGamesYear`. ~120 linhas duplicadas.

```typescript
// Refatorar para:
async function setFavoriteGamesBase(
  candidates: GameSearchResult[],
  field: "favoriteGames" | "favoriteGamesYear"
) { ... }
```

---

### 5. `any` Types Espalhados em 15+ Arquivos
Os commentários `// eslint-disable-next-line @typescript-eslint/no-explicit-any` aparecem em mais de 15 arquivos. Os casos mais impactantes para tipar corretamente:
- [mapPoolInput](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts#4-14) e [mapInputToDb](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/games/route.ts#4-20) nas API routes — podem usar interfaces TypeScript simples
- `dataToUpdate` em [quest-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts) — pode usar `Partial<Prisma.GameProgressUpdateInput>`
- Responses do IGDB em [igdb.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/igdb.ts) — pode criar interface `IGDBGame`

---

### 6. `console.log` de Debug em Produção
**Arquivos:** [user-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts), [igdb.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/igdb.ts)

Logs verbosos em produção expõem dados internos e poluem os logs do Vercel:
```typescript
// user-actions.ts — linha 97
console.log("[setFavoriteGames] Received candidates:", JSON.stringify(candidates, null, 2));
```

---

## 🟠 Performance

### 7. Game Lookup por Título (Não pelo IGDB ID)
**Arquivos:** [pool-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L135), [user-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#L110), [randomizer-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts#L39)

Em todos os lugares onde um jogo é salvo (pool, favoritos, randomizer), o lookup é feito por **título de texto**:
```typescript
prisma.game.findFirst({ where: { title: candidate.nome } })
```

Problemas:
- Case-sensitive por padrão no PostgreSQL
- Títulos com caracteres especiais, subtítulos ou espaços extras causam duplicatas no banco
- O IGDB já fornece um [id](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx#20-24) numérico único — esse deveria ser o campo de deduplicação

**Solução:** Adicionar campo `igdb_id String? @unique` ao model [Game](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx#124-131) e fazer lookup por ele.

---

### 8. N+1 Queries em Transações
**Arquivo:** [randomizer-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts#L81-L95), [pool-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L261-L276)

O padrão `for (game of games) { for (user of users) { findUnique + create } }` executa N×M queries sérias dentro de uma transação:

```typescript
// Para 6 jogos × 2 usuários = 12 findUnique + até 12 creates = 24 queries!
for (const game of savedGames) {
    for (const u of allUsers) {
        await tx.gameProgress.findUnique(...)
        await tx.gameProgress.create(...)
    }
}
```

**Solução:** Usar `createMany` com `skipDuplicates: true` — 1 query ao invés de N×M.

---

### 9. Dashboard Faz Muitas Queries Sequenciais
**Arquivo:** [page.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/%28main%29/page.tsx#L29-L31)

O `SELECT id FROM reviews ORDER BY RANDOM()` é executado separadamente e **bloqueia** o início das queries paralelas do `Promise.all` seguinte. São 4 round-trips sequenciais ao banco para renderizar o dashboard.

---

## 🔵 Schema / Dados

### 10. Campo `hltb_time` no Model [Game](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx#124-131) Existe Mas Nunca É Preenchido
**Arquivo:** [schema.prisma](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma#L93)

O schema já tem `hltb_time Int?` — campo pensado para o tempo do HowLongToBeat. Mas nenhum server action atual o preenche. Isso é exatamente o campo que o plano de integração HLTB vai usar — boa notícia!

---

### 11. `Pool.status` é `String` ao Invés de Enum
**Arquivo:** [schema.prisma](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma#L165)

```prisma
status String @default("OPEN") // OPEN, CLOSED
```

O comentário documenta os possíveis valores mas não há garantia de tipo no banco. Deveria ser um enum `PoolStatus` como os outros.

---

## 🟢 Melhorias de UX / Funcionalidade

### 12. Randomizer: Exibição das Seleções do Outro Jogador em Tempo Real
Quando um jogador salva suas seleções, o outro não vê automaticamente. A página requer refresh manual. Uma melhoria simples seria adicionar **polling a cada 30s** para recarregar o pool quando ainda faltam jogos do outro.

### 13. Review: Não Permite Editar Uma Avaliação Já Criada
A [createReview](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts#15-59) retorna erro se já existe uma review para o jogo. Existe [updateReview](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts#102-144), mas a UI não expõe essa função de forma óbvia — o usuário não sabe que pode editar.

### 14. [next.config.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/next.config.ts) — Faltam Domínios de Imagem
O `remotePatterns` só tem `images.igdb.com`. Imagens de avatares do Google (`lh3.googleusercontent.com`) e do Vercel Blob (`*.public.blob.vercel-storage.com`) não estão listadas, o que pode causar warnings ou erros com `next/image`.

```typescript
// Adicionar:
{ protocol: "https", hostname: "lh3.googleusercontent.com" },
{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
```

---

## Resumo por Prioridade

| # | Item | Impacto | Esforço |
|---|---|---|---|
| 1 | Remover `fs.writeFileSync` | 🔴 Crítico | Mínimo |
| 2 | Auth nas API routes | 🔴 Segurança | Baixo |
| 7 | Game lookup por IGDB ID | 🟠 Alto | Médio |
| 8 | N+1 → `createMany` | 🟠 Alto | Baixo |
| 4 | Deduplicar setFavoriteGames | 🟡 Médio | Baixo |
| 14 | next.config remotePatterns | 🟡 Médio | Mínimo |
| 3 | Cache token IGDB | 🟡 Médio | Médio |
| 11 | Pool.status → Enum | 🔵 Baixo | Médio |
| 5 | Eliminar `any` types | 🔵 Baixo | Alto |
