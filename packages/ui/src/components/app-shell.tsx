'use client';

import { ListIcon } from '@phosphor-icons/react/List';
import { MoonIcon } from '@phosphor-icons/react/Moon';
import { SunIcon } from '@phosphor-icons/react/Sun';
import { type ReactNode, useId, useState } from 'react';

import { cn } from '../lib/cn';
import { Button } from './button';

export interface AppNavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
  current?: boolean;
}

export interface AppShellProps {
  children: ReactNode;
  navigation?: AppNavigationItem[];
  logoSrc?: string;
  productName?: string;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  className?: string;
}

const approvedHorizontalLogo = '/assets/brand/logo-horizontal.svg';
const approvedReversedLogo = '/assets/brand/logo-reversed.svg';

export function AppShell({
  children,
  className,
  logoSrc = approvedHorizontalLogo,
  navigation = [],
  onThemeChange,
  productName = 'CandorLens',
  theme = 'light',
}: AppShellProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const contentId = useId();
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  const activeLogoSrc = theme === 'dark' ? approvedReversedLogo : logoSrc;

  return (
    <div
      className={cn(
        'min-h-dvh bg-[var(--cl-color-background)] font-[family-name:var(--cl-font-sans)] text-[var(--cl-color-foreground)]',
        theme === 'dark' && 'dark',
        className,
      )}
    >
      <a
        className="sr-only absolute left-4 top-4 z-[70] min-h-11 rounded-[var(--cl-radius-control)] bg-[var(--cl-color-primary)] px-4 py-2 font-semibold text-[var(--cl-color-primary-foreground)] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[var(--cl-color-ring)] focus:ring-offset-2"
        href={`#${contentId}`}
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-[var(--cl-color-border)] bg-[var(--cl-color-surface)]/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[var(--cl-nav-height)] max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
          <a
            aria-label={`${productName} home`}
            className="flex shrink-0 items-center"
            href="/"
          >
            <img alt={productName} className="h-8 w-auto" src={activeLogoSrc} />
          </a>
          <nav
            aria-label="Primary navigation"
            className="hidden min-w-0 flex-1 items-center gap-2 md:flex"
          >
            {navigation.map(({ current, href, icon, label }) => (
              <a
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-[var(--cl-radius-control)] px-4 py-2 text-sm font-semibold transition-[background-color,color] duration-[var(--cl-duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-surface)]',
                  current
                    ? 'bg-[var(--cl-color-accent)] text-[var(--cl-color-accent-foreground)]'
                    : 'text-[var(--cl-color-muted-foreground)] hover:bg-[var(--cl-color-muted)] hover:text-[var(--cl-color-foreground)]',
                )}
                href={href}
                key={href}
              >
                {icon}
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {onThemeChange ? (
              <Button
                aria-label={`Switch to ${nextTheme} mode`}
                onClick={() => onThemeChange(nextTheme)}
                size="compact"
                variant="ghost"
              >
                {theme === 'light' ? (
                  <MoonIcon aria-hidden="true" size={20} weight="regular" />
                ) : (
                  <SunIcon aria-hidden="true" size={20} weight="regular" />
                )}
              </Button>
            ) : null}
            {navigation.length > 0 ? (
              <Button
                aria-controls="candorlens-mobile-navigation"
                aria-expanded={mobileNavigationOpen}
                aria-label="Toggle navigation"
                className="md:hidden"
                onClick={() => setMobileNavigationOpen((open) => !open)}
                size="compact"
                variant="ghost"
              >
                <ListIcon aria-hidden="true" size={20} weight="regular" />
              </Button>
            ) : null}
          </div>
        </div>
        {navigation.length > 0 && mobileNavigationOpen ? (
          <nav
            aria-label="Mobile primary navigation"
            className="border-t border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] px-4 py-2 motion-safe:animate-[cl-nav-in_var(--cl-duration-normal)_ease-out] md:hidden"
            id="candorlens-mobile-navigation"
          >
            <div>
              {navigation.map(({ current, href, icon, label }) => (
                <a
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-2 rounded-[var(--cl-radius-control)] px-4 py-2 text-sm font-semibold text-[var(--cl-color-muted-foreground)] hover:bg-[var(--cl-color-muted)] hover:text-[var(--cl-color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)]',
                    current &&
                      'bg-[var(--cl-color-accent)] text-[var(--cl-color-accent-foreground)]',
                  )}
                  href={href}
                  key={href}
                  onClick={() => setMobileNavigationOpen(false)}
                >
                  {icon}
                  {label}
                </a>
              ))}
            </div>
          </nav>
        ) : null}
      </header>
      <main
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        id={contentId}
      >
        {children}
      </main>
    </div>
  );
}
