# 🏛️ Relatório de Engenharia e Análise de Impacto: Sistema de Guildas

> **Documento de Auditoria e Arquitetura de Produto**  
> **Objetivo:** Mapear exaustivamente todas as dependências, modelos, regras de negócio, atritos de UX e complexidades técnicas para a inclusão de Guildas no *Gamers Aposentados*.

---

## 🧭 1. Princípio Fundamental: Separação de Escopos (Global vs Guilda)

Para não gerar um caos de dados, a primeira regra arquitetural é definir com precisão cirúrgica o que pertence ao **Jogador (Global)** e o que pertence à **Guilda (Local)**:

```
                  ┌──────────────────────────────────────────────┐
                  │              JOGADOR (GLOBAL)                │
                  │  • Conta, Avatar, Senha, OAuth              │
                  │  • XP acumulado, Nível e Wardrobe           │
                  │  • Histórico de Reviews e Notas             │
                  │  • Quests Pessoais & Backlog Individual     │
                  │  • Jogos Favoritos & Deals Tracker          │
                  └──────────────────────┬───────────────────────┘
                                         │
                    Pertence a 1 ou N    │ (Membro / Líder)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │               GUILDA (LOCAL)                 │
                  │  • Potes do Randomizer (Main & Side)         │
                  │  • Quests Ativas da Guilda (Sorteio)         │
                  │  • Mural de Contratos por IA (Notice Board)  │
                  │  • Propostas & Votações de Pausa Ativa       │
                  │  • Leaderboard Interno da Guilda             │
                  │  • Feed de Atividades Recentes do Grupo      │
                  └──────────────────────┘
```

---

## 🗄️ 2. Mapeamento de Impacto no Banco de Dados (Prisma Schema)

| Entidade | Impacto da Mudança | Complexidade | Detalhes & Decisão Necessária |
| :--- | :--- | :--- | :--- |
| **`Guild`** | 🟢 **Novo Modelo** | Média | Tabela contendo `id`, `name`, `slug`, `avatar_url`, `banner_url`, `invite_code`, `owner_id`. |
| **`GuildMember`** | 🟢 **Novo Modelo** | Média | Tabela pivô contendo `guild_id`, `user_id`, `role (LEADER, OFFICER, MEMBER)`, `joined_at`. |
| **`Pool`** | 🟡 **Modificação** | Baixa | Adicionar `guild_id String`. Potes deixam de ser globais e passam a ser da guilda. |
| **`PoolEntry`** | 🟡 **Modificação** | Baixa | Continua ligando `pool_id`, `game_id` e `user_id` (quem indicou na guilda). |
| **`CampaignContract`** | 🟡 **Modificação** | Média | Adicionar `guild_id String` para permitir que duas guildas jogando o mesmo jogo tenham seus próprios contratos e progresso. |
| **`SpecialGameProposal`** | 🟡 **Modificação** | Baixa | Adicionar `guild_id String`. A votação de pausa ativa ocorre estritamente dentro da guilda. |
| **`GameProgress`** | 🔴 **Ponto Crítico** | **Alta** | **Decisão Arquitetural:** O progresso do jogador em um jogo deve ser *global por usuário* ou *isolado por guilda*? *(Ver Seção 5)*. |

---

## ⚙️ 3. Mapeamento de Impacto nas Server Actions & Serviços

### 🎲 A. Randomizer & Sorteio (`quest-actions.ts`, `pool-actions.ts`)
1. **Cotas de Indicação Dinâmicas:**
   - Hoje o código valida estritamente `2 indicações de Main` e `3 indicações de Side` divididas entre 2 e-mails fixos.
   - *Ajuste:* A cota de preenchimento do pote deve ser calculada dinamicamente:
     $$\text{Total Necessário} = N_{\text{membros}} \times \text{Cota por Membro}$$
2. **Validações de Elegibilidade de Jogos:**
   - Hoje a regra impede o sorteio de um jogo se ele já foi zerado por **ambos** os fundadores.
   - *Ajuste na Guilda:* O jogo é considerado inelegível se for zerado por **todos** os membros da guilda, ou se já estiver ativo na guilda atual.
3. **Execução do Roll (Sorteio):**
   - Ao sortear, o sistema cria o `GameProgress` com status `ACTIVE` para **todos os membros ativos daquela guilda**.

### 📜 B. Mural de Contratos por IA (`notice-board-actions.ts`, `notice-board-service.ts`)
1. **Consumo de Tokens de IA:**
   - Hoje cada usuário tem 2 tokens/dia (e fundadores têm 999).
   - *Ajuste:* Quando um membro clica em "Gerar Mural com IA", gasta o token do usuário ou a guilda tem um limite compartilhado de geração?
2. **Sincronização de Conclusão:**
   - Quando o Jogador A completa o Contrato 1 no mural da Guilda X, isso deve avançar apenas o contrato do Jogador A ou deve notificar o grupo? (Manter individual com placar comparativo da guilda).

