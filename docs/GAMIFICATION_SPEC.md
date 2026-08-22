# 🎮 Especificação do Sistema de Gamificação (GDD & XP Engine)

> **Documento de Game Design & Engenharia de Progressão**  
> **Projeto:** Gamers Aposentados  
> **Versão:** 1.0  
> **Módulo Técnico:** [`src/app/lib/xp-engine.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/xp-engine.ts) & [`src/lib/constants/rewards.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/lib/constants/rewards.ts)

---

## 📑 Índice

1. [Filosofia de Game Design & Princípios](#1-filosofia-de-game-design--princípios)
2. [Matemática do Sistema de XP (XP Engine)](#2-matemática-do-sistema-de-xp-xp-engine)
3. [Curva de Nível e Progressão de Carreira](#3-curva-de-nível-e-progressão-de-carreira)
4. [Tiers de Rank & Prestígio Visual](#4-tiers-de-rank--prestígio-visual)
5. [Catálogo de Recompensas & Cosméticos (Wardrobe)](#5-catálogo-de-recompensas--cosméticos-wardrobe)
6. [Feedback Sensorial & Celebração de Level Up](#6-feedback-sensorial--celebração-de-level-up)
7. [Integridade, Recálculo Determinístico & Transações](#7-integridade-recálculo-determinístico--transações)
8. [Matriz de Balanceamento & Expansões Futuras (V2)](#8-matriz-de-balanceamento--expansões-futuras-v2)

---

## 1. Filosofia de Game Design & Princípios

O ecossistema do **Gamers Aposentados** foi projetado para transformar o ato solitário de enfrentar um backlog acumulado de videogames em uma jornada cooperativa/competitiva contínua.

### Pilares Fundamentais:
1. **Valorização do Tempo Real (Anti-Grind Vazio):** A quantidade de XP concedida é diretamente proporcional ao esforço narrativo e temporal exigido pelo jogo, validado através da média global do *HowLongToBeat* (HLTB).
2. **Diferenciação de Escopo (Main vs. Side Quests):** Campanhas principais densas (RPGs, mundos abertos) exigem comprometimento a longo prazo e entregam recompensas de alto impacto; Side Quests (jogos indies, campanhas curtas) mantêm a rotatividade rápida da guilda.
3. **Recompensa por Maestria (Platinas & 100%):** O fechamento integral de conquistas é tratado como mérito de elite, aplicando um multiplicador substancial sobre a base de XP.
4. **Preservação Crítica da Memória:** O registro de reviews estruturadas com screenshots da jogatina concede recompensas de XP imediatas, incentivando a reflexão pós-jogo e enriquecendo o arquivo comunitário.

---

## 2. Matemática do Sistema de XP (XP Engine)

O cálculo de XP é estritamente determinístico e gerenciado por funções puras no módulo `xp-engine.ts`.

### 2.1 Fórmulas de Conclusão de Quests (`calculateGameXP`)

Para qualquer jogo finalizado (`status === "COMPLETED"`):

$$\text{Base XP}_{\text{Main Quest}} = \max\Big(300,\; \text{Horas HLTB} \times 15\Big)$$

$$\text{Base XP}_{\text{Side Quest}} = \max\Big(50,\; \text{Horas HLTB} \times 10\Big)$$

> *Nota:* Se o tempo HLTB for nulo ou zero, o sistema adota fallbacks seguros: **20 horas** para Main Quests (300 XP) e **6 horas** para Side Quests (60 XP).

### 2.2 Modificadores & Bônus Cumulativos

$$\text{XP Final} = \text{Base XP} + \text{Bônus Platina} + \text{Bônus Resgate}$$

* **Bônus de Platina / 100% Achievements (`isPlatinum = true`):**
  $$\text{Bônus Platina} = \text{Round}\big(\text{Base XP} \times 0.50\big) \quad (+50\%)$$
* **Bônus de Resgate / "Jogo Mofado" (`failedRollsCount >= 3`):**
  $$\text{Bônus Resgate} = \text{Round}\big(\text{Base XP} \times 0.20\big) \quad (+20\%)$$
  *Concedido a jogos que foram indicados 3 ou mais vezes no Randomizer sem serem sorteados antes de finalmente vencerem.*

### 2.3 XP por Produção Crítica & Análise (`calculateReviewXP`)

Ao cadastrar ou atualizar uma análise em `/reviews`:

| Ação Crítica | Critério | XP Concedido |
| :--- | :--- | :---: |
| **Review Simples** | Texto com menos de 50 caracteres | `+100 XP` |
| **Review Completa & Detalhada** | Texto $\ge$ 50 caracteres | `+200 XP` |
| **Bônus Fotográfico (Screenshots)** | 1 ou mais screenshots anexadas via Vercel Blob | `+50 XP` |
| **Teto Máximo por Review** | Review completa + screenshots | `+250 XP` |

---

### 2.4 Simulações de Cenários Reais

| Jogo Exemplo | Tipo de Quest | Duração HLTB | Platina? | Base XP | Bônus | XP Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| *Limbo / Inside* | Side Quest | 4h | Não | 50 XP *(Piso)* | 0 | **50 XP** |
| *Resident Evil 3 (Remake)* | Side Quest | 6h | Sim (+50%) | 60 XP | +30 XP | **90 XP** |
| *Hollow Knight* | Main Quest | 27h | Não | 405 XP | 0 | **405 XP** |
| *The Witcher 3: Wild Hunt* | Main Quest | 52h | Não | 780 XP | 0 | **780 XP** |
| *Elden Ring (100% Platina)* | Main Quest | 60h | Sim (+50%) | 900 XP | +450 XP | **1.350 XP** |
| *Persona 5 Royal (Platina)* | Main Quest | 100h | Sim (+50%) | 1.500 XP | +750 XP | **2.250 XP** |

---

## 3. Curva de Nível e Progressão de Carreira

A progressão de níveis utiliza uma curva exponencial de potência suave para garantir avanço rápido nos primeiros níveis (onboarding amigável) e desaceleração proporcional nos níveis avançados.

### 3.1 Equações da Curva

* **XP Requerido para passar do Nível $N$ para $N+1$:**
  $$\text{XP Requerido}(N) = \lfloor 80 \times N^{1.18} \rfloor$$

* **XP Acumulado Total para atingir o Nível $L$:**
  $$\text{XP Total}(L) = \sum_{N=1}^{L-1} \lfloor 80 \times N^{1.18} \rfloor$$

---

### 3.2 Tabela de Progressão de Níveis (1 a 25)

| Nível ($L$) | XP Requerido ($L \to L+1$) | XP Acumulado Total | Tier de Rank | Recompensa Desbloqueada no Nível |
| :---: | :---: | :---: | :--- | :--- |
| **1** | 80 XP | 0 XP | Aposentado Novato | 🏷️ Título: *Aposentado Novato* |
| **2** | 181 XP | 80 XP | Aposentado Novato | 🖼️ Moldura: *Moldura de Carvalho* |
| **3** | 291 XP | 261 XP | Aposentado Novato | 🏅 Insígnia: *Primeiro Passo* |
| **4** | 407 XP | 552 XP | Limpador de Poeira | 🏷️ Título: *Limpador de Poeira* |
| **5** | 527 XP | 959 XP | Limpador de Poeira | 🖼️ Moldura: *Escudo de Bronze* |
| **6** | 651 XP | 1.486 XP | Limpador de Poeira | 🏷️ Título: *Caçador de Backlog* |
| **7** | 778 XP | 2.137 XP | Limpador de Poeira | 🚩 Banner: *Fliperama Retrô* (FX: Scanline) |
| **8** | 908 XP | 2.915 XP | Limpador de Poeira | 🖼️ Moldura: *Brasão de Prata* |
| **9** | 1.040 XP | 3.823 XP | Caçador de Backlog | 🎨 Tema: *Taverna Medieval* |
| **10** | 1.175 XP | 4.863 XP | Caçador de Backlog | 🏷️ Título: *Destruidor de Pendências* |
| **11** | 1.312 XP | 6.038 XP | Caçador de Backlog | 🚩 Banner: *Dragão de Sangue* (FX: Dragon Fire) |
| **12** | 1.450 XP | 7.350 XP | Caçador de Backlog | 🖼️ Moldura: *Plasma Cyberpunk* (Pulse) |
| **13** | 1.591 XP | 8.800 XP | Caçador de Backlog | 🏷️ Título: *Veterano dos Controles* |
| **14** | 1.734 XP | 10.391 XP | Veterano dos Controles | 🖼️ Moldura: *Ouro Gótico* |
| **15** | 1.878 XP | 12.125 XP | Veterano dos Controles | 🎨 Tema: *Odisseia Estelar* |
| **16** | 2.024 XP | 14.003 XP | Veterano dos Controles | 🚩 Banner: *Templo de Chronos* (FX: Cosmic Stars) |
| **17** | 2.171 XP | 16.027 XP | Veterano dos Controles | 🏷️ Título: *Lenda do Retrogaming* |
| **18** | 2.320 XP | 18.198 XP | Veterano dos Controles | 🖼️ Moldura: *Aura do Vazio* |
| **19** | 2.470 XP | 20.518 XP | Veterano dos Controles | 🏷️ Título: *Mestre da Guilda Aposentada* |
| **20** | 2.622 XP | 22.988 XP | Mestre da Guilda | 🖼️ Moldura: *Chama da Fênix* (Legendary) |
| **21** | 2.775 XP | 25.610 XP | Mestre da Guilda | 🚩 Banner: *Éter Astral* (FX: Crystal Aura) |
| **22** | 2.929 XP | 28.385 XP | Mestre da Guilda | 🎨 Tema: *Arcade Retrô* (16-Bits) |
| **23** | 3.085 XP | 31.314 XP | Mestre da Guilda | 🚩 Banner: *Santuário do Sol Nascente* (FX: Sakura) |
| **24** | 3.242 XP | 34.399 XP | Mestre da Guilda | 🖼️ Moldura: *Coroa das Cinzas* (Lordran) |
| **25** | 3.400 XP | 37.641 XP | Mestre da Guilda | 🏆 Título: *Imortal do Backlog Zero* + 🎨 Tema: *Fogueira de Lordran* |

---

## 4. Tiers de Rank & Prestígio Visual

Os jogadores são enquadrados em 5 grandes patamares de honra (`RANK_TIERS`), que alteram dinamicamente a iluminação, bordas de avatar e tags em toda a interface do sistema:

```
  [ Nível 1 - 3 ]  ──►  Tier I:   Aposentado Novato      (Âmbar Suave)
  [ Nível 4 - 8 ]  ──►  Tier II:  Limpador de Poeira     (Verde Esmeralda)
  [ Nível 9 - 13]  ──►  Tier III: Caçador de Backlog     (Ciano Neon)
  [ Nível 14 - 19] ──►  Tier IV:  Veterano dos Controles (Cyber Magenta #bd0df2)
  [ Nível 20+ ]    ──►  Tier V:   Mestre da Guilda       (Ouro Solar & Fogo)
```

### Especificação de Estilos dos Ranks

```typescript
export const RANK_TIERS: RankTier[] = [
  {
    id: 'rookie',
    name: 'Aposentado Novato',
    minLevel: 1,
    maxLevel: 3,
    badgeClass: 'border-amber-600/50 bg-amber-950/30 text-amber-400 shadow-[0_0_12px_rgba(217,119,6,0.2)]',
    avatarBorder: 'border-amber-600/60 shadow-[0_0_20px_rgba(217,119,6,0.3)]',
    titleColor: 'text-amber-400',
    glowColor: 'bg-amber-600/15',
    iconName: 'shield',
  },
  {
    id: 'adventurer',
    name: 'Limpador de Poeira',
    minLevel: 4,
    maxLevel: 8,
    badgeClass: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    avatarBorder: 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.35)]',
    titleColor: 'text-emerald-400',
    glowColor: 'bg-emerald-500/15',
    iconName: 'compass',
  },
  {
    id: 'veteran',
    name: 'Caçador de Backlog',
    minLevel: 9,
    maxLevel: 13,
    badgeClass: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
    avatarBorder: 'border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.35)]',
    titleColor: 'text-cyan-400',
    glowColor: 'bg-cyan-500/15',
    iconName: 'swords',
  },
  {
    id: 'master',
    name: 'Veterano dos Controles',
    minLevel: 14,
    maxLevel: 19,
    badgeClass: 'border-[#bd0df2]/60 bg-[#bd0df2]/20 text-[#bd0df2] shadow-[0_0_18px_rgba(189,13,242,0.3)]',
    avatarBorder: 'border-[#bd0df2]/70 shadow-[0_0_30px_rgba(189,13,242,0.4)]',
    titleColor: 'text-[#bd0df2]',
    glowColor: 'bg-[#bd0df2]/20',
    iconName: 'crown',
  },
  {
    id: 'legend',
    name: 'Mestre da Guilda Aposentada',
    minLevel: 20,
    maxLevel: 999,
    badgeClass: 'border-amber-400/80 bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-amber-500/30 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
    avatarBorder: 'border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.5)]',
    titleColor: 'text-amber-300',
    glowColor: 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20',
    iconName: 'flame',
  }
];
```

---

## 5. Catálogo de Recompensas & Cosméticos (Wardrobe)

O catálogo global (`REWARDS_CATALOG`) organiza os itens cosméticos em 5 categorias:

### 5.1 Títulos de Honra (`TITLE`)
| ID | Nível | Nome | Raridade | Descrição |
| :--- | :---: | :--- | :--- | :--- |
| `title-novato` | 1 | **Aposentado Novato** | Common | Acabou de pendurar as chuteiras e ligar o console. |
| `title-limpador` | 4 | **Limpador de Poeira** | Common | Já tirou vários jogos mofados da prateleira. |
| `title-cacador` | 6 | **Caçador de Backlog** | Uncommon | Conquistou vitórias expressivas sobre jogos encostados. |
| `title-destruidor` | 10 | **Destruidor de Pendências** | Rare | Não deixa nenhum backlog impune. |
| `title-veterano` | 13 | **Veterano dos Controles** | Epic | Domina a arte de finalizar campanhas épicas sem abandonar. |
| `title-legend-retrogaming` | 17 | **Lenda do Retrogaming** | Epic | Sua sabedoria gamer é inquestionável na comunidade. |
| `title-mestre-guilda` | 19 | **Mestre da Guilda Aposentada** | Legendary | O nível lendário supremo de quem venceu o backlog acumulado. |
| `title-imortal-backlog` | 25 | **Imortal do Backlog Zero** | Legendary | O triunfo absoluto sobre o backlog e todas as eras dos games. |

---

### 5.2 Molduras de Avatar (`FRAME`)
| ID | Nível | Nome | Raridade | Estilo Visual / Asset |
| :--- | :---: | :--- | :--- | :--- |
| `frame-wooden` | 2 | **Moldura de Carvalho** | Common | Madeira rústica clássica Zelda (`border-amber-900`). |
| `frame-bronze` | 5 | **Escudo de Bronze** | Uncommon | Bronze metálico polido com glow âmbar. |
| `frame-silver` | 8 | **Brasão de Prata** | Rare | Prata de bruxo com reflexos metálicos. |
| `frame-cyber-neon` | 12 | **Plasma Cyberpunk** | Rare | Borda ciano com animação contínua de pulso neon. |
| `frame-gold` | 14 | **Ouro Gótico** | Epic | Ouro nobre gótico com anel de luz solar. |
| `frame-celestial-violet` | 18 | **Aura do Vazio** | Epic | Púrpura cósmico profundo com glow de energia escura. |
| `frame-legendary` | 20 | **Chama da Fênix** | Legendary | Borda rubi incandescente com duplo anel dourado. |
| `frame-bonfire-cinders` | 24 | **Coroa das Cinzas** | Legendary | Brasas ardentes de Lordran com partículas de fogo. |

---

### 5.3 Banners de Perfil com Efeitos Dinâmicos (`BANNER` + FX)
| ID | Nível | Nome | Raridade | Efeito Visual (`BannerFxOverlay`) |
| :--- | :---: | :--- | :--- | :--- |
| `banner-retro-arcade` | 7 | **Fliperama Retrô** | Uncommon | `scanline` (Linhas CRT animadas e aberração cromática). |
| `banner-fantasy-dragon` | 11 | **Dragão de Sangue** | Rare | `dragon-fire` (Labaredas de fogo e faíscas ascendentes). |
| `banner-chronos` | 16 | **Templo de Chronos** | Epic | `cosmic-stars` (Campo estelar cintilante e poeira estelar). |
| `banner-astral-crystal` | 21 | **Éter Astral** | Legendary | `crystal-aura` (Feixes de refração e brilhos prismáticos). |
| `banner-japanese-sunrise` | 23 | **Santuário do Sol Nascente** | Legendary | `sakura-twilight` (Pétalas de cerejeira caindo em paralaxe). |

---

### 5.4 Temas Globais de Interface (`THEME`)
Ao equipar um tema no perfil, o `ThemeProvider` injeta variáveis CSS customizadas na tag `<html>`:
* **Nível 9 — Taverna Medieval:** Tons terrosos, dourado envelhecido e texturas de pergaminho.
* **Nível 15 — Odisseia Estelar:** Azul profundo interestelar, roxo cósmico e branco estelar.
* **Nível 22 — Arcade Retrô:** Paleta 16-bits com contrastes vibrantes e tipografia pixelada.
* **Nível 25 — Fogueira de Lordran:** Preto carvão, laranja brasa incandescente e vermelho cinzento.
* **Padrão — Cyberpunk:** Neon Purple (`#bd0df2`), Cyber Cyan e Dark Slate.

---

## 6. Feedback Sensorial & Celebração de Level Up

Quando o usuário atinge o total de XP necessário para subir de nível, o sistema dispara um ciclo de recompensa em 3 etapas:

```
  [ Ganho de XP ] ──► [ LevelUpCelebrationListener ] ──► Modal Cinemático
                                                        ├─ Partículas Canvas (Confetes/Faíscas)
                                                        ├─ Revelação da Recompensa Desbloqueada
                                                        └─ Síntese Sonora Web Audio API
```

### 6.1 Síntese Procedural de Áudio (`LevelUpAudio.ts`)
Sem necessidade de carregar arquivos MP3 pesados, os sons de Level Up são sintetizados em tempo real via **Web Audio API**:

* **Cyberpunk (Padrão):** Arpeggio com onda *Sawtooth* com filtro *Bandpass* ressonante em escala pentatônica maior (C4 $\to$ C6).
* **Medieval:** Fanfarra majestosa combinando oscilador *Triangle* (trompete) e *Sine* (ressonância de sino harmônico em oitava superior).
* **Space:** Glissando de ondas *Sine* com modulação de frequência suave imitando dobra espacial e brilho estelar.
* **Pixel:** Jingle rápido e enérgico de 8 notas utilizando onda *Square* pura de 8-bits/16-bits.
* **Dark Souls (Lordran):** Sino catedralício sombrio em acorde menor (D2, D3, F3, A3) com decaimento exponencial de 3.5s sobreposto ao rugido da fogueira (*Sawtooth low-pass*).

---

## 7. Integridade, Recálculo Determinístico & Transações

Para prevenir corrupção de dados, explorações de XP ou perda de progresso após modificações no banco de dados, o sistema segue o padrão de **Recálculo Baseado em Estado**:

### 7.1 Algoritmo de Sincronização (`recalculateUserXPAndLevel`)
O XP do usuário **não é um acumulador incremental cego**. Em cada ação que altera o estado do jogo (concluir quest, marcar platina, dropar jogo, adicionar/editar review), o sistema:
1. Executa a mutação dentro de uma transação Prisma.
2. Faz uma varredura de todos os `GameProgress` com `status === "COMPLETED"` do usuário.
3. Faz uma varredura de todas as `Review` publicadas pelo usuário.
4. Aplica as fórmulas puras de `calculateGameXP` e `calculateReviewXP`.
5. Recalcula o nível correspondente e atualiza atomicamente as colunas `xp_points`, `level` e `equipped_title` na tabela `users`.

### 7.2 Tratamento de Drops e Deleys
* Se um jogo marcado como `COMPLETED` for posteriormente alterado para `DROPPED` ou resetado, o XP daquele jogo é **removido instantaneamente** no recálculo subsequente.
* Se o usuário cair de nível devido à perda de XP, itens de cosméticos que exigem nível superior continuam no catálogo, mas seu status passa a ser bloqueado até a recuperação do nível.

---

## 8. Matriz de Balanceamento & Expansões Futuras (V2)

### Propostas de Novas Mecânicas de Gamificação:

| Mecânica Proposta | Regra de Negócio / Fórmula | Benefício no Engajamento |
| :--- | :--- | :--- |
| **Daily Gaming Streak** | $\text{Bônus} = \min(1.5,\; 1.0 + (\text{Dias} \times 0.05))$ multiplicando o XP de contratos diários. | Incentiva o hábito de ligar o console e jogar diariamente. |
| **Guild Bounties (Apostas)** | Matheus e Lucas podem apostar 200 XP em quem zera a Main Quest primeiro. | Cria rivalidade saudável e dinamismo na guilda. |
| **Reroll Token Economy** | A cada 3 jogos platinados, o jogador ganha 1 "Token de Re-sorteio" para usar no Randomizer. | Recompensa a maestria com poder real de curadoria. |
| **Insígnias Narrativas Especiais** | Badges destravadas por feitos de catálogo (ex: *"Mestre dos Souls-like"*, *"Historiador dos JRPGs"*). | Diversifica as metas além do simples grind de níveis. |
| **Hall dos Campeões Sazonal** | Reset anual do Leaderboard competitivo com concessão de troféus eternos no perfil. | Mantém o desafio renovado a cada virada de ano. |
