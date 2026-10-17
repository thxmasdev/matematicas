import { describe, expect, it } from "vitest";
import { getTheoryBySlug } from "@/content/loader";
import { GEOMETRY_TEMPLATES } from "@/generators/geometry/templates";
import { generateVerified, getTemplate, templatesForModule } from "@/generators/registry";

const T = (id: string) => {
  const t = getTemplate(id);
  if (!t) throw new Error(`Plantilla no encontrada: ${id}`);
  return t;
};

describe("generación verificada de plantillas de geometría", () => {
  const SEEDS = 50;

  for (const template of GEOMETRY_TEMPLATES) {
    for (const d of template.difficulties) {
      it(`${template.id} [${d}]: ${SEEDS} semillas sin descartes y con verificación aprobada`, () => {
        const fps = new Set<string>();
        for (let i = 0; i < SEEDS; i++) {
          const { exercise, discarded, discardReasons } = generateVerified(template, `geo-s${i}`, d);
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

  it("módulo 6 tiene plantillas para sus temas principales", () => {
    const templates = templatesForModule(6);
    expect(templates.length).toBeGreaterThanOrEqual(3);
  });
});

describe("corrección y grading de respuestas de geometría", () => {
  it("angulos valida respuesta numérica entera", () => {
    const t = T("geometria.angulos");
    const { exercise } = generateVerified(t, "seed-ang", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "999").accepted).toBe(false);
  });

  it("figuras-planas valida área y perímetro", () => {
    const t = T("geometria.figuras-planas");
    const { exercise } = generateVerified(t, "seed-fig", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "0").accepted).toBe(false);
  });

  it("cuerpos valida volumen", () => {
    const t = T("geometria.cuerpos");
    const { exercise } = generateVerified(t, "seed-cuerp", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "-5").accepted).toBe(false);
  });
});

describe("contenido teórico del módulo 6", () => {
  it("carga la teoría de geometria conforme al esquema", () => {
    const theory = getTheoryBySlug("geometria");
    expect(theory).not.toBeNull();
    if (!theory) return;
    expect(theory.moduleId).toBe("module-06-geometry");
    expect(theory.sections.length).toBeGreaterThanOrEqual(3);
    for (const sec of theory.sections) {
      expect(sec.content.length).toBeGreaterThan(100);
      if (sec.examples) {
        expect(sec.examples.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
