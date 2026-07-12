import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  Hanken_Grotesk,
  Space_Grotesk,
} from "next/font/google";

import type { Metadata } from "next";

import "./globals.css";

// Default theme fonts (Geist)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Warm theme fonts (Design handoff)
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "this or that",
  description: "Two options. One winner. You decide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVars = [
    geistSans.variable,
    geistMono.variable,
    bricolage.variable,
    hanken.variable,
    spaceGrotesk.variable,
  ].join(" ");

  return (
    <html
      lang="en"
      data-theme="warm"
      className={`${fontVars} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
