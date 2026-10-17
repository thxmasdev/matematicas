"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HistoryRepository } from "@/storage/repositories";
import type { ExerciseHistoryRecord } from "@/storage/types";

export const DashboardStats: React.FC = () => {
  const [history, setHistory] = useState<ExerciseHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const histRepo = new HistoryRepository();
        const histList = await histRepo.listAll();
        if (active) {
          setHistory(histList);
        }
      } catch {
        // Fallback en caso de que IndexedDB esté bloqueado o vacío
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const totalAttempts = history.length;
  const totalCorrect = history.filter((h) => h.correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  // Cantidad de módulos donde el usuario ha practicado al menos 1 ejercicio
  const activeModules = new Set(history.map((h) => h.moduleId)).size;

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface/50 p-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Tarjeta 1: Aciertos / Porcentaje */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Efectividad</span>
            <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
              {accuracy}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-foreground">{accuracy}%</span>
            <span className="text-xs text-muted">de aciertos</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-500"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        {/* Tarjeta 2: Total Resueltos */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Ejercicios Resueltos</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-400">{totalCorrect}</span>
            <span className="text-xs text-muted">/ {totalAttempts} intentos</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            {totalAttempts === 0 ? "Comenzá tu primera práctica" : "Guardado en tu equipo"}
          </p>
        </div>

        {/* Tarjeta 3: Módulos practicados */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Módulos en Curso</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-accent-2">{activeModules}</span>
            <span className="text-xs text-muted">de 7 unidades</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            {activeModules === 7 ? "¡Completaste todos los temas!" : "7 módulos en la cartilla"}
          </p>
        </div>

        {/* Tarjeta 4: Acceso a Historial / Backup */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface-2/60 p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Tu Progreso Local</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/historial"
              className="rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-foreground border border-border/80 hover:border-accent hover:text-accent transition-colors"
            >
              Ver Historial →
            </Link>
            <Link
              href="/configuracion"
              className="rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              Copias ⚙️
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
