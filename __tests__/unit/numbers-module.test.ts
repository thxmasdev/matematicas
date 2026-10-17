import { describe, expect, it } from "vitest";
import { getTheoryBySlug } from "@/content/loader";
import { parseInterval, makeInterval, intervalIntersection, intervalToText } from "@/engine/numbers/intervals";
import { NUMBERS_TEMPLATES } from "@/generators/numbers/templates";
import { generateVerified, getTemplate, templatesForModule } from "@/generators/registry";

const T = (id: string) => {
  const t = getTemplate(id);
  if (!t) throw new Error(`Plantilla no encontrada: ${id}`);
  return t;
};

describe("intervalos reales y parsing", () => {
  it("crea intervalos y calcula intersección correctamente", () => {
    const A = makeInterval(1, "closed", 5, "closed"); // [1, 5]
    const B = makeInterval(3, "open", 7, "closed"); // (3, 7]
    const inter = intervalIntersection(A, B);
    expect(inter.left.value).toBe(3);
    expect(inter.left.type).toBe("open");
    expect(inter.right.value).toBe(5);
    expect(inter.right.type).toBe("closed");
    expect(intervalToText(inter)).toBe("(3, 5]");
  });

  it("parsea formatos válidos de intervalos", () => {
    const inv1 = parseInterval("[2, 6)");
    expect(inv1).not.toBeNull();
    expect(inv1?.left.value).toBe(2);
    expect(inv1?.left.type).toBe("closed");
    expect(inv1?.right.value).toBe(6);
    expect(inv1?.right.type).toBe("open");

    const inv2 = parseInterval("(-inf, 4]");
    expect(inv2).not.toBeNull();
    expect(inv2?.left.value).toBe(-Infinity);
    expect(inv2?.right.value).toBe(4);

    const empty = parseInterval("∅");
    expect(empty?.empty).toBe(true);
  });
});

describe("generación verificada de plantillas de números", () => {
  const SEEDS = 50;

  for (const template of NUMBERS_TEMPLATES) {
    for (const d of template.difficulties) {
      it(`${template.id} [${d}]: ${SEEDS} semillas sin descartes y con verificación aprobada`, () => {
        const fps = new Set<string>();
        for (let i = 0; i < SEEDS; i++) {
          const { exercise, discarded, discardReasons } = generateVerified(template, `num-s${i}`, d);
          expect(discarded, discardReasons.join("; ")).toBe(0);
          expect(template.check(exercise, exercise.correctAnswer).accepted).toBe(true);
          expect(template.verify(exercise)).toEqual([]);
          expect(exercise.hints.length).toBeGreaterThanOrEqual(1);
          expect(exercise.steps.length).toBeGreaterThanOrEqual(1);
          expect(exercise.fingerprint.startsWith(`${template.id}:`)).toBe(true);
          fps.add(exercise.fingerprint);
        }
        expect(fps.size).toBeGreaterThan(3);
      });
    }
  }

  it("módulo 3 tiene plantillas para sus temas principales", () => {
    const templates = templatesForModule(3);
    expect(templates.length).toBeGreaterThanOrEqual(5);
  });
});

describe("corrección y grading de respuestas de números", () => {
  it("fracciones combinadas valida fracciones equivalentes y rechaza erróneas", () => {
    const t = T("numeros.fracciones-combinadas");
    const { exercise } = generateVerified(t, "seed-frac", "facil");
    const correctRes = t.check(exercise, exercise.correctAnswer);
    expect(correctRes.accepted).toBe(true);

    const badRes = t.check(exercise, "999/2");
    expect(badRes.accepted).toBe(false);

    const invRes = t.check(exercise, "abc");
    expect(invRes.accepted).toBe(false);
  });

  it("logaritmos valida respuesta numérica exacta", () => {
    const t = T("numeros.logaritmos");
    const { exercise } = generateVerified(t, "seed-log", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "999").accepted).toBe(false);
  });

  it("regla de tres valida cálculo de proporción", () => {
    const t = T("numeros.regla-de-tres");
    const { exercise } = generateVerified(t, "seed-r3", "facil");
    expect(t.check(exercise, exercise.correctAnswer).accepted).toBe(true);
    expect(t.check(exercise, "0").accepted).toBe(false);
  });
});

describe("contenido teórico del módulo 3", () => {
  it("carga la teoría de conjuntos-numericos conforme al esquema", () => {
    const theory = getTheoryBySlug("conjuntos-numericos");
    expect(theory).not.toBeNull();
    if (!theory) return;
    expect(theory.moduleId).toBe("module-03-number-sets");
    expect(theory.sections.length).toBeGreaterThanOrEqual(5);
    for (const sec of theory.sections) {
      expect(sec.content.length).toBeGreaterThan(100);
      if (sec.examples) {
        expect(sec.examples.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
