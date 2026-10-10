"use client";

import { useState } from "react";
import { patchDocument, pullRequestText, snippetsFor } from "@/lib/remediation";
import type { ScanRecord } from "@/lib/types";

export function RemediationPanel({ record }: { record: ScanRecord }) {
  const snippets = snippetsFor(record);
  const [active, setActive] = useState(0);
  const [note, setNote] = useState("");
  const current = snippets[active] ?? snippets[0];

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setNote(`${label} copié.`);
  }

  function downloadPatch() {
    const blob = new Blob([patchDocument(record)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "auditflash-correctif.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!current) return null;

  return (
    <section className="no-print grid gap-4">
      <div>
        <p className="text-sm tracking-[0.14em] text-lime uppercase">Module 4 · remédiation</p>
        <h2 className="display mt-2 text-3xl text-white">Correctifs prêts à déposer</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          L'extrait correspond à la pile détectée ({record.stack}). Il ajoute les en-têtes manquants sans retirer vos scripts de paiement.
          Le déploiement reste dans votre dépôt : AuditFlash n'ouvre pas de session Git.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {snippets.map((snippet, index) => (
          <button
            key={snippet.filename}
            className={index === active ? "btn btn-lime" : "btn btn-ghost"}
            type="button"
            onClick={() => setActive(index)}
          >
            {snippet.label}
          </button>
        ))}
      </div>
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-sm">
          <span className="text-muted">{current.filename}</span>
          <button className="btn btn-ghost min-h-9 px-3" type="button" onClick={() => void copy(current.code, current.label)}>
            Copier
          </button>
        </div>
        <pre className="m-0 px-4 py-4 text-sm leading-6 text-mist">{current.code}</pre>
      </div>
      <div className="actions flex flex-wrap gap-3">
        <button className="btn btn-lime btn-stretch" type="button" onClick={downloadPatch}>
          Télécharger le correctif
        </button>
        <button className="btn btn-ghost btn-stretch" type="button" onClick={() => void copy(pullRequestText(record), "Message de pull request")}>
          Copier le message de pull request
        </button>
        <a className="btn btn-ghost btn-stretch no-underline" href={`/rapport/${record.id}`}>
          Rapport dirigeant
        </a>
      </div>
      {note ? <p className="text-sm text-lime">{note}</p> : null}
    </section>
  );
}
