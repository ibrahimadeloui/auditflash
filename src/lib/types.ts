export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Grade = "A+" | "A" | "B" | "C" | "D" | "E" | "F";

export type StackHint = "php" | "nginx" | "node" | "python" | "unknown";

export type Finding = {
  id: string;
  severity: Severity;
  title: string;
  technical: string;
  business: string;
  lossMin: number;
  lossMax: number;
  fixedByPatch: boolean;
};

export type RawExchange = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  setCookies: string[];
  body: string;
  demo: boolean;
};

export type ScanRecord = {
  id: string;
  createdAt: string;
  targetLabel: string;
  requestedUrl: string;
  finalUrl: string;
  httpStatus: number;
  demo: boolean;
  findings: Finding[];
  score: number;
  grade: Grade;
  gradeLabel: string;
  lossMin: number;
  lossMax: number;
  stack: StackHint;
};
