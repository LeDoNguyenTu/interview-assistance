# CandorLens Email Verification Design

## Goal

Support Neon Auth email verification codes after account creation without replacing the existing branded authentication experience.

## Flow

1. A user submits email and password on `/sign-up`.
2. A successful Neon Auth sign-up redirects to `/verify-email?email=...`.
3. The verification page presents one focused six-digit code field, a primary verify action, and an inline resend action.
4. Verification calls Neon Auth `emailOtp.verifyEmail` with the normalized email and code.
5. Success redirects to `/sign-in?verified=1`, where a visible success notice confirms completion.
6. Resend calls Neon Auth `emailOtp.sendVerificationOtp` with type `email-verification` and returns a generic success message.

## Interface

The page reuses `PublicShell`, Geist typography, the dark CandorLens palette, and the existing emerald focus color. The verification card remains centered and uses a compact security-status panel so it feels complete on wide screens without adding visual noise.

The code field uses `autocomplete="one-time-code"`, `inputmode="numeric"`, an associated label, and a live status region. Buttons remain at least 48 pixels tall with visible focus states and high-contrast text.

## Security and error handling

- Server actions validate and normalize every email and code value.
- Verification messages stay generic so the interface does not reveal whether an account exists.
- Neon Auth remains responsible for code expiry, attempt limits, and resend rate limits.
- The email query value is used only to identify the verification request and is never treated as authenticated identity.
- Redirects are fixed application paths and never accept user-provided destinations.

## Testing

Focused tests cover sign-up redirect behavior, invalid code rejection, successful verification, resend behavior, accessible form semantics, and the sign-in success notice. The full web suite, typecheck, lint, build, and a production smoke check are required before completion.
