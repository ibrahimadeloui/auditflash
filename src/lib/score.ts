import type { Finding, Grade, ScanRecord, Severity } from "./types";

const PENALTY: Record<Severity, number> = {
  critical: 40,
  high: 16,
  medium: 8,
  low: 3,
  info: 0,
};

export const GRADE_LABEL: Record<Grade, string> = {
  "A+": "Exemplaire",
  A: "Solide",
  B: "Correct",
  C: "À renforcer",
  D: "Exposé",
  E: "Critique",
  F: "Danger immédiat",
};

export function gradeFor(score: number): Grade {
  if (score >= 97) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  if (score >= 35) return "E";
  return "F";
}

export function summarize(findings: Finding[]): Pick<
  ScanRecord,
  "score" | "grade" | "gradeLabel" | "lossMin" | "lossMax"
> {
  const penalty = findings.reduce((sum, finding) => sum + PENALTY[finding.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const grade = gradeFor(score);
  const lossMin = findings.reduce((sum, finding) => sum + finding.lossMin, 0);
  const rawMax = findings.reduce((sum, finding) => sum + finding.lossMax, 0);
  const lossMax = Math.min(20_000_000, rawMax);
  return {
    score,
    grade,
    gradeLabel: GRADE_LABEL[grade],
    lossMin: Math.min(lossMin, lossMax),
    lossMax,
  };
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critique",
  high: "Élevé",
  medium: "Moyen",
  low: "Faible",
  info: "Info",
};
