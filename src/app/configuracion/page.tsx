"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { getDb } from "@/storage/database";
import {
  deleteAllData,
  exportBackup,
  importBackup,
  serializeBackup,
} from "@/storage/backup";
import { AppError } from "@/lib/errors";

export default function ConfiguracionPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Exportar copia de seguridad
  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const db = getDb();
      const backup = await exportBackup(db);
      const jsonStr = serializeBackup(backup);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `matematicas-unse-copia-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({
        type: "success",
        text: `Copia exportada exitosamente con ${backup.history.length} ejercicios registrados.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: `Error al exportar: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setExporting(false);
    }
  };

  // 2. Importar copia de seguridad
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);
    try {
      const text = await file.text();
      const summary = await importBackup(text, "replace");
      setMessage({
        type: "success",
        text: `¡Copia restaurada con éxito! Se importaron ${summary.historyAdded} ejercicios.`,
      });
    } catch (err) {
      const msg = err instanceof AppError ? err.message : "El archivo no tiene el formato de copia válido.";
      setMessage({
        type: "error",
        text: `Error al restaurar: ${msg}`,
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 3. Borrado completo de datos
  const handleDeleteAll = async () => {
    if (deleteInput !== "BORRAR") return;
    try {
      const db = getDb();
      await deleteAllData("BORRAR", db);
      setConfirmDelete(false);
      setDeleteInput("");
      setMessage({
        type: "success",
        text: "Todos los datos y el progreso local han sido eliminados de este navegador.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: `Error al borrar: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="space-y-2">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
          ← Volver al inicio
        </Link>
        <h1 className="text-3xl font-extrabold text-foreground">Configuración y Datos</h1>
        <p className="text-sm text-muted">
          Gestión de privacidad, copias de seguridad descargables y almacenamiento local.
        </p>
      </div>

      {/* Alerta de notificación */}
      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm font-medium ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
              : "border-rose-500/30 bg-rose-950/20 text-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Sección 1: Copias de Seguridad */}
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="border-b border-border/80 pb-3">
          <h2 className="text-lg font-bold text-foreground">Copias de Seguridad (Exportar / Importar)</h2>
          <p className="text-xs text-muted">
            Dado que la plataforma no utiliza servidores ni recopila tus datos, tu historial permanece
            en este navegador. Podés descargar una copia para llevar tu progreso a otro dispositivo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
          {/* Exportar */}
          <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface-2/40 p-4">
            <div>
              <h3 className="font-bold text-foreground text-sm">Descargar mi progreso</h3>
              <p className="mt-1 text-xs text-muted">
                Genera un archivo JSON con todos tus ejercicios resueltos, respuestas y estadísticas.
              </p>
            </div>
            <button
              type="button"
              disabled={exporting}
              onClick={handleExport}
              className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-background shadow-md shadow-accent/20 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              {exporting ? "Generando copia..." : "Descargar copia (.json)"}
            </button>
          </div>

          {/* Importar */}
          <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface-2/40 p-4">
            <div>
              <h3 className="font-bold text-foreground text-sm">Restaurar copia</h3>
              <p className="mt-1 text-xs text-muted">
                Cargá un archivo de respaldo previamente descargado para recuperar tu historial.
              </p>
            </div>
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                disabled={importing}
                className="hidden"
                id="file-backup-input"
              />
              <button
                type="button"
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-foreground hover:border-accent transition-colors disabled:opacity-60"
              >
                {importing ? "Validando copia..." : "Seleccionar archivo JSON..."}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 2: Información del Sistema */}
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-6 text-xs text-muted">
        <h2 className="text-sm font-bold text-foreground">Información de Almacenamiento</h2>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Tecnología de almacenamiento: <strong className="text-foreground">IndexedDB (Dexie.js v4)</strong></li>
          <li>Esquema de base de datos: <strong className="text-foreground">Versión 1</strong></li>
          <li>Exportación web: <strong className="text-foreground">Next.js Static Export 100% Offline</strong></li>
          <li>Privacidad: <strong className="text-foreground">Sin telemetría, sin cookies de rastreo, sin cuentas remotas</strong></li>
        </ul>
      </section>

      {/* Sección 3: Zona de Peligro (Borrar Datos) */}
      <section className="space-y-4 rounded-2xl border border-rose-500/30 bg-rose-950/10 p-6">
        <div className="border-b border-rose-500/20 pb-2">
          <h2 className="text-base font-bold text-rose-300">Zona de Peligro</h2>
          <p className="text-xs text-muted">
            Elimina irreversiblemente todo el historial de ejercicios, progreso acumulado y sesiones de este dispositivo.
          </p>
        </div>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            Borrar todo mi progreso...
          </button>
        ) : (
          <div className="space-y-3 rounded-xl border border-rose-500/40 bg-surface p-4">
            <p className="text-xs font-semibold text-rose-200">
              ¿Estás seguro? Para confirmar, escribí la palabra <span className="font-mono font-bold text-foreground">BORRAR</span> a continuación:
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Escribí BORRAR"
                className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-mono text-foreground focus:border-rose-400 focus:outline-none"
              />
              <button
                type="button"
                disabled={deleteInput !== "BORRAR"}
                onClick={handleDeleteAll}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white transition-opacity disabled:opacity-40"
              >
                Confirmar y borrar todo
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteInput("");
                }}
                className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
