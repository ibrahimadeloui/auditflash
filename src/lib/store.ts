import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { analyze } from "./analyze";
import { summarize } from "./score";
import type { RawExchange, ScanRecord } from "./types";

const file = path.join(process.env.VERCEL ? os.tmpdir() : process.cwd(), process.env.VERCEL ? "auditflash-audits.json" : path.join("data", "audits.json"));

type Db = { audits: ScanRecord[] };

async function readDb(): Promise<Db> {
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf8")) as Db;
    return Array.isArray(parsed.audits) ? parsed : { audits: [] };
  } catch {
    return { audits: [] };
  }
}

export function buildRecord(exchange: RawExchange): ScanRecord {
  const { findings, stack } = analyze(exchange);
  let targetLabel = exchange.finalUrl;
  if (exchange.demo) targetLabel = "Atelier Nadi · boutique de démonstration";
  else {
    try {
      targetLabel = new URL(exchange.finalUrl).hostname;
    } catch {
      targetLabel = exchange.finalUrl;
    }
  }

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    targetLabel,
    requestedUrl: exchange.requestedUrl,
    finalUrl: exchange.finalUrl,
    httpStatus: exchange.status,
    demo: exchange.demo,
    findings,
    stack,
    ...summarize(findings),
  };
}

export async function saveAudit(record: ScanRecord): Promise<void> {
  try {
    const db = await readDb();
    db.audits = [record, ...db.audits.filter((item) => item.id !== record.id)].slice(0, 40);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(db, null, 2), "utf8");
  } catch {
    // L'hébergement serverless n'autorise pas l'écriture durable. Le navigateur conserve le diagnostic.
  }
}

export async function listAudits(): Promise<ScanRecord[]> {
  return (await readDb()).audits;
}

export async function getAudit(id: string): Promise<ScanRecord | null> {
  return (await readDb()).audits.find((item) => item.id === id) ?? null;
}
