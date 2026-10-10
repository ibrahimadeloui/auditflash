import type { ScanRecord } from "./types";

const KEY = "auditflash.audits";

function readAll(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "[]") as ScanRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberAudit(record: ScanRecord) {
  const next = [record, ...readAll().filter((item) => item.id !== record.id)].slice(0, 40);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function recallAudit(id: string): ScanRecord | null {
  return readAll().find((item) => item.id === id) ?? null;
}

export function recallAudits(): ScanRecord[] {
  return readAll();
}
