"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getModules } from "@/content/loader";
import { DEFAULT_USER_NAME, getActiveUser } from "@/storage/scoreboard";
import { UserModal } from "@/components/user/UserModal";

export function Header() {
  const modules = getModules();
  const [userName, setUserName] = useState<string>(DEFAULT_USER_NAME);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carga inicial y listener reactivo de usuario
  useEffect(() => {
    let active = true;
    void (async () => {
      const current = await getActiveUser();
      if (active) setUserName(current);
    })();

    const handleUserChanged = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) setUserName(customEvent.detail);
    };

    window.addEventListener("unse-user-changed", handleUserChanged);
    return () => {
      active = false;
      window.removeEventListener("unse-user-changed", handleUserChanged);
    };
  }, []);

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  // Cierra el menú al hacer clic fuera del dropdown o al presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Bloquea el scroll de fondo cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Marca / Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-95"
            onClick={closeMenus}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-lg font-black text-accent group-hover:scale-105 transition-transform shadow-xs">
              ∑
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground sm:text-lg flex items-center gap-2">
                Matemática UNSE
                <span className="hidden sm:inline-block rounded-full bg-accent/10 border border-accent/25 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  2027
                </span>
              </span>
              <span className="text-[10px] text-muted -mt-0.5 hidden xs:inline-block">
                Cartilla de Ingreso FCEyT
              </span>
            </div>
          </Link>

          {/* Navegación Desktop (md:flex) */}
          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1.5 text-sm">
            {/* Dropdown de Módulos */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isDropdownOpen
                    ? "bg-surface-2 text-foreground"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span>Módulos</span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Panel flotante del Dropdown de Módulos */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-border bg-surface/95 backdrop-blur-xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-border/60">
                    Unidades de la Cartilla
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {modules.map((m) => (
                      <Link
                        key={m.id}
                        href={`/modulos/${m.slug}/`}
                        onClick={closeMenus}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-foreground group"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 border border-accent/20 text-xs font-bold text-accent group-hover:bg-accent group-hover:text-background transition-colors">
                          {m.unit}
                        </span>
                        <span className="font-medium truncate">{m.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Enlaces principales */}
            <Link
              href="/scoreboard/"
              onClick={closeMenus}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-amber-400/90 transition hover:bg-surface-2 hover:text-amber-300"
              title="Tabla de posiciones y puntajes"
            >
              <span>🏆</span>
              <span>Scoreboard</span>
            </Link>

            <Link
              href="/historial/"
              onClick={closeMenus}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"
              title="Historial de ejercicios y progreso"
            >
              <span>📊</span>
              <span>Historial</span>
            </Link>

            <Link
              href="/configuracion/"
              onClick={closeMenus}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"
              title="Ajustes y copias de seguridad"
            >
              <span>⚙️</span>
              <span>Ajustes</span>
            </Link>

            {/* Divisor vertical */}
            <div className="mx-1 h-5 w-px bg-border/80" />

            {/* Botón de usuario activo */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-foreground hover:bg-surface-2 group shadow-xs"
              title="Cambiar usuario o perfil"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="max-w-[120px] truncate">{userName}</span>
            </button>
          </nav>

          {/* Botones Mobile (md:hidden) */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Botón compacto de usuario en mobile */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-foreground transition-colors"
              title="Cambiar usuario"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="max-w-[80px] truncate text-[11px] font-semibold">{userName}</span>
            </button>

            {/* Botón Hamburguesa */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Menú Mobile Desplegable */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-30 md:hidden flex flex-col">
          {/* Backdrop oscurecido */}
          <div
            className="fixed inset-0 top-16 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Contenedor del Menú */}
          <div className="relative z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-surface/98 backdrop-blur-xl px-4 py-5 shadow-2xl">
            {/* Tarjeta de usuario activo */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-surface-2/60 p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-sm">
                  👤
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted">Perfil de práctica</div>
                  <div className="text-sm font-semibold text-foreground truncate">{userName}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsModalOpen(true);
                }}
                className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted hover:border-accent hover:text-foreground transition-colors"
              >
                Cambiar
              </button>
            </div>

            {/* Accesos rápidos */}
            <div className="mb-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Herramientas y progreso
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/scoreboard/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-surface p-3 text-center transition hover:border-amber-400/50 hover:bg-surface-2"
                >
                  <span className="text-xl">🏆</span>
                  <span className="mt-1 text-xs font-semibold text-amber-300">Scoreboard</span>
                </Link>
                <Link
                  href="/historial/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-surface p-3 text-center transition hover:border-accent/50 hover:bg-surface-2"
                >
                  <span className="text-xl">📊</span>
                  <span className="mt-1 text-xs font-semibold text-muted hover:text-foreground">Historial</span>
                </Link>
                <Link
                  href="/configuracion/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-surface p-3 text-center transition hover:border-accent/50 hover:bg-surface-2"
                >
                  <span className="text-xl">⚙️</span>
                  <span className="mt-1 text-xs font-semibold text-muted hover:text-foreground">Ajustes</span>
                </Link>
              </div>
            </div>

            {/* Lista de Módulos */}
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Módulos de la Cartilla
              </div>
              <div className="flex flex-col gap-1.5">
                {modules.map((m) => (
                  <Link
                    key={m.id}
                    href={`/modulos/${m.slug}/`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-surface/80 p-3 text-sm transition hover:border-accent hover:bg-surface-2 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 border border-accent/25 text-xs font-bold text-accent group-hover:bg-accent group-hover:text-background transition-colors">
                        {m.unit}
                      </span>
                      <span className="font-medium text-foreground truncate">{m.title}</span>
                    </div>
                    <svg
                      className="h-4 w-4 shrink-0 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de usuario */}
      <UserModal
        forceOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
