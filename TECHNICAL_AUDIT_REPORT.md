# 🛡️ Relatório de Auditoria e Diagnóstico Técnico Completo (Gamers Aposentados)

> **Data da Auditoria:** 8 de Março de 2026  
> **Escopo:** Server Actions (`src/app/lib/`), Rotas de API (`src/app/api/`), Componentes React (`src/components/`), Modelo de Dados (`prisma/schema.prisma`), Autenticação e Autorização (NextAuth v5 & RBAC).  
> **Status de Compilação:** `npx tsc --noEmit` ✅ (0 erros) | **Playwright:** 116 testes em 37 arquivos ✅ (100% de aprovação na suíte existente) | **ESLint:** 36 erros e 55 warnings ❌ (Regras de Hooks violadas no Randomizer, `prefer-const`, tags HTML `<a>`).

---

## 📑 Sumário Executivo

A aplicação **Gamers Aposentados** apresenta uma arquitetura rica e moderna com **Next.js 16 (App Router)**, **React 19**, **NextAuth v5**, **Prisma ORM 6** e **Tailwind CSS 4**. O sistema gerencia sorteios colaborativos de jogos (Randomizer/Pools), progressão individual e cooperativa de quests, avaliações com upload de mídias, quadro de avisos com contratos atômicos, gamificação com títulos/molduras/banners e rastreamento de promoções (Steam/ITAD).

Apesar de a suíte de testes pontuais passar com sucesso, esta auditoria técnica identificou **vulnerabilidades críticas de segurança** (incluindo escalação de privilégios de Administrador por domínio `@test.com`), **violações severas das Regras de Hooks do React 19** que causam inconsistências de renderização no componente principal do Randomizer, **possibilidade de negação de serviço (loop infinito no cálculo de XP)** e **gargalos de concorrência e performance (consultas N+1)**.

---

## 1. 🔴 Bugs Críticos e Erros de Lógica

