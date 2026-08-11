// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CaptureSource } from '@candorlens/core';

import { Button } from './button.js';
import { CaptureIndicator } from './capture-indicator.js';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog.js';
import { Input } from './input.js';
import { Label } from './label.js';

afterEach(cleanup);

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
    expect(status.textContent).toContain('1:05 elapsed');
    expect(screen.getByTestId('capture-indicator-icon')).toBeInstanceOf(SVGElement);
    expect(screen.getByRole('button', { name: 'Stop capture' })).toBeTruthy();
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
