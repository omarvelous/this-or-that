import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-line/50 bg-bg/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-ink text-lg font-bold tracking-tight"
        >
          this or that
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-5">
          <Link
            href="/#how-it-works"
            className="text-muted hover:text-ink hidden text-sm font-medium transition-colors sm:block"
          >
            How it works
          </Link>
          <Link
            href="/dashboard"
            className="text-muted hover:text-ink hidden text-sm font-medium transition-colors sm:block"
          >
            My polls
          </Link>
          <Link
            href="/polls/new"
            className="rounded-input bg-option-a hover:bg-option-a-hover px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Create a poll
          </Link>
        </nav>
      </div>
    </header>
  );
}