### ⏸️ C. Pausa Ativa & Special Release (`special-game-actions.ts`)
1. **Quórum de Votação Proporcional:**
   - Hoje requer aprovação de 2/2 jogadores.
   - *Ajuste:* Quórum dinâmico baseado no tamanho da guilda:
     $$\text{Votos Mínimos para Aprovação} = \left\lfloor \frac{N_{\text{membros}}}{2} \right\rfloor + 1$$

### 📖 D. Histórico de Quests (`history-actions.ts`)
1. **Filtro de Potes da Guilda:**
   - A aba "Potes da Guilda Oficial" passa a se chamar **"Potes da Guilda"** e consulta os sorteios fechados da guilda atualmente ativa no cabeçalho.

---

## 🖥️ 4. Mapeamento de Telas e Componentes (Frontend Tier)

### 1. Novo Componente: `GuildSwitcher` (No Header / Sidebar)
* Exibe a guilda atualmente selecionada.
* Dropdown para alternar entre as guildas do usuário.
* Botão para **"Criar Nova Guilda"** e **"Entrar via Código de Convite"**.

### 2. Dashboard Central (`/` - `page.tsx`)
* **Hero Principal:** Exibe a Main Quest e Side Quest ativas da **Guilda Selecionada**.
* **Leaderboard ("Fila do INSS"):** Exibe o ranking dos membros da **Guilda Selecionada** (com aba alternativa para o ranking global da plataforma).
* **RecentActivity Feed:** Feed de eventos filtrado pelos membros daquela guilda.

### 3. Nova Página / Modal: Gestão da Guilda (`/guilds/[id]` ou Modal)
* Nome, descrição, foto de capa e banner.
* Link / Código de Convite copiável com 1 clique (`/invite/XYZ123`).
* Lista de membros com seus papéis (`Líder`, `Oficial`, `Membro`).
* Ações de moderação: Promover a Oficial, Expulsar membro, Sair da guilda.

---

## ⚠️ 5. Os 6 "Casos de Caos" e Decisões Críticas que Precisamos Tomar

Antes de escrever qualquer linha de código, estas 6 situações precisam de regras bem definidas:

### 🥊 Caso 1: O "Conflito de Jogos Repetidos" (GameProgress Global vs Local)
* *Cenário:* O jogador Matheus está jogando *Elden Ring* com a Guilda A (está em 40%). Ele entra na Guilda B e eles sorteiam *Elden Ring*.
* *Alternativa Recomendada:* O `GameProgress` de um jogo é **pessoal do jogador** (`user_id + game_id`). Se a Guilda B sortear o mesmo jogo, o Matheus já entra com seus 40% preservados, e o progresso dele conta normalmente na visualização da Guilda B. Isso evita duplicar o mesmo jogo 3 vezes no armário do usuário.

### ⏳ Caso 2: Membro Inativo travando o Randomizer
* *Cenário:* Uma guilda de 4 pessoas abre o sorteio. Três membros preenchem suas indicações em 5 minutos. O quarto membro viaja e fica 1 semana sem abrir o app.
* *Solução Necessária:* O Líder/Oficial da guilda deve ter o poder de **"Trancar Pote com Membros Presentes"** ou definir o sorteio ignorando quem não preencheu até o prazo limite.

### 🚪 Caso 3: Membro Entrando no Meio de uma Quest Ativa
* *Cenário:* Matheus e Lucas já estão em 60% de *Mad Max*. Um amigo novo entra na guilda hoje.
* *Solução Necessária:* O novo membro entra na guilda e tem a opção de clicar em **"Entrar na Quest Atual"** (iniciando em 0%) ou aguardar o próximo sorteio da guilda.

### 👑 Caso 4: Saída do Líder / Transferência de Guilda
* *Cenário:* O criador da guilda decide sair ou deletar a conta.
* *Solução Necessária:* O sistema não permite ao Líder sair sem antes transferir a liderança para outro membro ativo (ou promover o membro mais antigo automaticamente).

### 🪙 Caso 5: Economia de Tokens de IA no Mural
* *Cenário:* Várias pessoas criam guildas e tentam abusar da geração de mural com IA no Gemini.
* *Solução Necessária:* O limite de geração de mural é atrelado ao **usuário que clica** (ex: 2 tokens diários por usuário). A guilda se beneficia do mural gerado sem sobrecarregar a cota da API.

### 🔒 Caso 6: Retrocompatibilidade 100% Garantida com a Guilda dos Fundadores
* *Cenário:* Como garantir que você e o Lucas não sintam nenhuma diferença negativa no app atual?
* *Solução:* No momento da migração, o sistema cria a guilda **"Guilda dos Fundadores"**, associa vocês dois automaticamente como líderes, e define o cookie de guilda ativa padrão para ela. Para vocês, a experiência continuará exatamente igual ao que é hoje.
