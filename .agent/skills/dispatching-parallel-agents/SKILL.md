---
name: dispatching-parallel-agents
description: |
  Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies.
  This skill orchestrates multiple AI agents (Codex, GLM, MiniMax, Amp, Grok) to work in parallel,
  maximizing throughput while avoiding conflicts. Covers task decomposition, agent selection based on
  capabilities, RALPH loop integration, conflict prevention, and real-world parallel execution examples.
---

# Dispatching Parallel Agents

Coordinate multiple AI agents to execute tasks simultaneously, maximizing development velocity
while preventing conflicts. This is the core skill for multi-agent collaboration.

## When to Use

- **2+ independent tasks** can be worked on simultaneously
- **No shared state** between tasks (different files/modules)
- **Total work > 2 hours** and parallelization is beneficial
- **Overnight execution** where multiple agents can run unattended

## Agent Capability Matrix

### Model Backgrounds & Strengths

| Agent | Model | Background | Best For | Cost | Speed |
|-------|-------|------------|----------|------|-------|
| **Antigravity** | Claude Opus 4.5 | Deep reasoning, planning | Architecture, coordination, complex debugging | 💰💰💰 | 🐢 |
| **Amp** | Claude Sonnet 4.5 | Accuracy, low hallucination | Code review, quality assurance | 💰💰 | 🐇 |
| **Codex** | GPT-5.2 Codex | Patient execution | Detailed refactoring, overnight tasks, React | 💰💰 | 🐢 |
| **GLM** | GLM-4.7 | Speed, Chinese, cost | Large code generation, repetitive tasks | 💰 | 🐇🐇 |
| **MiniMax** | MiniMax | Type-safe, structured | Theme systems, type definitions | 💰 | 🐇 |
| **Grok** | xAI Grok | Real-time search | Research, API docs, best practices | 💰💰 | 🐇 |

### Performance Benchmarks (2025-2026)

```
GLM-4.7:
  - SWE-bench: 73.8%
  - LiveCodeBench-v6: 84.9% (open-source #1)
  - Cost: ~15% of Claude

Codex (GPT-5.2):
  - First-try success: 37%
  - With retries: 70.2%
  - Development speedup: 2-3x

Claude Sonnet 4.5:
  - Accuracy: Highest tier
  - Hallucination rate: Lowest
  - Large codebase understanding: Excellent
```

## RALPH Loop Integration

The RALPH loop (Read → Analyze → Learn → Plan → Hypothesize) integrates with multi-agent workflow:

```
┌─────────────────────────────────────────────────────────────────────┐
│ RALPH LOOP                                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────┐   ┌─────────┐   ┌───────┐   ┌──────┐   ┌────────────┐   │
│  │ READ │ → │ ANALYZE │ → │ LEARN │ → │ PLAN │ → │ HYPOTHESIZE│   │
│  └──────┘   └─────────┘   └───────┘   └──────┘   └────────────┘   │
│      ↑                                                     │       │
│      └─────────────── Feedback Loop ──────────────────────┘       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ MULTI-AGENT DISPATCH PHASE                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  After PLAN: Antigravity decomposes into parallel tasks             │
│                                                                     │
│  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐      │
│  │ Agent A (Codex)│   │ Agent B (GLM)  │   │ Agent C (Mini) │      │
│  │ Task Guide A   │   │ Task Guide B   │   │ Task Guide C   │      │
│  │ Files: A/*     │   │ Files: B/*     │   │ Files: C/*     │      │
│  └───────┬────────┘   └───────┬────────┘   └───────┬────────┘      │
│          │                    │                    │                │
│          └────────────────────┼────────────────────┘                │
│                               ↓                                     │
│                    ┌──────────────────┐                             │
│                    │ Antigravity      │                             │
│                    │ Reviews & Merges │                             │
│                    └──────────────────┘                             │
│                               ↓                                     │
│                    Back to READ (next iteration)                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Conflict Prevention Strategies

### 1. File-Level Isolation

**Principle**: Each agent owns exclusive files/directories.

```
❌ BAD: Both agents edit same file
   Agent A: components/Header.tsx (lines 1-50)
   Agent B: components/Header.tsx (lines 51-100)
   Result: Merge conflicts guaranteed

