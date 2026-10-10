import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class AuditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditError";
  }
}

const SENSITIVE_PATH =
  /(?:^|\/)(?:\.env(?:\.|$|\b)|\.git(?:\/|$)|\.svn(?:\/|$)|\.hg(?:\/|$)|\.ds_store|wp-config\.php|config\.php|configuration\.php|settings\.php|web\.config|id_rsa|shadow|passwd|\.sql|\.bak|\.backup|\.dump|\.pem|\.key|\.p12|\.pfx)(?:$|[/?#])/i;

export function isBlockedIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized.startsWith("::ffff:")) return isBlockedIp(normalized.slice("::ffff:".length));
  if (normalized === "::1" || normalized === "::") return true;

  if (normalized.includes(":")) {
    const first = normalized.split(":").find((part) => part.length > 0) ?? "0";
    const value = Number.parseInt(first, 16);
    if (!Number.isFinite(value)) return true;
    if ((value & 0xfe00) === 0xfc00) return true;
    if ((value & 0xffc0) === 0xfe80) return true;
    return false;
  }

  const parts = normalized.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true;
  return false;
}

function assertHostname(hostname: string) {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host || host.length > 253) throw new AuditError("Adresse invalide.");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal" ||
    host === "metadata.internal"
  ) {
    throw new AuditError(
      "Cette adresse n'est pas autorisée. L'audit express ne contacte pas la machine locale ni un réseau privé.",
    );
  }
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) {
    throw new AuditError("Cette forme d'adresse n'est pas autorisée.");
  }
}

export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new AuditError("Indiquez une adresse complète, par exemple https://www.maboutique.com.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AuditError("Seules les adresses http et https sont acceptées.");
  }
  if (url.username || url.password) throw new AuditError("L'adresse ne doit pas contenir d'identifiants.");
  if (raw.length > 2000) throw new AuditError("Adresse trop longue.");

  const port = url.port;
  const allowedPort = url.protocol === "https:" ? "443" : "80";
  if (port && port !== allowedPort) {
    throw new AuditError("Seuls les ports web 80 et 443 sont acceptés.");
  }

  assertHostname(url.hostname);
  if (SENSITIVE_PATH.test(decodeURIComponent(url.pathname))) {
    throw new AuditError(
      "AuditFlash ne télécharge pas les fichiers d'environnement, dépôts, sauvegardes ou clés. Indiquez la page d'accueil.",
    );
  }

  if (isIP(url.hostname)) {
    if (isBlockedIp(url.hostname)) {
      throw new AuditError(
        "Cette adresse n'est pas autorisée. L'audit express ne contacte pas la machine locale ni un réseau privé.",
      );
    }
    return url;
  }

  let records: { address: string }[];
  try {
    records = await lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new AuditError("Cette adresse est introuvable.");
  }

  if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) {
    throw new AuditError(
      "Cette adresse n'est pas autorisée. L'audit express ne contacte pas la machine locale ni un réseau privé.",
    );
  }

  return url;
}
