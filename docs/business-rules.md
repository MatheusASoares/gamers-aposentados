# 🎮 Regras de Negócio - Gamers Aposentados

Este documento detalha as Regras de Negócio vigentes do projeto **gamers-aposentados**, mapeadas a partir da engenharia reversa do esquema do banco de dados e da lógica de API implementada nas rotas, Server Actions e componentes.

---

## 1. Visão Geral do App

O **Gamers Aposentados** é um sistema projetado para gerenciar e incentivar a conclusão do backlog de jogos de dois jogadores específicos: **Matheus** e **Lucas**. A mecânica central do sistema baseia-se na estruturação de desafios cooperativos/competitivos divididos em duas categorias principais:
* **Main Quests**: Missões maiores de campanha principal.
* **Side Quests**: Missões menores de campanha secundária.

O fluxo de jogos é controlado de ponta a ponta: desde a sugestão e o sorteio imparcial de jogos de forma randômica (**The Great Randomizer**) até o acompanhamento do progresso de jogabilidade por meio de marcos reais da história gerados por Inteligência Artificial (**Notice Board** / **Quadro de Avisos**).

---

## 2. Entidades de Dados e Estados

As tabelas do sistema estão mapeadas no arquivo [schema.prisma](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma). A seguir são descritas as principais entidades e o papel de cada uma na lógica do negócio:

### 2.1. Tabela de Entidades
* **`User`**: Rastreia os dados de perfil, credenciais e sessões de login dos participantes do sistema.
* **`Game`**: Armazena as informações estáticas do jogo, tais como título, plataforma de referência, links para imagens de capa e banner, o tipo de quest (`MAIN_QUEST` ou `SIDE_QUEST`) e o tempo médio estimado do HowLongToBeat (`hltb_time`).
* **`GameProgress`**: Controla o progresso de cada gamer em cada jogo de maneira individual, vinculando o status atual (`GameStatus`) e a porcentagem de conclusão (0% a 100%).
* **`Review`**: Registra o feedback final do jogador ao concluir um jogo, englobando nota (0 a 10 ou 0 a 5), dificuldade subjetiva (1 a 5), texto de análise e total de horas jogadas no mundo real.
* **`Pool`**: Representa um sorteio ativo ou passado do Randomizer, mapeando o mês/ano de ocorrência, o tipo de quest e a referência ao jogo sorteado como vencedor (`winner_game_id`).
* **`PoolEntry`**: Tabela pivô que associa os jogos propostos para um sorteio específico e o jogador responsável por aquela indicação.
* **`CampaignContract`**: Tarefas de progressão da campanha geradas dinamicamente via IA para o Notice Board de um jogo. Cada contrato possui um número sequencial e uma porcentagem cumulativa de progresso correspondente à sua conclusão.
* **`CampaignContractProgress`**: Acompanhamento individual que indica se um determinado contrato de campanha está bloqueado (`LOCKED`), disponível para progressão (`AVAILABLE`) ou concluído (`COMPLETED`) por um jogador.

---

### 2.2. Ciclo de Vida do Progresso do Jogo (`GameStatus`)

O progresso do jogo para cada usuário transiciona entre os estados definidos pelo enum `GameStatus`:

```plaintext
      [ Novo Jogo Cadastrado ]
                 │
                 ▼
          ┌─────────────┐
          │  SUGGESTED  │ ◄────── (Jogo no backlog)
          └──────┬──────┘
                 │ Sorteio do Randomizer / Pausa Ativa
                 ▼
          ┌─────────────┐
          │   ACTIVE    │ ◄────── (Sendo jogado ativamente)
          └────┬─────┬──┘
               │     │
     100% Prog │     │ Desistência (Drop)
               ▼     ▼
    ┌───────────┐   ┌───────────┐
    │ COMPLETED │   │  DROPPED  │
    └───────────┘   └─────┬─────┘
                          │ Retomada (Se ambos abandonaram)
                          ▼
                    (Volta a ACTIVE)
```

