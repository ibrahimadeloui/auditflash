import { NextResponse } from "next/server";
import { UUID_RE } from "@/lib/format";
import { patchDocument } from "@/lib/remediation";
import { getAudit } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Diagnostic introuvable." }, { status: 404 });
  const audit = await getAudit(id);
  if (!audit) return NextResponse.json({ error: "Diagnostic introuvable." }, { status: 404 });
  return new NextResponse(patchDocument(audit), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "attachment; filename=auditflash-correctif.txt",
    },
  });
}
