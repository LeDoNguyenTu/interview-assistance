import Link from 'next/link';

const shortcuts = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sessions', label: 'Session history' },
  { href: '/settings', label: 'Account settings' },
] as const;

export function AppFooter() {
  return (
    <footer
      className="relative border-t border-white/10 bg-[#061310]/72"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-[90rem] flex-col gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold text-white">
            &copy; 2026 CandorLens
          </p>
          <p className="mt-1 text-sm leading-6 text-[#9fb8ae]">
            Consent-first capture. Visible controls. Human-reviewed guidance.
          </p>
        </div>
        <nav
          aria-label="Product shortcuts"
          className="flex flex-wrap items-center gap-x-1 gap-y-2"
        >
          {shortcuts.map((shortcut) => (
            <Link
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm font-medium text-[#b9c9c4] transition-colors duration-200 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf0cb]"
              href={shortcut.href}
              key={shortcut.href}
            >
              {shortcut.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
