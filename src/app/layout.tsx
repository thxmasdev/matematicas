import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Matemática UNSE 2027 — Práctica de ingreso",
  description:
    "Plataforma de práctica de Matemática para el ingreso 2027: siete módulos, ejercicios generados dinámicamente y progreso guardado en tu dispositivo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-border px-4 py-5 text-xs text-muted">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-center sm:text-left">
              Basado en la Cartilla de Ingreso Matemática 2027. Tu progreso se guarda solo en este dispositivo.
            </p>
            <div className="flex items-center gap-1.5 text-muted">
              <span>Desarrollado por</span>
              <a
                href="https://github.com/thxmasdev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                title="GitHub de thxmasdev"
              >
                <svg
                  className="h-4 w-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>thxmasdev</span>
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
