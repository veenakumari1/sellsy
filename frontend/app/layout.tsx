import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
