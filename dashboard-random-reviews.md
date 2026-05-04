# Dashboard Random Reviews Optimization

## Overview
Otimizar a query `SELECT id FROM reviews ORDER BY RANDOM() LIMIT 5` na página do dashboard (`src/app/(main)/page.tsx`). O uso de `ORDER BY RANDOM()` causa *full table scan*, o que escala mal e prejudica a performance do banco de dados (Prisma/PostgreSQL).

## Project Type
WEB (Next.js)

## Success Criteria
- [ ] A página principal carrega sem penalidade de tempo de resposta devido à query de reviews.
- [ ] O banco de dados não sofre *full table scan* contínuo.
- [ ] Os reviews continuam sendo selecionados de forma aleatória sem bias.

## Tech Stack
- **Next.js (Server Components)**: Onde a lógica reside.
- **Prisma**: ORM atual da aplicação.
- **PostgreSQL**: Banco de dados subjacente.
- **TypeScript/JS**: Utilizado para manipulação de array em memória, caso seja a solução escolhida.

## File Structure
- `src/app/(main)/page.tsx` - Modificação principal no bloco de "Independent Data Fetching".

## Task Breakdown

### Task 1: Análise e Escolha da Abordagem
- **Agent**: `backend-specialist`
- **Skills**: `database-design`, `nodejs-best-practices`
- **Description**: Definir, com base nas respostas do usuário, se a estratégia será cache + JS shuffle ou SQL puro com lógica de Offset/TableSample.
- **INPUT**: Decisões do usuário nas perguntas socráticas.
- **OUTPUT**: Abordagem final escolhida e documentada.
- **VERIFY**: Confirmação da viabilidade da solução escolhida no código.

### Task 2: Implementação da Otimização
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`, `python-patterns` (adaptação para JS/TS)
- **Description**: Substituir a instrução `prisma.$queryRaw` em `page.tsx` pela lógica otimizada (ex: `findMany({ select: { id: true } })` seguido de ordenação/sorteio O(N) no JS, ou usar subquery otimizada).
- **INPUT**: `src/app/(main)/page.tsx`.
- **OUTPUT**: Arquivo `page.tsx` atualizado.
- **VERIFY**: A IDE não acusa erros de TypeScript na query e os tipos de retorno continuam batendo com `{ id: string }[]`.

### Task 3: Validação em Ambiente Local
- **Agent**: `test-engineer` / `orchestrator`
- **Skills**: `lint-and-validate`
- **Description**: Executar lint e carregar a página localmente para garantir que não há quebra de layout e que 5 IDs são retornados corretamente.
- **INPUT**: Comando de execução `npm run dev`.
- **OUTPUT**: Página carregando e populando os *Stats Cards* (`<StatsGrid />`).
- **VERIFY**: Console limpo de erros e métricas de query mais eficientes.

## Phase X: Verification
- [x] Socratic Gate respeitado (Aguardando resposta do usuário).
- [x] Lint executado (`npm run lint && npx tsc --noEmit`).
- [x] Build concluído sem quebras (`npm run build`).
- [x] Teste manual na página local (`npm run dev`).
- [x] Nenhuma hardcoded secret introduzida.
