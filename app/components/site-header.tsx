import Link from "next/link";

type SiteHeaderProps = {
  compact?: boolean;
};

export function SiteHeader({ compact = false }: SiteHeaderProps) {
  return (
    <header className="w-full border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-heading text-lg font-semibold text-[var(--primary)]">
          Communication Skills Drill
        </Link>
        {!compact ? (
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
            <Link href="/">Home</Link>
            <Link href="/#access">Enter Code</Link>
            <Link href="/educators">Educator Access</Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
