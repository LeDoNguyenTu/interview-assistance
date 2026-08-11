# CandorLens Brand Guidelines

Status: Direction C approved
Date: 2026-08-12

## Brand Name

**CandorLens**

Candor communicates honesty, clarity, and direct conversation. Lens communicates focus, context, and careful review. Together, the name supports both sides of the product: improving interview conversations and helping interviewers evaluate them responsibly.

The name was selected after a preliminary exact-name web and GitHub collision search returned no results on 2026-08-12. This is not trademark, company-name, or domain-name clearance; formal clearance is required before commercial launch.

Alternatives considered:

- VerityRound — clear interview association, but more formal and less conversational.
- VoxaProof — strong voice-analysis signal, but sounds more forensic than supportive.
- RoundSignal — strong product meaning, but already used by an active software business.

## Brand Idea

**See the conversation clearly.**

CandorLens helps people understand what was asked, what was answered, what evidence supports the answer, and where better follow-up is needed.

## Positioning

CandorLens is an interview intelligence workspace for people who want clearer practice, more structured interviews, and evidence-oriented review. It combines consented conversation capture, contextual model guidance, and transparent post-session analysis without presenting automated judgments as facts.

## Voice

- Clear: use direct language and explain technical states in plain terms.
- Calm: avoid alarmist detection language or accusatory claims.
- Evidence-oriented: distinguish observations, inferences, and uncertainty.
- Respectful: treat candidates and interviewers as decision-makers, not data points.
- Practical: lead with the next useful action.

Avoid claims such as “100% accurate,” “undetectable,” “proves cheating,” or “guaranteed.”

## Logo Concept

The **Open Exchange** mark uses two equal conversational ribbons to create an open passage in negative space. Each ribbon represents one participant; the passage represents clarity emerging from candid dialogue rather than being imposed by the software.

The crossing top edges show context moving between both sides. The open lower edge keeps the symbol active and unfinished, reinforcing that CandorLens supports human judgment instead of replacing it. The silhouette intentionally avoids eye, camera, shield, microphone, and surveillance imagery.

## Logo Files

| Asset | Use |
|---|---|
| `assets/brand/logo-horizontal.svg` | Web header, reports, and documentation |
| `assets/brand/logo-mark.svg` | App icon, favicon, avatar, and compact navigation |
| `assets/brand/logo-reversed.svg` | Dark surfaces |
| `assets/brand/logo-monochrome.svg` | One-color printing and constrained contexts |
| `assets/brand/logo-wordmark.svg` | Wordmark-only placements |
| `assets/brand/previews/candorlens-identity-preview.png` | Approved identity reference board |
| `assets/brand/concepts/` | Archived exploration; not production assets |

## Logo Usage

- Keep clear space equal to one quarter of the mark's height on every side.
- Use the full horizontal logo at widths of 120 px or greater.
- Use the mark alone at 16–64 px; prefer 24 px or larger for interface controls.
- Do not stretch, rotate, crop, recolor, add shadows, or apply gradients.
- Use the reversed version on Deep Forest or similarly dark backgrounds.
- Use the monochrome mark when only one ink or color is available.
- Preserve the open center; never close the passage or remove either participant.

## Color Palette

| Token | Value | Use |
|---|---:|---|
| Ink | `#16211F` | Primary text and wordmark |
| Deep Forest | `#173C36` | Primary brand field and left logo ribbon |
| Action Forest | `#216B58` | Primary actions and links |
| Action Forest Dark | `#185444` | Hover and pressed actions |
| Warm Mint | `#67CFA8` | Right logo ribbon and restrained highlights |
| Mint Surface | `#DDF5EB` | Selected and informational surfaces |
| Canvas | `#F7FAF8` | Application background |
| Surface | `#FFFFFF` | Cards, panels, dialogs |
| Muted Surface | `#EEF4F1` | Secondary regions and skeletons |
| Border | `#D9E5E0` | Dividers and control outlines |
| Destructive | `#DC2626` | Destructive actions and errors |

All text/background pairs must meet WCAG AA contrast. Warm Mint is decorative on light surfaces and must not be used for body text. Status must never be communicated by color alone.

## Typography

- Manrope: application headings, body, controls, and reports.
- The production wordmark uses outlined Manrope Bold letterforms and has no runtime font dependency.
- Fira Code: transcript timestamps, code, identifiers, metrics, and technical metadata only.
- System fallback: Inter, Segoe UI, Arial, sans-serif.

Manrope is distributed under the SIL Open Font License 1.1. The source font and license are stored in `assets/brand/type/` so logo exports are reproducible.

## Iconography and Motion

- Use one consistent Phosphor outlined icon family.
- Use 1.5–2 px strokes and 20–24 px standard sizes.
- Use restrained 150–300 ms transitions.
- Respect reduced-motion preferences.
- Avoid decorative pulsing or movement that suggests hidden monitoring.
