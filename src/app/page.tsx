import Link from "next/link";
import { getModules } from "@/content/loader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Scoreboard } from "@/components/dashboard/Scoreboard";

export default function HomePage() {
  const modules = getModules();

  return (
    <div className="space-y-12">
      {/* Sección Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 sm:p-10 shadow-lg backdrop-blur-sm">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-2">
            <span>🎓 Ingreso 2027</span>
            <span>·</span>
            <span>Cartilla Oficial FCEyT / UNSE</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Entrená tu ingreso a <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">Matemática</span>
          </h1>

          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Siete unidades completas con generación ilimitada de ejercicios verificados, pistas progresivas,
            resolución paso a paso y almacenamiento 100% privado en tu navegador.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/modulos/logica/practica"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-background shadow-md shadow-accent/25 transition-transform hover:scale-105 active:scale-95"
            >
              Comenzar con Unidad 1: Lógica →
            </Link>
            <Link
              href="/scoreboard"
              className="rounded-xl border border-border bg-surface-2 px-5 py-3 text-sm font-semibold text-amber-400/90 transition-colors hover:border-amber-400"
            >
              🏆 Scoreboard
            </Link>
            <Link
              href="/historial"
              className="rounded-xl border border-border bg-surface-2 px-5 py-3 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              📊 Mi Historial
            </Link>
          </div>
        </div>
      </section>

      {/* Resumen de Progreso Real */}
      <section aria-labelledby="progreso-title" className="space-y-4">
        <h2 id="progreso-title" className="text-lg font-bold text-foreground">
          Tu Progreso de Estudio
        </h2>
        <DashboardStats />
      </section>

      {/* Scoreboard de Estudiantes */}
      <section aria-labelledby="scoreboard-title" className="space-y-4">
        <Scoreboard compact={true} />
      </section>

      {/* Grid de los 7 Módulos de la Cartilla */}
      <section aria-labelledby="modulos-title" className="space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 id="modulos-title" className="text-xl font-bold text-foreground">
            Módulos de la Cartilla 2027
          </h2>
          <span className="text-xs text-muted">7 Unidades Oficiales</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div
              key={m.id}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:bg-surface-2/80 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-accent-2/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-accent-2">
                    Unidad {m.unit}
                  </span>
                  <span className="text-xs text-muted">{m.topics.length} temas</span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                  {m.title}
                </h3>

                <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-3">
                  {m.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-border/60 pt-4">
                <Link
                  href={`/modulos/${m.slug}/practica`}
                  className="flex-1 rounded-xl bg-accent px-3 py-2 text-center text-xs font-bold text-background transition-transform hover:scale-102"
                >
                  Practicar →
                </Link>
                <Link
                  href={`/modulos/${m.slug}`}
                  className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-center text-xs font-semibold text-muted hover:border-accent hover:text-foreground transition-colors"
                >
                  Teoría
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
