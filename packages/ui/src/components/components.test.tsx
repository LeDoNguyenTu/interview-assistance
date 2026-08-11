// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CaptureSource } from '@candorlens/core';

import { AppShell } from './app-shell.js';
import { Badge } from './badge.js';
import { Button } from './button.js';
import { CaptureIndicator } from './capture-indicator.js';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog.js';
import { Input } from './input.js';
import { Label } from './label.js';

afterEach(cleanup);

const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

function tokenValue(scope: string, token: string): string {
  const scopeMatch = tokensCss.match(new RegExp(`${scope}\\s*\\{([\\s\\S]*?)\\n\\}`));
  const valueMatch = scopeMatch?.[1]?.match(new RegExp(`${token}:\\s*([^;]+);`));

  if (!valueMatch?.[1]) {
    throw new Error(`Missing ${token} in ${scope}`);
  }

  return valueMatch[1].trim();
}

function resolvedTokenValue(scope: string, token: string): string {
  const value = tokenValue(scope, token);
  const reference = value.match(/^var\((--[^)]+)\)$/)?.[1];
  return reference ? resolvedTokenValue(scope, reference) : value;
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
      throw new Error(`Expected a six-digit hex colour, received ${hex}`);
    }

    const toLinearChannel = (offset: number) => {
      const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };
    const red = toLinearChannel(1);
    const green = toLinearChannel(3);
    const blue = toLinearChannel(5);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Button', () => {
  it('activates from the keyboard', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Continue</Button>);

    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('uses native disabled semantics', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Continue
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(button);

    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('form primitives', () => {
  it('connects a programmatic label to its input', () => {
    render(
      <div>
        <Label htmlFor="session-title">Session title</Label>
        <Input id="session-title" />
      </div>,
    );

    expect(screen.getByLabelText('Session title').getAttribute('id')).toBe(
      'session-title',
    );
  });
});

describe('Dialog', () => {
  it('returns focus to its trigger after closing', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open session details</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Session details</DialogTitle>
          <Button>Save details</Button>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole('button', { name: 'Open session details' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(document.activeElement).toBe(trigger);
  });
});

describe('CaptureIndicator', () => {
  it('announces capture status with visible text and an icon', () => {
    const sources: CaptureSource[] = ['microphone', 'system-audio'];
    render(
      <CaptureIndicator
        elapsedSeconds={65}
        onStop={vi.fn()}
        sources={sources}
        state="capturing"
      />,
    );

    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Capturing');
    expect(status.textContent).toContain('Microphone, System audio');
    expect(screen.getByRole('timer', { name: 'Elapsed capture time' }).textContent).toBe('1:05 elapsed');
    expect(screen.getByTestId('capture-indicator-icon')).toBeInstanceOf(SVGElement);
    expect(screen.getByRole('button', { name: 'Stop capture' })).toBeTruthy();
  });

  it('keeps elapsed time out of the live status announcement', () => {
    render(
      <CaptureIndicator
        elapsedSeconds={65}
        sources={['microphone']}
        state="capturing"
      />,
    );

    expect(screen.getByRole('status').textContent).not.toContain('1:05 elapsed');
    const timer = screen.getByRole('timer', { name: 'Elapsed capture time' });
    expect(timer.textContent).toBe('1:05 elapsed');
    expect(timer.getAttribute('aria-live')).toBeNull();
  });

  it('keeps the stop control available for an interrupted capture', () => {
    render(
      <CaptureIndicator
        onStop={vi.fn()}
        sources={['browser-tab']}
        state="interrupted"
      />,
    );

    expect(screen.getByRole('status').textContent).toContain('Capture interrupted');
    expect(screen.getByRole('button', { name: 'Stop capture' })).toBeTruthy();
  });
});

describe('AppShell', () => {
  const navigation = [{ href: '/sessions', label: 'Sessions' }];

  it('removes closed mobile navigation links from the keyboard and accessibility tree', async () => {
    const user = userEvent.setup();
    render(
      <AppShell navigation={navigation}>
        <p>Workspace</p>
      </AppShell>,
    );

    expect(screen.getAllByRole('link', { name: 'Sessions' })).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: 'Mobile primary navigation' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Toggle navigation' }));

    expect(screen.getAllByRole('link', { name: 'Sessions' })).toHaveLength(2);
  });

  it('uses the approved reversed mark for dark semantic surfaces', () => {
    render(
      <AppShell logoSrc="/assets/brand/logo-horizontal.svg" theme="dark">
        <p>Workspace</p>
      </AppShell>,
    );

    expect(screen.getByRole('img', { name: 'CandorLens' }).getAttribute('src')).toBe(
      '/assets/brand/logo-reversed.svg',
    );
  });
});

describe('design tokens', () => {
  it('binds danger badges to their dedicated foreground and surface tokens', () => {
    render(<Badge tone="danger">Needs attention</Badge>);

    const badge = screen.getByText('Needs attention');
    expect(badge.className).toContain('bg-[var(--cl-color-danger-surface)]');
    expect(badge.className).toContain('text-[var(--cl-color-danger-foreground)]');
  });

  it('keeps the spacing token scale on strict 8px increments', () => {
    const spacing = [...tokensCss.matchAll(/--cl-space-(\d+):\s*([\d.]+)rem/g)].map(
      ([, pixels, rem]) => [pixels, rem],
    );

    expect(spacing).toEqual([
      ['8', '0.5'],
      ['16', '1'],
      ['24', '1.5'],
      ['32', '2'],
      ['40', '2.5'],
      ['48', '3'],
    ]);
  });

  it('keeps danger badge foreground and surface pairs at WCAG AA contrast', () => {
    const lightRatio = contrastRatio(
      resolvedTokenValue(':root', '--cl-color-danger-foreground'),
      resolvedTokenValue(':root', '--cl-color-danger-surface'),
    );
    const darkRatio = contrastRatio(
      tokenValue('\\.dark', '--cl-color-danger-foreground'),
      tokenValue('\\.dark', '--cl-color-danger-surface'),
    );

    expect(lightRatio).toBeGreaterThanOrEqual(4.5);
    expect(darkRatio).toBeGreaterThanOrEqual(4.5);
  });
});
