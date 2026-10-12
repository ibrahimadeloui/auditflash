import type { Metadata } from "next";
import { JetBrains_Mono, Outfit, Rajdhani } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "WB Audiflash — plateforme d'audit de sécurité web",
  description:
    "Diagnostic de configuration, score métier, simulation de correctif et rapport dirigeant pour les boutiques et les TPE.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${outfit.variable} ${rajdhani.variable} ${mono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
