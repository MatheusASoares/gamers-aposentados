# 🛡️ Relatório de Auditoria e Diagnóstico Técnico Completo (Gamers Aposentados)

> **Data da Auditoria:** 17 de Agosto de 2026  
> **Escopo:** Next.js (App Router), Prisma ORM, NextAuth v5, Server Actions, API Routes, Serviços de Deals (ITAD/Steam), Inteligência Artificial (Gemini), Componentes React e Banco de Dados PostgreSQL.  
> **Status Geral do Projeto:** 🟢 Operacional com correções críticas recomendadas em segurança, roteamento de middleware, integridade de transações e concorrência.

---

## 📑 Índice Executivo

1. [🔴 Bugs Críticos e Erros de Lógica](#1-bugs-críticos-e-erros-de-lógica)
2. [🔒 Vulnerabilidades de Segurança e Autenticação](#2-vulnerabilidades-de-segurança-e-autenticação)
3. [⚡ Problemas de Performance e Consultas N+1](#3-problemas-de-performance-e-consultas-n1)
4. [⚛️ Componentes React, Vazamento de Memória e Acessibilidade](#4-componentes-react-vazamento-de-memória-e-acessibilidade)
5. [🗄️ Modelagem de Banco de Dados, Prisma e Integridade Referencial](#5-modelagem-de-banco-de-dados-prisma-e-integridade-referencial)
6. [📋 Plano de Remediação com Exemplos de Código](#6-plano-de-remediação-com-exemplos-de-código)

---

## 1. 🔴 Bugs Críticos e Erros de Lógica

### 1.1 Regra de Bloqueio em `joinQuest` Impede Início de Quests Sorteadas (`SUGGESTED`) - DONE

- **Arquivo:** [`src/app/lib/quest-actions.ts:243-286`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#L243-L286)
- **Gravidade:** **Alta**
- **Causa Raiz:** Quando uma pool é sorteada pelo Randomizer, registros em `game_progress` são criados com status `SUGGESTED`. Quando um jogador clica em _"Entrar na Quest"_, a função `joinQuest` encontra o registro existente e cai no bloco que valida se o jogo já foi dropado:
    ```typescript
    // Trecho em quest-actions.ts
    const droppedCount = allProgresses.filter((p) => p.status === "DROPPED").length;
    if (droppedCount >= activeUserIds.length) {
        // Reativa...
    } else {
        return {
            success: false,
            error: "Este jogo não pode ser iniciado porque não foi abandonado (dropped) por ambos os jogadores oficiais.",
        };
    }
    ```
- **Consequência:** Para um jogo recém-sorteado (`status: "SUGGESTED"`), `droppedCount` é `0`. Como `0 < 2`, o sistema rejeita a entrada do jogador com uma mensagem de erro incorreta, impossibilitando que jogadores entrem em quests novas.
- **Correção:** Tratar explicitamente o status `SUGGESTED` antes da checagem de `DROPPED`.

---

### 1.2 `NoticeBoardMuralClient` Falha em Múltiplos Usuários e Usuários Novos - DONE

- **Arquivo:** [`src/components/contracts/NoticeBoardMuralClient.tsx:205-207, 332-334`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/contracts/NoticeBoardMuralClient.tsx#L332-L334) e [`src/app/lib/notice-board-actions.ts:61-78`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/notice-board-actions.ts#L61-L78)
- **Gravidade:** **Alta**
- **Causa Raiz:**
    1. No client component, o código lê `const progress = contract.user_progresses[0];`. Se o array contiver múltiplos progressos ou estiver ordenado de forma diferente, ele exibe o status de outro jogador.
    2. Se um novo usuário se cadastrar ou acessar `/board` após a geração dos contratos, `contract.user_progresses` estará vazio (`[]`). Ao tentar completar um contrato, `progress?.id` será `""`, causando exceção `"Contrato não encontrado"` em `completeContractAction`.
- **Correção:** Garantir criação automática (upsert) do progresso do usuário logado ao carregar contratos e filtrar `user_progresses` estritamente pelo `session.user.id`.

---

### 1.3 `executeRoll` Ignora Reativação de Jogos Previamente Dropados - DONE

- **Arquivo:** [`src/app/lib/pool-actions.ts:411-420`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L411-L420)
- **Gravidade:** **Média-Alta**
- **Causa Raiz:** As regras de negócio permitem que um jogo re-entre na pool se ambos os jogadores o tiverem dropado. No entanto, ao sortear o vencedor, o sorteio executa:
    ```typescript
    await tx.gameProgress.updateMany({
        where: {
            game_id: winnerEntry.game_id,
            status: "SUGGESTED", // ❌ Só atualiza se for SUGGESTED
        },
        data: {
            status: "ACTIVE",
            start_date: new Date(),
        },
    });
    ```
    Se os jogadores tinham o jogo com status `DROPPED`, seus registros não são atualizados para `ACTIVE`.
- **Correção:** Atualizar o status para `ACTIVE` para todos os `activeUsers` independentemente do status anterior (exceto se já estiver COMPLETED).

---

### 1.4 Inconsistência de IDs (UUID vs IGDB ID) no Randomizer- done

- **Arquivo:** [`src/app/lib/pool-actions.ts:131`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L131)
- **Gravidade:** **Média**
- **Detalhes:** Em `getOpenPool`, `gameIgdbId` é populado com `e.game_id` (o UUID interno do PostgreSQL) em vez de `e.game.igdb_id`. Ao salvar novamente a seleção via `saveSelections`, o frontend envia o UUID no campo `igdbId`, forçando o backend a buscar sempre por título em vez do ID externo real da IGDB.

---

### 1.5 Falha na Recalculação de XP ao Dropar Quest - DONE

- **Arquivo:** [`src/app/lib/quest-actions.ts:129-178`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#L129-L178)
- **Gravidade:** **Média**
- **Detalhes:** As ações `updateQuestProgress` e `completeQuest` disparam `recalculateUserXPAndLevel`. No entanto, `dropQuest` não dispara essa função. Se um usuário marcar um jogo como concluído e depois decidir dropá-lo, o XP continuará creditado indevidamente até uma futura sincronização.

---

## 2. 🔒 Vulnerabilidades de Segurança e Autenticação

### 2.1 Server Action Pública Sem Autenticação: `runBackfillXP` - DONE

- **Arquivo:** [`src/app/lib/gamification-actions.ts:243-260`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/gamification-actions.ts#L243-L260)
- **Gravidade:** **Alta (CWE-306 / Missing Authentication for Critical Function)**
- **Vulnerabilidade:** A função `runBackfillXP` está exposta como uma Server Action (`"use server"`) sem nenhuma verificação de sessão (`auth()`) ou checagem de permissão de administrador.
- **Risco:** Qualquer usuário anônimo na internet pode invocar essa ação remotamente enviando uma requisição POST para o endpoint RPC do Next.js, forçando o recálculo massivo de XP de todos os usuários do banco em loop, causando exaustão de CPU e DoS.
- **Correção:** Adicionar validação de sessão e restringir a execução apenas a emails autorizados (`isRandomizerPlayer`).

---

### 2.2 Troca de Senha Sem Exigir Senha Atual (`changePassword`) - DONE

- **Arquivo:** [`src/app/lib/user-actions.ts:70-91`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#L70-L91)
- **Gravidade:** **Alta (CWE-620 / Unverified Password Change)**
- **Vulnerabilidade:** A função `changePassword` recebe apenas `{ newPassword }` e sobrescreve o hash no banco sem exigir e validar a senha atual do usuário (`currentPassword`).
- **Risco:** Em caso de sessão ativa aberta em dispositivo compartilhado ou ataque de CSRF/XSS, a conta pode ser sequestrada permanentemente sem que o invasor conheça a credencial original.
- **Correção:** Validar `currentPassword` com `bcrypt.compare` antes de permitir a alteração.

---

### 2.3 Risco de Apicalypse Query Injection na Integração IGDB -DPNE

- **Arquivo:** [`src/app/lib/igdb.ts:76, 136`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/igdb.ts#L76)
- **Gravidade:** **Média (CWE-943 / Improper Neutralization of Special Elements in Data Query)**
- **Vulnerabilidade:** O parâmetro `query` e `title` são interpolados diretamente na sintaxe da API Apicalypse:
    ```typescript
    body: `search "${query}"; fields name, cover.image_id, ...;`;
    ```
    Se o usuário pesquisar por termos contendo aspas duplas (ex: `Resident Evil "Nemesis"` ou `Dark Souls"; where...`), a consulta quebra com erro 400 ou pode alterar a estrutura de filtros do payload Apicalypse.
- **Correção:** Sanitizar e escapar aspas duplas: `const sanitized = query.replace(/"/g, '\\"');`.

---

### 2.4 Upload de Arquivos com Parâmetro `folder` Não Sanitizado

- **Arquivo:** [`src/app/api/upload/route.ts:33-35`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/upload/route.ts#L33-L35)
- **Gravidade:** **Média**
- **Vulnerabilidade:** O campo `folder` é extraído diretamente do `FormData` sem validação contra uma lista de pastas permitidas (whitelist):
    ```typescript
    const folder = (formData.get("folder") as string) || "avatars";
    ```
- **Correção:** Adicionar lista estrita de pastas válidas: `const ALLOWED_FOLDERS = ["avatars", "screenshots", "covers"] as const;`.

---

### 2.5 Ausência de Validação de Intervalo em `updateQuestProgress`

- **Arquivo:** [`src/app/lib/quest-actions.ts:11-14`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#L11-L14)
- **Gravidade:** **Baixa-Média**
- **Vulnerabilidade:** O parâmetro `percentage` não é validado com schema Zod. Um usuário autenticado pode enviar números negativos (ex: `-50`) ou superiores a 100 (ex: `99999`), corrompendo a integridade visual da barra de progresso.
- **Correção:** Validar com Zod: `z.number().int().min(0).max(100)`.

---

## 3. ⚡ Problemas de Performance e Consultas N+1

### 3.1 `ORDER BY RANDOM()` no Carregamento do Dashboard

- **Arquivo:** [`src/app/(main)/page.tsx:52-66`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/%28main%29/page.tsx#L52-L66)
- **Impacto:** O comando SQL `ORDER BY RANDOM() LIMIT 5` força o PostgreSQL a escanear e ordenar toda a tabela `reviews`. À medida que a base de reviews cresce, essa query degrada o tempo de resposta do dashboard principal.
- **Otimização:** Selecionar IDs recentes ou usar amostragem baseada em offset determinístico.

---

### 3.2 Loop N+1 de Atualização Sequencial no Endpoint `/api/ai/hltb`

- **Arquivo:** [`src/app/api/ai/hltb/route.ts:183-206`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/ai/hltb/route.ts#L183-L206)
- **Impacto:** O endpoint percorre os jogos retornados pela IA executando `await prisma.game.updateMany` sequencialmente um por um dentro de um `for` loop:
    ```typescript
    for (const aiResult of parsedData.results) {
        if (aiResult.mainStory !== null) {
            await prisma.game.updateMany({ ... }); // ❌ N queries sequenciais
        }
    }
    ```
- **Otimização:** Agrupar as atualizações dentro de um `prisma.$transaction([...])` com `Promise.all`.

---

### 3.3 Upload Sequencial de Imagens nos Modais de Review

- **Arquivos:** [`src/components/reviews/AddReviewModal.tsx:120-140`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/reviews/AddReviewModal.tsx#L120-L140) e [`src/components/reviews/EditReviewModal.tsx:114-144`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/reviews/EditReviewModal.tsx#L114-L144)
- **Impacto:** Ao anexar 4 screenshots, a função `uploadAllScreenshots` realiza requisições HTTP POST para `/api/upload` de forma serial dentro de um loop `for...of`. Se cada upload demorar 800ms, o usuário espera mais de 3.2 segundos.
- **Otimização:** Disparar os uploads em paralelo utilizando `Promise.all(screenshots.map(...))`.

---

### 3.4 Query Redundante ao Banco no Dashboard

- **Arquivo:** [`src/app/(main)/page.tsx:271-275`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/%28main%29/page.tsx#L271-L275)
- **Impacto:** O código executa um `prisma.$queryRaw` para buscar `equipped_frame` e `equipped_banner`, mesmo já tendo executado um `prisma.user.findUnique` linhas acima. Como essas colunas já fazem parte do schema Prisma, uma consulta extra é desperdiçada.
- **Otimização:** Incluir `equipped_frame` e `equipped_banner` diretamente no `select` do `findUnique`.

---

## 4. ⚛️ Componentes React, Vazamento de Memória e Acessibilidade

### 4.1 Vazamento de Memória com `URL.createObjectURL` Sem `revokeObjectURL`

- **Arquivos:**
    - [`src/components/reviews/AddReviewModal.tsx:95`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/reviews/AddReviewModal.tsx#L95)
    - [`src/components/reviews/EditReviewModal.tsx:90`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/reviews/EditReviewModal.tsx#L90)
    - [`src/components/profile/avatar-upload.tsx:45`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/profile/avatar-upload.tsx#L45)
- **Problema:** Strings `blob:http://...` criadas pelo navegador permanecem alocadas na memória do DOM até o descarregamento da página. Se o usuário abrir o modal, selecionar imagens e fechar sem submeter, os buffers de imagem não são liberados.
- **Correção:** Adicionar cleanup no `useEffect` de desmontagem ou revogar URLs no fechamento do modal.

---

### 4.2 Estado Dessincronizado no Modal de Edição (`EditReviewModal`)

- **Arquivo:** [`src/components/reviews/EditReviewModal.tsx:58-66`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/reviews/EditReviewModal.tsx#L58-L66)
- **Problema:** O formulário inicializa o estado uma única vez na montagem via `useState(review.rating)`. Caso as props do componente mudem ou o modal seja reutilizado, os inputs não refletem os dados atualizados.
- **Correção:** Sincronizar o estado com a prop `review` quando o modal for aberto (`useEffect` ouvindo `open` e `review.id`).

---

### 4.3 Falta de Tratamento de Erro / Type Guard em `GameAutocomplete`

- **Arquivo:** [`src/components/ui/game-autocomplete.tsx:39-40`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/ui/game-autocomplete.tsx#L39-L40)
- **Problema:** Se a rota `/api/igdb` retornar um objeto de erro (ex: `{ error: "Unauthorized" }`), a linha `setResults(data)` atribui um objeto não-iterável ao estado. Na renderização, `results.map` estoura com: `TypeError: results.map is not a function`.
- **Correção:** Usar `setResults(Array.isArray(data) ? data : [])`.

---

## 5. 🗄️ Modelagem de Banco de Dados, Prisma e Integridade Referencial

### 5.1 Faltam Índices Essenciais no `prisma/schema.prisma`

- **Arquivo:** [`prisma/schema.prisma`](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma)
- **Problema:** As tabelas mais movimentadas não possuem índices nas colunas filtradas frequentemente:
    - `Game`: Falta índice em `title` e `created_at`.
    - `GameProgress`: Falta índice composto em `@@index([user_id, status])` e `@@index([game_id, status])`.
    - `Pool`: Falta índice composto em `@@index([type, status, created_at])`.
    - `Review`: Falta índice em `created_at`.

### 5.2 Comportamento de Exclusão em Cascata Incompleto

- **Arquivo:** [`prisma/schema.prisma:164-165, 203-205`](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma#L164-L165)
- **Problema:**
    - `Review.user`: Falta `onDelete: Cascade`. Se um usuário for deletado, o banco recusa a exclusão por violação de chave estrangeira.
    - `PoolEntry.pool` e `PoolEntry.user`: Faltam `onDelete: Cascade`.

---

## 6. 📋 Plano de Remediação com Exemplos de Código

### Correção 1: Corrigir Lógica de Desbloqueio em `joinQuest`

```typescript
// src/app/lib/quest-actions.ts
if (existing) {
    if (existing.status === "ACTIVE") {
        return { success: true };
    }

    if (existing.status === "COMPLETED") {
        return {
            success: false,
            error: "Este jogo já foi concluído e não pode ser jogado novamente.",
        };
    }

    // Se o jogo está no status inicial de sorteio (SUGGESTED), permite iniciar diretamente!
    if (existing.status === "SUGGESTED") {
        await tx.gameProgress.update({
            where: { id: existing.id },
            data: {
                status: "ACTIVE",
                progress_percentage: 0,
                start_date: new Date(),
                end_date: null,
            },
        });
        return { success: true };
    }

    // Caso contrário (estava DROPPED), aplica a regra de ambos terem dropado
    const activeUsers = await tx.user.findMany({
        where: { email: { in: RANDOMIZER_PLAYER_EMAILS } },
        select: { id: true },
    });
    const activeUserIds = activeUsers.map((u) => u.id);

    const allProgresses = await tx.gameProgress.findMany({
        where: {
            game_id: gameId,
            user_id: { in: activeUserIds },
        },
    });

    const droppedCount = allProgresses.filter((p) => p.status === "DROPPED").length;
    if (droppedCount >= activeUserIds.length) {
        await tx.gameProgress.update({
            where: { id: existing.id },
            data: {
                status: "ACTIVE",
                progress_percentage: 0,
                start_date: new Date(),
                end_date: null,
            },
        });
        return { success: true };
    }

    return {
        success: false,
        error: "Este jogo não pode ser iniciado porque não foi abandonado por ambos os jogadores oficiais.",
    };
}
```

---

### Correção 2: Proteger `runBackfillXP` e Validar Senha Atual em `changePassword`

```typescript
// src/app/lib/gamification-actions.ts
export async function runBackfillXP(): Promise<{
    success: boolean;
    count?: number;
    error?: string;
}> {
    const session = await auth();
    if (!session?.user?.email || !isRandomizerPlayer(session.user.email)) {
        return { success: false, error: "Acesso não autorizado." };
    }
    // Executa recálculo...
}
```

```typescript
// src/app/lib/user-actions.ts
const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "A senha atual é obrigatória."),
    newPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres."),
});

export async function changePassword(data: z.infer<typeof ChangePasswordSchema>) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Não autenticado." };

    const validation = ChangePasswordSchema.safeParse(data);
    if (!validation.success) return { success: false, error: "Dados inválidos." };

    const { currentPassword, newPassword } = validation.data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.password) {
        return {
            success: false,
            error: "Usuário não encontrado ou autenticado por provedor social.",
        };
    }

    const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordsMatch) {
        return { success: false, error: "A senha atual está incorreta." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
    });

    return { success: true };
}
```

---

### Correção 3: Paralelizar Upload de Screenshots

```typescript
// src/components/reviews/AddReviewModal.tsx
const uploadAllScreenshots = async (): Promise<string[]> => {
    return Promise.all(
        screenshots.map(async (item) => {
            const formData = new FormData();
            formData.append("file", item.file);
            formData.append("folder", "screenshots");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Falha ao enviar screenshot.");
            }

            const data = await res.json();
            return data.url as string;
        }),
    );
};
```

---

## 📊 Matriz Resumo de Severidade

| Categoria                   | Total de Itens | Crítico | Alto  | Médio  | Baixo |
| :-------------------------- | :------------: | :-----: | :---: | :----: | :---: |
| **Bugs Críticos & Lógica**  |       5        |    0    |   2   |   3    |   0   |
| **Segurança & Auth**        |       5        |    0    |   2   |   2    |   1   |
| **Performance & Queries**   |       4        |    0    |   0   |   3    |   1   |
| **React, Memória & UI**     |       3        |    0    |   0   |   2    |   1   |
| **Prisma & Banco de Dados** |       2        |    0    |   0   |   2    |   0   |
| **Total**                   |     **19**     |  **0**  | **4** | **12** | **3** |
