import React from "react";
import Link from "next/link";
import { Scoreboard } from "@/components/dashboard/Scoreboard";

export default function ScoreboardPage() {
  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="space-y-2">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
          ← Volver al inicio
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Scoreboard de Aspirantes</h1>
            <p className="text-sm text-muted">
              Tabla de posiciones local con todos los usuarios que han practicado en este equipo.
            </p>
          </div>
          <Link
            href="/modulos/logica/practica"
            className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-background shadow-md shadow-accent/20 transition-transform hover:scale-105"
          >
            Sumar puntos practicando 🚀
          </Link>
        </div>
      </div>

      {/* Reglas de puntuación */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-emerald-400">Nivel Fácil</span>
          <p className="mt-1 text-2xl font-extrabold text-foreground">+10 <span className="text-xs font-normal text-muted">pts</span></p>
          <span className="text-[11px] text-muted">por respuesta correcta</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-sky-400">Nivel Intermedio</span>
          <p className="mt-1 text-2xl font-extrabold text-foreground">+25 <span className="text-xs font-normal text-muted">pts</span></p>
          <span className="text-[11px] text-muted">por respuesta correcta</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-amber-400">Nivel Difícil</span>
          <p className="mt-1 text-2xl font-extrabold text-foreground">+50 <span className="text-xs font-normal text-muted">pts</span></p>
          <span className="text-[11px] text-muted">por respuesta correcta</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-rose-400">Nivel Avanzado</span>
          <p className="mt-1 text-2xl font-extrabold text-foreground">+100 <span className="text-xs font-normal text-muted">pts</span></p>
          <span className="text-[11px] text-muted">por respuesta correcta</span>
        </div>
      </div>

      {/* Scoreboard Principal */}
      <section className="rounded-3xl border border-border bg-surface/60 p-6 shadow-sm">
        <Scoreboard compact={false} />
      </section>

      {/* Explicación de almacenamiento y exportación */}
      <div className="rounded-2xl border border-border bg-surface p-6 text-xs text-muted space-y-2">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <span>💾</span> ¿Cómo se guardan estos datos?
        </h3>
        <p>
          Todos los ejercicios, puntos y nombres están almacenados en la base de datos interna de tu navegador (<strong>IndexedDB</strong>) bajo la tabla de historial. Si varias personas usan esta misma máquina o navegador, cada una puede seleccionar su nombre para registrar sus intentos por separado.
        </p>
        <p>
          Podés descargar una copia de seguridad en formato <strong>.json</strong> desde la sección de{" "}
          <Link href="/configuracion" className="text-accent underline font-semibold">
            Configuración
          </Link>{" "}
          para respaldar o transferir este Scoreboard a otro dispositivo.
        </p>
      </div>
    </div>
  );
}
