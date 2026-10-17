import { describe, expect, it } from "vitest";
import { Rng } from "@/engine/core/rng";
import type { GeneratedExercise } from "@/engine/exercise";
import { parseFormula, tryParseFormula } from "@/engine/logic/parser";
import {
  and,
  evaluate,
  not,
  or,
  subformulas,
  toText,
  V,
  type Prop,
} from "@/engine/logic/proposition";
import { randomFormula, canonicalText, shapeFor, VAR_SETS } from "@/generators/logic/formulas";
import { PROPOSITION_BANK, LOGIC_TEMPLATES } from "@/generators/logic/templates";
import { generateVerified, getTemplate, templatesForModule } from "@/generators/registry";
import type { Difficulty } from "@/types/module";

const DIFFS: Difficulty[] = ["facil", "intermedio", "dificil", "avanzado"];
const T = (id: string) => {
  const t = getTemplate(id);
  if (!t) throw new Error(`Plantilla inexistente: ${id}`);
  return t;
};
const ex = (params: Record<string, string>): GeneratedExercise =>
  ({ params, instanceId: "x", seed: "x" }) as unknown as GeneratedExercise;

describe("parser de fórmulas (reglas de prioridad de la cartilla 1.2.4)", () => {
  const root = (s: string) => parseFormula(s).k;

  it("el condicional es más débil que ∧ y ∨", () => {
    expect(toText(parseFormula("p ⇒ q ∨ r"))).toBe("p → (q ∨ r)");
    expect(root("p ⇒ q ∨ r")).toBe("imp");
  });
  it("el bicondicional es la operación más fuerte (se resuelve último)", () => {
    expect(root("p ⇔ q ⇒ r")).toBe("iff");
    expect(root("(p ⇔ q) ⇒ r")).toBe("imp");
  });
  it("la negación liga solo a lo que sigue", () => {
    expect(root("~p ⇒ q ∧ r")).toBe("imp");
    expect(root("~(p ⇒ q ∧ r)")).toBe("not");
  });
  it("∧ y ∨ mezclados sin paréntesis son ambiguos y se rechazan", () => {
    expect(tryParseFormula("p ∧ q ∨ r").ok).toBe(false);
    expect(tryParseFormula("p ∨ q ∧ r").ok).toBe(false);
    expect(tryParseFormula("p ∧ q ∧ r").ok).toBe(true);
    expect(tryParseFormula("p ⇒ q ⇒ r").ok).toBe(false);
    expect(tryParseFormula("p ⇔ q ⇔ r").ok).toBe(false);
  });
  it("acepta alternativas ASCII y de la cartilla", () => {
    expect(toText(parseFormula("p -> q"))).toBe(toText(parseFormula("p ⇒ q")));
    expect(toText(parseFormula("p <-> q"))).toBe(toText(parseFormula("p ⟺ q")));
    expect(toText(parseFormula("p ^ q"))).toBe("p ∧ q");
    expect(toText(parseFormula("∼p | q"))).toBe("~p ∨ q");
  });
  it("rechaza entradas inválidas o peligrosas sin lanzar desde tryParse", () => {
    for (const bad of ["", "p ∧", "(p", "p)", "p q", "alert(1)", "p ∧ 1", "p; q", "⇒ p"]) {
      expect(tryParseFormula(bad).ok, bad).toBe(false);
    }
    expect(tryParseFormula("p ∧ ".repeat(100) + "q").ok).toBe(false);
  });
  it("round-trip texto→AST→texto en 300 fórmulas aleatorias", () => {
    const r = new Rng("parser-roundtrip");
    for (let i = 0; i < 300; i++) {
      const f = randomFormula(r, shapeFor(r.pick(DIFFS), VAR_SETS[0]));
      expect(toText(parseFormula(toText(f)))).toBe(toText(f));
    }
  });
});

