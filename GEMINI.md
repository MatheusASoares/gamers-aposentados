---
trigger: always_on
---

# GEMINI.md - Antigravity Kit

> This file defines how the AI behaves in this workspace.

---

## 🚨 CRITICAL: AGENT & SKILL PROTOCOL

> **MANDATORY:** Read the appropriate agent file and its skills BEFORE implementation.

### 1. Modular Skill Loading Protocol
Agent activated → Check frontmatter `skills:` → Read `SKILL.md` (INDEX) → Read specific sections.
- **Selective Reading:** DO NOT read all files in a skill folder. Read `SKILL.md` first, then only sections matching request.
- **Rule Priority:** P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md). All rules binding.

### 2. Enforcement Protocol
1. **Activated:** Read Rules → Check Frontmatter → Load SKILL.md → Apply All.
2. **Forbidden:** Never skip reading agent rules or skill instructions. "Read → Understand → Apply" is mandatory.

---

## 📥 REQUEST CLASSIFIER

| Request Type | Trigger Keywords | Active Tiers | Result |
| :--- | :--- | :--- | :--- |
| **QUESTION** | "what is", "how does", "explain" | TIER 0 only | Text Response |
| **SURVEY/INTEL** | "analyze", "list files", "overview" | TIER 0 + Explorer | Session Intel (No File) |
| **SIMPLE CODE** | "fix", "add", "change" (single file) | TIER 0 + TIER 1 (lite) | Inline Edit |
| **COMPLEX CODE** | "build", "create", "implement", "refactor" | TIER 0 + TIER 1 (full) + Agent | `{task-slug}.md` Required |
| **DESIGN/UI** | "design", "UI", "page", "dashboard" | TIER 0 + TIER 1 + Agent | `{task-slug}.md` Required |
| **SLASH CMD** | /create, /orchestrate, /debug | Command-specific flow | Variable |

---

## 🤖 INTELLIGENT AGENT ROUTING (AUTO)

**ALWAYS ACTIVE: Automatically analyze and select the best specialist agent(s).**

### Protocol
1. **Analyze (Silent):** Detect domains (Frontend, Backend, Security, etc.).
2. **Select Agent(s):** Choose the specialist. Respect `@agent` overrides.
3. **Inform User (Mandatory):**
```markdown
🤖 **Applying knowledge of `@[agent-name]`...**

[Continue with specialized response]
```

### ⚠️ Routing Checklist (Before ANY Code/Design Work)
1. Identified correct agent? → If not, stop & analyze domain.
2. Read agent `.md` file? → Open `.agent/agents/{agent}.md`.
3. Announced `🤖 Applying knowledge of @[agent]...`? → Must include.
4. Loaded required skills from frontmatter? → Read them.

---

## TIER 0: UNIVERSAL RULES (Always Active)

### 🌐 Language Handling
- Non-English prompts: Translate internally, respond in user's language, code/comments in English.

### 🧹 Clean Code (Global Mandatory)
- Concise, self-documenting code. No over-engineering.
- Testing: Pyramid (Unit > Int > E2E) + AAA Pattern.
- Performance: Core Web Vitals standard.

### 🌐 Browser Access Policy (Explicit Approval Only)
> 🔴 **MANDATORY:** DO NOT invoke `browser_subagent` autonomously.
> - **Default:** Browser tools are restricted / OFF by default.
> - **Trigger:** Invoke `browser_subagent` **ONLY** when explicitly requested (e.g., *"abra o browser"*, *"teste na tela"*, *"tire screenshot"*).
> - **Validation:** Use TypeScript (`npx tsc --noEmit`), unit tests, and terminal scripts for validation.

### 📁 File Dependency Awareness
1. Check `CODEBASE.md` → File Dependencies.
2. Identify dependent files and update affected files together.

### 🛑 Global Socratic Gate
**Every request must pass through the Socratic Gate before ANY tool use or code implementation:**
- **New Feature / Build:** Ask min. 3 strategic questions.
- **Code Edit / Bug Fix:** Confirm understanding + ask impact questions.
- **Vague / Simple:** Clarify Purpose, Users, and Scope.
- **Full Orchestration:** Stop subagents until plan is confirmed.
- **Direct "Proceed":** Ask 2 edge-case / trade-off questions first.

