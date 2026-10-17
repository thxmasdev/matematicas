"use client";

import React, { useEffect, useState } from "react";
import {
  DEFAULT_USER_NAME,
  getActiveUser,
  hasPromptedUsername,
  purgePreviousStorageIfNeeded,
  setActiveUser,
} from "@/storage/scoreboard";

interface UserModalProps {
  /** Si es true, fuerza la apertura del modal (ej: desde el botón Cambiar Usuario) */
  forceOpen?: boolean;
  onClose?: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ forceOpen, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputName, setInputName] = useState("");
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      // 1. Purga de almacenamiento anterior si no se había purgado
      await purgePreviousStorageIfNeeded();

      const activeUser = await getActiveUser();
      const prompted = hasPromptedUsername();

      if (!active) return;
      setInputName(activeUser === DEFAULT_USER_NAME ? "" : activeUser);
      setIsFirstVisit(!prompted);

      if (forceOpen || !prompted) {
        setIsOpen(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [forceOpen]);

  const handleSave = async (nameToSave: string) => {
    const finalName = await setActiveUser(nameToSave);
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("unse-user-changed", { detail: finalName }));
    }
    if (onClose) onClose();
  };

  const handleClose = () => {
    if (isFirstVisit) {
      void handleSave(DEFAULT_USER_NAME);
    } else {
      setIsOpen(false);
      if (onClose) onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-accent-2/20 blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          {/* Cabecera */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-2">
                <span>🎓 Matemática UNSE 2027</span>
                <span>·</span>
                <span>Bienvenido</span>
              </div>
              <h2 id="user-modal-title" className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
                ¿Cómo querés ingresar?
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Elegí si preferís registrar tu nombre para guardar tus récords en el Scoreboard o continuar como usuario anónimo.
              </p>
            </div>
            {!isFirstVisit && (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl p-1.5 text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            )}
          </div>

          {/* Opciones */}
          <div className="space-y-4">
            {/* Opción 1: Ingresar con Nombre */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputName.trim().length > 0) {
                  void handleSave(inputName);
                }
              }}
              className="rounded-2xl border border-border bg-surface-2/60 p-4 space-y-3 transition-colors focus-within:border-accent"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">✍️</span>
                <label htmlFor="user-name-input" className="text-sm font-bold text-foreground">
                  Ingresar con mi nombre o alias
                </label>
              </div>
              <p className="text-xs text-muted">
                Tu progreso y puntos se registrarán con este nombre en la tabla de posiciones local.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  id="user-name-input"
                  type="text"
                  autoFocus={isFirstVisit}
                  maxLength={40}
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Ej: Franco, Sofía, Thomas..."
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={inputName.trim().length === 0}
                  className="rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-background shadow-md shadow-accent/25 transition-all hover:scale-102 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Continuar con mi nombre →
                </button>
              </div>
            </form>

            {/* Separador visual */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">O bien</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            {/* Opción 2: Continuar como Anónimo */}
            <button
              type="button"
              onClick={() => void handleSave(DEFAULT_USER_NAME)}
              className="w-full rounded-2xl border border-border bg-surface hover:bg-surface-2/80 p-4 text-left transition-all hover:border-accent/60 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-lg group-hover:scale-105 transition-transform">
                    👤
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                      Continuar como Usuario Anónimo
                    </h3>
                    <p className="text-xs text-muted">
                      Practicá sin registrar tu nombre. Podrás cambiar tu nombre más tarde en cualquier momento.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all">
                  →
                </span>
              </div>
            </button>
          </div>

          {/* Información de privacidad */}
          <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3 text-[11px] text-muted flex items-start gap-2">
            <span className="text-accent">🔒</span>
            <span>
              100% privado y seguro: todos tus datos permanecen en este navegador mediante IndexedDB. Sin registros remotos ni cuentas externas.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
