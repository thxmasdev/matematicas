"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getModules } from "@/content/loader";
import { DEFAULT_USER_NAME, getActiveUser } from "@/storage/scoreboard";
import { UserModal } from "@/components/user/UserModal";

export function Header() {
  const modules = getModules();
  const [userName, setUserName] = useState<string>(DEFAULT_USER_NAME);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            <span className="text-accent">∑</span> Matemática UNSE 2027
          </Link>
          <nav aria-label="Principal" className="flex flex-wrap items-center gap-1 text-sm">
            {modules.map((m) => (
              <Link
                key={m.id}
                href={`/modulos/${m.slug}/`}
                className="rounded-md px-2 py-1 text-muted transition hover:bg-surface-2 hover:text-foreground"
              >
                {m.unit}. {m.title.split(" ").slice(0, 2).join(" ")}
              </Link>
            ))}
            <div className="flex items-center gap-1 border-l border-border pl-2 text-xs font-medium">
              <Link
                href="/scoreboard"
                className="rounded-lg px-2.5 py-1 text-amber-400/90 hover:text-amber-300 transition hover:bg-surface-2 font-semibold"
                title="Scoreboard y tabla de posiciones"
              >
                🏆 Scoreboard
              </Link>
              <Link
                href="/historial"
                className="rounded-lg px-2.5 py-1 text-muted transition hover:bg-surface-2 hover:text-foreground"
                title="Historial de práctica y estadísticas"
              >
                📊 Historial
              </Link>
              <Link
                href="/configuracion"
                className="rounded-lg px-2.5 py-1 text-muted transition hover:bg-surface-2 hover:text-foreground"
                title="Configuración y copias de seguridad"
              >
                ⚙️ Ajustes
              </Link>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="ml-1 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-muted hover:border-accent hover:text-foreground transition-colors"
                title="Cambiar de usuario"
              >
                👤 {userName}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Modal de bienvenida al ingresar por primera vez o al hacer click en el usuario */}
      <UserModal
        forceOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
