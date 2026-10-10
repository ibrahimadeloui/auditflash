import { AuditError, assertPublicHttpUrl } from "./net";
import type { RawExchange } from "./types";

const MAX_BYTES = 500_000;
const MAX_HOPS = 4;

async function readLimited(response: Response): Promise<string> {
  const type = response.headers.get("content-type") ?? "";
  if (type && !/text\/|json|xml|javascript|ecmascript/i.test(type)) return "";
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    const room = MAX_BYTES - received;
    const slice = value.byteLength > room ? value.slice(0, room) : value;
    chunks.push(slice);
    received += slice.byteLength;
    if (value.byteLength > room) {
      await reader.cancel();
      break;
    }
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

function collectHeaders(response: Response): { headers: Record<string, string>; setCookies: string[] } {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    headers[key.toLowerCase()] = headers[key.toLowerCase()] ? `${headers[key.toLowerCase()]}, ${value}` : value;
  });
  const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  return { headers, setCookies };
}

export async function fetchPublicPage(raw: string): Promise<RawExchange> {
  let current = await assertPublicHttpUrl(raw);
  const requestedUrl = current.href;

  for (let hop = 0; hop < MAX_HOPS; hop += 1) {
    current = await assertPublicHttpUrl(current.href);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    let response: Response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "User-Agent": "AuditFlash/0.1 (diagnostic passif de configuration)",
        },
      });
    } catch (error) {
      if (error instanceof AuditError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AuditError("Le site n'a pas répondu à temps.");
      }
      throw new AuditError("Impossible de joindre cette adresse.");
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new AuditError("Redirection sans adresse de destination.");
      current = new URL(location, current);
      continue;
    }

    const { headers, setCookies } = collectHeaders(response);
    const body = await readLimited(response);
    return {
      requestedUrl,
      finalUrl: current.href,
      status: response.status,
      headers,
      setCookies,
      body,
      demo: false,
    };
  }

  throw new AuditError("Trop de redirections.");
}
