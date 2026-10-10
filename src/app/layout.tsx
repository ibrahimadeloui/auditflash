import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuditFlash — cybersécurité simplifiée pour les PME",
  description:
    "Diagnostic de configuration, score métier, simulation de correctif et rapport dirigeant pour les boutiques et les TPE.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${outfit.variable} ${syne.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-full">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
