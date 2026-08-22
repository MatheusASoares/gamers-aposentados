# 🗺️ Mapeamento Funcional Completo: Gamers Aposentados

> **Documento de Engenharia de Produto & Arquitetura Funcional**  
> **Versão:** 1.0  
> **Escopo:** Mapeamento exaustivo de todas as features, regras de negócio, fluxos de ponta a ponta, entidades manipuladas, atritos de UX e oportunidades de evolução (V2).

---

## 📑 Índice de Features

1. [The Great Randomizer (Sorteio & Gestão de Potes/Pools)](#1-the-great-randomizer-sorteio--gestão-de-potespools)
2. [Pausa Ativa & Inserção de Jogo Especial (Direct Active Insert)](#2-pausa-ativa--inserção-de-jogo-especial-direct-active-insert)
3. [Notice Board (Mural de Contratos de Campanha por IA)](#3-notice-board-mural-de-contratos-de-campanha-por-ia)
4. [Dashboard Central & Painéis de Acompanhamento (Hub da Guilda)](#4-dashboard-central--painéis-de-acompanhamento-hub-da-guilda)
5. [Sistema de Reviews, Críticas e Avaliações](#5-sistema-de-reviews-críticas-e-avaliações)
6. [Histórico de Quests & Retomada de Backlog (Quests History)](#6-histórico-de-quests--retomada-de-backlog-quests-history)
7. [Mecanismo de Gamificação (XP Engine, Níveis & Level Up)](#7-mecanismo-de-gamificação-xp-engine-níveis--level-up)
8. [Armário de Recompensas e Customização de Identidade (Wardrobe)](#8-armário-de-recompensas-e-customização-de-identidade-wardrobe)
9. [Galeria Hall of Fame & Vitrine de Jogos Favoritos](#9-galeria-hall-of-fame--vitrine-de-jogos-favoritos)
10. [Deals Tracker & Comparador Steam Family (US vs BR)](#10-deals-tracker--comparador-steam-family-us-vs-br)
11. [Autenticação, Gestão de Usuários & Segurança de Acesso](#11-autenticação-gestão-de-usuários--segurança-de-acesso)

---

### 1. The Great Randomizer (Sorteio & Gestão de Potes/Pools)
* **Objetivo:** Eliminar a paralisia de escolha dos jogadores através de um sorteio randômico, imparcial e auditável para definir os próximos jogos a serem jogados da fila de backlog.
* **Como Funciona Atualmente:**
  * O usuário acessa a aba do Randomizer (`/randomizer`) e escolhe a categoria: **Main Quest** (campanhas longas) ou **Side Quest** (jogos menores/rápidos).
  * Cada jogador oficial (Matheus e Lucas) pesquisa jogos integrados à API da IGDB com autocomplete, recuperando título, capa em alta resolução e arte em landscape (artwork).
  * **Regras de Pote:** 
    * *Main Quest:* Requer exatamente 4 jogos no total (2 indicações por jogador).
    * *Side Quest:* Requer exatamente 6 jogos no total (3 indicações por jogador).
  * **Validações de Elegibilidade:** O sistema impede a inserção de jogos se: (a) já foi completado (`COMPLETED`) por qualquer jogador; (b) já está em andamento (`ACTIVE`); (c) possui progresso anterior e não foi abandonado (`DROPPED`) por **ambos** os jogadores oficiais.
  * Ao salvar a lista de indicações, o sistema aciona a IA Gemini com Google Search Grounding para extrair e cachear a média de horas do *HowLongToBeat* (HLTB).
  * Com o pote cheio e a quest anterior da categoria finalizada/dropada, o botão **"Roll"** é destravado. A execução do sorteio roda sob transação com Lock Pessimista (`FOR UPDATE`), fecha o `Pool`, define o `winner_game_id`, cria/atualiza os registros de `GameProgress` de todos os participantes como `SUGGESTED` e coloca o vencedor como `ACTIVE` com data de início registrada.
* **Entidades / Estados Manipulados:** `Pool` (`OPEN` $\to$ `CLOSED`), `PoolEntry`, `Game`, `GameProgress` (`SUGGESTED`, `ACTIVE`), `User`.
* **Pontos de Atrito / Limitações:**
  * Não há suporte a pesos de sorteio ou "mulligan" (direito a 1 re-roll emergencial por temporada se ambos concordarem).
  * Se um jogador demorar dias para preencher sua cota, o outro fica bloqueado sem um sistema de notificação interna ou lembrete de pendência.
  * Não permite salvar rascunhos de listas de desejos prévias para importar no pote com um clique.
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Sistema de Veto/Banish (Modo Draft):** Antes do Roll, cada jogador ganha o direito de banir 1 indicação do adversário, forçando escolhas mais estratégicas.
  * **Reroll Token (Moeda de Re-sorteio):** Consumir XP ou uma moeda da guilda conquistada em platinas para forçar um novo sorteio caso o jogo sorteado seja inviável no momento.
  * **Histórico de Pools & Potes Passados:** Aba dedicada para consultar quais jogos concorreram em sorteios anteriores e quantas vezes um mesmo jogo bateu na trave sem vencer.

---

### 2. Pausa Ativa & Inserção de Jogo Especial (Direct Active Insert)
* **Objetivo:** Permitir que a guilda jogue lançamentos sazonais aguardados ou cooperativos de ocasião sem quebrar as regras de integridade do Randomizer convencional.
* **Como Funciona Atualmente:**
  * Um jogador oficial utiliza a função de inserção especial (`insertSpecialGame`), buscando o jogo na IGDB e definindo a categoria (`MAIN_QUEST` ou `SIDE_QUEST`).
  * O sistema cria o registro de `Game`, pesquisa o HLTB via IA e injeta diretamente o status `ACTIVE` no `GameProgress` de ambos os jogadores.
  * O jogo assume a posição de Quest Ativa no Dashboard, permitindo o acompanhamento de progresso sem necessidade de fechar um pote de sorteio.
* **Entidades / Estados Manipulados:** `Game`, `GameProgress` (`ACTIVE`), `User`.
* **Pontos de Atrito / Limitações:**
  * Não há distinção visual explícita no Dashboard entre uma quest fruto de sorteio do Randomizer e uma quest inserida por Pausa Ativa/Lançamento.
  * Não há limite ou cooldown configurado, permitindo que a regra central do Randomizer seja ignorada repetidamente sem custo de gamificação.
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Tag de Evento / "Special Release":** Exibir uma badge visual diferenciada (ex: moldura roxa pulsante) para identificar que o jogo é um evento especial da guilda.
  * **Votação de Pausa Ativa com Quórum:** Exigir confirmação/aceite mútuo dos dois jogadores na interface antes do jogo se tornar ativo.

---

### 3. Notice Board (Mural de Contratos de Campanha por IA)
* **Objetivo:** Quebrar a jornada de jogos longos em marcos curtos e objetivos narrativos diários ("Atomic Quests"), combatendo o abandono e fornecendo sensação contínua de evolução.
* **Como Funciona Atualmente:**
  * Ao acessar a rota `/board`, se o jogo ativo ainda não possui contratos, o jogador oficial pode clicar em **"Gerar Mural de Contratos"**.
  * A API consulta o Gemini 2.5 Flash alimentado com metadados da IGDB e busca na web a estrutura real de capítulos, atos e chefes do jogo.
  * A IA gera um conjunto de 4 a 8 registros de `CampaignContract`, contendo: título do capítulo, objetivo narrativo detalhado, missão atômica diária recomendada e percentual cumulativo de progresso (ex: 15%, 35%, 60%, 100%).
  * Para cada jogador, cria-se o `CampaignContractProgress`. A progressão é linear e estrita: o contrato 1 inicia como `AVAILABLE` e os demais como `LOCKED`.
  * Ao concluir um contrato, o jogador clica em "Completar": o contrato passa a `COMPLETED`, o `progress_percentage` geral do `GameProgress` é sincronizado com a meta do contrato, e o próximo contrato vira `AVAILABLE`. Ao completar o último (100%), o jogo é finalizado automaticamente como `COMPLETED`.
* **Entidades / Estados Manipulados:** `CampaignContract`, `CampaignContractProgress` (`LOCKED`, `AVAILABLE`, `COMPLETED`, `FAILED`), `GameProgress`, `Game`.
* **Pontos de Atrito / Limitações:**
  * Jogos muito novos ou sem cobertura ampla de detonados na web podem gerar contratos genéricos baseados puramente na estimativa de horas HLTB.
  * Não permite edição manual rápida de um contrato caso a IA alucine a ordem de um chefe ou o jogador tome uma rota alternativa não linear (ex: RPGs de mundo aberto como *Elden Ring*).
  * Ausência de botão para reverter um contrato marcado como concluído por engano sem precisar resetar todo o progresso do jogo.
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Modo Árvore de Decisão / Sub-Quests Opcionais:** Suporte a contratos ramificados para jogos com múltiplos finais ou campanhas não lineares.
  * **Diário de Bordo do Contrato:** Permitir anexar notas rápidas, timestamps ou screenshots daquele chefe específico ao concluir o card no mural.
  * **Editor Manual de Contratos:** Botão administrativo para os jogadores ajustarem o texto ou adicionarem marcos personalizados na trilha.

---

### 4. Dashboard Central & Painéis de Acompanhamento (Hub da Guilda)
* **Objetivo:** Centralizar o estado em tempo real da guilda, exibindo a Main Quest e Side Quest ativas, progresso individual de cada gamer, histórico recente e métricas competitivas.
* **Como Funciona Atualmente:**
  * **ActiveQuestHero:** Card principal com arte landscape do jogo, barra de progresso individual interativa, tempo médio HLTB, autor da indicação e botões de ação rápida (Incrementar %, Concluir, Dropar e Acessar Mural).
  * **SideQuestBar:** Painel lateral dedicado para a Side Quest em andamento com as mesmas ações simplificadas.
  * **StatsGrid:** Exibe 4 métricas consolidadas: Quests Zeradas, Horas Jogadas acumuladas, Média de Notas da Guilda e Total de Platinas.
  * **Leaderboard:** Tabela comparativa direta entre Matheus e Lucas, ranqueando por Nível, XP Total, Taxa de Conclusão de Quests e Platinas.
  * **RecentActivity Feed:** Feed cronológico em tempo real agregando múltiplos eventos: indicações de jogos, sorteios de pools, atualizações de porcentagem, reviews postadas e platinas obtidas.
  * **UserProfileWidget:** Resumo flutuante do perfil logado com avatar estilizado, nível atual, barra de progresso de XP para o próximo nível e título equipado.
* **Entidades / Estados Manipulados:** `GameProgress`, `Pool`, `Review`, `Game`, `User`.
* **Pontos de Atrito / Limitações:**
  * O dashboard depende de SSR com consultas no banco PostgreSQL; sem WebSockets/SSE nativo, a atualização de progresso do outro jogador exige refresh de tela ou revalidação de rota.
  * Falta um filtro temporal no Leaderboard (ex: placar geral histórico vs placar da temporada do ano corrente).
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Live Activity Ticker:** Notificações em tempo real com som retro sutil quando o outro jogador marcar progresso na sessão.
  * **Batalha de Progresso Visual (Ghost Mode):** Linha do tempo visual sobreposta mostrando quem está mais avançado no jogo ativo minuto a minuto.

---

### 5. Sistema de Reviews, Críticas e Avaliações
* **Objetivo:** Registrar o veredito final, análise crítica e estatísticas de jogabilidade real de cada membro da guilda após zerar um jogo.
* **Como Funciona Atualmente:**
  * Acessível via rota `/reviews` ou através de atalhos rápidos após a conclusão de uma quest.
  * O modal de review (`AddReviewModal` / `EditReviewModal`) permite selecionar um jogo do acervo concluído.
  * **Campos coletados:**
    * *Nota Geral:* 0 a 10 (ou 0 a 5 com granularidade).
    * *Dificuldade Subjetiva:* 1 (Muito Fácil) a 5 (Extremamente Difícil).
    * *Horas Reais Jogadas:* Registro do tempo real investido no console/PC.
    * *Texto de Análise:* Texto dissertativo detalhando a experiência.
    * *Galeria de Screenshots:* Upload de imagens da jogatina direto para o Vercel Blob Storage com validação de tipo de arquivo.
  * As reviews são exibidas em um feed estruturado (`ReviewsClient`) com filtros por nota, jogador, ordenação por data e busca por título.
* **Entidades / Estados Manipulados:** `Review`, `Game`, `User`, `GameProgress`.
* **Pontos de Atrito / Limitações:**
  * Não há suporte para formatação rica em Markdown no campo de texto da análise crítica.
  * Ausência de tags pré-definidas (ex: "Obra-prima", "Gameplay Excelente", "História Fraca", "Bugado").
  * Falta um cálculo comparativo entre o tempo real jogado pelo usuário e o tempo médio previsto pelo HLTB.
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Review em Duelo (Head-to-Head Review):** Quando ambos zerarem o mesmo jogo, renderizar um card com a comparação lado a lado das notas, horas gastas e divergências de opinião.
  * **Badge de Precisão HLTB:** Selo indicativo se o jogador foi "Speedrunner", "No Ritmo Médio" ou "Explorador/Completionist" em relação ao tempo HLTB original.

---

### 6. Histórico de Quests & Retomada de Backlog (Quests History)
* **Objetivo:** Catalogar o arquivo histórico de todas as campanhas concluídas e abandonadas ao longo dos anos, permitindo auditoria de desempenho e reabertura de jogos dropados.
* **Como Funciona Atualmente:**
  * A rota `/quests` renderiza o `HistoryClient`, permitindo filtrar o acervo por Ano (com seletor dinâmico baseado em datas de banco), tipo de quest (`MAIN` ou `SIDE`) e status (`COMPLETED` ou `DROPPED`).
  * Cada card de histórico exibe: capa, autor da indicação, data de conclusão/drop, horas estimadas, percentual atingido e nota concedida (se houver review).
  * **Mecânica de Retomada (Re-join Quest):** Para jogos com status `DROPPED` por ambos, o jogador pode acionar o botão de retomada (`joinQuest`), resetando o status para `ACTIVE` e permitindo que o jogo volte para a esteira ativa do Dashboard.
* **Entidades / Estados Manipulados:** `GameProgress` (`DROPPED`, `COMPLETED`, `ACTIVE`), `Game`, `User`, `Review`.
* **Pontos de Atrito / Limitações:**
  * Não exibe gráficos consolidados de retenção por ano (ex: pizza de jogos concluídos vs dropados no ano).
  * Não permite exportação dos dados históricos (ex: exportar lista anual em CSV/JSON ou imagem para redes sociais).
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Gamers Wrapped Anual:** Geração de infográfico automático de fim de ano estilo *Spotify Wrapped* (jogo do ano da guilda, gamer com mais horas, maior drop, jogo mais difícil).
  * **Cemitério de Drops (Grave of Shame):** Área com estética dark/cômica dedicada exclusivamente a analisar os motivos e percentuais de jogos que foram abandonados.

---

### 7. Mecanismo de Gamificação (XP Engine, Níveis & Level Up)
* **Objetivo:** Fornecer um ciclo contínuo de recompensa baseado no esforço real de jogatina, convertendo tempo e dedicação em níveis e prestígio na guilda.
* **Como Funciona Atualmente:**
  * **Fórmulas de Concessão de XP (`xp-engine.ts`):**
    * *Main Quest Zerada:* $\max(300, \text{HLTB} \times 15)$ XP.
    * *Side Quest Zerada:* $\max(50, \text{HLTB} \times 10)$ XP.
    * *Bônus de Platina:* Incremento fixo adicional de XP por jogo platinado.
  * **Fórmula de Nível:** Nível calculado pela curva exponencial $\text{XP Requerido}(N) = \lfloor 80 \times N^{1.18} \rfloor$.
  * **Tiers de Rank:** Classificação em patamares (Tier I a X: Recruta, Aventureiro, Veterano, Campeão, Elite, Mestre, Grão-Mestre, Lenda, Imortal, Vanguardista) com gradientes e glows neon distintos.
  * **Celebração de Level Up:** O frontend escuta alterações de nível e dispara um modal cinemático (`LevelUpCelebrationModal`), chuva de partículas (`LevelUpParticles`) e efeitos sonoros gerados dinamicamente via síntese Web Audio API (`LevelUpAudio.ts`).
* **Entidades / Estados Manipulados:** `User` (`xp_points`, `level`), `GameProgress`, `Game`.
* **Pontos de Atrito / Limitações:**
  * O recálculo de XP é disparado de forma síncrona/reativa em Server Actions (`recalculateUserXPAndLevel`), o que pode somar latência nas respostas de mutação.
  * Não existem multiplicadores temporários de XP (ex: "Fim de semana de maratona" ou "Bônus por zerar sem dropar").
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Streak de Dias Ativos (Daily Gaming Streak):** Conceder bônus diário de XP ao registrar progresso no Notice Board em dias consecutivos.
  * **Árvore de Talentos / Perks da Guilda:** Gastar pontos de talento obtidos em níveis altos para destravar vantagens estéticas ou direitos a reroll no Randomizer.

---

### 8. Armário de Recompensas e Customização de Identidade (Wardrobe)
* **Objetivo:** Permitir que os jogadores customizem seus avatares e cards de perfil, exibindo o status cosmético conquistado através de seus níveis de XP.
* **Como Funciona Atualmente:**
  * No perfil do usuário (`/profile/[identifier]`), o componente `RewardsCustomizationModule` exibe o catálogo global de itens cosméticos (`REWARDS_CATALOG`), agrupados por tipo:
    * **Títulos de Honra:** Títulos textuais equipáveis (ex: "The Backlog Slayer", "Retro God", "Night City Legend").
    * **Molduras de Avatar (Frames):** Bordas decorativas animadas e estilizadas para o avatar.
    * **Banners de Perfil:** Imagens temáticas com camadas dinâmicas de efeitos especiais (`BannerFxOverlay` com efeitos de glitch, scanlines, matrix rain e partículas).
    * **Temas Globais (Theme Switcher):** Paletas completas da aplicação injetadas via CSS Variables (`cyberpunk`, `synthwave`, `matrix`, `retro`, `stealth`).
  * Cada item possui um requisito de nível mínimo (`requiredLevel`). Se o jogador atingir o nível, o item é destravado e pode ser equipado com persistência no banco de dados.
* **Entidades / Estados Manipulados:** `User` (`equipped_title`, `equipped_frame`, `equipped_banner`, `equipped_theme`), Banco de dados via Server Actions.
* **Pontos de Atrito / Limitações:**
  * O catálogo de recompensas (`REWARDS_CATALOG`) é estático em código TypeScript ao invés de uma tabela gerenciável no banco de dados.
  * Pré-visualização do tema altera apenas as variáveis locais antes de salvar, sem permitir teste em telas secundárias antes do commit.
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Insígnias de Conquista (Badges Especiais):** Cosméticos destravados por feitos específicos (ex: "Zerou 5 RPGs > 50h", "Nunca dropou um jogo no ano") e não apenas por nível geral de XP.
  * **Efeitos de Cursor & Áudio de Interface Customizáveis:** Sons de clique cyberpunk ou rastros de neon no ponteiro do mouse equipáveis no armário.

---

### 9. Galeria Hall of Fame & Vitrine de Jogos Favoritos
* **Objetivo:** Imortalizar as maiores conquistas dos membros da guilda, destacando seus jogos favoritos de todos os tempos e do ano vigente.
* **Como Funciona Atualmente:**
  * **Top 3 All-Time & Top 3 do Ano:** Módulos com cards interativos onde o usuário pode buscar e fixar até 3 jogos concluídos como seus favoritos absolutos ou favoritos da temporada anual. A persistência ocorre nas relações many-to-many `UserFavorites` e `UserFavoritesYear`.
  * **Hall of Fame Grid:** Galeria visual listando todos os jogos zerados pelo usuário com capas, tempo de jogo, tipo de quest e data de conclusão.
  * **Reivindicação de Platinas (Platinum Trophy System):** Em cada card do Hall of Fame, o jogador pode alternar o status de platina (`is_platinum`), registrando a data da platina e adicionando o troféu ao seu perfil público.
* **Entidades / Estados Manipulados:** `User`, `Game`, `GameProgress` (`is_platinum`, `platinum_at`), tabelas pivô de favoritos.
* **Pontos de Atrito / Limitações:**
  * A seleção de favoritos só aceita jogos já cadastrados previamente na base local.
  * Não exibe a data em que o jogo entrou no Top 3 ou histórico de substituições de favoritos.
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Comentário de Curadoria no Top 3:** Espaço para o jogador redigir um parágrafo justificando por que aquele jogo específico é Top 1/2/3 da sua vida.
  * **Compartilhamento em Card de Imagem (Social Card):** Exportação do Top 3 em formato PNG de alta resolução gerado via `@vercel/og` para redes sociais e Discord.

---

### 10. Deals Tracker & Comparador Steam Family (US vs BR)
* **Objetivo:** Otimizar as finanças da guilda ao monitorar promoções e apontar se a compra de um jogo sai mais barata na Steam Americana (USD) ou na Steam Brasileira (BRL), considerando o compartilhamento de biblioteca familiar (*Steam Family*).
* **Como Funciona Atualmente:**
  * Acessível na rota `/deals`, alimentado pelo `DealsContainer` e `DealsSearch`.
  * **Consumo de APIs Externas:**
    * *Steam Storefront API:* Preços oficiais em BRL e USD para contas das duas regiões.
    * *IsThereAnyDeal (ITAD) API:* Rastreamento de Menor Preço Histórico (All-Time Low), descontos atuais em múltiplas lojas autorizadas e IDs de jogos.
  * **Motor de Câmbio (`currencyService.ts`):** Consulta a cotação comercial USD/BRL em tempo real com sistema de cache em memória e fallback seguro offline.
  * **Comparador de Economia Familiar (`dealComparator.ts`):** Converte os valores para a mesma moeda, calcula o percentual de desconto e indica expressamente qual loja oferece a maior economia para o grupo familiar da guilda.
  * Exibe carrossel de principais ofertas em destaque ("Top Deals") e buscador com *debouncing* para pesquisar qualquer jogo do catálogo global.
* **Entidades / Estados Manipulados:** Cache em memória (`dealsCache.ts`), APIs externas (Steam, ITAD, AwesomeAPI/Câmbio).
* **Pontos de Atrito / Limitações:**
  * Sem persistência de uma "Lista de Desejos de Preço" (Wishlist com alerta de menor preço no banco de dados).
  * Rate-limits severos da API da Steam podem causar delays pontuais na busca sem um mecanismo de proxy/fallback com fila.
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Alerta de Preço no Discord:** Webhook que avisa automaticamente no servidor da guilda quando um jogo presente no backlog atingir seu Menor Preço Histórico.
  * **Cálculo de Custo por Hora de Gameplay:** Integrar a média de horas do HLTB ao preço da promoção (ex: R$ 50 para 100 horas = R$ 0,50 por hora de entretenimento).

---

### 11. Autenticação, Gestão de Usuários & Segurança de Acesso
* **Objetivo:** Proteger os dados da guilda, gerenciar sessões ativas e garantir controle de acesso baseado em funções (RBAC).
* **Como Funciona Atualmente:**
  * Autenticação via **NextAuth v5** com provedor de credenciais (`CredentialsProvider`) e suporte a tokens JWT e sessões no PostgreSQL.
  * **RBAC & Jogadores Oficiais:** Apenas e-mails autenticados configurados na constante `RANDOMIZER_PLAYER_EMAILS` (Matheus e Lucas) possuem permissão para realizar ações de escrita no Randomizer e sorteios de pools. Visitantes recebem perfil de espectador.
  * **Central de Configurações (`settings-modal.tsx`):** Permite alterar nome de exibição, username público, imagem de perfil e troca de senha protegida por validação da senha atual com hash `bcrypt`.
  * **Upload de Ativos (`/api/upload`):** Integração com Vercel Blob com restrição a tipos de mídia válidos e sanitização de pastas (`avatars`, `screenshots`, `covers`).
* **Entidades / Estados Manipulados:** `User`, `Account`, `Session`.
* **Pontos de Atrito / Limitações:**
  * E-mails de jogadores oficiais estão hardcoded em constante no código ao invés de controlados por campo `role` (`ADMIN`, `PLAYER`, `SPECTATOR`) na tabela `users`.
  * Ausência de fluxo de recuperação de senha por e-mail (Magic Link / Reset Token).
* **Sugestões de Melhoria & Novas Mecânicas:**
  * **Migração para RBAC em Banco:** Criar enum `UserRole` no schema Prisma para facilitar inclusão de novos membros ou espectadores sem deploy de código.
  * **Integração OAuth com Steam e Discord:** Login direto com conta Steam para sincronizar conquistas, biblioteca e avatar com um clique.

---

## 📊 1. Matriz de Novas Ideias & Melhorias

| Feature | Melhoria / Nova Funcionalidade | Esforço | Impacto |
| :--- | :--- | :---: | :---: |
| **Notice Board** | **Editor Manual & Reversão de Contratos:** Ajustar textos, metas de progresso e desfazer marcação de concluído. | Médio | **Alto** |
| **The Great Randomizer** | **Sistema de Veto / Banish (Draft Mode):** Cada jogador pode banir 1 indicação do adversário antes do sorteio. | Baixo | **Alto** |
| **Reviews & Hall da Fama** | **Review em Duelo (Head-to-Head):** Comparativo lado a lado de notas, horas reais e opiniões dos 2 jogadores. | Médio | **Alto** |
| **Deals Tracker** | **Wishlist Integrada & Webhook de Menor Preço no Discord:** Alerta instantâneo quando jogos da lista caem de preço. | Médio | **Alto** |
| **Gamificação & XP** | **Streak Diário de Progresso (Daily Streak):** Bônus multiplicador de XP para registros em dias consecutivos. | Baixo | **Médio** |
| **The Great Randomizer** | **Reroll Token (Consumo de Moeda/XP):** Permitir gastar prestígio para descartar um sorteio indesejado. | Baixo | **Médio** |
| **Histórico de Quests** | **Gamers Wrapped Anual:** Geração de infográfico automático de fim de ano com retrospectiva da guilda. | Médio | **Alto** |
| **Autenticação & Perfis** | **Integração OAuth com Steam:** Login e importação automática de horas jogadas e conquistas platinadas. | Alto | **Alto** |
| **Dashboard** | **Ghost Mode / Batalha de Progresso Visual:** Linha do tempo sobreposta em tempo real de quem está na frente no jogo ativo. | Médio | **Médio** |
| **Armário de Recompensas** | **Badges por Conquistas Narrativas:** Cosméticos liberados por feitos especiais (ex: 5 RPGs > 50h zerados). | Baixo | **Médio** |

---

## 🚀 2. Gaps de Produto (O que falta no ecossistema)

1. **Sincronização Automática com Steam API (Playtime & Achievements Sync):**
   * *O que é:* Conectar diretamente a chave da Steam dos jogadores para importar automaticamente as horas reais jogadas, detectar a conclusão da campanha principal e validar troféus de platina sem necessidade de digitação manual.
2. **Sistema de Desafios & Apostas Cooperativas ("Side Bets / Guild Bounties"):**
   * *O que é:* Mecânica onde um jogador cria um desafio específico para o outro no jogo ativo (ex: "Zerar sem usar viagem rápida", "Matar o chefe X de primeira tentativa") valendo apostas de XP, moedas de personalização ou favores na vida real.
3. **Gerenciador de Backlog Pessoal com Tier List ("The Vault"):**
   * *O que é:* Um espaço individual onde cada jogador organiza seu acervo pessoal de jogos não jogados em formato de Tier List (S, A, B, C) e define prioridades prévias que alimentam automaticamente o Randomizer nas rodadas de indicação.
4. **Modo Co-op Simultanêo ("Duo Campaign Sync"):**
   * *O que é:* Mecânica dedicada para jogos cooperativos jogados juntos (ex: *Baldur's Gate 3*, *It Takes Two*, *A Way Out*), onde o progresso do Notice Board é compartilhado e concluído conjuntamente para ambos os perfis com divisão de XP balanceada.
5. **Central de Memórias & Clipes de Jogatina ("Guild Moments"):**
   * *O que é:* Um feed visual estilo mural para arquivar pequenos clipes de vídeo (links do YouTube/Twitch/Kick) e áudios de reações engraçadas gravadas durante as jogatinas mais difíceis da guilda.
