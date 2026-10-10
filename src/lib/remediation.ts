import type { Finding, ScanRecord, StackHint } from "./types";

const STACK_LABEL: Record<StackHint, string> = {
  php: "PHP / WordPress",
  nginx: "Nginx",
  node: "Node.js",
  python: "Python",
  unknown: "Pile non identifiée",
};

function has(findings: Finding[], id: string) {
  return findings.some((finding) => finding.id === id && finding.fixedByPatch);
}

function headerLines(findings: Finding[], https: boolean): string[] {
  const lines: string[] = [];
  if (has(findings, "header-hsts") && https) {
    lines.push('Strict-Transport-Security: max-age=31536000; includeSubDomains');
  }
  if (has(findings, "header-csp") || has(findings, "header-frame")) {
    lines.push("Content-Security-Policy: base-uri 'self'; object-src 'none'; frame-ancestors 'none'");
  }
  if (has(findings, "header-frame")) lines.push("X-Frame-Options: DENY");
  if (has(findings, "header-nosniff")) lines.push("X-Content-Type-Options: nosniff");
  if (has(findings, "header-referrer")) lines.push("Referrer-Policy: strict-origin-when-cross-origin");
  if (has(findings, "header-permissions")) {
    lines.push("Permissions-Policy: camera=(), microphone=(), geolocation=()");
  }
  return lines;
}

function nginx(lines: string[], findings: Finding[]): string {
  const directives = lines.map((line) => {
    const [name, ...rest] = line.split(": ");
    return `    add_header ${name} "${rest.join(": ")}" always;`;
  });
  const tokens = has(findings, "disclosure-tech") ? "\n    server_tokens off;" : "";
  return `# Correctif AuditFlash — à placer dans le bloc server, puis nginx -t && reload
# La politique de contenu ci-dessous ne bloque pas vos scripts de paiement.
# Validez le tunnel de commande en préproduction.
server {${tokens}
${directives.join("\n")}
}`;
}

function htaccess(lines: string[], findings: Finding[]): string {
  const directives = lines.map((line) => {
    const [name, ...rest] = line.split(": ");
    return `  Header always set ${name} "${rest.join(": ")}"`;
  });
  const unset = has(findings, "disclosure-tech") ? "\n  Header unset X-Powered-By" : "";
  return `# Correctif AuditFlash — .htaccess
<IfModule mod_headers.c>${unset}
${directives.join("\n")}
</IfModule>`;
}

function php(lines: string[], findings: Finding[]): string {
  const calls = lines.map((line) => {
    const [name, ...rest] = line.split(": ");
    return `header(${JSON.stringify(`${name}: ${rest.join(": ")}`)});`;
  });
  const cookies = has(findings, "cookies-session")
    ? `
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => true,
  'httponly' => true,
  'samesite' => 'Lax',
]);`
    : "";
  const generator = has(findings, "cms-wordpress")
    ? `
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');`
    : "";
  return `<?php
// Correctif AuditFlash — avant toute sortie HTML.
${calls.join("\n")}${cookies}${generator}
`;
}

function node(lines: string[]): string {
  const sets = lines
    .map((line) => {
      const [name, ...rest] = line.split(": ");
      return `  response.headers.set(${JSON.stringify(name)}, ${JSON.stringify(rest.join(": "))});`;
    })
    .join("\n");
  return `// Correctif AuditFlash — middleware.js (Next.js / Node)
import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();
${sets}
  return response;
}
`;
}

function python(lines: string[]): string {
  const sets = lines
    .map((line) => {
      const [name, ...rest] = line.split(": ");
      return `        response.headers[${JSON.stringify(name)}] = ${JSON.stringify(rest.join(": "))}`;
    })
    .join("\n");
  return `# Correctif AuditFlash — middleware FastAPI
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
${sets}
        return response

app.add_middleware(SecurityHeaders)
`;
}

export type Snippet = {
  id: StackHint | "apache";
  label: string;
  filename: string;
  code: string;
};

export function snippetsFor(record: Pick<ScanRecord, "findings" | "stack" | "finalUrl">): Snippet[] {
  const https = record.finalUrl.startsWith("https:");
  const lines = headerLines(record.findings, https);
  if (lines.length === 0 && !record.findings.some((finding) => finding.fixedByPatch)) {
    return [
      {
        id: record.stack,
        label: STACK_LABEL[record.stack],
        filename: "auditflash-rien-a-changer.txt",
        code: "Aucun en-tête de configuration à ajouter pour les points corrigibles de ce diagnostic.\n",
      },
    ];
  }

  const pack: Snippet[] = [
    { id: "nginx", label: "Nginx", filename: "auditflash.conf", code: nginx(lines, record.findings) },
    { id: "apache", label: "Apache .htaccess", filename: ".htaccess", code: htaccess(lines, record.findings) },
    { id: "php", label: "PHP / WordPress", filename: "security-headers.php", code: php(lines, record.findings) },
    { id: "node", label: "Node.js", filename: "middleware.js", code: node(lines) },
    { id: "python", label: "Python", filename: "security_headers.py", code: python(lines) },
  ];

  const preferred = record.stack === "unknown" ? "php" : record.stack;
  const rank = (id: Snippet["id"]) => {
    if (preferred === "php" && (id === "php" || id === "apache")) return 0;
    return id === preferred ? 0 : 1;
  };
  return pack.sort((a, b) => rank(a.id) - rank(b.id));
}

export function patchDocument(record: ScanRecord): string {
  const snippets = snippetsFor(record);
  const intro = [
    "AuditFlash — correctif de configuration",
    `Cible : ${record.targetLabel}`,
    `Adresse : ${record.finalUrl}`,
    `Score mesuré : ${record.grade} (${record.score}/100)`,
    "",
    "Ce fichier ne modifie pas le site tout seul.",
    "Déposez l'extrait adapté à votre hébergement, testez le paiement, puis ouvrez une pull request.",
    "La politique de contenu proposée laisse les scripts existants en place et bloque le cadrage par un autre site.",
    "",
  ];
  const body = snippets
    .map((snippet) => `----- ${snippet.label} (${snippet.filename}) -----\n${snippet.code.trim()}\n`)
    .join("\n");
  return `${intro.join("\n")}\n${body}`;
}

export function pullRequestText(record: ScanRecord): string {
  const titles = record.findings.filter((finding) => finding.fixedByPatch).map((finding) => `- ${finding.title}`);
  return [
    `fix(security): en-têtes de sécurité pour ${record.targetLabel}`,
    "",
    "Ce correctif ajoute la configuration mesurée par AuditFlash.",
    "À valider en préproduction, tunnel de paiement compris.",
    "",
    titles.length ? titles.join("\n") : "- Aucun point corrigible automatiquement.",
    "",
    `Score avant correctif : ${record.grade} (${record.score}/100).`,
  ].join("\n");
}
