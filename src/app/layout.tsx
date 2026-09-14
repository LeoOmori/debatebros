import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/atkinson-hyperlegible-next/400.css";
import "@fontsource/atkinson-hyperlegible-next/700.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "debatebros — ideias entram em confronto",
  description: "Debata ideias com simulações educativas de grandes pensadores.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
