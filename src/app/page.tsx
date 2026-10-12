import { CyberBackdrop } from "@/components/cyber-backdrop";
import { ScanForm } from "@/components/scan-form";
import { ScriptTerminal } from "@/components/script-terminal";

const modules = [
  {
    index: "01",
    title: "Diagnostic express",
    text: "Une adresse suffit. AuditFlash lit le chiffrement, les en-têtes, les cookies et les signaux publics de la page : CMS, tunnel de paiement.",
  },
  {
    index: "02",
    title: "Score et langage métier",
    text: "Une note de A+ à F, traduite en impact boutique, avec une estimation indicative de perte en francs CFA.",
  },
  {
    index: "03",
    title: "Patch en direct",
    text: "Une boutique isolée montre une page hostile recouvrant le paiement, puis le même écran une fois le cadrage refusé. La visite directe continue de fonctionner.",
  },
  {
    index: "04",
    title: "Correctif et rapport",
    text: "Extraits Nginx, Apache, PHP, Node.js et Python, message de pull request à coller, et rapport lisible par un dirigeant.",
  },
];

const ticker = [
  "root@wb-audiflash",
  "./scan --headers",
  "HSTS",
  "CSP",
  "X-Frame-Options",
  "nosniff",
  "cookies Secure HttpOnly SameSite",
  "wordpress.generator",
  "fedapay | kkiapay | stripe",
  "score A+ → F",
  "mode=passif",
  "aucune clé affichée",
];

const checks = [
  "HTTPS et HSTS",
  "Content-Security-Policy",
  "Protection contre le cadrage",
  "X-Content-Type-Options",
  "Cookies Secure, HttpOnly, SameSite",
  "Version WordPress publiée",
  "Présence FedaPay, Kkiapay ou Stripe",
  "Motif de clé secrète, sans l'afficher",
];

export default function Home() {
  const stream = [...ticker, ...ticker];

  return (
    <main className="cyber-home">
      <CyberBackdrop />
      <section className="shell relative z-10 py-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <img
            src="/brand/logo.jpg"
            alt="WB Audiflash, plateforme d'audit de sécurité web"
            className="hero-logo"
          />
          <p className="script hud">
            <span className="hud-dot" />
            sys.online · scan passif
          </p>
        </div>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="script text-xs tracking-[0.22em] text-lime uppercase">
              // pour les particuliers, TPE et PME
            </p>
            <h1 className="glitch display mt-4 text-4xl leading-[0.95] text-white sm:text-6xl lg:text-7xl" data-text="La cybersécurité, jusqu'au correctif.">
              La cybersécurité, jusqu'au correctif.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-mist">
              De la page d'accueil au rapport pour le dirigeant : un diagnostic de configuration, l'impact sur
              l'encaissement, puis les extraits à déposer sans équipe sécurité.
            </p>
          </div>
          <div className="shield-wrap">
            <div className="shield-ring" />
            <div className="shield-ring shield-ring-delay" />
            <img
              src="/brand/shield.jpg"
              alt="Bouclier numérique et cadenas, visuel de la plateforme"
              className="shield-art"
            />
          </div>
        </div>

        <div className="relative z-10 mt-8 grid gap-6 lg:grid-cols-2">
          <ScanForm />
          <ScriptTerminal />
        </div>
      </section>

      <div className="ticker relative z-10" aria-hidden="true">
        <div className="ticker-track script">
          {stream.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>

      <section className="shell relative z-10 grid gap-4 py-14 md:grid-cols-2">
        {modules.map((module, index) => (
          <article key={module.index} className="panel module-card p-6" style={{ animationDelay: `${index * 90}ms` }}>
            <p className="script text-xs tracking-[0.18em] text-lime">root@module_{module.index}</p>
            <h2 className="display mt-3 text-2xl text-white">{module.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{module.text}</p>
          </article>
        ))}
      </section>

      <section className="shell relative z-10 grid gap-6 pb-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="script text-xs tracking-[0.18em] text-flare uppercase">// surface mesurée</p>
          <h2 className="display mt-3 text-3xl text-white">Ce qui est mesuré</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Conçu pour une démo devant un jury comme pour le site d'une boutique. Le parcours dure moins d'une minute.
          </p>
        </div>
        <ul className="grid gap-3 text-sm sm:grid-cols-2">
          {checks.map((item) => (
            <li key={item} className="script rounded-2xl border border-line px-4 py-3 text-[0.78rem] tracking-wide">
              <span className="text-lime">› </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
