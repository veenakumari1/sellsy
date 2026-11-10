import type { Metadata } from "next";
import { Fraunces, Inter_Tight, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sellsy | AI-Powered E-commerce Intelligence & Growth Platform",
  description: "Understand your store, predict sales trends, segment customer cohorts, and make smarter data-driven decisions with specialized AI agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${interTight.variable} ${plexMono.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}