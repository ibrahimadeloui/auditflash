import { ScanForm } from "@/components/scan-form";

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

export default function Home() {
  return (
    <main>
      <section className="shell grid items-end gap-10 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
        <div>
          <p className="text-sm tracking-[0.18em] text-lime uppercase">Pour les particuliers, TPE et PME</p>
          <h1 className="display mt-4 text-4xl leading-[0.95] text-white sm:text-6xl lg:text-7xl">
            La cybersécurité simplifiée, jusqu'au correctif.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-mist">
            De la page d'accueil au rapport pour le dirigeant : un diagnostic de configuration, l'impact sur l'encaissement,
            puis les extraits à déposer sans équipe sécurité.
          </p>
        </div>
        <ScanForm />
      </section>

      <section className="shell grid gap-4 pb-16 md:grid-cols-2">
        {modules.map((module) => (
          <article key={module.index} className="panel p-6">
            <p className="text-sm text-lime">{module.index}</p>
            <h2 className="display mt-3 text-2xl text-white">{module.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{module.text}</p>
          </article>
        ))}
      </section>

      <section className="shell grid gap-6 pb-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="display text-3xl text-white">Ce qui est mesuré</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Conçu pour une démo devant un jury comme pour le site d'une boutique. Le parcours dure moins d'une minute.
          </p>
        </div>
        <ul className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            "HTTPS et HSTS",
            "Content-Security-Policy",
            "Protection contre le cadrage",
            "X-Content-Type-Options",
            "Cookies Secure, HttpOnly, SameSite",
            "Version WordPress publiée",
            "Présence FedaPay, Kkiapay ou Stripe",
            "Motif de clé secrète, sans l'afficher",
          ].map((item) => (
            <li key={item} className="rounded-2xl border border-line px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
