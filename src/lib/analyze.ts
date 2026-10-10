import type { Finding, RawExchange, StackHint } from "./types";

const LOSS = {
  high: { lossMin: 800_000, lossMax: 4_000_000 },
  medium: { lossMin: 150_000, lossMax: 900_000 },
  low: { lossMin: 0, lossMax: 120_000 },
} as const;

function header(headers: Record<string, string>, name: string): string | null {
  const value = headers[name.toLowerCase()];
  return value && value.trim() ? value.trim() : null;
}

function wordpressVersion(html: string): string | null {
  const patterns = [
    /<meta[^>]*name=["']generator["'][^>]*content=["']WordPress\s+([0-9][^"']*)["']/i,
    /<meta[^>]*content=["']WordPress\s+([0-9][^"']*)["'][^>]*name=["']generator["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function paymentNames(html: string): string[] {
  const names: string[] = [];
  if (/fedapay/i.test(html)) names.push("FedaPay");
  if (/kkiapay/i.test(html)) names.push("Kkiapay");
  if (/js\.stripe\.com|stripe\.com\/v3|checkout\.stripe/i.test(html)) names.push("Stripe");
  return names;
}

function hasSecretPattern(html: string): boolean {
  return (
    /\b(?:sk|rk)_(?:live|test)_[0-9A-Za-z]{10,}/.test(html) ||
    /\bAKIA[0-9A-Z]{16}\b/.test(html)
  );
}

function cookieIssues(setCookies: string[]): { name: string; missing: string[] }[] {
  return setCookies.flatMap((raw) => {
    const name = raw.split("=", 1)[0]?.trim();
    if (!name || name.length > 80) return [];
    const lower = raw.toLowerCase();
    const missing: string[] = [];
    if (!/;\s*secure(?:;|$)/.test(lower)) missing.push("Secure");
    if (!/;\s*httponly(?:;|$)/.test(lower)) missing.push("HttpOnly");
    if (!/;\s*samesite=/.test(lower)) missing.push("SameSite");
    return missing.length ? [{ name, missing }] : [];
  });
}

function framingProtected(headers: Record<string, string>): boolean {
  const xfo = header(headers, "x-frame-options");
  if (xfo && /^(deny|sameorigin)$/i.test(xfo)) return true;
  const csp = header(headers, "content-security-policy") ?? "";
  return /frame-ancestors\s+[^;]*(?:'none'|"none")/i.test(csp);
}

export function detectStack(headers: Record<string, string>, body: string): StackHint {
  const powered = (headers["x-powered-by"] ?? "").toLowerCase();
  const server = (headers["server"] ?? "").toLowerCase();
  const sample = body.slice(0, 8000).toLowerCase();
  const blob = `${powered} ${server} ${sample}`;
  if (
    powered.includes("php") ||
    sample.includes("wp-content") ||
    sample.includes("wordpress") ||
    /<meta[^>]*wordpress/i.test(body)
  ) {
    return "php";
  }
  if (server.includes("nginx")) return "nginx";
  if (powered.includes("next") || powered.includes("express") || sample.includes("next.js")) return "node";
  if (server.includes("uvicorn") || server.includes("gunicorn") || powered.includes("python")) return "python";
  return "unknown";
}

export function analyze(exchange: RawExchange): { findings: Finding[]; stack: StackHint } {
  const findings: Finding[] = [];
  const final = new URL(exchange.finalUrl);
  const https = final.protocol === "https:";

  if (!https) {
    findings.push({
      id: "transport-https",
      severity: "high",
      title: "Page servie sans chiffrement",
      technical: "La réponse finale utilise HTTP. Les échanges, y compris un formulaire de commande, peuvent être lus sur le réseau.",
      business:
        "Risque élevé. Sur un wifi partagé, un tiers peut voir la page et intercaler une fausse étape de paiement. Vos clients paient, vous ne recevez rien.",
      ...LOSS.high,
      fixedByPatch: false,
    });
  }

  if (https && !header(exchange.headers, "strict-transport-security")) {
    findings.push({
      id: "header-hsts",
      severity: "high",
      title: "Le navigateur n'est pas forcé à rester en HTTPS",
      technical: "OWASP A02:2021 – Cryptographic Failures. L'en-tête Strict-Transport-Security est absent.",
      business:
        "Risque élevé. Un client qui retape votre adresse peut retomber sur une version non chiffrée. Le moment le plus exposé est le paiement.",
      ...LOSS.high,
      fixedByPatch: true,
    });
  }

  const csp = header(exchange.headers, "content-security-policy");
  if (!csp) {
    findings.push({
      id: "header-csp",
      severity: "high",
      title: "Aucune politique de contenu",
      technical: "OWASP A05:2021 – Security Misconfiguration. L'en-tête Content-Security-Policy est absent.",
      business:
        "Risque élevé. Le navigateur n'a aucune consigne pour limiter les scripts de la page. Un composant de thème ou d'extension modifié peut s'exécuter au milieu du tunnel de commande.",
      ...LOSS.high,
      fixedByPatch: true,
    });
  } else if (/unsafe-inline/i.test(csp) && /unsafe-eval/i.test(csp)) {
    findings.push({
      id: "csp-permissive",
      severity: "medium",
      title: "Politique de contenu trop ouverte",
      technical: "La Content-Security-Policy autorise à la fois les scripts en ligne et eval.",
      business:
        "La protection existe, mais elle laisse passer beaucoup de scripts. Un extrait ajouté au thème peut encore s'exécuter sur la page de commande.",
      ...LOSS.medium,
      fixedByPatch: false,
    });
  }

  if (!framingProtected(exchange.headers)) {
    findings.push({
      id: "header-frame",
      severity: "high",
      title: "La boutique peut être affichée dans une autre page",
      technical:
        "OWASP A05:2021 – Security Misconfiguration. Ni X-Frame-Options ni frame-ancestors ne empêchent le cadrage.",
      business:
        "Risque élevé. Une page tierce peut recouvrir votre bouton de paiement. Le client croit valider une promotion, il confirme en réalité une autre action.",
      ...LOSS.high,
      fixedByPatch: true,
    });
  }

  const nosniff = header(exchange.headers, "x-content-type-options");
  if (!nosniff || nosniff.toLowerCase() !== "nosniff") {
    findings.push({
      id: "header-nosniff",
      severity: "medium",
      title: "Le type des fichiers n'est pas verrouillé",
      technical: "L'en-tête X-Content-Type-Options: nosniff est absent.",
      business:
        "Un fichier déposé avec le mauvais type peut être ouvert comme une page. L'incident dépasse alors le simple document mal rangé.",
      ...LOSS.medium,
      fixedByPatch: true,
    });
  }

  if (!header(exchange.headers, "referrer-policy")) {
    findings.push({
      id: "header-referrer",
      severity: "low",
      title: "Les adresses internes peuvent fuiter",
      technical: "L'en-tête Referrer-Policy est absent.",
      business:
        "Le lien complet de vos pages peut être transmis aux sites tiers, y compris un prestataire de paiement ou une régie publicitaire.",
      ...LOSS.low,
      fixedByPatch: true,
    });
  }

  if (!header(exchange.headers, "permissions-policy")) {
    findings.push({
      id: "header-permissions",
      severity: "low",
      title: "Caméra et micro ne sont pas explicitement refusés",
      technical: "L'en-tête Permissions-Policy est absent.",
      business:
        "Le site ne déclare pas qu'il se passe de la caméra, du micro et de la localisation. Un composant intégré peut encore les demander.",
      ...LOSS.low,
      fixedByPatch: true,
    });
  }

  const cookies = cookieIssues(exchange.setCookies);
  if (cookies.length > 0) {
    const names = cookies.map((cookie) => cookie.name).join(", ");
    findings.push({
      id: "cookies-session",
      severity: "medium",
      title: "Cookies de session insuffisamment protégés",
      technical: `Les cookies ${names} n'ont pas tous les attributs Secure, HttpOnly et SameSite. Les valeurs ne sont pas conservées.`,
      business:
        "La session d'un client peut voyager sur une connexion non chiffrée ou être lue par un script de page. Quelqu'un d'autre poursuivrait alors sa commande.",
      ...LOSS.medium,
      fixedByPatch: true,
    });
  }

  const version = wordpressVersion(exchange.body);
  if (version) {
    findings.push({
      id: "cms-wordpress",
      severity: "medium",
      title: `Version WordPress ${version} visible`,
      technical: `La balise generator publie WordPress ${version}. Les extensions de paiement héritent de cette exposition.`,
      business:
        "La version exacte du site est publique. Tant que le cœur et les extensions de paiement ne sont pas à jour, vous restez sur une version déjà connue.",
      ...LOSS.medium,
      fixedByPatch: true,
    });
  } else if (/wp-content|woocommerce/i.test(exchange.body)) {
    findings.push({
      id: "cms-wordpress",
      severity: "low",
      title: "Site de type WordPress ou WooCommerce",
      technical: "La page d'accueil contient des marqueurs wp-content ou WooCommerce, sans numéro de version lisible.",
      business:
        "Votre catalogue ressemble à une boutique WordPress. Le point sensible est la mise à jour des extensions qui encaissent les paiements.",
      ...LOSS.low,
      fixedByPatch: false,
    });
  }

  const powered = header(exchange.headers, "x-powered-by");
  const server = header(exchange.headers, "server");
  const banner = [server, powered].filter(Boolean).join(" · ");
  if (banner && /\d/.test(banner)) {
    findings.push({
      id: "disclosure-tech",
      severity: "low",
      title: "Version du serveur annoncée",
      technical: `Les en-têtes publics indiquent : ${banner}.`,
      business:
        "Ce n'est pas une faille à elle seule. Cette bannière indique toutefois la pile exacte à quelqu'un qui cherche une version non corrigée.",
      ...LOSS.low,
      fixedByPatch: true,
    });
  }

  const payments = paymentNames(exchange.body);
  if (payments.length > 0) {
    findings.push({
      id: "payment-public",
      severity: "info",
      title: `Paiement ${payments.join(", ")} détecté sur la page`,
      technical:
        "Un script ou un marqueur de passerelle est présent dans la page d'accueil. Aucune clé n'est extraite ni affichée.",
      business:
        "Le tunnel d'encaissement est visible dès la première page. Seule une clé publique a sa place dans le navigateur. La clé secrète reste sur le serveur.",
      lossMin: 0,
      lossMax: 0,
      fixedByPatch: false,
    });
  }

  if (hasSecretPattern(exchange.body)) {
    findings.push({
      id: "secret-pattern",
      severity: "critical",
      title: "Une clé secrète semble présente dans la page publique",
      technical:
        "OWASP A02:2021 – Cryptographic Failures. Un motif de clé secrète a été reconnu dans le HTML public. La valeur n'est ni stockée ni affichée.",
      business:
        "Risque critique. Une clé secrète de paiement publiée dans la page permet de débiter ou de rembourser sans passer par vous. Révoquez-la chez le prestataire, puis sortez-la du code visible.",
      lossMin: 2_500_000,
      lossMax: 15_000_000,
      fixedByPatch: false,
    });
  }

  if (!https && /<input[^>]*type=["']password["']/i.test(exchange.body)) {
    findings.push({
      id: "form-password-http",
      severity: "high",
      title: "Formulaire de mot de passe sans chiffrement",
      technical: "Un champ password est servi sur HTTP.",
      business:
        "Les identifiants de vos clients ou de votre administration circulent en clair. Changez-les après le passage en HTTPS.",
      ...LOSS.high,
      fixedByPatch: false,
    });
  }

  if (https && /(?:src|action)=["']http:\/\//i.test(exchange.body)) {
    findings.push({
      id: "mixed-content",
      severity: "medium",
      title: "Ressources encore chargées en HTTP",
      technical: "La page HTTPS référence au moins une adresse http:// dans src ou action.",
      business:
        "Une partie de la page, parfois un script de paiement, n'est pas protégée. Le cadenas du navigateur ne couvre alors pas tout le tunnel.",
      ...LOSS.medium,
      fixedByPatch: false,
    });
  }

  if (exchange.status >= 400) {
    findings.push({
      id: "http-status",
      severity: "info",
      title: `La page a répondu HTTP ${exchange.status}`,
      technical: "Les en-têtes ont été lus malgré ce statut. Le contenu métier de la page peut être incomplet.",
      business: "Le diagnostic porte sur la configuration renvoyée au visiteur, pas sur le bon affichage du catalogue.",
      lossMin: 0,
      lossMax: 0,
      fixedByPatch: false,
    });
  }

  const rank: Record<Finding["severity"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return { findings, stack: detectStack(exchange.headers, exchange.body) };
}
