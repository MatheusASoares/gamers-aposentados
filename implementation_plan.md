# HLTB Integration no Randomizer

Quando o usuário salva seus 3 jogos no Randomizer, o app irá automaticamente buscar os dados de tempo de conclusão no **HowLongToBeat (HLTB)** e exibir uma badge com as horas estimadas em cada card de jogo.

> [!WARNING]
> O pacote npm `howlongtobeat` (ckatzorke) está **abandonado** (último commit há 4 anos) e **quebrado**. O HLTB não tem API oficial. Qualquer solução envolve scraping ou AI.

## Três Opções — Escolha Uma

Há duas formas de resolver isso. A escolha afeta complexidade e dependências externas.

---

## Opção 1 — AI com Gemini 🤖 (Recomendada)

O Gemini recebe o nome do jogo e usa a **Google Search Tool** para encontrar os dados no HLTB e formatá-los em JSON estruturado. Isso é exatamente um "AI agent" integrado ao projeto.

```
[Usuário salva jogos]
        ↓
[handleSaveSelections no client]
        ↓ (após sucesso)
[Chama POST /api/ai/hltb com lista de jogos]
        ↓
[API Route chama Gemini com Google Search Tool]
        ↓ Gemini pesquisa "GameName site:howlongtobeat.com"
[Gemini extrai e formata as horas → retorna JSON]
        ↓
[Exibe badge no card]
```

**Custo:** Gemini 2.0 Flash tem tier gratuito generoso (1500 req/dia). Google Search Tool tem 1500 chamadas gratuitas/dia.  
**Latência:** ~2-4s por lote de jogos (chamada paralela).  
**Requer:** `GEMINI_API_KEY` no [.env](file:///c:/Users/mathe/Desktop/gamers-aposentados/.env) e no Vercel.

---

## Opção 2 — Scraping Manual do HLTB 🔧

Fazer o scraping direto da API interna do HLTB (a mesma que o site usa), sem pacote npm. Basta replicar a chamada `POST https://howlongtobeat.com/api/search` com os headers corretos.

**Vantagem:** Sem dependência externa, sem custo.  
**Desvantagem:** Frágil — pode quebrar se o HLTB mudar (igual ao npm package).

---

## Opção 3 — Scraping Manual (Recomendada se não quiser AI)

Mesma lógica do Opção 2, mas com um pequeno cache em memória usando um `Map` no servidor para evitar chamadas repetidas ao HLTB durante a sessão.

---

## Implementação Proposta (Opção 1 — Gemini)

### Dependências

#### [NEW] `@google/generative-ai` npm package

```bash
npm install @google/generative-ai
```

#### [MODIFY] [.env](file:///c:/Users/mathe/Desktop/gamers-aposentados/.env) e [.env.example](file:///c:/Users/mathe/Desktop/gamers-aposentados/.env.example)

```
GEMINI_API_KEY=sua-chave-aqui
```

---

### Backend

#### [NEW] `src/app/api/ai/hltb/route.ts`

Nova API Route que recebe uma lista de títulos e retorna dados do HLTB via Gemini:

```typescript
POST /api/ai/hltb
Body: { titles: ["The Witcher 3", "Hollow Knight", "Celeste"] }

Response:
{
  "results": [
    { "title": "The Witcher 3", "mainStory": 52, "mainExtra": 103 },
    { "title": "Hollow Knight", "mainStory": 27, "mainExtra": 45 },
    { "title": "Celeste", "mainStory": 8, "mainExtra": 12 }
  ]
}
```

---

### Frontend

#### [MODIFY] [src/components/game/RandomizerClient.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx)

**O que muda:**
1. Adicionar estado `hltbData: Record<string, HltbResult>` por título de jogo
2. Após [handleSaveSelections](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx#136-164) ter sucesso, chamar `/api/ai/hltb` com todos os jogos de uma vez
3. Exibir uma badge com as horas no card de cada jogo

**Badge visual proposta:**
```
┌──────────────────────────────────┐
│ 🎮 [Imagem]  The Witcher 3       │
│              ⏱ ~52h Main Story   │
└──────────────────────────────────┘
```

A badge aparece em todos os cards do pool (meus + do outro jogador).

---

## Verificação

1. Configurar `GEMINI_API_KEY` no [.env.local](file:///c:/Users/mathe/Desktop/gamers-aposentados/.env.local)
2. Rodar `npm run dev`
3. Acessar `/randomizer`, selecionar 3 jogos, clicar em **Salvar Seleções**
4. Verificar que a badge `⏱ ~Xh` aparece nos cards
5. DevTools → Network: verificar chamada para `/api/ai/hltb`

## Token Budget

| Item | Estimativa |
|---|---|
| Criar `/api/ai/hltb/route.ts` | ~80 linhas |
| Modificar [RandomizerClient.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/game/RandomizerClient.tsx) | ~60 linhas |
| **Total estimado** | **~140 linhas** |
