import { NextResponse } from "next/server";
import { demoExchange } from "@/lib/demo";
import { fetchPublicPage } from "@/lib/fetch-public";
import { AuditError } from "@/lib/net";
import { buildRecord, saveAudit } from "@/lib/store";

const hits: number[] = [];

export async function POST(request: Request) {
  const now = Date.now();
  while (hits.length > 0 && hits[0] < now - 60_000) hits.shift();
  if (hits.length >= 20) {
    return NextResponse.json(
      { error: "Trop de diagnostics en une minute. Réessayez dans un instant." },
      { status: 429 },
    );
  }

  let payload: { url?: unknown; demo?: unknown };
  try {
    payload = (await request.json()) as { url?: unknown; demo?: unknown };
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  hits.push(now);

  try {
    const exchange = payload.demo === true ? demoExchange() : await fetchPublicPage(String(payload.url ?? ""));
    const record = buildRecord(exchange);
    await saveAudit(record);
    return NextResponse.json(record);
  } catch (error) {
    const message = error instanceof AuditError || error instanceof Error ? error.message : "Diagnostic impossible.";
    const safe = error instanceof AuditError ? message : "Diagnostic impossible pour cette adresse.";
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