---

## TIER 1: CODE RULES

### 📱 Project Type Routing
- **MOBILE:** `mobile-developer` (Skill: `mobile-design`)
- **WEB:** `frontend-specialist` (Skill: `frontend-design`)
- **BACKEND:** `backend-specialist` (Skills: `api-patterns`, `database-design`)

### 🏁 Final Checklist Protocol
Triggered by: "son kontrolleri yap", "final checks", "çalıştır tüm testleri":
- **Manual Audit:** `python .agent/scripts/checklist.py .`
- **Pre-Deploy:** `python .agent/scripts/checklist.py . --url <URL>`
- **Order:** 1. Security → 2. Lint → 3. Schema → 4. Tests → 5. UX → 6. SEO → 7. Lighthouse/E2E.

**Scripts Available:**
- `security_scan.py`, `dependency_analyzer.py` (vulnerability-scanner)
- `lint_runner.py` (lint-and-validate), `test_runner.py` (testing-patterns)
- `schema_validator.py` (database-design), `ux_audit.py`, `accessibility_checker.py` (frontend-design)
- `seo_checker.py` (seo-fundamentals), `bundle_analyzer.py`, `lighthouse_audit.py` (performance-profiling)
- `playwright_runner.py` (webapp-testing), `mobile_audit.py` (mobile-design)

---

## TIER 2: DESIGN RULES & BRAND EXCEPTIONS

> 💜 **Project Brand Exception (Gamers Aposentados):**
> O tom `#bd0df2` (Neon Purple/Cyber Magenta) e a estética Cyberpunk Neon da aplicação possuem **autorização explícita e exceção de marca aprovada** para utilização em toda a interface.

### 📱💻 DIRETRIZ RESPONSIVA DUAL-PARADIGM (Desktop vs Mobile Friendly)
> 🚨 **REGRA OBRIGATÓRIA:** O design desktop e mobile devem ser tratados como experiências distintas de primeira classe, nunca como mero encolhimento de tela.

1. **Separação de Layouts por Viewport**:
   - **Desktop (`lg` / `xl`)**: Aproveitamento inteligente do espaço horizontal. Grupos de 4 ações/filtros DEVEM ficar alinhados em linha contínua **4x1** (`lg:flex lg:flex-row` ou `grid lg:grid-cols-4`). Subfiltros e barras de controle devem se posicionar em linha única sem quebras verticais desnecessárias.
   - **Mobile (`< sm` / `sm`)**: Foco em usabilidade tátil (polegar). Filtros podem ser organizados em **2x2** ou carrossel horizontal deslizável, com botões amplos para toque seguro.
2. **Padrão Tipográfico & Política Anti-Microtexto**:
   - **Títulos e Headings**: Mínimo `text-sm sm:text-base font-bold` (proibido usar `text-xs` para nomes e títulos principais).
   - **Preços e Métricas**: Mínimo `text-sm sm:text-base font-black` com alto contraste visual e destaque na moeda local (BRL).
   - **Labels, Badges e Tags**: Mínimo `text-xs font-bold` (PROIBIDO o uso de fontes ilegíveis como `text-[9px]` ou `text-[10px]` para dados informativos).
   - **Interatividade & Botões**: Padding mínimo de `px-3 py-1.5` ou `px-3.5 py-2`, garantindo legibilidade e feedback tátil em qualquer densidade de tela.

- **Web UI/UX:** Read `.agent/frontend-specialist.md`
- **Mobile UI/UX:** Read `.agent/mobile-developer.md`

---

## 📁 QUICK REFERENCE
- **Masters:** `orchestrator`, `project-planner`, `security-auditor`, `backend-specialist`, `frontend-specialist`, `mobile-developer`, `debugger`, `game-developer`
- **Key Skills:** `clean-code`, `brainstorming`, `app-builder`, `frontend-design`, `mobile-design`, `plan-writing`, `behavioral-modes`
