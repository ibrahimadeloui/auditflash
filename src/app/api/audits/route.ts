import { NextResponse } from "next/server";
import { listAudits } from "@/lib/store";

export async function GET() {
  const audits = await listAudits();
  return NextResponse.json(
    audits.map((audit) => ({
      id: audit.id,
      createdAt: audit.createdAt,
      targetLabel: audit.targetLabel,
      finalUrl: audit.finalUrl,
      grade: audit.grade,
      gradeLabel: audit.gradeLabel,
      score: audit.score,
      demo: audit.demo,
    })),
  );
}
