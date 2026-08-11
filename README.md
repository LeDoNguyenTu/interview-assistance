# CandorLens

CandorLens is a consent-based interview coaching and interviewer review platform.

## Prerequisites

- Node.js 24 LTS
- Corepack

## Setup

```powershell
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm install
pnpm format:check
```

Copy `.env.example` to the appropriate local environment file and provide values only through approved secret-management systems. Do not commit environment files with values.

## Workspace commands

```powershell
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```
