---
name: token-estimator
description: Estimates token consumption for an implementation plan and appends a Token Budget section to the plan. Use this skill whenever you finish writing an implementation_plan.md before presenting it to the user for review. It helps the user decide whether to start implementation based on expected cost.
---

# Token Estimator Skill

Use this skill **at the end of every PLANNING phase**, right before calling `notify_user` to request review. After writing `implementation_plan.md`, run a token estimation and append a **Token Budget** section to the plan.

## When to Apply

- After finishing `implementation_plan.md`
- Before requesting user review via `notify_user`
- For any plan that involves modifying, creating, or deleting files

## How to Estimate

### Step 1 — Count the files and their sizes

For every file listed in the plan under **Proposed Changes**, use the `view_file_outline` or `run_command` tool to measure its current line count:

```powershell
(Get-Item "absolute\path\to\file.ts").Length   # bytes
# or
(Get-Content "absolute\path\to\file.ts").Count  # line count
```

### Step 2 — Classify each file

| Class      | Description                                  | Token multiplier     |
| ---------- | -------------------------------------------- | -------------------- |
| **READ**   | File is read for context only (not modified) | lines × 8            |
| **MODIFY** | File is partially modified                   | lines × 12           |
| **NEW**    | File is created from scratch                 | estimated lines × 15 |
| **DELETE** | File is deleted (minimal cost)               | 50 flat              |

> Token ≈ 4 characters ≈ 0.75 words. A 100-line TypeScript file ≈ ~1 200 tokens to read.

### Step 3 — Add planning & reasoning overhead

| Item                                  | Flat cost            |
| ------------------------------------- | -------------------- |
| Planning reasoning + tool calls       | +3 000               |
| Each file read (tool call overhead)   | +200 per file        |
| Browser / terminal verification steps | +1 500 per step      |
| Per-file edit tool call               | +300 per file edited |

### Step 4 — Compute total and classify budget

| Total Estimate  | Budget Label     | Recommendation                 |
| --------------- | ---------------- | ------------------------------ |
| < 15 000        | 🟢 **Low**       | Safe to proceed anytime        |
| 15 000 – 40 000 | 🟡 **Medium**    | Proceed; stay focused          |
| 40 000 – 80 000 | 🟠 **High**      | Consider splitting into phases |
| > 80 000        | 🔴 **Very High** | Strongly recommend phasing     |

## Step 5 — Append to implementation_plan.md

Add this section at the **bottom** of the plan, before requesting review:

```markdown
---

## 💰 Token Budget Estimate

| File                | Action | Lines | Est. Tokens |
| ------------------- | ------ | ----- | ----------- |
| `foo.ts`            | MODIFY | 120   | ~1 440      |
| `bar.tsx`           | MODIFY | 80    | ~960        |
| `new-component.tsx` | NEW    | ~60   | ~900        |

| Overhead Item        | Est. Tokens |
| -------------------- | ----------- |
| Planning & reasoning | ~3 000      |
| File reads (N × 200) | ~800        |
| Verification steps   | ~1 500      |

**Total estimate: ~8 600 tokens** — 🟢 Low budget. Safe to proceed.

> These are rough estimates. Actual usage may vary ±30%.
```

## Important Notes

- **Be conservative**: round up, not down.
- **If the plan has phases**, estimate each phase separately.
- **Do not block** on getting exact numbers — a rough estimate is far more useful than none.
- **Always include the budget section**, even for small plans. It takes 1 minute and saves the user from unexpected mid-task interruptions.