### 1.1 Violação Grave das Regras de Hooks no `RandomizerClient.tsx` (React 19 / Compiler Breaking) - [DONE]
- **Arquivos e Linhas:** 
  - [`src/components/game/RandomizerClient.tsx:99-106`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx#L99-L106)
  - [`src/components/game/RandomizerClient.tsx:464-473`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx#L464-L473)
- **Gravidade:** **Crítica**
- **Causa Raiz:**
  1. No início de `RandomizerClient`, existe um retorno antecipado condicional antes da declaração de todos os React Hooks:
     ```typescript
     if (!canAddGames) {
         return (
             <PersonalQuestHub
                 currentUserId={currentUserId}
                 currentUserName={currentUserName}
             />
         );
     }
     const { data: session } = useSession(); // ❌ Hook chamado APÓS retorno antecipado
     const [questType, setQuestType] = useState<QuestType>("SIDE");
     // ... outros 26 hooks (useState, useCallback, useEffect)
     ```
  2. Mais abaixo, na linha 464, após dezenas de declarações de funções auxiliares e lógica de sorteio, novos hooks são invocados tardiamente:
     ```typescript
     const [cycleText, setCycleText] = useState<string>("");
     const cycleIntervalRef = useRef<NodeJS.Timeout | null>(null);
     useEffect(() => { ... }, []);
     ```
- **Impacto:** O ESLint detecta **28 erros de `react-hooks/rules-of-hooks`**. No React 19 com o React Compiler ativo, chamadas condicionais de hooks quebram a ordem determinística do array interno de fibras do React. Se o estado `canAddGames` oscilar ou um usuário transitar de permissão, o React lança o erro fatal em runtime: *"Rendered fewer hooks than expected. This may be caused by an accidental early return statement."*
- **Remediação:** Mover todos os hooks incondicionalmente para o topo do componente, ou encapsular a renderização condicional em um componente pai estruturado.

---

### 1.2 Loop Infinito e Negação de Serviço (DoS) em `calculateLevelFromXP` - [DONE]
- **Arquivo e Linhas:** [`src/app/lib/xp-engine.ts:110-134`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/xp-engine.ts#L110-L134)
- **Gravidade:** **Crítica (Disponibilidade / CPU 100%)**
- **Causa Raiz:**
  ```typescript
  export function calculateLevelFromXP(totalXP: number) {
    let level = 1;
    let accumulated = 0;
    while (true) {
      const xpNeeded = getXPForNextLevel(level);
      if (accumulated + xpNeeded > totalXP) {
        // ...
        return { level, currentLevelXP, nextLevelXP: xpNeeded, progressPercentage };
      }
      accumulated += xpNeeded;
      level++;
    }
  }
  ```
  Se `totalXP` for passado como `NaN` (ocorrência comum se houver erro aritmético em HLTB nulo ou campos numéricos corrompidos no banco), a expressão `accumulated + xpNeeded > NaN` avalia **sempre como `false`** em JavaScript. O laço `while (true)` nunca encerra, travando a thread do Node.js/Vercel Serverless Function em 100% de CPU até estourar timeout ou memória.
  Além disso, se `totalXP` for negativo, `progressPercentage` retorna valores negativos inválidos (ex: `-13%`).
- **Remediação:** Sanitizar explicitamente `if (!Number.isFinite(totalXP) || totalXP < 0) totalXP = 0;` antes de iniciar o loop e estipular um limite máximo defensivo de iterações (`level <= 999`).

---

### 1.3 Condição de Corrida (Race Condition) e Falta de Atomicidade em `updateQuestProgress` - [DONE]
- **Arquivo e Linhas:** [`src/app/lib/quest-actions.ts:74-124`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#L74-L124)
- **Gravidade:** **Alta**
- **Causa Raiz:** O método verifica a existência prévia de `gameProgress` via `findUnique` fora de uma transação serializável ou operação atômica de `upsert`:
  ```typescript
  const existing = await prisma.gameProgress.findUnique({
      where: { user_id_game_id: { user_id: session.user.id, game_id: gameId } },
  });
  if (existing) {
      await prisma.gameProgress.update(...);
  } else {
      await prisma.gameProgress.create(...);
  }
  ```
  Se o usuário interagir rapidamente com o slider de progresso ou submeter múltiplos ajustes concorrentes, requisições simultâneas tentarão o `prisma.gameProgress.create(...)` ao mesmo tempo, disparando exceção `PrismaClientKnownRequestError` código `P2002` (violação da constraint única `@@unique([user_id, game_id])`).
- **Remediação:** Substituir o bloco `findUnique` + `if/else` por um único `prisma.gameProgress.upsert(...)`.

---

### 1.4 Chamadas Síncronas de `setState` em Efeitos (`react-hooks/set-state-in-effect`) - [DONE]
- **Arquivos e Linhas:**
  - [`src/components/deals/SteamSaleCountdownCard.tsx:55`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/deals/SteamSaleCountdownCard.tsx#L55) (`setIsMounted(true)`)
  - [`src/components/guild/GuildMascotCompanion.tsx:65`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/guild/GuildMascotCompanion.tsx#L65) (`setHasImageError(false)`)
  - [`src/components/layout/bottom-nav.tsx:87`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/layout/bottom-nav.tsx#L87) (`setIsMoreOpen(false)`)
- **Gravidade:** **Média**
- **Causa Raiz:** Disparo síncrono de atualização de estado no corpo de `useEffect`, provocando re-renderizações em cascata e degradação de Core Web Vitals (INP - Interaction to Next Paint).
- **Remediação:**
  - Para `isMounted`: Inicializar via `useSyncExternalStore` ou computar estados derivados sem re-render desnecessário.
  - Para o Mascot e o BottomNav: Resetar estados no manipulador de evento de transição ou usar chave (`key={mascot?.id}`) para reset estrutural de estado pelo React.

---

### 1.5 Erros de Sintaxe e Linting que Impedem Builds Estritos - [DONE]
- **Arquivos e Linhas:**
  - [`src/services/deals/dealsOracleService.ts:320`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/services/deals/dealsOracleService.ts#L320): Variável `let steamAppId` nunca é reatribuída (`prefer-const`).
  - [`src/components/guild/GuildRewardsCustomizationModule.tsx:144`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/guild/GuildRewardsCustomizationModule.tsx#L144): Variável `let payload` nunca é reatribuída (`prefer-const`).
  - [`src/app/(main)/guild/page.tsx:44`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/(main)/guild/page.tsx#L44): Uso de tag nativa `<a>` para navegação interna de página em vez do `<Link>` do `next/link`.

---

## 2. 🔒 Vulnerabilidades de Segurança e Autenticação

### 2.1 Backdoor e Escalação de Privilégios de Administrador por Domínio `@test.com` (CWE-269 / CWE-284) - [DONE]
- **Arquivos e Linhas:**
  - [`src/lib/permissions.ts:20`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/lib/permissions.ts#L20)
  - [`src/lib/randomizer-players.ts:26`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/lib/randomizer-players.ts#L26)
  - [`src/app/lib/actions.ts:58`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/actions.ts#L58)
  - [`src/app/lib/pool-actions.ts:226, 441`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L226)
  - [`src/components/game/RandomizerClient.tsx:149`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx#L149)
- **Gravidade:** **Crítica (CVSS 9.8)**
- **Vulnerabilidade:**
  Para facilitar testes automatizados em ambientes locais, foi inserida a verificação `lower.endsWith("@test.com")` em múltiplos pontos nevrálgicos de autorização:
  ```typescript
  // permissions.ts
  export function isGuildMaster(user: UserPermissionContext | null | undefined): boolean {
      if (!user) return false;
      if (user.role === "GUILD_MASTER") return true;
      if (user.email) {
          const lower = user.email.toLowerCase();
          if (RANDOMIZER_PLAYER_EMAILS.includes(lower) || lower.endsWith("@test.com")) return true; // ⚠️ BACKDOOR
      }
      return false;
  }
  ```
  E na Server Action pública de registro de usuário (`src/app/lib/actions.ts:58`):
  ```typescript
  await prisma.guildMember.create({
      data: {
          guild_id: founderGuild.id,
          user_id: user.id,
          role: "MEMBER",
          is_active: email.endsWith("@test.com"), // ⚠️ Inversão de lógica de negócio
      },
  });
  ```
- **Vetor de Ataque:** Qualquer pessoa na internet pode acessar a rota `/register` e cadastrar uma conta como `qualquercoisa@test.com`. Como não há verificação de e-mail por código/link, a conta é criada imediatamente. O sistema automaticamente concede:
  1. `isGuildMaster === true` (acesso irrestrito a configurações de guilda, moderação e sorteios).
  2. `isRandomizerPlayer === true` (capacidade de manipular potes de jogos oficiais).
  3. `is_active === true` na guilda dos Fundadores.
  Em contrapartida, **um usuário legítimo que se cadastrar com `@gmail.com` ou `@outlook.com` recebe `is_active: false`**, ficando bloqueado de participar da guilda principal!
- **Remediação:** Restringir privilégios estritamente à checagem de banco (`user.role === "GUILD_MASTER"` ou `RANDOMIZER_PLAYER_EMAILS`), desativando checagens por sufixo de domínio em produção (`process.env.NODE_ENV === "test"` apenas quando necessário).

---

### 2.2 Falta de Verificação de Guilda em Votações e Propostas Especiais (BOLA / IDOR) - [DONE]
- **Arquivo e Linhas:** [`src/app/lib/special-game-actions.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/special-game-actions.ts) e [`src/lib/special-game-permissions.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/lib/special-game-permissions.ts)
- **Status:** 🟢 **REMEDIADO (Testes em `tests/special-game-voting.spec.ts` 100% aprovados)**
- **Gravidade:** **Alta (CWE-639 / Insecure Direct Object References)**

- **Vulnerabilidade:** A ação `voteSpecialGameProposal(proposalId, approved)` valida a sessão do usuário, mas **não valida se o usuário pertence à mesma guilda (`proposal.guild_id`) vinculada à proposta**:
  ```typescript
  const proposal = await prisma.specialGameProposal.findUnique({
      where: { id: proposalId },
      include: { votes: true },
  });
  // Não há verificação se session.user.id pertence a proposal.guild_id!
  ```
- **Impacto:** Um membro de uma Guilda B pode votar ou sabotar uma votação de pausa ativa de uma Guilda A bastando enviar o UUID da proposta na requisição RPC.
- **Remediação:** Exigir validação de `guildMember` para o `proposal.guild_id` antes de registrar o voto.

---

### 2.3 Ausência de Validação de Domínio em Screenshots de Reviews (CWE-20 / IP Tracking & SSRF) - [DONE]
- **Arquivo e Linhas:** [`src/app/lib/review-actions.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/review-actions.ts) e [`src/lib/file-validation.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/lib/file-validation.ts)
- **Status:** 🟢 **REMEDIADO (Validado via `isValidScreenshotUrl` com 10/10 testes aprovados em `tests/upload-sanitization.spec.ts`)**
- **Gravidade:** **Média-Alta**
- **Vulnerabilidade:** Na criação de reviews, URLs arbitrárias de screenshots eram salvas e carregadas no feed por outros usuários sem restrição de domínio ou protocolo.
- **Remediação:** Implementado `isValidScreenshotUrl` com allowlist estrita (Vercel Blob, caminhos locais seguros e CDNs de jogos), bloqueando SSRF, IPs privados e domínios de rastreamento.


---

### 2.4 Ausência de Rate Limiting nas Ações de Autenticação (`actions.ts`) - [DONE]
- **Arquivo e Linhas:** [`src/app/lib/actions.ts:18-84`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/actions.ts#L18-L84) e [`src/lib/rate-limiter.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/lib/rate-limiter.ts)
- **Status:** 🟢 **REMEDIADO (Proteção contra força bruta/DDoS implementada via `InMemoryRateLimiter` com 6/6 testes aprovados em `tests/auth-rate-limiting.spec.ts`)**
- **Gravidade:** **Média (CWE-307 / Credential Stuffing & CPU DoS)**
- **Vulnerabilidade:** Os métodos `register` e `authenticate` executavam hashing Bcrypt (`bcrypt.hash(password, 10)`) e consultas ao banco sem nenhum limitador de tentativas por IP ou e-mail.
- **Impacto:** Permitia ataques de força bruta contra senhas de usuários e exaustão intencional de CPU no servidor através do disparo massivo de requisições de registro com cálculo de hash.
- **Remediação Concluída:** Implementado limitador com algoritmo Sliding Window (Janela Deslizante) e pruning automático de memória. Aplicadas cotas defensivas:
  - Registro (`register`): 5 requisições a cada 15 minutos por IP.
  - Login (`authenticate`): 10 requisições a cada 15 minutos por IP; 5 requisições a cada 15 minutos por e-mail (defesa dual contra credential stuffing e IP switching). Retorna tempo amigável de espera (`resetSeconds`) em português.

---

## 3. ⚡ Problemas de Performance e Consultas N+1

### 3.1 Consultas N+1 e Laços Sequenciais em Recálculo de Gamificação
- **Arquivos e Linhas:**
  - [`src/app/lib/xp-engine.ts:187-243`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/xp-engine.ts#L187-L243)
  - [`src/app/lib/gamification-actions.ts:196-218`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/gamification-actions.ts#L196-L218)
  - [`src/app/lib/guild-gamification-actions.ts:60-120`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/guild-gamification-actions.ts#L60-L120)
- **Gravidade:** **Média-Alta**
- **Causa Raiz:**
  1. A função `runBackfillXP` recupera todos os usuários e executa `recalculateUserXPAndLevel` em um loop sequencial `for (const u of users)`.
  2. Para cada usuário, são disparadas buscas individuais em `gameProgress`, `reviews`, `user.findUnique` e `user.update`.
  3. Com 100 usuários, são efetuadas mais de 400 consultas isoladas ao banco PostgreSQL em cascata, bloqueando a conexão.
- **Remediação:** Utilizar agregação SQL nativa (`COUNT`, `SUM` agrupados por `user_id`) para calcular o XP total de múltiplos usuários em uma única consulta, e executar os updates via batch (`prisma.$executeRaw` com `UPDATE users AS u SET ... FROM (...)`).

---

### 3.2 Monólito de Client Component no `RandomizerClient.tsx` (92 KB / 1471 Linhas)
- **Arquivo:** [`src/components/game/RandomizerClient.tsx`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx)
- **Gravidade:** **Média**
- **Causa Raiz:** O arquivo centraliza múltiplas responsabilidades desproporcionais:
  - Síntese de áudio procedural via Web Audio API (`AudioContext`, osciladores de som de dados rolando);
  - Animação de roleta e slots visuais;
  - Busca de dados de HLTB e autopreenchimento de capas IGDB;
  - Modais de votação de pausa ativa e jogos especiais;
  - Gerenciamento de cotas de membros e snapshot de cancelamento.
- **Impacto:** O payload JavaScript enviado para a página `/randomizer` é excessivamente pesado, aumentando o tempo de hidratação e degradando o Time to Interactive (TTI) em dispositivos móveis.
- **Remediação:** Modularizar o componente em submódulos dedicados (`RandomizerAudio.ts`, `RandomizerSlots.tsx`, `RandomizerNominationGrid.tsx`, `SpecialGameModal.tsx`).

---

### 3.3 Índices Ausentes no Banco de Dados (`schema.prisma`)
- **Arquivo:** [`prisma/schema.prisma`](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma)
- **Gravidade:** **Média**
- **Campos Faltantes:**
  1. `SpecialGameProposal`: Lacks index on `proposer_id`. Buscas de propostas criadas por um usuário realizam Seq Scan na tabela `special_game_proposals`.
  2. `UserTrackedDeal`: Possui índice em `user_id`, mas queries que buscam por `deal_id` ou `steam_app_id` isoladamente realizam varredura sequencial.
  3. `CampaignContract`: Falta índice composto em `[guild_id, sequence_order]` para otimização do Mural de Contratos em guildas com alta densidade de contratos.
- **Remediação:** Adicionar as diretivas `@@index([proposer_id])`, `@@index([deal_id])` e `@@index([guild_id, sequence_order])` no `schema.prisma`.

---

## 4. 🧹 Qualidade de Código e Inconsistências Arquiteturais

### 4.1 Inconsistência de Acesso a Dados: Mistura de Prisma ORM com `$executeRaw`
- **Arquivo e Linhas:** [`src/app/lib/gamification-actions.ts:125, 153, 180`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/gamification-actions.ts#L125)
- **Detalhes:**
  Enquanto títulos são atualizados via `prisma.user.update(...)`, molduras, banners e temas são atualizados via SQL cru:
  ```typescript
  await prisma.$executeRaw`UPDATE users SET equipped_frame = ${frameUrl} WHERE id = ${session.user.id}`;
  await prisma.$executeRaw`UPDATE users SET equipped_banner = ${bannerId} WHERE id = ${session.user.id}`;
  await prisma.$executeRaw`UPDATE users SET equipped_theme = ${themeId} WHERE id = ${session.user.id}`;
  ```
  Esses campos já existem formalmente no modelo `User` do `schema.prisma` (`equipped_frame`, `equipped_banner`, `equipped_theme`). O uso de raw query ignora o middleware do Prisma, invalida o type-checking e gera inconsistências com o cache de sessão do NextAuth.

---

### 4.2 Proliferação de Tipos `any` em Ações de Guilda
- **Arquivos e Linhas:**
  - [`src/app/lib/guild-actions.ts:84, 756, 772, 776`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/guild-actions.ts#L84)
  - [`src/app/lib/guild-gamification-actions.ts:179`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/guild-gamification-actions.ts#L179)
- **Detalhes:** Uso explícito de `(m: any) => m.is_active` e retornos tipados como `any[]`, suprimindo a segurança estática provida pelo TypeScript e gerando warnings no linter.

---

### 4.3 Acoplamento Rígido a Identificadores Pessoais
- **Arquivos:** [`src/lib/randomizer-players.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/lib/randomizer-players.ts) e [`src/app/lib/actions.ts:50`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/actions.ts#L50)
- **Detalhes:** E-mails pessoais (`matheus31also@gmail.com`, `lucasedu17gomes@gmail.com`) e nomes de guilda fundadora (`"fundadores"`, `"aposentados"`) estão hardcoded no código TypeScript em vez de serem parametrizados por variáveis de ambiente ou pela tabela de permissões no banco.

---

## 5. 🛠️ Plano de Remediação com Exemplos de Código

### Correção 1: Refatoração do `RandomizerClient.tsx` (Regras de Hooks)
```tsx
// src/components/game/RandomizerClient.tsx
export function RandomizerClient(props: RandomizerClientProps) {
    // 1. Incondicional: Chamar useSession e Hooks no topo absoluto
    const { data: session } = useSession();
    const equippedTheme = session?.user?.equipped_theme || "cyberpunk";

    const [questType, setQuestType] = useState<QuestType>("SIDE");
    const [poolId, setPoolId] = useState<string | null>(null);
    const [mySelections, setMySelections] = useState<LocalCandidate[]>([]);
    const [cycleText, setCycleText] = useState<string>("");
    const cycleIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);
        };
    }, []);

    // 2. Retorno antecipado seguro APÓS todos os hooks
    if (!props.canAddGames) {
        return (
            <PersonalQuestHub
                currentUserId={props.currentUserId}
                currentUserName={props.currentUserName}
            />
        );
    }

    return (
        // Restante do JSX normal do Randomizer
    );
}
```

---

### Correção 2: Blindagem contra DoS em `calculateLevelFromXP`
```typescript
// src/app/lib/xp-engine.ts
export function calculateLevelFromXP(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercentage: number;
} {
  // Sanitização estrita contra NaN, Infinity e valores negativos
  const safeXP = !Number.isFinite(totalXP) || totalXP < 0 ? 0 : Math.floor(totalXP);

  let level = 1;
  let accumulated = 0;
  const MAX_LEVEL = 999;

  while (level < MAX_LEVEL) {
    const xpNeeded = getXPForNextLevel(level);
    if (accumulated + xpNeeded > safeXP) {
      const currentLevelXP = safeXP - accumulated;
      const progressPercentage = Math.min(100, Math.max(0, Math.round((currentLevelXP / xpNeeded) * 100)));
      return {
        level,
        currentLevelXP,
        nextLevelXP: xpNeeded,
        progressPercentage,
      };
    }
    accumulated += xpNeeded;
    level++;
  }

  return {
    level: MAX_LEVEL,
    currentLevelXP: 0,
    nextLevelXP: getXPForNextLevel(MAX_LEVEL),
    progressPercentage: 100,
  };
}
```

---

### Correção 3: Eliminação do Backdoor de Domínio `@test.com`
```typescript
// src/lib/permissions.ts
export function isGuildMaster(user: UserPermissionContext | null | undefined): boolean {
    if (!user) return false;
    if (user.role === "GUILD_MASTER") return true;
    
    // Permitir e-mails oficiais de fallback
    if (user.email) {
        const lower = user.email.toLowerCase();
        if (RANDOMIZER_PLAYER_EMAILS.includes(lower)) return true;
        // Permitir @test.com APENAS em ambiente estrito de teste automatizado
        if (process.env.NODE_ENV === "test" && lower.endsWith("@test.com")) {
            return true;
        }
    }
    return false;
}

// src/app/lib/actions.ts (Registro de Usuário)
await prisma.guildMember.create({
    data: {
        guild_id: founderGuild.id,
        user_id: user.id,
        role: "MEMBER",
        is_active: true, // ✅ Usuários reais cadastrados ficam ativos por padrão
    },
});
```

---

### Correção 4: Operação Atômica via Upsert em `updateQuestProgress`
```typescript
// src/app/lib/quest-actions.ts
const progress = await prisma.gameProgress.upsert({
    where: {
        user_id_game_id: {
            user_id: session.user.id,
            game_id: gameId,
        },
    },
    update: {
        progress_percentage: percentage,
        status: percentage >= 100 ? "COMPLETED" : "ACTIVE",
        end_date: percentage >= 100 ? new Date() : null,
    },
    create: {
        user_id: session.user.id,
        game_id: gameId,
        progress_percentage: percentage,
        status: percentage >= 100 ? "COMPLETED" : "ACTIVE",
        start_date: new Date(),
        end_date: percentage >= 100 ? new Date() : null,
    },
});
```

---

## 📊 Matriz de Priorização e Próximos Passos

| Prioridade | Problema | Arquivo | Risco | Esforço |
| :--- | :--- | :--- | :--- | :--- |
| 🔴 **P0** | Violação de Regras de Hooks (28 erros) | `RandomizerClient.tsx` | Crash de Runtime / React 19 | Médio |
| 🔴 **P0** | Backdoor e Falha de Ativação `@test.com` | `permissions.ts` & `actions.ts` | Escalação de Privilégios | Baixo |
| 🔴 **P0** | Loop Infinito / DoS no Motor de XP | `xp-engine.ts` | Queda do Servidor (100% CPU) | Baixo |
| 🟡 **P1** | Concorrência sem Upsert em Quests | `quest-actions.ts` | Exceção `P2002` em duplicidade | [DONE] |
| 🟡 **P1** | BOLA em Votação de Jogo Especial | `special-game-actions.ts` | Voto em Guilda Cruzada | [DONE] |
| 🟡 **P1** | Efeitos com `setState` síncrono (3 arquivos) | `SteamSaleCountdownCard`, etc. | Queda de FPS / Layout Shifts | [DONE] |

| 🟢 **P2** | Migrar `$executeRaw` para `prisma.user.update` | `gamification-actions.ts` | Inconsistência de Código | Baixo |
| 🟢 **P2** | Adicionar Índices Ausentes no Prisma | `schema.prisma` | Latência em Tabelas Maiores | Baixo |
| 🟢 **P2** | Modularização do `RandomizerClient` | `RandomizerClient.tsx` | Bundle Size / Manutenibilidade | Alto |

---
*Relatório gerado de forma autônoma pela suíte de auditoria do Antigravity Kit.*
