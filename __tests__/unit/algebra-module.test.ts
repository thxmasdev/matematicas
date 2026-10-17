import { describe, expect, it } from "vitest";
import { getTheoryBySlug } from "@/content/loader";
import { ALGEBRA_TEMPLATES } from "@/generators/algebra/templates";
import { generateVerified, getTemplate, templatesForModule } from "@/generators/registry";

const T = (id: string) => {
  const t = getTemplate(id);
  if (!t) throw new Error(`Plantilla no encontrada: ${id}`);
  return t;
};

describe("generación verificada de plantillas de álgebra", () => {
  const SEEDS = 50;

  for (const template of ALGEBRA_TEMPLATES) {
    for (const d of template.difficulties) {
      it(`${template.id} [${d}]: ${SEEDS} semillas sin descartes y con verificación aprobada`, () => {
        const fps = new Set<string>();
        for (let i = 0; i < SEEDS; i++) {
          const { exercise, discarded, discardReasons } = generateVerified(template, `alg-s${i}`, d);
          expect(discarded, discardReasons.join("; ")).toBe(0);
          expect(template.check(exercise, exercise.correctAnswer).accepted).toBe(true);
          expect(template.verify(exercise)).toEqual([]);
          expect(exercise.hints.length).toBeGreaterThanOrEqual(1);
          expect(exercise.steps.length).toBeGreaterThanOrEqual(1);
          expect(exercise.fingerprint.startsWith(`${template.id}:`)).toBe(true);
          fps.add(exercise.fingerprint);
        }
        expect(fps.size).toBeGreaterThan(1);
      });
    }
  }

  it("módulo 5 tiene plantillas para sus temas principales", () => {
    const templates = templatesForModule(5);
    expect(templates.length).toBeGreaterThanOrEqual(4);
  });
});

describe("corrección y grading de respuestas de álgebra", () => {
  it("operaciones-polinomios valida la opción reducida correcta", () => {
    const t = T("algebra.operaciones-polinomios");
    const { exercise } = generateVerified(t, "seed-poly", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "otra cosa").accepted).toBe(false);
  });

  it("teorema del resto valida el resto entero", () => {
    const t = T("algebra.resto");
    const { exercise } = generateVerified(t, "seed-resto", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "999").accepted).toBe(false);
  });

  it("factorizacion valida la expresión factorizada", () => {
    const t = T("algebra.factorizacion");
    const { exercise } = generateVerified(t, "seed-fact", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "(x - 999)^2").accepted).toBe(false);
  });

  it("fracciones-algebraicas valida la simplificación", () => {
    const t = T("algebra.fracciones-algebraicas");
    const { exercise } = generateVerified(t, "seed-frac-alg", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "x + 999").accepted).toBe(false);
  });
});

describe("contenido teórico del módulo 5", () => {
  it("carga la teoría de expresiones-algebraicas conforme al esquema", () => {
    const theory = getTheoryBySlug("expresiones-algebraicas");
    expect(theory).not.toBeNull();
    if (!theory) return;
    expect(theory.moduleId).toBe("module-05-algebra");
    expect(theory.sections.length).toBeGreaterThanOrEqual(4);
    for (const sec of theory.sections) {
      expect(sec.content.length).toBeGreaterThan(100);
      if (sec.examples) {
        expect(sec.examples.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
