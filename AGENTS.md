# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Reference

**Package Manager:** pnpm (v10+)

```bash
pnpm dev          # Start dev server (hot reload) - http://localhost:6888
pnpm build        # Production build (Vite frontend + esbuild backend)
pnpm check        # TypeScript type check (no emit)
pnpm test         # Run all tests (Vitest)
pnpm format       # Format code (Prettier)
pnpm db:push      # Generate and run database migrations (Drizzle)
```

### Running Single Tests
```bash
pnpm vitest run server/eastmoney.test.ts           # Run specific test file
pnpm vitest run -- -t "should convert stock code"  # Run tests matching name
```

## Architecture Overview

DragonFly is an AI-powered A-stock (A股) analysis platform with a monorepo structure:

```
DragonFly/
├── client/src/           # React 19 frontend
│   ├── refactor_v2/      # Main UI components, hooks, stores
│   └── main.tsx          # App entry point
├── server/               # Node.js + Express + tRPC backend
│   ├── _core/            # Server entry, tRPC init, SSE streaming, AI agent system
│   ├── routers/          # tRPC routers (market, stock, ai, watchlist)
│   ├── ai/               # AI provider integrations
│   └── *.ts              # Data providers (akshare, eastmoney, ifind, yahoofinance)
├── shared/               # Shared types (frontend ↔ backend)
├── drizzle/              # Database schema and migrations (SQLite)
└── docs/                 # Documentation
    ├── ARCHITECTURE.md   # System architecture details
    └── ai-collab/        # AI collaboration guides
```

### Key Technical Decisions

1. **Type-Safe API**: tRPC provides end-to-end type safety between client and server
2. **Multi-Source Data**: Stock data from iFinD/AKShare/Eastmoney with automatic failover
3. **AI Streaming**: SSE-based streaming at `/api/ai/stream` using SmartAgent architecture
4. **State Management**: Zustand for client state, React Query for server state
5. **Charts**: `lightweight-charts` for K-line (candlestick) charts with A-stock style (red=up, green=down)

### Data Flow

```
User Action → Zustand Store → React Query → tRPC Client
    ↓
tRPC Server → Data Provider (iFinD/AKShare/Eastmoney) or AI Service
    ↓
Response (cached by React Query) → UI Update
```

### AI Integration

Multiple AI models supported via unified interface in `server/ai/`:
- OpenAI (GPT-4o)
- DeepSeek (DeepSeek-V3)
- Gemini (Gemini Pro)
- GLM (GLM-4)

## Code Style

- **TypeScript**: All new code must be TypeScript (strict mode)
- **Formatting**: Prettier with double quotes, semicolons, 2-space indent, 80 char line width
- **Components**: Functional React components with hooks
- **Imports**: Group by 1) third-party, 2) local modules, 3) types
- **Testing**: Vitest with `describe`/`it`/`expect` pattern

## Important Files

| File | Purpose |
|------|---------|
| `server/_core/index.ts` | Server entry point, Express + tRPC setup |
| `server/_core/agent/` | SmartAgent AI system (orchestration, skills, memory) |
| `server/routers/index.ts` | tRPC router aggregation |
| `client/src/refactor_v2/stores/` | Zustand state stores |
| `shared/types.ts` | Unified type exports |
| `drizzle/schema.ts` | Database schema definition |

## Detailed Documentation

For comprehensive guidelines, see:
- `docs/ARCHITECTURE.md` - System architecture and data structures
- `docs/ai-collab/AGENTS.md` - Full code style guide and file organization
- `docs/ai-collab/AI-COLLAB-PLAYBOOK.md` - Multi-agent collaboration workflows
