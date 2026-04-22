import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BitBingo – Explorer's Chart",
  description:
    "A real-time event management web application for coding competitions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Google Fonts: Playfair Display (serif) + Caveat (cursive/handwritten) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Caveat:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col paper-bg text-stone-800">
        {children}
      </body>
    </html>
  );
}