✅ GOOD: Agents own different files
   Agent A: components/Header.tsx, api/stocks.ts
   Agent B: themes/*.ts, stores/theme.store.ts
   Result: Clean merge
```

### 2. Dependency Ordering

**Principle**: Infrastructure before features, types before implementation.

```
Phase 1 (Foundation) - Must complete first:
  └── types/theme.ts [GLM]
  └── api/client.ts [Codex]

Phase 2 (Implementation) - Can parallelize after Phase 1:
  ├── themes/dark.theme.ts [GLM]
  ├── themes/pixel.theme.ts [GLM]  
  ├── api/stocks.ts [Codex]
  └── api/watchlist.ts [Codex]

Phase 3 (Integration) - After Phase 2:
  └── components/ThemeSwitcher.tsx [Any]
```

### 3. Contract-First Development

**Principle**: Define interfaces before implementation.

```typescript
// Define contract FIRST (in shared types file)
interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

// Then agents implement independently
// Agent A: implements getTheme(id) → Theme
// Agent B: implements <ThemeSwitcher themes={Theme[]} />
```

### 4. Task Boundary Markers

Include clear ownership in task guides:

```markdown
### Task: Theme Store Implementation

**Owner**: MiniMax
**Files OWNED** (exclusive write):
  - stores/theme.store.ts
  - themes/registry.ts

**Files READ-ONLY** (for reference):
  - types/theme.ts
  - tokens.css

**Do NOT touch**:
  - components/* (Codex owns these)
```

## Real-World Example: DragonFly Parallel Execution

### Scenario: Codex + MiniMax Working Simultaneously

```
┌──────────────────────────────────────────────────────────────────┐
│ TIME: 2026-01-20 15:17                                           │
│ User: "让 Codex 干 UI 优化，让 MiniMax 干主题系统"                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────┐                             │
│  │ CODEX: UI-POLISH-COMBINED.md   │                             │
│  │ ─────────────────────────────── │                             │
│  │ Owns:                           │                             │
│  │ - components/LeftPane.tsx       │                             │
│  │ - components/StockChart.tsx     │                             │
│  │ - components/RightPane.tsx      │                             │
│  │ - styles/tokens.css (shadows)   │                             │
│  │                                 │                             │
│  │ Tasks:                          │                             │
│  │ ✅ BF-001: Name display fix     │                             │
│  │ ✅ UI-001: Sidebar modernize    │                             │
│  │ ✅ UI-003: Chart controls       │                             │
│  │ ✅ UI-005: AI input glow        │                             │
│  └─────────────────────────────────┘                             │
│                  ↓                                                │
│             (Running ~2.5h)                                       │
│                  ↓                                                │
│  ┌─────────────────────────────────┐                             │
│  │ MINIMAX: GLM-P1-THEME-GUIDE.md │                             │
│  │ ─────────────────────────────── │                             │
│  │ Owns:                           │                             │
│  │ - types/theme.ts                │                             │
│  │ - themes/*.theme.ts             │                             │
│  │ - themes/registry.ts            │                             │
│  │ - stores/theme.store.ts         │                             │
│  │ - hooks/useTheme.ts             │                             │
│  │                                 │                             │
│  │ Tasks:                          │                             │
│  │ ✅ G-001: Theme types           │                             │
│  │ ✅ G-002-005: 4 themes          │                             │
│  │ ✅ G-008: Zustand store         │                             │
│  │ ✅ G-010: ThemeSwitcher         │                             │
│  └─────────────────────────────────┘                             │
│                  ↓                                                │
│             (Running ~2.5h)                                       │
│                  ↓                                                │
├──────────────────────────────────────────────────────────────────┤
│ TIME: 2026-01-20 19:17 (4 hours later)                           │
│                                                                  │
│ RESULT: Both complete, pnpm check passes ✅                      │
│         No merge conflicts                                       │
│         4 themes working + UI improvements                       │
│                                                                  │
│ NEXT: Antigravity reviews → Creates Round 2 fixes               │
└──────────────────────────────────────────────────────────────────┘
```

### Post-Merge Review Findings

After parallel execution, Antigravity reviews and creates new tasks:

```markdown
## Review Findings → Round 2 Tasks

| Issue Found | New Task | Assignee |
|-------------|----------|----------|
| Search dropdown behavior | FIX-001: Keyboard navigation | Codex |
| Button position blocks price | FIX-002: Move to left toolbar | Codex |
| Period buttons are mock | FIX-003: Connect to backend | Codex |
| Cyberpunk theme glitch | FIX-005: Border rendering | MiniMax |
| Dark theme input colors | FIX-006: Use CSS variables | Codex |
```

## Task Guide Template for Parallel Execution

```markdown
# [Task Group Name]

> **Executor**: Codex / GLM / MiniMax
> **Estimated Time**: X hours
> **Parallel Group**: A / B / C  ← Indicates parallel execution group

---

## ⚠️ Ownership Declaration

### Files I OWN (exclusive write access):
- `path/to/file1.ts`
- `path/to/file2.tsx`
- `path/to/directory/*`

### Files I READ (no modifications):
- `types/*.ts`
- `styles/tokens.css`

### Files FORBIDDEN (another agent owns):
- `themes/*` (MiniMax owns)
- `api/*` (Codex owns)

---

## Tasks

### T-001: First Task
...

---

## Verification

\`\`\`bash
pnpm check  # Type safety
pnpm dev    # Visual check
\`\`\`

## Problem Log

If blocked, document here immediately:
- [x] Problem: ...
- [x] Workaround: ...
- [ ] Needs human decision: ...
```

## Dispatch Decision Tree

```
                    ┌─────────────────┐
                    │  New Task Set   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Can parallelize? │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
           YES              DEPENDS           NO
            │                │                │
  ┌─────────▼─────────┐     │       ┌────────▼────────┐
  │ Check file overlap │     │       │ Sequential exec │
  └─────────┬─────────┘     │       │ (use best agent)│
            │               │       └─────────────────┘
    ┌───────┴───────┐       │
    │               │       │
   NONE          OVERLAP    │
    │               │       │
    ▼               ▼       ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│ Dispatch  │  │ Split by  │  │ Phase into│
│ to agents │  │ files/dirs│  │ sequential│
└───────────┘  └───────────┘  └───────────┘
```

## Best Practices

1. **Always declare file ownership** in task guides
2. **Types/interfaces first** to establish contracts
3. **No shared mutable state** between parallel agents
4. **Batch reviews** after parallel work completes
5. **Quick iteration cycles** - don't let issues accumulate
6. **Visual verification** with agent-browser for UI work
7. **pnpm check gate** - mandatory before considering done
8. **Problem logging** - agents must document blockers immediately

## Anti-Patterns to Avoid

```
❌ Two agents editing same component
❌ Agent A depends on Agent B's in-progress work
❌ No ownership declaration in task guides
❌ Skipping type definitions before implementation
❌ Long parallel runs without checkpoints
❌ No verification commands in task guides
```

## Communication Templates

### Dispatching to Agent

```
请阅读并执行 tasks/epics/{epic}/codex/TASK-GUIDE.md

这是与 {other-agent} 并行执行的任务。
你负责的文件: {list}
禁止修改: {other-agent's files}
```

### Agent Status Report

```markdown
## Status: [Agent Name]

### Completed
- ✅ T-001: Description
- ✅ T-002: Description

### In Progress
- 🔄 T-003: Description (eta: 30min)

### Blocked
- ⚠️ T-004: Need backend API for X

### Files Modified
- `path/to/file1.ts` (new)
- `path/to/file2.tsx` (modified)

### Verification
\`\`\`
pnpm check → ✅ Pass
\`\`\`
```
