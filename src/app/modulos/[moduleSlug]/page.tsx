import Link from "next/link";
import { getModules, getModuleBySlug, getTheoryBySlug } from "@/content/loader";
import { MathRenderer } from "@/components/math/MathRenderer";

export function generateStaticParams() {
  return getModules().map((m) => ({ moduleSlug: m.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = await params;
  const m = getModuleBySlug(moduleSlug);
  return { title: `${m.title} — Matemática UNSE 2027`, description: m.description };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const m = getModuleBySlug(moduleSlug);
  const theory = getTheoryBySlug(moduleSlug);

  return (
    <article className="space-y-10">
      {/* Navegación y cabecera */}
      <div className="space-y-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
          ← Volver al panel principal
        </Link>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-2">
              Unidad {m.unit}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{m.title}</h1>
            <p className="max-w-2xl text-base text-muted">{m.description}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2.5 sm:flex-col">
            <Link
              href={`/modulos/${m.slug}/practica`}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-bold text-background shadow-md shadow-accent/20 transition-transform hover:scale-105 active:scale-95"
            >
              Comenzar Práctica Guiada →
            </Link>
          </div>
        </header>
      </div>

      {/* Temas del módulo */}
      <section aria-labelledby="temas-title" className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 id="temas-title" className="text-lg font-bold text-foreground">
            Temas de la Unidad
          </h2>
          <span className="text-xs text-muted">{m.topics.length} temas clave</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {m.topics.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold text-foreground">{t.title}</h3>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {t.subtopics.map((s) => (
                  <li key={s} className="rounded-md bg-surface-2 px-2.5 py-1 text-xs text-muted">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Contenido Teórico y Ejemplos Resueltos */}
      {theory && theory.sections.length > 0 && (
        <section aria-labelledby="teoria-title" className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 id="teoria-title" className="text-lg font-bold text-foreground">
              Teoría y Ejemplos de la Cartilla
            </h2>
            <span className="text-xs text-muted">{theory.sections.length} secciones explicativas</span>
          </div>

          <div className="space-y-6">
            {theory.sections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-accent-2">{section.title}</h3>

                <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/90">
                  <MathRenderer content={section.content} />
                </div>

                {/* Callouts informativos */}
                {section.callouts && section.callouts.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    {section.callouts.map((callout, cIdx) => (
                      <div
                        key={cIdx}
                        className={`rounded-xl border p-4 text-xs leading-relaxed ${
                          callout.type === "warning"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                            : callout.type === "tip"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : "border-accent/30 bg-accent/10 text-accent-2"
                        }`}
                      >
                        {callout.title && <h4 className="mb-1 font-bold text-foreground">{callout.title}</h4>}
                        <MathRenderer content={callout.content} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Ejemplos resueltos */}
                {section.examples && section.examples.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Ejemplos resueltos</h4>
                    {section.examples.map((ex, eIdx) => (
                      <div key={eIdx} className="rounded-xl border border-border/80 bg-surface-2/60 p-4 text-xs">
                        <h5 className="font-semibold text-foreground">{ex.title}</h5>
                        <div className="mt-1 text-muted">
                          <MathRenderer content={ex.statement} />
                        </div>
                        <div className="mt-2.5 rounded-lg border border-border/60 bg-surface/80 p-2.5 text-foreground/90 font-mono">
                          <span className="font-semibold text-accent-2 not-italic">Solución: </span>
                          <MathRenderer content={ex.solution} />
                        </div>
                        {ex.explanation && (
                          <p className="mt-1.5 text-muted">
                            <MathRenderer content={ex.explanation} />
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Link
              href={`/modulos/${m.slug}/practica`}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-background shadow-lg shadow-accent/25 transition-transform hover:scale-105 active:scale-95"
            >
              Practicar los ejercicios de esta unidad →
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
