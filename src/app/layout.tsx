import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import PWARegister from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"] });

// 1. Nastavení mobilního zobrazení (viewportu) – zabrání nechtěnému zoomování při swipování karet
export const viewport: Viewport = {
  themeColor: "#dc2626", // Hlavní červená barva CineVibe
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 2. Tvoje stávající metadata rozšířená o PWA konfiguraci
export const metadata: Metadata = {
  title: "CineVibe | Kde sledovat filmy",
  description: "Tvůj prémiový průvodce streamovacími službami.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CineVibe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className="bg-slate-950 text-slate-50">
      <head>
        {/* iOS specifická ikona pro uložení na plochu */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        {/* Registrace Service Workera pro PWA na pozadí */}
        <PWARegister />
        <Header />
        {children}
      </body>
    </html>
  );
}