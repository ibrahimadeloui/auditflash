import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-[#04101c]/80 backdrop-blur-md">
      <div className="shell flex flex-wrap items-center justify-between gap-3 py-3 sm:py-4">
        <Link href="/" className="inline-flex no-underline">
          <img
            src="/brand/logo.jpg"
            alt="WB Audiflash, plateforme d'audit de sécurité web"
            className="brand-logo"
          />
        </Link>
        <nav className="script flex items-center gap-4 text-[0.72rem] tracking-[0.16em] text-mist uppercase">
          <Link href="/historique" className="text-mist no-underline hover:text-lime">
            Historique
          </Link>
          <Link href="/demo/boutique" className="text-mist no-underline hover:text-lime">
            Boutique démo
          </Link>
        </nav>
      </div>
    </header>
  );
}