* **`SUGGESTED`**: O jogo é incluído no backlog de sugestões do usuário. Ele permanece nesse estado enquanto está contido em um pote aberto para votação ou aguardando ação.
* **`ACTIVE`**: O jogo é definido como a quest atual em progresso do usuário.
  * **Origem da Transição**: A mudança para `ACTIVE` ocorre:
    1. Quando o jogo é o vencedor sorteado do pote pelo método [executeRoll](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L330-L434), ativando-o para todos os jogadores do sorteio.
    2. Quando um jogador oficial realiza um bypass no sorteio convencional utilizando a **Pausa Ativa** ([insertSpecialGame](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L470-L630)), forçando o jogo a ficar `ACTIVE`.
    3. Quando o usuário inicia manualmente o jogo pelo método [joinQuest](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/quest-actions.ts#L222-L300).
* **`COMPLETED`**: Indica que o usuário concluiu o jogo. Ocorre de forma automatizada ao marcar o último contrato (100%) da campanha no Notice Board como finalizado, ou ao digitar 100% de progresso manualmente.
* **`DROPPED`**: O jogador desiste de jogar a quest ativa. O sistema define a data de término e libera o jogo.

---

### 2.3. Ciclo de Vida do Contrato de Campanha (`ContractStatus`)

A progressão dos contratos no Quadro de Avisos é estritamente linear e sequencial:

```plaintext
  ┌───────────────────────┐
  │   AVAILABLE (Ordem 1) │ ──► Jogador conclui o objetivo ──┐
  └───────────────────────┘                                  │
                                                             ▼
  ┌───────────────────────┐                        ┌───────────────────┐
  │   LOCKED (Ordem > 1)  │ ──► Destravado por ──► │     COMPLETED     │
  └───────────────────────┘                        └───────────────────┘
```

* **`LOCKED`**: Status inicial de todos os contratos com ordem de sequência superior a 1. Eles ficam travados até que todos os marcos anteriores sejam atingidos.
* **`AVAILABLE`**: O contrato está pronto para ser jogado e marcado como concluído. No início, apenas o contrato de `sequence_order === 1` está disponível.
* **`COMPLETED`**: Indica que o objetivo daquela fase foi cumprido. Ao marcar o contrato como completo, o sistema atualiza o percentual de progresso geral do jogador no jogo correspondente e muda o status do contrato de sequência seguinte (`sequence_order + 1`) de `LOCKED` para `AVAILABLE`.

---

## 3. Regras de Negócio Vigentes

### 3.1. Restrição de Acesso e Perfis Oficiais
* Apenas os jogadores **Matheus** (`matheus31also@gmail.com`) e **Lucas** (`lucasedu17gomes@gmail.com`) possuem permissões administrativas para adicionar seleções e rodar sorteios de potes (conforme configurado em [randomizer-players.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/lib/randomizer-players.ts)).
* Outros e-mails autenticados em ambiente de produção recebem `403 Forbidden` ao interagir com as rotas de modificação de pools.
* Em ambiente de desenvolvimento ou de suíte de testes (`process.env.NODE_ENV === "development"` ou `"test"`), a função [isRandomizerPlayer](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/lib/randomizer-players.ts#L19-L27) ignora a barreira de e-mail e concede acesso administrativo a qualquer usuário autenticado.

### 3.2. Capacidade e Limites de Potes (Pools) do Randomizer
* O preenchimento do pote ativo do Randomizer possui limites bem desenhados:
  * **Main Quest**: Requer exatamente **4 jogos** indicados para que o sorteio seja liberado. O limite de indicações por jogador é de **2 jogos**.
  * **Side Quest**: Requer exatamente **6 jogos** indicados para que o sorteio seja liberado. O limite de indicações por jogador é de **3 jogos**.
* Se um usuário possuir e-mail terminado em `@test.com`, ele é considerado um testador e pode preencher sozinho todos os jogos requeridos do pote (limite individual igual ao total exigido).

### 3.3. Elegibilidade de um Jogo para o Sorteio
A inclusão de um jogo no pote ativo passa por uma validação profunda descrita em [validateGameEligibilityForPool](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L39-L92):
* **Proibido se Completo**: Se o jogo tiver status `COMPLETED` para Matheus ou para Lucas na base de dados, ele nunca mais poderá entrar em nenhum sorteio ou ser jogado como quest novamente.
* **Proibido se Ativo**: Se o jogo está com progresso `ACTIVE` para algum jogador, ele é rejeitado.
* **Condição para Reentrada de Drops**: Um jogo com progresso que foi abandonado por um jogador só pode entrar no sorteio se **ambos** os jogadores oficiais tiverem o status de progresso dele marcado como `DROPPED`. Se apenas um abandonou ou se um deles nem começou a jogá-lo, o jogo permanece bloqueado.

### 3.4. Bloqueio de Sorteio Ativo
* O sorteio do pote (Roll) para uma determinada categoria (Main ou Side Quest) é **bloqueado** caso a quest vencedora da rodada anterior desse mesmo tipo ainda esteja ativa (`ACTIVE`) para Matheus ou para Lucas.
* Para liberar o botão "Roll", ambos os jogadores precisam resolver a quest anterior, seja concluindo-a (`COMPLETED`) ou dropando-a (`DROPPED`).

### 3.5. Enriquecimento de Dados HLTB e IA Grounding
* **Cálculo da Duração**: Ao salvar a lista de jogos indicados, o frontend faz uma chamada para a API [/api/ai/hltb](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/ai/hltb/route.ts).
  * O sistema consome o tempo em cache do banco de dados se disponível.
  * Para novos títulos, faz uma pesquisa em tempo real na web através do Gemini-2.5-Flash (Google Search Grounding) para pegar a média "Main Story" no site HowLongToBeat.
  * Os valores de meia hora são arredondados para cima (ex: 5.5h -> 6h) e valores menores que 1 hora são gravados como 1. O retorno é salvo em lote de forma assíncrona no banco.
* **Geração da Campanha**: Ao criar o Notice Board de um jogo ([generateNoticeBoardAction](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/notice-board-actions.ts#L9-L88)), o serviço consome informações do IGDB e pesquisa via Gemini os atos e chefes do modo história real daquele jogo para estruturar a progressão em capítulos lógicos e específicos. 
  * Se a busca falhar ou o jogo for obscuro, a IA gera marcos com títulos estimativos proporcionais à duração do HLTB para não alucinar dados fictícios.

### 3.6. Concorrência e Integridade de Dados
* O sistema implementa **Lock Pessimista** (`SELECT ... FOR UPDATE`) no banco de dados para os métodos [saveSelections](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L151-L293) e [executeRoll](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L330-L434).
* Isso evita que cliques simultâneos de jogadores causem duplicidades de indicações ou que o pote seja sorteado enquanto outro usuário atualiza suas escolhas.
* No sorteio ([executeRoll](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L330-L434)), a busca de usuários oficiais é feita fora da transação do Prisma, reduzindo o tempo de retenção do lock do banco de dados.

### 3.7. Preservação de Histórico e Deleções
* O endpoint de DELETE de [/api/pools](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts#L138-L151) é totalmente desabilitado por regra de negócio, retornando `403 Forbidden` para qualquer chamada. A deleção de pools é estritamente proibida no sistema.
* Ao deletar um jogo indicado (`DELETE /api/games`), o sistema limpa apenas o autor da indicação (`nominated_by_id = null`), mantendo o jogo e a capa armazenados fisicamente no banco de dados para preservar relacionamentos históricos com progressos e reviews.

---

## 4. Fluxos Principais

### 4.1. Fluxo do Sorteio (The Great Randomizer)
1. **Seleção de Candidatos**: O jogador oficial acessa o painel do Randomizer, seleciona a categoria de Quest (Main ou Side) e adiciona os jogos de sua escolha do backlog.
2. **Validação de Elegibilidade**: Ao adicionar ou salvar, o sistema analisa individualmente os jogos. Caso um jogo infrinja as regras (completo por alguém, ativo por alguém, ou dropped por apenas um jogador), a gravação é bloqueada exibindo a mensagem de erro.
3. **Salvar Seleções**: Ao clicar em salvar, o sistema remove as indicações anteriores do usuário logado no pote corrente e insere as novas indicações usando um lock pessimista no banco de dados. Em seguida, aciona a IA para obter o tempo do HLTB.
4. **Preenchimento do Pote**: O sistema aguarda que o outro jogador oficial também complete e salve suas seleções para que o pote atinja a contagem exigida de jogos (4 para Main Quest, 6 para Side Quest).
5. **Realização do Sorteio (Roll)**:
   * Com o pote cheio e a quest anterior resolvida, um dos jogadores clica em "Roll".
   * A aplicação executa um sorteio imparcial no servidor dentro de uma transação.
   * O pool é fechado (`status = CLOSED`) e o jogo vencedor é registrado no campo `winner_game_id`.
   * Todos os jogos inseridos no pote geram registros de `GameProgress` com status `SUGGESTED` para Matheus e Lucas.
   * O progresso do jogo vencedor é atualizado para status `ACTIVE` com 0% de progresso e `start_date` registrado no momento do sorteio.
   * O sistema exibe o jogo vencedor na interface com animação cinemática.

---

### 4.2. Fluxo da Campanha (Notice Board / Quadro de Avisos)
1. **Geração do Notice Board**: Com a quest em andamento (`ACTIVE`), um jogador oficial aciona a geração do mural de contratos.
2. **Divisão de Metas**: O sistema consulta a IA que estrutura a progressão linear em contratos reais de capítulos e chefes (CampaignContracts).
3. **Abertura do Desafio**: Os registros de progresso de contratos (`CampaignContractProgress`) são criados para ambos os jogadores. O contrato de `sequence_order === 1` fica `AVAILABLE`, enquanto os de ordem 2 em diante iniciam como `LOCKED`.
4. **Execução**: Os jogadores jogam o game real no console ou PC.
5. **Conclusão de Etapas**: Ao atingir a meta descrita no contrato corrente, o jogador clica em "Completar Contrato".
   * O status da etapa muda para `COMPLETED`.
   * O percentual de progresso do jogo do usuário (`GameProgress.progress_percentage`) é atualizado com o valor acumulado estabelecido por aquele contrato.
   * O contrato subsequente (`sequence_order + 1`) muda para `AVAILABLE` para aquele jogador.
6. **Conclusão do Jogo**: Ao completar o último contrato da trilha (que vale 100%), o progresso geral do jogo do usuário é atualizado automaticamente para 100%, seu status passa a ser `COMPLETED` e o campo `end_date` é carimbado.
7. **Desbloqueio**: Assim que ambos os jogadores oficiais resolverem o jogo vencedor (ambos mudando para `COMPLETED` ou `DROPPED`), a restrição do Randomizer daquele tipo de quest cai, e o botão "Roll" é reativado para iniciar um novo ciclo.
