import { describe, expect, it } from "vitest";
import { getTheoryBySlug } from "@/content/loader";
import { TRIGONOMETRY_TEMPLATES } from "@/generators/trigonometry/templates";
import { generateVerified, getTemplate, templatesForModule } from "@/generators/registry";

const T = (id: string) => {
  const t = getTemplate(id);
  if (!t) throw new Error(`Plantilla no encontrada: ${id}`);
  return t;
};

describe("generación verificada de plantillas de trigonometría", () => {
  const SEEDS = 50;

  for (const template of TRIGONOMETRY_TEMPLATES) {
    for (const d of template.difficulties) {
      it(`${template.id} [${d}]: ${SEEDS} semillas sin descartes y con verificación aprobada`, () => {
        const fps = new Set<string>();
        for (let i = 0; i < SEEDS; i++) {
          const { exercise, discarded, discardReasons } = generateVerified(template, `trig-s${i}`, d);
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

  it("módulo 7 tiene plantillas para sus temas principales", () => {
    const templates = templatesForModule(7);
    expect(templates.length).toBeGreaterThanOrEqual(3);
  });
});

describe("corrección y grading de respuestas de trigonometría", () => {
  it("pitagoras valida longitud entera", () => {
    const t = T("trigonometria.pitagoras");
    const { exercise } = generateVerified(t, "seed-pit", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "999").accepted).toBe(false);
  });

  it("razones trigonométricas valida fracciones irreducibles", () => {
    const t = T("trigonometria.razones");
    const { exercise } = generateVerified(t, "seed-raz", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "99/100").accepted).toBe(false);
  });

  it("angulos notables valida valores exactos", () => {
    const t = T("trigonometria.angulos-notables");
    const { exercise } = generateVerified(t, "seed-not", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "otra cosa").accepted).toBe(false);
  });
});

describe("contenido teórico del módulo 7", () => {
  it("carga la teoría de trigonometria conforme al esquema", () => {
    const theory = getTheoryBySlug("trigonometria");
    expect(theory).not.toBeNull();
    if (!theory) return;
    expect(theory.moduleId).toBe("module-07-trigonometry");
    expect(theory.sections.length).toBeGreaterThanOrEqual(3);
    for (const sec of theory.sections) {
      expect(sec.content.length).toBeGreaterThan(100);
      if (sec.examples) {
        expect(sec.examples.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
