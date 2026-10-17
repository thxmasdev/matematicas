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
        <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted">
          Basado en la Cartilla de Ingreso Matemática 2027. Tu progreso se guarda solo en este dispositivo.
        </footer>
      </body>
    </html>
  );
}
