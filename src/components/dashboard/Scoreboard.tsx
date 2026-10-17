"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HistoryRepository } from "@/storage/repositories";
import {
  computeScoreboard,
  DEFAULT_USER_NAME,
  getActiveUser,
} from "@/storage/scoreboard";
import type { UserScoreboardEntry } from "@/storage/types";
import { UserModal } from "@/components/user/UserModal";

interface ScoreboardProps {
  /** Si es true, limita la cantidad de filas a mostrar (ej. top 5 para el dashboard) */
  compact?: boolean;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ compact = false }) => {
  const [entries, setEntries] = useState<UserScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState<string>(DEFAULT_USER_NAME);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const historyRepo = new HistoryRepository();
      const [records, current] = await Promise.all([
        historyRepo.listAll(),
        getActiveUser(),
      ]);
      const scoreboard = computeScoreboard(records);
      setEntries(scoreboard);
      setActiveUser(current);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const historyRepo = new HistoryRepository();
        const [records, current] = await Promise.all([
          historyRepo.listAll(),
          getActiveUser(),
        ]);
        if (active) {
          const scoreboard = computeScoreboard(records);
          setEntries(scoreboard);
          setActiveUser(current);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    const handleUserChanged = () => {
      void loadData();
    };

    window.addEventListener("unse-user-changed", handleUserChanged);
    return () => {
      active = false;
      window.removeEventListener("unse-user-changed", handleUserChanged);
    };
  }, []);

  const displayList = compact ? entries.slice(0, 5) : entries;

  return (
    <>
      <div className="space-y-4">
        {/* Barra de cabecera del Scoreboard */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                Scoreboard de Estudiantes
              </h2>
            </div>
            <p className="text-xs text-muted">
              Puntos y efectividad de todas las personas que practican en este dispositivo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:border-accent hover:text-foreground transition-all shadow-sm"
            >
              <span>👤</span>
              <span>Practicando como: <strong className="text-foreground">{activeUser}</strong></span>
              <span className="text-accent underline text-[11px] ml-1">Cambiar</span>
            </button>
            {compact && entries.length > 5 && (
              <Link
                href="/scoreboard"
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-accent hover:bg-surface-2 transition-colors"
              >
                Ver todos ({entries.length}) →
              </Link>
            )}
          </div>
        </div>

        {/* Estado de carga */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface/50" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          /* Estado vacío */
          <div className="rounded-3xl border border-dashed border-border bg-surface/40 p-8 text-center sm:p-12">
            <span className="text-4xl">🎯</span>
            <h3 className="mt-3 text-base font-bold text-foreground">El Scoreboard está esperando tu primer récord</h3>
            <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
              Resolvé ejercicios en cualquiera de las 7 unidades para sumar puntos y aparecer en la tabla de posiciones.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/modulos/logica/practica"
                className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-background shadow-md shadow-accent/20 transition-transform hover:scale-105"
              >
                Comenzar a practicar ahora →
              </Link>
            </div>
          </div>
        ) : (
          /* Tabla / Podio de Posiciones */
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="divide-y divide-border/60">
              {displayList.map((entry, index) => {
                const rank = index + 1;
                const isCurrent = entry.userName === activeUser;
                const totalMinutes = Math.round((entry.totalTimeMs / 1000) / 60);

                // Medallas o posición
                let rankBadge = (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-muted">
                    #{rank}
                  </span>
                );
                if (rank === 1) {
                  rankBadge = (
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-sm font-bold text-amber-300 ring-1 ring-amber-500/40" title="1º Puesto">
                      🥇
                    </span>
                  );
                } else if (rank === 2) {
                  rankBadge = (
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-400/20 text-sm font-bold text-slate-300 ring-1 ring-slate-400/40" title="2º Puesto">
                      🥈
                    </span>
                  );
                } else if (rank === 3) {
                  rankBadge = (
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700/20 text-sm font-bold text-amber-600 ring-1 ring-amber-700/40" title="3º Puesto">
                      🥉
                    </span>
                  );
                }

                return (
                  <div
                    key={entry.userName}
                    className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                      isCurrent ? "bg-accent/5 hover:bg-accent/10" : "hover:bg-surface-2/40"
                    }`}
                  >
                    {/* Izquierda: Rango + Avatar + Nombre */}
                    <div className="flex items-center gap-3">
                      {rankBadge}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-sm font-extrabold text-background shadow-sm">
                        {entry.userName.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {entry.userName}
                          </span>
                          {isCurrent && (
                            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span>{entry.correctCount} aciertos de {entry.totalAttempts}</span>
                          <span>·</span>
                          <span>{entry.modulesPlayed.length} unidades exploradas</span>
                          {totalMinutes > 0 && (
                            <>
                              <span>·</span>
                              <span>{totalMinutes} min invertidos</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Derecha: Puntuación y Efectividad */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-border/40 pt-2 sm:border-t-0 sm:pt-0">
                      {/* Barra de Efectividad */}
                      <div className="w-24 text-right">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-muted">Acierto</span>
                          <span className="text-foreground">{entry.accuracy}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full bg-emerald-400 transition-all duration-300"
                            style={{ width: `${entry.accuracy}%` }}
                          />
                        </div>
                      </div>

                      {/* Score total */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-xs text-muted uppercase font-bold tracking-wider">Score</span>
                        <p className="text-lg font-extrabold text-accent">
                          {entry.score} <span className="text-xs font-normal text-muted">pts</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal para cambiar o registrar nombre */}
      {isModalOpen && (
        <UserModal
          forceOpen={true}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
