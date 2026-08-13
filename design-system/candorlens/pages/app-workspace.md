# CandorLens Signed-In Workspace Override

This override takes precedence over `MASTER.md` for signed-in pages.

- Use Geist Sans for every heading, label, form control, and body paragraph. Use Geist Mono only for elapsed time, source metadata, and compact status labels.
- Use an OLED-dark canvas with navy-black surfaces. Do not render a light card, dark-green text, or a low-contrast muted button in the signed-in experience.
- Primary action: saturated emerald fill with white text. Secondary action: translucent dark surface, white label, and a white or emerald focus ring. Destructive action: rose outline or fill with white text.
- The dashboard uses a signal visualization only as a backdrop for session state. The live workspace uses an audio-level visualization with numerical source status, never color alone.
- Keep motion to route entrance, capture-state change, and button feedback. All transitions use opacity or transform, 150-300ms, and are disabled under `prefers-reduced-motion`.
