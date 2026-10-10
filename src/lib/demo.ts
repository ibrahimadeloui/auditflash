import type { RawExchange } from "./types";

export const DEMO_GENERATOR = "WordPress 6.2.1";
export const DEMO_POWERED_BY = "PHP/8.1.12";
export const DEMO_SERVER = "Apache/2.4.54 (Ubuntu)";
export const DEMO_COOKIE = "atelier_session=demo-session; Path=/";
export const DEMO_PAYMENT_SRC = "/demo/fedapay-checkout.js";

export function demoExchange(): RawExchange {
  const body = `<!doctype html>
<html lang="fr">
  <head>
    <meta name="generator" content="${DEMO_GENERATOR}" />
    <script src="${DEMO_PAYMENT_SRC}"></script>
  </head>
  <body>
    <main class="woocommerce">
      <p>Paiement FedaPay et Kkiapay, boutique de démonstration.</p>
    </main>
  </body>
</html>`;

  return {
    requestedUrl: "demo://atelier-nadi",
    finalUrl: "https://demo.auditflash.local/boutique",
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      server: DEMO_SERVER,
      "x-powered-by": DEMO_POWERED_BY,
    },
    setCookies: [DEMO_COOKIE],
    body,
    demo: true,
  };
}
