# 🚀 Guia Oficial de Implantação e Produção (Production Deployment Guide)
> **Projeto**: Gamers Aposentados  
> **Data**: 2026-07-25  
> **Objetivo**: Subir todas as novas funcionalidades (Temas Dinâmicos, Gamificação Nível 21, Quadro de Recompensas, Randomizer Themed Roll, Bordas e Quests) para produção de forma **zero-downtime** e **100% segura sem quebrar o banco nem a sessão dos usuários**.

---

## 📋 1. Checklist Pré-Flight (Ambiente Local)

Antes de realizar o deploy, execute a verificação final no seu ambiente local para confirmar que o código compila sem qualquer erro de tipagem ou bundle:

```bash
# 1. Compilação TypeScript estrita (deve retornar 0 erros)
npx tsc --noEmit

# 2. Build local de produção Next.js (valida geração de páginas SSR/SSG/Server Actions)
npm run build
```

---

## 🗄️ 2. Atualização e Sincronização do Banco de Dados (PostgreSQL / Neon)

As atualizações incluem novas colunas e enums na tabela `users` (`equipped_theme`, `equipped_title`, `equipped_frame`, `equipped_banner`, `xp_points`, `level`).

### 🔹 Passo 2.1: Verificar Variáveis de Ambiente de Produção
Ganta que no seu painel da Vercel / Provedor de Hospedagem as seguintes variáveis estejam configuradas:

```env
# Conexão com o PostgreSQL (Neon / Supabase)
DATABASE_URL="postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require"

# NextAuth / Auth.js
NEXTAUTH_SECRET="sua-chave-secreta-gerada"
NEXTAUTH_URL="https://seu-dominio.com"

# API do IGDB (Autocomplete & Imagens)
IGDB_CLIENT_ID="seu-client-id"
IGDB_CLIENT_SECRET="seu-client-secret"
```

### 🔹 Passo 2.2: Sincronizar o Schema Prisma em Produção
No seu terminal local (ou via script de deploy no CI/CD), execute o comando de push do Prisma para atualizar as tabelas em produção sem perder os dados existentes:

```bash
# Sincroniza as colunas de recompensa/nível no PostgreSQL de produção
npx prisma db push
```

> [!NOTE]
> O `npx prisma db push` cria apenas as novas colunas e enums com valores padrão (`cyberpunk`, `level = 1`), preservando todos os jogos, avaliações e contas de usuário já criadas!

---

## 🚢 3. Deploy na Vercel (Recomendado) ou Servidor Node.js

### 🔹 Opção A: Deploy via Vercel (Git Push)
Se o projeto está conectado ao GitHub / Vercel:

1. Faça o commit e push da branch principal:
   ```bash
   git add .
   git commit -m "feat: temas dinâmicos, gamificação nível 21, randomizer e bordas de recompensas"
   git push origin main
   ```
2. A Vercel detectará o push e executará o `npm run build` automaticamente.

### 🔹 Opção B: Deploy via Vercel CLI (Direto do Terminal)
```bash
npx vercel --prod
```

### 🔹 Opção C: Deploy Manual em VPS / Docker (PM2 / Node Server)
```bash
# No servidor de produção:
git pull origin main
npm ci
npx prisma generate
npx prisma db push
npm run build
pm2 restart gamers-aposentados
```

---

## ⚡ 4. Mecanismo de Cálculo de XP & Níveis (XP Engine)

O sistema de gamificação calcula o XP e os níveis dos jogadores automaticamente com base em [`src/app/lib/xp-engine.ts`](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/xp-engine.ts):

### 🔹 Fórmula de Ganho de XP por Quest:
- **Main Quests**: $\text{XP Base} = \max(300, \text{HLTB} \times 15)$ XP.
- **Side Quests / Mensais**: $\text{XP Base} = \max(50, \text{HLTB} \times 10)$ XP.
- **Bônus de Platina (100%)**: $+50\%$ de XP adicional sobre o XP base do jogo.
- **Bônus de Resgate / Jogo Mofado**: $+20\%$ de XP para jogos que acumularam sorteios anteriores.

### 🔹 Fórmula de Nível e Curva de Progresso:
- $\text{XP Requerido}(N) = \lfloor 80 \times N^{1.18} \rfloor$
- O nível do jogador é recalculado dinamicamente via `calculateLevelFromXP(totalXP)`, que calcula a barra de progresso ($0\% \text{ a } 100\%$) e o XP restante para o próximo nível.

### 🔹 Recálculo Retroativo de XP dos Jogadores Existentes:
Caso queira recalcular o XP de todos os usuários com base nas quests e jogos históricos já registrados no banco de produção:

```bash
# Recalcula o XP de todos os usuários com base no histórico real do banco
npx tsx src/scripts/backfill-xp.ts
```

### 🔹 Desbloqueio Geral (Nível 21 para Testes):
Caso você queira conceder Nível 21 (25.000 XP) a todos os usuários da guilda em produção para liberação total de todos os itens cosméticos:

```bash
node scratch/unlock_level21_all.cjs
```

---

## ✅ 5. Roteiro de Teste Pós-Implantação (Smoke Test)

Após o deploy concluir com sucesso, faça a verificação em produção navegando pelas rotas da guilda:

1. **Autenticação**: Faça login com uma conta de usuário.
2. **Navegação de Temas (Perfil -> Armário de Recompensas)**:
   - Troque entre os 4 temas (**Cyberpunk Neon**, **RPG Medieval**, **RPG Espacial**, **Pixel Art 16-Bit**).
   - Verifique a alteração instantânea das cores, bordas `.glass-card` e efeitos atmosféricos.
3. **Randomizer (Menu Board / Sorteio)**:
   - Clique em **"Testar Animação 🎲"**.
   - Confirme a exibição dos novos **Emblemas de Gaming (`react-icons/gi`)** sem qualquer quebra ou erro de script.
4. **Contratos & Reviews**:
   - Acesse o menu **Quests** e **Reviews** e confirme a presença das bordas iluminadas do tema equipado.

---

## ⏪ 6. Plano de Contingência & Rollback (Em caso de emergência)

Se ocorrer algum imprevisto em produção:

1. **Rollback do Deploy na Vercel**: No painel da Vercel -> *Deployments* -> selecione o deployment anterior -> Clique em *Promote to Production*.
2. **Segurança do Banco de Dados**: Nenhuma coluna antiga foi removida ou renomeada. O banco de dados permanecerá 100% retrocompatível.
