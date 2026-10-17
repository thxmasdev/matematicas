import { describe, expect, it } from "vitest";
import { getTheoryBySlug } from "@/content/loader";
import { FUNCTIONS_TEMPLATES } from "@/generators/functions/templates";
import { generateVerified, getTemplate, templatesForModule } from "@/generators/registry";

const T = (id: string) => {
  const t = getTemplate(id);
  if (!t) throw new Error(`Plantilla no encontrada: ${id}`);
  return t;
};

describe("generación verificada de plantillas de funciones y relaciones", () => {
  const SEEDS = 50;

  for (const template of FUNCTIONS_TEMPLATES) {
    for (const d of template.difficulties) {
      it(`${template.id} [${d}]: ${SEEDS} semillas sin descartes y con verificación aprobada`, () => {
        const fps = new Set<string>();
        for (let i = 0; i < SEEDS; i++) {
          const { exercise, discarded, discardReasons } = generateVerified(template, `fn-s${i}`, d);
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

  it("módulo 4 tiene plantillas para sus temas principales", () => {
    const templates = templatesForModule(4);
    expect(templates.length).toBeGreaterThanOrEqual(4);
  });
});

describe("corrección y grading de respuestas de funciones", () => {
  it("pares-relaciones valida Sí/No y sinónimos comunes", () => {
    const t = T("funciones.pares-relaciones");
    const { exercise } = generateVerified(t, "seed-rel", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "quizás").accepted).toBe(false);
  });

  it("ecuacion-lineal valida despejes fraccionarios y enteros", () => {
    const t = T("funciones.ecuacion-lineal");
    const { exercise } = generateVerified(t, "seed-ec1", "intermedio");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "999").accepted).toBe(false);
  });

  it("sistema-2x2 valida formato par ordenado (x, y)", () => {
    const t = T("funciones.sistema-2x2");
    const { exercise } = generateVerified(t, "seed-sis", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "(999, 999)").accepted).toBe(false);
    expect(t.check(exercise, "x=1").accepted).toBe(false);
  });

  it("ecuacion-cuadratica valida raíces separadas por coma", () => {
    const t = T("funciones.ecuacion-cuadratica");
    const { exercise } = generateVerified(t, "seed-cuad", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "999, 888").accepted).toBe(false);
  });
});

describe("contenido teórico del módulo 4", () => {
  it("carga la teoría de relaciones-y-funciones conforme al esquema", () => {
    const theory = getTheoryBySlug("relaciones-y-funciones");
    expect(theory).not.toBeNull();
    if (!theory) return;
    expect(theory.moduleId).toBe("module-04-relations-functions");
    expect(theory.sections.length).toBeGreaterThanOrEqual(3);
    for (const sec of theory.sections) {
      expect(sec.content.length).toBeGreaterThan(100);
      if (sec.examples) {
        expect(sec.examples.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
