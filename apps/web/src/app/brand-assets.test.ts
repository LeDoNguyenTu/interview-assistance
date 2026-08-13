// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const approvedLogoPath = resolve(
  process.cwd(),
  '../../assets/brand/logo-horizontal.svg',
);
const publicLogoPath = resolve(
  process.cwd(),
  'public/assets/brand/logo-horizontal.svg',
);
const appChromePath = resolve(
  process.cwd(),
  'src/components/app/app-chrome.tsx',
);

describe('brand assets', () => {
  it('serves the approved horizontal SVG from the signed-in app shell', () => {
    const approvedLogo = readFileSync(approvedLogoPath);
    const publicLogo = readFileSync(publicLogoPath);
    const parsedSvg = new DOMParser().parseFromString(
      publicLogo.toString('utf8'),
      'image/svg+xml',
    );
    const appChrome = readFileSync(appChromePath, 'utf8');

    expect(parsedSvg.querySelector('parsererror')).toBeNull();
    expect(parsedSvg.documentElement.localName).toBe('svg');
    expect(publicLogo.equals(approvedLogo)).toBe(true);
    expect(appChrome).toContain('src="/assets/brand/logo-horizontal.svg"');
  });
});
