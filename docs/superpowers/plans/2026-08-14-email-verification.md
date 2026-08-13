# CandorLens Email Verification Implementation Plan

**Goal:** Add a production-ready Neon Auth email verification code flow and deploy it without consuming GitHub Actions credit.

**Architecture:** Keep authentication mutations in server actions backed by the existing lazy Neon Auth server client. Add one client form for pending and inline states, one public route for verification, and one success notice on sign-in.

**Tech stack:** Next.js 16 App Router, React 19 server actions, Neon Auth email OTP, Vitest, Testing Library, Tailwind CSS.

## Task 1: Specify auth action behavior

- Add action tests that mock only Neon Auth and Next redirect boundaries.
- Prove successful sign-up redirects to the verification route.
- Prove malformed codes never call Neon Auth.
- Prove verify and resend call the installed Neon Auth endpoint names.
- Run the focused test and observe the expected failure before implementation.

## Task 2: Implement server actions

- Export a shared auth action state.
- Redirect successful registration to the verification screen.
- Add verified email and code parsing.
- Add verification and resend actions with generic error messages.
- Redirect successful verification to the sign-in confirmation state.

## Task 3: Build the verification interface

- Add a dedicated `verify-email` page inside the public auth group.
- Add a high-contrast six-digit code form with pending, error, and resend feedback.
- Extend sign-in feedback to render a verification success state.
- Add accessible component and page tests.

## Task 4: Verify and publish

- Run focused tests, full web tests, typecheck, lint, formatting, and production build.
- Review the final diff and run the React quality review.
- Commit with `[skip ci]`, push `main`, and deploy directly to Vercel production.
- Confirm the deployment is READY, the production alias resolves, the auth routes respond, and runtime logs are clean.
- Select and begin the next milestone from the existing delivery roadmap.
