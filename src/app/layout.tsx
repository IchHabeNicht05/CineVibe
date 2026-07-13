import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CineVibe | Kde sledovat filmy",
  description: "Tvůj prémiový průvodce streamovacími službami.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className="bg-slate-950 text-slate-50">
      <body className={inter.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}