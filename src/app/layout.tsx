import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rising Hope — A global charity for the vulnerable",
  description:
    "Rising Hope funds orphan care, widow livelihoods and hospital recovery through registered community micro-banks. Give small. Change everything.",
  keywords: ["charity", "orphans", "widows", "hospital care", "donations", "microbank", "Rising Hope"],
  openGraph: {
    title: "Rising Hope — Small gifts. Rising hope.",
    description: "Transparent, community-led giving for orphans, widows and the hospitalised.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