describe("ejercicios de la cartilla verificados a mano", () => {
  const val = (s: string, env: Record<string, boolean>) => evaluate(parseFormula(s), env);
  it("ejercicio 6 (p=V, q=F, r=V)", () => {
    const env = { p: true, q: false, r: true };
    expect(val("p ∧ r", env)).toBe(true);
    expect(val("q ∨ ~q", env)).toBe(true);
    expect(val("q ∧ (r ∨ p)", env)).toBe(false);
    expect(val("r ∨ ~(p ∨ q)", env)).toBe(true);
  });
  it("ejercicio 7 (m=F, t=V, s=V)", () => {
    const env = { m: false, t: true, s: true };
    expect(val("m ⇒ t", env)).toBe(true);
    expect(val("(t ⇒ ~s) ∧ m", env)).toBe(false);
    expect(val("m ⇔ ~s", env)).toBe(true);
    expect(val("(s ⇔ m) ∨ ~(t ⇒ m)", env)).toBe(true);
  });
  it("ejercicio 5: colocación de paréntesis", () => {
    const t = T("logica.parentesizar");
    const cases: [string, string, string][] = [
      ["p ∨ q ⇒ r ∧ p", "imp", "p ∨ q ⇒ r ∧ p"],
      ["p ∧ q ⇒ r ∨ s", "and", "p ∧ (q ⇒ r ∨ s)"],
      ["~p ⇒ q ∧ r", "not", "~(p ⇒ q ∧ r)"],
      ["p ⇒ q ∨ r", "or", "(p ⇒ q) ∨ r"],
      ["~p ⇔ q ⇒ r", "iff", "~p ⇔ q ⇒ r"],
      ["~p ∧ (q ⇒ r)", "not", "~(p ∧ (q ⇒ r))"],
      ["p ∧ q ∨ r", "or", "(p ∧ q) ∨ r"],
    ];
    for (const [flat, target, answer] of cases) {
      expect(t.check(ex({ flat, target }), answer).status, `${flat} → ${answer}`).toBe("correct");
    }
  });
  it("parentesizar rechaza respuestas incorrectas con mensajes útiles", () => {
    const t = T("logica.parentesizar");
    const e = ex({ flat: "p ∧ q ⇒ r ∨ s", target: "and" });
    expect(t.check(e, "p ∧ q ⇒ r ∨ s").status).toBe("incorrect"); // raíz = condicional
    expect(t.check(e, "(p ∧ q) ⇒ (r ∨ s)").status).toBe("incorrect");
    expect(t.check(e, "p ∨ (q ⇒ r ∨ s)").message).toMatch(/solo podés agregar paréntesis/);
    expect(t.check(e, "p ∧ q ∨ r").status).toBe("invalid");
    expect(t.check(e, "p ∧ (q ⇒ r ∨ s) y más texto").status).toBe("invalid");
  });
});

describe("generación verificada: barrido de semillas", () => {
  const SEEDS = 150;

  for (const template of LOGIC_TEMPLATES) {
    for (const d of template.difficulties) {
      it(`${template.id} [${d}]: ${SEEDS} semillas sin descartes y con respuesta aceptada`, () => {
        const fps = new Set<string>();
        for (let i = 0; i < SEEDS; i++) {
          const { exercise, discarded, discardReasons } = generateVerified(template, `s${i}`, d);
          expect(discarded, discardReasons.join("; ")).toBe(0);
          expect(template.check(exercise, exercise.correctAnswer).accepted).toBe(true);
          expect(template.verify(exercise)).toEqual([]);
          expect(exercise.hints.length).toBeGreaterThanOrEqual(2);
          expect(exercise.steps.length).toBeGreaterThanOrEqual(1);
          expect(exercise.fingerprint.startsWith(`${template.id}:`)).toBe(true);
          // Las pistas no regalan la respuesta
          for (const h of exercise.hints) expect(h).not.toContain(`respuesta: ${exercise.correctAnswer}`);
          fps.add(exercise.fingerprint);
        }
        expect(fps.size).toBeGreaterThan(5);
      });
    }
  }

  it("es determinista: misma semilla, mismo ejercicio", () => {
    for (const template of LOGIC_TEMPLATES) {
      const d = template.difficulties[0];
      const a = generateVerified(template, "fija", d).exercise;
      const b = generateVerified(template, "fija", d).exercise;
      expect(b).toEqual(a);
    }
  });

  it("rechaza dificultades no soportadas", () => {
    expect(() => generateVerified(T("logica.es-proposicion"), "x", "avanzado")).toThrow(/no admite/);
  });

  it("el módulo 1 tiene plantillas para sus 3 temas", () => {
    const topics = new Set(templatesForModule(1).map((t) => t.topicId));
    expect([...topics].sort()).toEqual(["operadores-logicos", "proposiciones", "prioridad-y-evaluacion"].sort());
  });
});

describe("la dificultad depende de parámetros matemáticos reales", () => {
  const connectives = (f: Prop) => subformulas(f).filter((s) => s.k !== "not").length;
  it("valor de verdad: cantidad de conectivos binarios por nivel", () => {
    const t = T("logica.valor-de-verdad");
    const expected: Record<Difficulty, number> = { facil: 1, intermedio: 2, dificil: 3, avanzado: 4 };
    for (const d of DIFFS) {
      for (let i = 0; i < 60; i++) {
        const { exercise } = generateVerified(t, `d${i}`, d);
        expect(connectives(parseFormula(String(exercise.params.formula))), d).toBeLessThanOrEqual(expected[d]);
        // las subfórmulas repetidas se cuentan una sola vez, así que el máximo es el esperado
      }
    }
  });
  it("tabla de verdad: filas = 2^variables y crece con el nivel", () => {
    const t = T("logica.tabla-verdad");
    const rows = (d: Difficulty) =>
      Math.max(
        ...Array.from({ length: 40 }, (_, i) => {
          const s = generateVerified(t, `r${i}`, d).exercise.answerSpec;
          return s.type === "truth-column" ? s.rows : 0;
        }),
      );
    expect(rows("facil")).toBeLessThanOrEqual(4);
    expect(rows("intermedio")).toBe(8);
    expect(rows("avanzado")).toBeGreaterThanOrEqual(8);
  });
});

