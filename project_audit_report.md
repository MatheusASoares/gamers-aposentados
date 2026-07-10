# Gamers Aposentados - Relatório de Auditoria de Projeto (Project Audit Report)

Este relatório apresenta uma análise detalhada do codebase da aplicação **Gamers Aposentados**. O documento foi atualizado para refletir o status dos problemas identificados anteriormente e documentar as novas falhas descobertas na revisão de Junho de 2026.

---

## 🔍 Sumário

1. [📊 Status dos Problemas Anteriores (Relatório de 29 de Maio)](#1-status-dos-problemas-anteriores-relatorio-de-29-de-maio)
2. [🚨 Novos Bugs Críticos & Problemas de Concorrência](#2-novos-bugs-criticos--problemas-de-concorrencia)
3. [🛡️ Novos Riscos de Segurança & Validação de API](#3-novos-riscos-de-seguranca--validacao-de-api)
4. [⚡ Novos Gargalos de Performance & Escabilidade](#4-novos-gargalos-de-performance--escabilidade)
5. [🛠️ Nova Integridade do Banco de Dados & Restrições (Constraints)](#5-nova-integridade-do-banco-de-dados--restricoes-constraints)
6. [🧑‍💻 Novos Defeitos de Componentes React & UX](#6-novos-defeitos-de-componentes-react--ux)
7. [📋 Resumo das Recomendações Acionáveis](#7-resumo-das-recomendacoes-acionaveis)

---

## 📊 1. Status dos Problemas Anteriores (Relatório de 29 de Maio)

Todos os problemas identificados no relatório anterior (29 de maio) foram corrigidos ou resolvidos. Veja o log de verificação:

### 🚨 1.1 Função Impura no Render (Bloqueador de Build) — **RESOLVIDO**

- **Correção:** O embaralhamento em memória utilizando `Math.random()` no arquivo [page.tsx](<file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/(main)/page.tsx>) foi substituído por uma consulta nativa no banco (`ORDER BY RANDOM()`) via `prisma.$queryRaw`, eliminando falhas de compilação e garantindo escalabilidade.

### 🚨 1.2 Identificador de Modelo de IA Inválido (Erro 404) — **IGNORADO (BYPASSED)**

- **Status:** Ignorado por design. O modelo `gemini-2.5-flash` é suportado e está em pleno funcionamento nos servidores da API.

### 🚨 1.3 Dessincronização de Estado na Criação de Review — **RESOLVIDO**

- **Correção:** Adicionado `router.refresh()` ao componente [AddReviewModal.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/reviews/AddReviewModal.tsx) após a criação bem-sucedida, atualizando a listagem de avaliações sem necessitar de recarregamento manual da página.

### 🛡️ 2.1 Bypass Global de Autenticação em Rotas de API — **RESOLVIDO**

- **Correção:** Proteção aplicada no arquivo [auth.config.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/auth.config.ts) para rotear todas as APIs `/api/*` pelo gate de autenticação (exceto `/api/auth/*`), retornando payload JSON com status `401 Unauthorized` em vez de redirecionar para a página de login.

### 🛡️ 2.2 Proxy do IGDB Sem Autenticação — **RESOLVIDO**

- **Correção:** Adicionada validação de sessão no endpoint de proxy, retornando status `401` para requisições de usuários não autenticados.

### 🛡️ 2.3 Bypass de Autorização em Server Actions — **RESOLVIDO**

- **Correção:** Validação da permissão `isRandomizerPlayer` integrada com sucesso na ação `saveRandomizerRoll`.

### 🛡️ 2.4 Bypasses nas Rotas `/api/pools` e `/api/games` — **RESOLVIDO**

- **Correção:** Inserida checagem de escopo `isRandomizerPlayer` no CRUD de pools, validação forçando o `nominatedById` a coincidir com o `session.user.id` na criação de jogos, e remoção da reatribuição de propriedade/indicação no PUT de jogos.

### ⚡ 3.1 Falha de Serialização de Cache no Token do Twitch — **RESOLVIDO**

- **Correção:** O tratamento de erros em `fetchNewTwitchToken` em [igdb.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/igdb.ts) agora lança a exceção (`throw`), impedindo que o `unstable_cache` armazene em cache retornos nulos (`null`) por 24 horas.

### ⚡ 3.2 Shuffling em Memória (N+1 Query) — **RESOLVIDO**

- **Correção:** Resolvido usando ordenação nativa do PostgreSQL.

### ⚡ 3.3 Vazamento de Event Listener no Autocomplete — **RESOLVIDO**

- **Correção:** Envelopado o callback `onCancel` em uma `useRef` estável dentro de [game-autocomplete.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/ui/game-autocomplete.tsx).

### 🛠️ 4.1 Corrupção de Progresso ao Sortear Jogo — **RESOLVIDO**

- **Correção:** A query de atualização de progresso foi modificada para atingir exclusivamente jogos no estado `SUGGESTED`.

### 🛠️ 4.2 Falta de Cascade Deletes (Falha de FK ao Deletar Jogo) — **RESOLVIDO**

- **Correção:** Configurada a regra `onDelete: Cascade` nas relações de `Review` e `PoolEntry` no [schema.prisma](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma).

### 🧑‍💻 5.1 Recarregamentos Completos de Página (Full Reloads) — **RESOLVIDO**

- **Correção:** Substituídas todas as instâncias de `window.location.reload()` por `router.refresh()` nos componentes da dashboard.

### 🧑‍💻 5.2 Código Morto na Rota de API — **RESOLVIDO**

- **Correção:** Trecho redundante e inacessível excluído do método `PUT /api/pools/route.ts`.

---

## 🚨 2. Novos Bugs Críticos & Problemas de Concorrência

### 2.1 Condição de Corrida (Race Condition) na Seleção de Favoritos

- **Arquivo:** [user-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/user-actions.ts#L110)
- **Impacto:** **Alto (Falha de Restrição no Banco de Dados)**
- **Detalhes:** A função `setFavoriteGamesBase` utiliza `Promise.all` para processar a busca e criação de jogos em paralelo:
    1. O comando `prisma.game.findFirst` executa concorrentemente para todos os itens do array.
    2. Se o usuário mandar o mesmo jogo duplicado no array, ou clicar rapidamente duas vezes no botão de salvar, as promessas em paralelo verificarão simultaneamente que o jogo não existe, e ambas tentarão rodar `prisma.game.create` com o mesmo `igdb_id`.
    3. Isso estoura um erro de constraint única no banco de dados, abortando e falhando a requisição.
- **Solução:** Filtrar/deduplicar o array antes de iniciar as operações e executar o mapeamento do loop de criação sequencialmente (ex: usando loop `for...of`), ou envolver a gravação em tratamento amigável de erro de concorrência.

### 2.2 Ausência de Transações nas Ações de Progresso-DONE

- **Arquivo:** [quest-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#L10)
- **Impacto:** **Médio (Integridade de Dados)**
- **Detalhes:** Funções como `joinQuest`, `completeQuest` e `dropQuest` realizam checagens seguidas de gravações na tabela `GameProgress` em comandos separados sem envelopamento de transação. Cliques duplos velozes do usuário podem desencadear inserções duplicadas concorrentes de progresso para o mesmo jogo.
- **Solution:** Envelopar as operações de escrita em `prisma.$transaction` ou utilizar queries atômicas (`upsert`).

---

## 🛡️ 3. Novos Riscos de Segurança & Validação de API

### 3.1 Spoofing de Tipo MIME no Upload de Arquivos-DONE

- **Arquivo:** [route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/upload/route.ts#L21)
- **Impacto:** **Médio (Risco de Segurança)**
- **Detalhes:** A rota de upload valida o arquivo usando apenas `file.type.startsWith("image/")`, que confia na propriedade `Content-Type` enviada no request HTTP do cliente. Um usuário poderia renomear um script malicioso (como PHP ou HTML contendo scripts) para `.png` e passá-lo com cabeçalho de imagem. Embora o Vercel Blob apenas hospede arquivos estáticos, permitir o upload de payloads arbitrários é inseguro.
- **Solução:** Implementar validação de cabeçalhos de arquivo reais (Magic Bytes / File Signatures) no backend para verificar se os arquivos enviados são de fato imagens verdadeiras (PNG, JPEG, WEBP, GIF).

---

## ⚡ 4. Novos Gargalos de Performance & Escabilidade

### 4.1 Queries N+1 Dentro de Loops de Transação no Mural de Avisos-DONE

- **Arquivo:** [notice-board-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/notice-board-actions.ts#L20)
- **Impacto:** **Alto (Latência e Consumo de Conexões)**
- **Detalhes:** A função `generateNoticeBoardAction` executa queries assíncronas em loop para inserir contratos e depois itera por todos os jogadores em loop para inserir registros de progresso individual de contratos. Isso gera dezenas de conexões individuais dentro de uma transação aberta, causando extrema latência e risco de timeout na conexão de banco.
- **Solução:** Refatorar a criação para usar `prisma.campaignContract.createMany` e `prisma.campaignContractProgress.createMany`, realizando batching das inserções em poucas queries otimizadas em vez de loops.

### 4.2 Arquivo de Server Actions Morto (Dead Code)

- **Arquivo:** [progress-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/progress-actions.ts)
- **Impacto:** **Baixo (Poluição de Código)**
- **Detalhes:** O arquivo `progress-actions.ts` contém código idêntico ao de `quest-actions.ts` para controle de quests, mas nunca é importado ou utilizado por nenhum arquivo ou componente no projeto.
- **Solução:** Deletar permanentemente o arquivo morto do workspace.

---

## 🛠️ 5. Nova Integridade do Banco de Dados & Restrições (Constraints)

### 5.1 Ausência de Chave Única Composta em Reviews

- **Arquivo:** [schema.prisma](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma#L145)
- **Impacto:** **Médio (Duplicação de Dados)**
- **Detalhes:** A tabela `Review` não possui restrição única composta no banco para `[user_id, game_id]`. Isso permite a inserção concorrente de mais de uma review do mesmo usuário para o mesmo jogo caso o fluxo de validação no backend sofra condição de corrida.
- **Solução:** Adicionar um índice `@@unique([user_id, game_id])` ao modelo `Review` no esquema do Prisma.

### 5.2 Ausência de Chave Única Composta em Entradas de Sorteio (PoolEntry)

- **Arquivo:** [schema.prisma](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma#L188)
- **Impacto:** **Médio (Inconsistência de Regra)**
- **Detalhes:** `PoolEntry` não possui índice único para os campos de jogo, pote e usuário. Um comandante poderia burlar a regra do Randomizer e adicionar mais indicações do mesmo jogo em um único pote de sorteio.
- **Solução:** Adicionar o índice composto `@@unique([pool_id, game_id, user_id])` ao modelo `PoolEntry`.

---

## 🧑‍💻 6. Novos Defeitos de Componentes React & UX

### 6.1 Atualização de Estado na Fase de Renderização (FavoriteGamesModule)

- **Arquivo:** [favorite-games-module.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/profile/favorite-games-module.tsx#L34)
- **Impacto:** **Médio (Loop de Renderização do React)**
- **Detalhes:** O componente atualiza o estado local `setFavorites` na fase de renderização se a referência `initialFavorites` mudar. Se o componente pai recriar a lista em cada render do Server Component, o React entrará em loop de render contínuo.
- **Solução:** Comparar o conteúdo profundo dos arrays favoritos (por exemplo, concatenando os IDs `initialFavorites.map(g => g.id).join(",")`) em vez de comparar a referência bruta.

### 6.2 Bloqueio de Sincronização de Inputs no Modal de Configurações

- **Arquivo:** [settings-modal.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/auth/settings-modal.tsx#L34)
- **Impacto:** **Médio (Defeito de UX)**
- **Detalhes:** Os campos `name` e `username` usam estados que inicializam somente no mount. Se os dados da sessão mudarem com o modal fechado, o componente exibirá informações desatualizadas ao ser reaberto.
- **Solução:** Implementar um `useEffect` ouvindo a propriedade `open` e o estado da sessão `user` para sincronizar os inputs com dados atualizados.

### 6.3 Saltos de Tela Inesperados (Scroll Jumping) no Mural de Contratos

- **Arquivo:** [NoticeBoardMuralClient.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/contracts/NoticeBoardMuralClient.tsx#L88)
- **Impacto:** **Baixo (Salto de UX)**
- **Detalhes:** O efeito executa a query global `document.querySelectorAll('[data-active="true"]')` no DOM para dar scroll automático, podendo selecionar elementos de outras seções e fazer a tela pular de forma indesejada.
- **Solução:** Usar uma referência React `useRef` atrelada ao container interno das raias para limitar a busca e controle de rolagem.

---

## 📋 7. Resumo das Recomendações Acionáveis

| Seção   | Área do Problema         | Gravidade | Arquivo / Localização                 | Correção Sugerida                                                     |
| :------ | :----------------------- | :-------- | :------------------------------------ | :-------------------------------------------------------------------- |
| **2.1** | Condição de Corrida      | 🔴 Alto   | `src/app/lib/user-actions.ts`         | Deduplicar array e rodar inserções no banco sequencialmente.          |
| **2.2** | Integridade Concorrente  | 🟡 Médio  | `src/app/lib/quest-actions.ts`        | Envelopar queries de progresso em `prisma.$transaction`.              |
| **3.1** | Segurança no Upload      | 🟡 Médio  | `src/app/api/upload/route.ts`         | Validar a assinatura de bytes (Magic Bytes) dos uploads.              |
| **4.1** | Loop N+1 de Banco        | 🔴 Alto   | `src/app/lib/notice-board-actions.ts` | Inserir em lote usando `createMany` para contratos/progressos.        |
| **4.2** | Código Morto             | 🟢 Baixo  | `src/app/lib/progress-actions.ts`     | Excluir o arquivo Server Actions não utilizado.                       |
| **5.1** | Unicidade no Banco       | 🟡 Médio  | `prisma/schema.prisma`                | Incluir `@@unique([user_id, game_id])` em `Review`.                   |
| **5.2** | Unicidade no Banco       | 🟡 Médio  | `prisma/schema.prisma`                | Incluir `@@unique([pool_id, game_id, user_id])` em `PoolEntry`.       |
| **6.1** | Loop de Render React     | 🟡 Médio  | `favorite-games-module.tsx`           | Sincronizar estado local por meio de comparação profunda de IDs.      |
| **6.2** | Dados de Modal Travados  | 🟡 Médio  | `settings-modal.tsx`                  | Usar `useEffect` para sincronizar inputs com a sessão ativa.          |
| **6.3** | Seleção de Scroll Global | 🟢 Baixo  | `NoticeBoardMuralClient.tsx`          | Restringir consultas do mural usando referências locais via `useRef`. |

---

_Relatório gerado em: 2026-06-27_
