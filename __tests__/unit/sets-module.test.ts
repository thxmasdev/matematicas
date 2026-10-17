import { describe, expect, it } from "vitest";
import { getTheoryBySlug } from "@/content/loader";
import { parseSet } from "@/engine/sets/sets";
import { SETS_TEMPLATES } from "@/generators/sets/templates";
import { generateVerified, getTemplate, templatesForModule } from "@/generators/registry";


const T = (id: string) => {
  const t = getTemplate(id);
  if (!t) throw new Error(`Plantilla no encontrada: ${id}`);
  return t;
};

describe("parseSet y parseo de respuestas de conjuntos", () => {
  it("parsea formatos válidos con llaves y sin llaves", () => {
    expect(parseSet("{1, 2, 3}")).toEqual([1, 2, 3]);
    expect(parseSet("1, 2, 3")).toEqual([1, 2, 3]);
    expect(parseSet("3, 1, 2")).toEqual([1, 2, 3]);
    expect(parseSet("{ 5 ; 10 ; 15 }")).toEqual([5, 10, 15]);
  });

  it("parsea conjunto vacío en sus diversas formas estándar", () => {
    expect(parseSet("∅")).toEqual([]);
    expect(parseSet("{}")).toEqual([]);
    expect(parseSet("vacio")).toEqual([]);
    expect(parseSet("vacío")).toEqual([]);
    expect(parseSet("\\emptyset")).toEqual([]);
  });

  it("devuelve null para formatos con caracteres no permitidos", () => {
    expect(parseSet("1 + 2")).toBeNull();
    expect(parseSet("eval(alert)")).toBeNull();
    expect(parseSet("")).toBeNull();
  });
});

describe("generación verificada de plantillas de conjuntos", () => {
  const SEEDS = 80;

  for (const template of SETS_TEMPLATES) {
    for (const d of template.difficulties) {
      it(`${template.id} [${d}]: ${SEEDS} semillas sin descartes y con verificación aprobada`, () => {
        const fps = new Set<string>();
        for (let i = 0; i < SEEDS; i++) {
          const { exercise, discarded, discardReasons } = generateVerified(template, `set-s${i}`, d);
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

  it("módulo 2 tiene plantillas para sus temas principales", () => {
    const templates = templatesForModule(2);
    expect(templates.length).toBeGreaterThanOrEqual(3);
    const topics = new Set(templates.map((t) => t.topicId));
    expect(topics.has("conjuntos-especiales")).toBe(true);
    expect(topics.has("operaciones-conjuntos")).toBe(true);
    expect(topics.has("nocion-y-representacion")).toBe(true);
  });
});

describe("corrección pedagógica de operaciones con conjuntos", () => {
  const t = T("conjuntos.operaciones");

  it("acepta respuestas exactas con diferente orden o espaciado", () => {
    const { exercise } = generateVerified(t, "test-op-1", "facil");
    const expected = parseSet(exercise.correctAnswer)!;
    const shuffled = [...expected].reverse().join(", ");
    const result = t.check(exercise, `{ ${shuffled} }`);
    expect(result.accepted).toBe(true);
  });

  it("diagnostica elementos faltantes o sobrantes", () => {
    const { exercise } = generateVerified(t, "test-op-diag", "intermedio");
    const expected = parseSet(exercise.correctAnswer)!;
    if (expected.length >= 2) {
      // Falta un elemento
      const missingOne = expected.slice(0, -1);
      const r1 = t.check(exercise, `{${missingOne.join(",")}}`);
      expect(r1.accepted).toBe(false);
      expect(r1.message).toMatch(/faltaron elementos/i);

      // Sobra un elemento
      const extraOne = [...expected, 999];
      const r2 = t.check(exercise, `{${extraOne.join(",")}}`);
      expect(r2.accepted).toBe(false);
      expect(r2.message).toMatch(/no corresponden/i);
    }
  });
});

describe("principio de inclusión-exclusión", () => {
  const t = T("conjuntos.cardinal");

  it("verifica la consistencia de la fórmula card(A ∪ B) = card(A) + card(B) - card(A ∩ B)", () => {
    for (let i = 0; i < 20; i++) {
      const { exercise } = generateVerified(t, `inc-exc-${i}`, "intermedio");
      const p = exercise.params;
      const cA = Number(p.cardA);
      const cB = Number(p.cardB);
      const cInt = Number(p.cardInter);
      const cUnion = Number(p.cardUnion);
      expect(cUnion).toBe(cA + cB - cInt);
    }
  });
});

describe("contenido teórico de conjuntos", () => {
  it("la teoría de conjuntos está completa y enlazada con los temas de la cartilla", () => {
    const theory = getTheoryBySlug("conjuntos");
    expect(theory).not.toBeNull();
    if (!theory) return;
    expect(theory.sections.length).toBe(3);
    for (const sec of theory.sections) {
      expect(sec.content.length).toBeGreaterThan(100);
      if (sec.examples) {
        expect(sec.examples.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
