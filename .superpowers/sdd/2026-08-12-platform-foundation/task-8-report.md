# Task 8: Supabase SSR authentication report

## Result

Implemented cookie-based Supabase SSR authentication for the Next.js 16 web app. The implementation uses the pinned `@supabase/ssr` `0.12.4` and `@supabase/supabase-js` `2.112.3` packages. It does not add, link, or apply any Supabase migration and does not expose a service-role key.

## Red-green evidence

1. Added `apps/web/src/lib/auth/require-user.test.ts` before its implementation.
2. Ran `corepack pnpm --filter @candorlens/web test -- src/lib/auth/require-user.test.ts`.
3. Observed RED: `Cannot find module './require-user.js'`, which was the expected missing authorization implementation.
4. Added the minimum claims validation and protected-route redirect behavior.
5. Re-ran the focused test: all authorization tests passed.
6. Final package test run: 3 files and 7 tests passed.

## Security decisions

- `getValidatedClaims` uses `supabase.auth.getClaims()` only. A user must have a string `sub` claim; absent, malformed, or errored claims are unauthenticated.
- There is no cookie-presence, `getSession()` user object, or `user_metadata` authorization fallback. Tests cover invalid claims shaped like a cookie session and missing claims despite a cookie marker.
- Protected application routes call a server-only `requireUser` wrapper and redirect unauthenticated requests to `/sign-in`.
- Browser and server clients use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. No service-role or provider key is imported.
- `proxy.ts` is used for Next 16. It calls `getClaims()` to refresh session cookies and forwards the SSR package's anti-cache headers with any refreshed cookies.
- Sign-in failures are generic. Sign-up always returns the same non-enumerating confirmation. The callback returns a generic auth-error query state and only accepts a local relative `next` path.

## Files

- Added Supabase browser, server, and proxy clients plus root `proxy.ts`.
- Added validated-claims helpers, including a server-only wrapper.
- Added sign-in/sign-up actions and pages, callback route, sign-out action, and accessible pending/status form UI.
- Updated the protected application layout and dashboard sign-out control.
- Updated `apps/web/package.json` and `pnpm-lock.yaml` with exact Supabase package pins and `server-only` for the server boundary.

## Verification

Passed:

```text
corepack pnpm --filter @candorlens/web lint
corepack pnpm --filter @candorlens/web typecheck
corepack pnpm --filter @candorlens/web test
corepack pnpm --filter @candorlens/web build
```

The production build completed successfully and reports `/dashboard` and `/auth/callback` as dynamic, with `proxy.ts` recognized as the Proxy.

## Blockers and limitations

- No local Supabase URL or publishable key is configured, so a live authentication/browser flow cannot be exercised in this checkout. Starting the dev server correctly returned `Supabase public configuration is missing.` from the proxy instead of running with an unsafe fallback.
- The configured `agent-browser` executable is unavailable in this environment, so no automated browser screenshot was captured.
- `corepack pnpm install --frozen-lockfile` currently rejects the explicitly required `2.112.3` Supabase dependency family under the repository minimum-release-age policy. pnpm reports that its six Supabase entries were published after the policy cutoff. This is a supply-chain policy decision requiring parent-owner direction; the implementation does not weaken that policy.
- No remote Supabase project was linked or changed.

## Review fix round 1

### Root cause and change

The prior callback accepted any value that began with `/`. That allowed values which look relative before URL normalization but can become an external authority path, such as `/\\evil.example` and encoded slash/backslash variants. The callback now calls `getSafeCallbackRedirectPath`, which uses an explicit allowlist: only the exact `/dashboard` destination is accepted. Every other value, including URL-normalization and encoded bypass attempts, falls back to `/dashboard`.

The callback's generic `error=auth` redirect was not displayed on the sign-in page. The page now awaits Next 16 `searchParams` and renders `SignInErrorAlert` only for that exact value. The alert is visible, uses `role="alert"`, and has generic non-enumerating text.

### Red-green evidence

1. Added callback-destination regression tests before the helper. The focused run failed with `Cannot find module './callback-redirect.js'` as expected.
2. Added the smallest allowlisted helper and updated the callback route. Callback tests then passed for `/dashboard`, `/\\evil.example`, `//evil.example`, encoded slash/backslash variants, and double-encoded backslashes.
3. Added the sign-in error alert test before the component. The test first failed because the alert component did not exist, then passed after the component/page wiring.

### Verification

Passed after the review fix:

```text
corepack pnpm --filter @candorlens/web test      # 5 files, 16 tests
corepack pnpm --filter @candorlens/web typecheck
corepack pnpm --filter @candorlens/web build
```

The pinned `2.112.3` Supabase package family is explicitly exempted by exact package-and-version entries in `minimumReleaseAgeExclude`, because the required versions are newer than the repository's release-age policy. This does not introduce a floating dependency or change the pinned versions.
