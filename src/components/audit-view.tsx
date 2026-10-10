"use client";

import { useEffect, useState } from "react";
import { RemediationPanel } from "@/components/remediation-panel";
import { SandboxPanel } from "@/components/sandbox-panel";
import { formatDate, formatMoney } from "@/lib/format";
import { recallAudit, rememberAudit } from "@/lib/memory";
import { SEVERITY_LABEL } from "@/lib/score";
import type { ScanRecord } from "@/lib/types";

function tone(grade: string) {
  if (grade === "A+" || grade === "A") return "grade-ok";
  if (grade === "B" || grade === "C") return "grade-warn";
  return "grade-bad";
}

export function AuditView({ id, mode = "screen" }: { id: string; mode?: "screen" | "report" }) {
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const cached = recallAudit(id);
    if (cached) setRecord(cached);
    void (async () => {
      const response = await fetch(`/api/audits/${id}`);
      const data = (await response.json()) as ScanRecord & { error?: string };
      if (cancelled) return;
      if (!response.ok) {
        if (!cached) setError(data.error || "Diagnostic introuvable.");
        return;
      }
      rememberAudit(data);
      setRecord(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) return <p className="shell py-16 text-[#ffd0d4]">{error}</p>;
  if (!record) return <p className="shell py-16 text-muted">Chargement du diagnostic…</p>;

  const report = mode === "report";
  const urgent = record.findings.filter(
    (finding) => finding.severity === "critical" || finding.severity === "high",
  ).length;

  return (
    <article className="shell grid gap-8 py-6 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-sm tracking-[0.14em] text-lime uppercase">
            {report ? "Rapport exécutif" : "Module 2 · impact métier"}
          </p>
          <h1 className="display mt-2 text-3xl text-white sm:text-5xl">{record.targetLabel}</h1>
          <p className="mt-3 break-all text-sm text-muted">
            {formatDate(record.createdAt)} · {record.finalUrl}
          </p>
        </div>
        <div className={`grade ${tone(record.grade)}`}>
          <strong>{record.grade}</strong>
          <span>{record.score}/100</span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5 md:col-span-2">
          <p className="text-sm text-muted">Lecture pour un dirigeant</p>
          <p className="mt-2 text-lg text-white">
            Score {record.grade}, {record.gradeLabel.toLowerCase()}.{" "}
            {urgent === 0
              ? "Aucun point critique sur la page d'accueil."
              : `${urgent} point${urgent > 1 ? "s" : ""} à traiter en priorité sur la page d'accueil.`}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-muted">Perte indicative</p>
          <p className="display mt-2 text-2xl text-white">
            {formatMoney(record.lossMin)}
            <span className="mt-1 block text-base text-muted">à {formatMoney(record.lossMax)}</span>
          </p>
          <p className="mt-3 text-xs text-muted">
            Ordre de grandeur TPE/PME : interruption d'encaissement, perte de confiance, remise en état. Ce n'est pas un devis d'assurance.
          </p>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="display text-2xl text-white">Ce que ça veut dire pour l'activité</h2>
        {record.findings.length === 0 ? (
          <p className="panel p-5">Aucune fragilité de configuration détectée sur cette page.</p>
        ) : (
          record.findings.map((finding) => (
            <article key={finding.id} className="panel grid gap-2 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`sev sev-${finding.severity}`}>{SEVERITY_LABEL[finding.severity]}</span>
                <h3 className="text-lg text-white">{finding.title}</h3>
              </div>
              <p>{finding.business}</p>
              <p className="text-sm text-muted">{finding.technical}</p>
              {finding.lossMax > 0 ? (
                <p className="text-sm text-warn">
                  Estimation liée : {formatMoney(finding.lossMin)} – {formatMoney(finding.lossMax)}
                </p>
              ) : null}
            </article>
          ))
        )}
      </section>

      {report ? (
        <section className="panel p-5">
          <h2 className="display text-2xl text-white">Actions recommandées</h2>
          <ul className="mt-3 grid gap-2">
            {record.findings.filter((finding) => finding.fixedByPatch).map((finding) => (
              <li key={finding.id}>{finding.title}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Le fichier de correctif (Nginx, Apache, PHP, Node.js, Python) se télécharge depuis l'écran de diagnostic.
            À valider en préproduction avant mise en production.
          </p>
        </section>
      ) : (
        <>
          <SandboxPanel findings={record.findings} />
          <RemediationPanel record={record} />
        </>
      )}

      <p className="text-xs text-muted">
        Diagnostic de configuration sur la page demandée. AuditFlash ne teste pas les injections, ne récupère pas de fichiers privés et n'affiche aucune clé.
      </p>
      {report ? (
        <button className="btn btn-lime no-print w-fit" type="button" onClick={() => window.print()}>
          Enregistrer en PDF
        </button>
      ) : null}
    </article>
  );
}
