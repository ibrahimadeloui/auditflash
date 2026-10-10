import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="no-print">
      <div className="shell flex flex-wrap items-center justify-between gap-3 py-4 sm:py-5">
        <Link href="/" className="flex items-center gap-3 text-mist no-underline">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-sm font-bold text-ink">AF</span>
          <span>
            <strong className="display block text-lg leading-none text-white">AuditFlash</strong>
            <span className="text-xs tracking-[0.16em] text-muted uppercase">SecurityBot</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-mist">
          <Link href="/historique" className="text-mist no-underline hover:text-white">
            Historique
          </Link>
          <Link href="/demo/boutique" className="text-mist no-underline hover:text-white">
            Boutique démo
          </Link>
        </nav>
      </div>
    </header>
  );
}
