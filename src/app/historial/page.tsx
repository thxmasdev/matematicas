"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HistoryRepository } from "@/storage/repositories";
import type { ExerciseHistoryRecord } from "@/storage/types";

export default function HistorialPage() {
  const [history, setHistory] = useState<ExerciseHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "correct" | "incorrect">("all");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const repo = new HistoryRepository();
        const records = await repo.listAll();
        if (active) {
          // Orden descendente (más reciente primero)
          setHistory([...records].reverse());
        }
      } catch {
        // Fallback
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const total = history.length;
  const correctCount = history.filter((h) => h.correct).length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const totalSeconds = Math.round(history.reduce((acc, h) => acc + h.timeMs, 0) / 1000);
  const totalMinutes = Math.round(totalSeconds / 60);

  // Filtrado de la lista
  const filtered = history.filter((item) => {
    if (moduleFilter !== "all" && item.moduleId !== moduleFilter) return false;
    if (statusFilter === "correct" && !item.correct) return false;
    if (statusFilter === "incorrect" && item.correct) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="space-y-2">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
          ← Volver al inicio
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Historial y Estadísticas</h1>
            <p className="text-sm text-muted">
              Registro completo de tus ejercicios practicados en este dispositivo.
            </p>
          </div>
          <Link
            href="/configuracion"
            className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted hover:border-accent hover:text-foreground transition-colors"
          >
            Exportar datos (.json) ⚙️
          </Link>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Total Intentos</span>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{total}</p>
          <span className="text-xs text-muted">ejercicios realizados</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Aciertos</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-400">{correctCount}</p>
          <span className="text-xs text-muted">correctos</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Efectividad</span>
          <p className="mt-2 text-2xl font-extrabold text-accent">{accuracy}%</p>
          <span className="text-xs text-muted">tasa de éxito global</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Tiempo Total</span>
          <p className="mt-2 text-2xl font-extrabold text-accent-2">{totalMinutes} min</p>
          <span className="text-xs text-muted">{totalSeconds} segundos</span>
        </div>
      </div>

      {/* Filtros de la lista */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/60 p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted">Filtrar por Unidad:</span>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
          >
            <option value="all">Todas las unidades</option>
            <option value="1">Unidad 1: Lógica</option>
            <option value="2">Unidad 2: Conjuntos</option>
            <option value="3">Unidad 3: Números</option>
            <option value="4">Unidad 4: Funciones</option>
            <option value="5">Unidad 5: Álgebra</option>
            <option value="6">Unidad 6: Geometría</option>
            <option value="7">Unidad 7: Trigonometría</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-muted">Resultado:</span>
          {(["all", "correct", "incorrect"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-accent text-background font-bold"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              {s === "all" ? "Todos" : s === "correct" ? "Aciertos" : "Errores"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Intentos */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-12 text-center">
          <p className="text-base font-semibold text-muted">No hay registros que coincidan con los filtros.</p>
          <p className="mt-1 text-xs text-muted">
            {total === 0 ? "Comenzá a practicar en cualquiera de los módulos." : "Probá cambiando los filtros seleccionados."}
          </p>
          <Link
            href="/modulos/logica/practica"
            className="mt-4 inline-block rounded-xl bg-accent px-4 py-2 text-xs font-bold text-background"
          >
            Ir a practicar →
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
            const seconds = Math.round(item.timeMs / 1000);

            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-xs transition-colors hover:border-border/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm ${
                      item.correct ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    {item.correct ? "✓" : "✗"}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">Unidad {item.moduleId}</span>
                      <span className="text-muted">·</span>
                      <span className="font-mono text-muted">{item.templateId}</span>
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-accent-2">
                        {item.difficulty}
                      </span>
                    </div>
                    <div className="mt-1 text-muted">
                      <span>Respuesta: </span>
                      <span className="font-mono text-foreground/90 font-semibold">{item.userAnswer || "(vacío)"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 text-muted">
                  <span>{dateStr}</span>
                  <span className="text-[11px]">{seconds} seg</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
