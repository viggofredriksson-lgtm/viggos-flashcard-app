import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flashcards",
  description: "AI-drivna flashcards med spaced repetition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className={`${geistSans.variable} antialiased`}>
        <nav className="border-b border-cream-dark/60 backdrop-blur-sm bg-cream/70 sticky top-0 z-10">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-lg font-bold text-green"
            >
              Flashcards
            </Link>
            <div className="flex gap-1 rounded-full bg-white/60 border border-cream-dark/60 px-1 py-1 text-sm">
              <Link
                href="/study"
                className="rounded-full px-4 py-1.5 text-gray transition-all hover:bg-green-light hover:text-green"
              >
                Plugga
              </Link>
              <Link
                href="/decks"
                className="rounded-full px-4 py-1.5 text-gray transition-all hover:bg-green-light hover:text-green"
              >
                Decks
              </Link>
              <Link
                href="/import"
                className="rounded-full px-4 py-1.5 text-gray transition-all hover:bg-green-light hover:text-green"
              >
                Importera
              </Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
