"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
  "Lecture de l'adresse",
  "Réponse HTTP et chiffrement",
  "En-têtes de sécurité",
  "Cookies de session",
  "Signaux publics de la page",
  "Score et traduction métier",
];

export function ScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(-1);

  async function run(demo: boolean) {
    if (!demo && !url.trim()) {
      setError("Indiquez l'adresse de la page d'accueil, ou lancez la boutique de démonstration.");
      return;
    }
    setError("");
    setStep(0);
    const timers = STEPS.slice(1, -1).map((_, index) =>
      window.setTimeout(() => setStep(index + 1), (index + 1) * 650),
    );

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demo ? { demo: true } : { url: url.trim() }),
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id) throw new Error(data.error || "Diagnostic impossible.");
      timers.forEach((timer) => window.clearTimeout(timer));
      setStep(STEPS.length - 1);
      window.setTimeout(() => router.push(`/audit/${data.id}`), 450);
    } catch (caught) {
      timers.forEach((timer) => window.clearTimeout(timer));
      setStep(-1);
      setError(caught instanceof Error ? caught.message : "Diagnostic impossible.");
    }
  }

  const running = step >= 0;

  return (
    <div className="panel p-5 sm:p-7">
      {running ? (
        <div aria-live="polite">
          <p className="text-sm tracking-[0.14em] text-lime uppercase">Diagnostic express</p>
          <h2 className="display mt-2 text-3xl text-white">Vérifications en cours</h2>
          <ol className="mt-6 grid gap-3">
            {STEPS.map((label, index) => {
              const state = index < step ? "fait" : index === step ? "en cours" : "attente";
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                      index <= step ? "bg-lime text-ink" : "bg-panel-2 text-muted"
                    }`}
                  >
                    {index < step ? "✓" : index + 1}
                  </span>
                  <span className={index <= step ? "text-white" : "text-muted"}>
                    {label}
                    {state === "en cours" ? "…" : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(false);
          }}
        >
          <label className="grid gap-2 text-sm" htmlFor="site-url">
            <span className="text-muted">Adresse de la page d'accueil</span>
            <input
              id="site-url"
              name="url"
              type="url"
              inputMode="url"
              placeholder="https://www.maboutique.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="min-h-14 rounded-2xl border border-line bg-ink px-4 text-base text-white outline-none focus:border-lime"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="btn btn-lime" type="submit">
              Lancer le diagnostic
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => void run(true)}>
              Scanner la boutique de démo
            </button>
          </div>
          {error ? (
            <p className="rounded-xl bg-[#3a1820] px-3 py-2 text-sm text-[#ffd0d4]" role="alert">
              {error}
            </p>
          ) : (
            <p className="text-sm text-muted">
              L'audit lit la page publique et ses en-têtes. Il ne lance pas d'attaque et ne télécharge aucun fichier privé.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