describe("corrección de respuestas por plantilla", () => {
  it("valor de verdad", () => {
    const t = T("logica.valor-de-verdad");
    const e = generateVerified(t, "vv", "intermedio").exercise;
    const other = e.correctAnswer === "V" ? "F" : "V";
    expect(t.check(e, other).status).toBe("incorrect");
    expect(t.check(e, e.correctAnswer.toLowerCase()).accepted).toBe(true);
    expect(t.check(e, e.correctAnswer === "V" ? "verdadero" : "falso").accepted).toBe(true);
    expect(t.check(e, `${e.correctAnswer} es la respuesta`).status).toBe("invalid");
    expect(t.check(e, "").status).toBe("invalid");
  });
  it("tabla de verdad", () => {
    const t = T("logica.tabla-verdad");
    const e = generateVerified(t, "tt", "intermedio").exercise;
    const spaced = [...e.correctAnswer].join(" ");
    expect(t.check(e, spaced.toLowerCase()).accepted).toBe(true);
    const flipped = (e.correctAnswer[0] === "V" ? "F" : "V") + e.correctAnswer.slice(1);
    const r = t.check(e, flipped);
    expect(r.status).toBe("incorrect");
    expect(r.message).toMatch(/1 fila incorrecta/);
    expect(t.check(e, e.correctAnswer + "V").status).toBe("invalid");
    expect(t.check(e, "XYZ").status).toBe("invalid");
  });
  it("opción múltiple: exige una opción exacta", () => {
    for (const id of ["logica.es-proposicion", "logica.identificar-operacion", "logica.clasificar"]) {
      const t = T(id);
      const d = t.difficulties[t.difficulties.length - 1];
      const e = generateVerified(t, "oc", d).exercise;
      if (e.answerSpec.type !== "choice") throw new Error("se esperaba choice");
      const wrong = e.answerSpec.options.find((o) => o !== e.correctAnswer)!;
      expect(t.check(e, wrong).status).toBe("incorrect");
      expect(t.check(e, e.correctAnswer).accepted).toBe(true);
      expect(t.check(e, `${e.correctAnswer} y algo más`).status).toBe("invalid");
    }
  });
  it("simbolizar: acepta conmutación, distingue equivalentes de la forma directa", () => {
    const t = T("logica.simbolizar");
    let sawImp = false;
    for (let i = 0; i < 80 && !sawImp; i++) {
      const e = generateVerified(t, `sy${i}`, "facil").exercise;
      const f = parseFormula(e.correctAnswer);
      if (f.k === "imp") {
        sawImp = true;
        const asOr = toText(or(not(f.a), f.b));
        expect(t.check(e, asOr).status).toBe("equivalent");
        expect(t.check(e, asOr).accepted).toBe(false);
        expect(t.check(e, toText(and(f.b, f.a))).status).toBe("incorrect");
      }
      if (f.k === "and") {
        expect(t.check(e, toText(and(f.b, f.a))).accepted).toBe(true);
      }
    }
    expect(sawImp).toBe(true);
    const e = generateVerified(t, "sy", "dificil").exercise;
    expect(t.check(e, "p ∧ ∧").status).toBe("invalid");
  });
});

describe("banco de proposiciones y espacio finito", () => {
  it("cada elemento tiene justificación y clase coherentes", () => {
    const ids = new Set(PROPOSITION_BANK.map((i) => i.id));
    expect(ids.size).toBe(PROPOSITION_BANK.length);
    for (const i of PROPOSITION_BANK) {
      expect(i.reason.length).toBeGreaterThan(10);
      if (i.isProposition) expect(i.reason).toMatch(/\((V|F)\)|valor de verdad/);
      else expect(i.reason).toMatch(/no es verdadera|no tiene valor|no se puede|sin valor|ni falsa|sin un valor|sin valores/i);
    }
  });
  it("el espacio de es-proposicion es finito y se detecta (11 + 10 elementos)", () => {
    const t = T("logica.es-proposicion");
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) seen.add(generateVerified(t, `e${i}`, "facil").exercise.fingerprint);
    expect(seen.size).toBe(PROPOSITION_BANK.filter((p) => p.level === "facil").length);
  });
  it("las fórmulas aleatorias usan todas las variables y no son triviales", () => {
    const r = new Rng("vars");
    for (let i = 0; i < 200; i++) {
      const f = randomFormula(r, shapeFor("intermedio", ["p", "q", "r"]));
      expect(new Set(canonicalText(f).match(/[pqr]/g)).size).toBe(3);
    }
    expect(V("p")).toEqual({ k: "var", name: "p" });
  });
});
