import { sessionModeSchema } from '@candorlens/core';
import { normalizeProviderError } from '@candorlens/models';
import {
  AppShell,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';

import horizontalLogo from '../../../assets/brand/logo-horizontal.svg';

const supportedModes = sessionModeSchema.options.map((mode) => mode.replace(/^./, (letter) => letter.toUpperCase()));
const providerStatus = normalizeProviderError({
  code: 'unavailable',
  operation: 'connect',
  providerId: 'fixture',
  retryable: false,
}).message;

export function DesktopApp() {
  return (
    <AppShell
      logoSrc={horizontalLogo}
      navigation={[{ current: true, href: '#workspace', label: 'Desktop workspace' }]}
    >
      <section aria-labelledby="desktop-title" className="mx-auto grid max-w-4xl gap-6 py-8 sm:py-12">
        <div className="max-w-2xl">
          <Badge className="mb-4" tone="muted">
            Visible desktop workspace
          </Badge>
          <h1
            className="text-4xl font-bold tracking-[-0.045em] text-[var(--cl-color-deep-forest)] sm:text-5xl"
            id="desktop-title"
          >
            CandorLens desktop
          </h1>
          <p className="mt-5 text-base leading-7 text-[var(--cl-color-muted-foreground)] sm:text-lg">
            A normal desktop view for clearer practice, structured interviews, and evidence-oriented review.
          </p>
        </div>

        <Card id="workspace">
          <CardHeader>
            <CardTitle>Capture unavailable</CardTitle>
            <CardDescription>
              Desktop capture is not part of this application shell. No audio source can be selected or recorded here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p
              aria-atomic="true"
              aria-live="polite"
              className="rounded-[var(--cl-radius-control)] bg-[var(--cl-color-muted)] px-4 py-3 font-semibold text-[var(--cl-color-foreground)]"
              role="status"
            >
              Capture unavailable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foundation status</CardTitle>
            <CardDescription>
              The shared workspace is ready for the next consent-first milestone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 border-t border-[var(--cl-color-border)] pt-5 text-sm leading-6 sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Session modes</dt>
                <dd className="text-[var(--cl-color-muted-foreground)]">{supportedModes.join(', ')}</dd>
              </div>
              <div>
                <dt className="font-semibold">Model guidance</dt>
                <dd className="text-[var(--cl-color-muted-foreground)]">{providerStatus}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
