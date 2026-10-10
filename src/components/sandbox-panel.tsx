"use client";

import { useState } from "react";
import type { Finding } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { GRADE_LABEL, summarize } from "@/lib/score";

export function SandboxPanel({ findings }: { findings: Finding[] }) {
  const [patched, setPatched] = useState(false);
  const measured = summarize(findings);
  const simulated = summarize(findings.filter((finding) => !finding.fixedByPatch));

  return (
    <section className="no-print grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.14em] text-lime uppercase">Module 3 · bac à sable</p>
          <h2 className="display mt-2 text-3xl text-white">Simulation de correctif</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            La boutique Atelier Nadi est une page isolée d'AuditFlash. Rien n'est modifié sur le site diagnostiqué.
            Le bouton rouge appartient à la page hostile, pas à la boutique.
          </p>
        </div>
        <button className={patched ? "btn btn-ghost" : "btn btn-lime"} type="button" onClick={() => setPatched((value) => !value)}>
          {patched ? "Retirer le patch virtuel" : "Appliquer le patch virtuel"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="browser">
          <div className="browser-bar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span>promo-cadeau.example — page hostile</span>
          </div>
          <div className="frame-slot">
            {patched ? (
              <div className="blocked">
                <div>
                  <p className="display text-2xl text-white">Affichage refusé</p>
                  <p className="mt-2 text-sm">
                    Le navigateur bloque le cadrage : X-Frame-Options DENY et frame-ancestors 'none'.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <iframe title="Boutique cadrée par une page tierce" src="/demo/boutique" />
                <button
                  className="overlay-hit"
                  type="button"
                  onClick={() =>
                    window.alert("Simulation : ce bouton n'appartient pas à la boutique. Aucun paiement n'a eu lieu.")
                  }
                >
                  Récupérer mon cadeau
                </button>
              </>
            )}
          </div>
        </article>

        <article className="browser">
          <div className="browser-bar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span>atelier-nadi.example — visite directe</span>
          </div>
          <div className="frame-slot">
            <iframe title="Boutique visitée directement" src="/demo/boutique" />
          </div>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <p className="text-sm text-muted">Score mesuré</p>
          <p className="display mt-2 text-4xl text-white">
            {measured.grade}
            <span className="ml-3 text-lg text-muted">{GRADE_LABEL[measured.grade]}</span>
          </p>
          <p className="mt-2 text-sm text-muted">Estimation {formatMoney(measured.lossMin)} – {formatMoney(measured.lossMax)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-muted">Après le patch virtuel</p>
          <p className={`display mt-2 text-4xl ${simulated.grade === "A+" || simulated.grade === "A" ? "text-lime" : "text-warn"}`}>
            {simulated.grade}
            <span className="ml-3 text-lg text-muted">{GRADE_LABEL[simulated.grade]}</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            {simulated.score}/100
            {simulated.lossMax > 0
              ? ` · estimation ${formatMoney(simulated.lossMin)} – ${formatMoney(simulated.lossMax)}`
              : " · plus d'estimation de perte sur les points corrigés"}
          </p>
        </div>
      </div>
    </section>
  );
}
