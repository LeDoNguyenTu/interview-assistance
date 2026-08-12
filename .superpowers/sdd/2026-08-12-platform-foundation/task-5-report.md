# Task 5 report: Next.js web shell

## Scope delivered

- Created `@candorlens/web` with Next.js `16.3.0`, React `19.2.8`, App Router routes, PostCSS/Tailwind integration, and exact pinned package versions in `pnpm-lock.yaml`.
- Added a server-rendered public home screen, a non-authenticating sign-in placeholder, dashboard placeholder, error boundary, and not-found view.
- Used the approved horizontal logo, the packaged Manrope source through `next/font/local`, and shared `@candorlens/ui` cards and badges. The only Client Component in the web routes is the required Next error boundary reset control.
- Kept the unauthenticated surface free of capture controls, model calls, protected-content workarounds, evasion behavior, data fetching, and authentication implementation.

## Red-green record

1. Wrote `apps/web/src/app/page.test.tsx` before `page.tsx`.
2. Ran `corepack pnpm --filter @candorlens/web test -- page.test.tsx`.
   - Red result: failed to resolve `./page.js`, because `HomePage` did not exist yet.
3. Implemented the minimal home page, then reran the same test.
   - Green result: 1 test file and 2 tests passed.
4. The test asserts CandorLens is present, the consent-first statement is present, exactly one Sign in link is offered, and no capture button is available before authentication.

## Integration correction

The existing source-only UI package was compatible with Vitest but not with the Next 16 production bundler:

- Internal UI source imports used `.js` specifiers while the actual files are TypeScript/TSX sources, producing Turbopack module-resolution errors.
- The shared UI barrel also exposed hook/Radix components without explicit client boundaries, causing the server-component build to reject `useState` in `AppShell`.

The narrow fix changes UI-internal source imports to extensionless TypeScript imports, aligns its local TypeScript resolver with bundler resolution, and marks only `AppShell`, `CaptureIndicator`, and `Dialog` as client components. The web routes remain Server Components by default.

## Verification

All commands completed successfully after the final changes:

```text
corepack pnpm --filter @candorlens/ui lint       # pass
corepack pnpm --filter @candorlens/ui typecheck  # pass
corepack pnpm --filter @candorlens/ui test       # 12/12 pass
corepack pnpm --filter @candorlens/web lint      # pass
corepack pnpm --filter @candorlens/web typecheck # pass
corepack pnpm --filter @candorlens/web test      # 2/2 pass
corepack pnpm --filter @candorlens/web build     # pass
```

`next build` compiled successfully and statically prerendered `/`, `/sign-in`, and `/dashboard`.

## UI smoke check

The local Next server served all expected resources:

```text
GET /                                  200
GET /sign-in                           200
GET /dashboard                         200
GET /assets/brand/logo-horizontal.svg  200 image/svg+xml
```

The rendered home HTML contained CandorLens and the full consent-first statement, contained exactly one `Sign in` link, and contained zero capture buttons. A controllable browser was not connected in this environment (and the standalone `agent-browser` executable was unavailable), so a visual screenshot and browser-console capture could not be produced; the direct rendered-response smoke check was completed instead.

## Review fix round 1: approved logo asset

- Added `brand-assets.test.ts`, which parses the served public file as SVG, compares its raw bytes with `assets/brand/logo-horizontal.svg`, and verifies the root layout references `/assets/brand/logo-horizontal.svg`.
- Red: the new focused test failed on the existing public asset with `text data outside of root node`; its bytes did not match the approved source.
- Green: replaced the public file with a direct byte-for-byte copy of the approved SVG, without manual SVG recreation. The focused test passed with the existing home-page tests (3/3 total).
- Follow-up checks passed: `pnpm --filter @candorlens/web lint`, `typecheck`, `test`, and `build`.
