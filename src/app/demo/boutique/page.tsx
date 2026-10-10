import type { Metadata } from "next";
import { DEMO_GENERATOR, DEMO_PAYMENT_SRC } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Atelier Nadi — boutique de démonstration",
  description: "Page isolée pour la simulation AuditFlash. Aucun paiement réel.",
  generator: DEMO_GENERATOR,
  robots: { index: false, follow: false },
};

const products = [
  { name: "Pagne tissé", price: "28 000 F" },
  { name: "Sac cuir", price: "45 000 F" },
  { name: "Ensemble bazin", price: "62 000 F" },
];

export default function BoutiqueDemo() {
  return (
    <div className="shop-demo min-h-screen bg-[#f6f1e7] text-[#1c1915]">
      <header className="flex items-center justify-between px-5 py-4">
        <strong className="display text-xl">Atelier Nadi</strong>
        <a className="text-xs text-[#1c1915]" href="/">
          Retour
        </a>
      </header>
      <main className="woocommerce grid gap-3 px-5 pb-8">
        <p className="text-sm">Boutique de démonstration. Aucun paiement n'est encaissé.</p>
        {products.map((product) => (
          <article key={product.name} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
            <span>{product.name}</span>
            <strong>{product.price}</strong>
          </article>
        ))}
        <button
          id="payer"
          type="button"
          data-paiement="fedapay kkiapay"
          className="mt-2 rounded-full bg-[#1f6f54] px-4 py-3 font-semibold text-white"
        >
          Payer 45 000 F
        </button>
        <script src={DEMO_PAYMENT_SRC} />
      </main>
    </div>
  );
}
