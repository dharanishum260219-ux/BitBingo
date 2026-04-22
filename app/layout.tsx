import type { Metadata } from "next";
import Link from "next/link";
import { Chakra_Petch, Pirata_One } from "next/font/google";
import "./globals.css";

const displayFont = Pirata_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const uiFont = Chakra_Petch({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "BitBingo | Quest Arena",
  description:
    "A live coding arena with scoreboard battles, challenge tiles, and instant proof updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${uiFont.variable} h-full`}
    >
      <body className="min-h-full game-bg text-[var(--ink-900)]">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <span className="ambient-glow ambient-glow-a" />
          <span className="ambient-glow ambient-glow-b" />
        </div>

        <Link
          href="/admin"
          aria-label="Admin settings"
          title="Admin settings"
          className="icon-orb fixed right-4 top-4 z-50"
        >
          CTRL
        </Link>

        <div className="min-h-full flex flex-col">{children}</div>
      </body>
    </html>
  );
}
