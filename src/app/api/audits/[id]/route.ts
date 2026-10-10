import { NextResponse } from "next/server";
import { UUID_RE } from "@/lib/format";
import { getAudit } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Diagnostic introuvable." }, { status: 404 });
  const audit = await getAudit(id);
  if (!audit) return NextResponse.json({ error: "Diagnostic introuvable." }, { status: 404 });
  return NextResponse.json(audit);
}
