"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";

type Item = {
  id: string;
  createdAt: string;
  targetLabel: string;
  grade: string;
  gradeLabel: string;
  score: number;
  demo: boolean;
};

export default function HistoryPage() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    void fetch("/api/audits")
      .then((response) => response.json())
      .then((data: Item[]) => setItems(data));
  }, []);

  return (
    <main className="shell py-8">
      <h1 className="display text-4xl text-white">Historique</h1>
      <p className="mt-2 text-sm text-muted">Les quarante derniers diagnostics de cette machine.</p>
      <div className="mt-8 grid gap-3">
        {items === null ? <p className="text-muted">Chargement…</p> : null}
        {items?.length === 0 ? <p className="text-muted">Aucun diagnostic pour le moment.</p> : null}
        {items?.map((item) => (
          <Link key={item.id} href={`/audit/${item.id}`} className="panel flex items-center justify-between gap-4 p-5 no-underline">
            <span>
              <strong className="block text-white">{item.targetLabel}</strong>
              <span className="text-sm text-muted">
                {formatDate(item.createdAt)}
                {item.demo ? " · démonstration" : ""}
              </span>
            </span>
            <span className="display text-3xl text-lime">
              {item.grade}
              <span className="ml-2 text-sm text-muted">{item.score}</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
