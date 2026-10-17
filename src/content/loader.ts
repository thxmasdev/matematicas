import { parseModule, parseTheory } from "./schemas";
import { AppError } from "@/lib/errors";
import type { MathModule } from "@/types/module";
import type { ModuleTheory } from "@/types/theory";

import m1 from "./modules/module-01-logic.json";
import m2 from "./modules/module-02-sets.json";
import m3 from "./modules/module-03-number-sets.json";
import m4 from "./modules/module-04-relations-functions.json";
import m5 from "./modules/module-05-algebra.json";
import m6 from "./modules/module-06-geometry.json";
import m7 from "./modules/module-07-trigonometry.json";

import t1 from "./theory/logic.json";
import t2 from "./theory/sets.json";
import t3 from "./theory/numbers.json";
import t4 from "./theory/functions.json";
import t5 from "./theory/algebra.json";
import t6 from "./theory/geometry.json";
import t7 from "./theory/trigonometry.json";

const RAW_MODULES: readonly unknown[] = [m1, m2, m3, m4, m5, m6, m7];
const RAW_THEORIES: Record<string, unknown> = {
  logica: t1,
  conjuntos: t2,
  "conjuntos-numericos": t3,
  "relaciones-y-funciones": t4,
  "expresiones-algebraicas": t5,
  geometria: t6,
  trigonometria: t7,
};


let cache: MathModule[] | null = null;
const theoryCache = new Map<string, ModuleTheory>();

/** Devuelve los 7 módulos validados y ordenados. Falla de forma explícita si hay contenido inválido. */
export function getModules(): MathModule[] {
  if (!cache) {
    const parsed = RAW_MODULES.map(parseModule).sort((a, b) => a.order - b.order);
    const slugs = new Set(parsed.map((m) => m.slug));
    if (slugs.size !== parsed.length) {
      throw new AppError("CONTENT_INVALID", "Hay slugs de módulo duplicados");
    }
    cache = parsed;
  }
  return cache;
}

export function getModuleBySlug(slug: string): MathModule {
  const found = getModules().find((m) => m.slug === slug);
  if (!found) throw new AppError("CONTENT_NOT_FOUND", `Módulo no encontrado: ${slug}`);
  return found;
}

export function getTheoryBySlug(slug: string): ModuleTheory | null {
  if (theoryCache.has(slug)) return theoryCache.get(slug)!;
  const raw = RAW_THEORIES[slug];
  if (!raw) return null;
  const parsed = parseTheory(raw);
  theoryCache.set(slug, parsed);
  return parsed;
}

