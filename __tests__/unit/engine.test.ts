import { describe, expect, it } from "vitest";
import { Rng } from "@/engine/core/rng";
import { Fraction } from "@/engine/core/fraction";
import { evaluateExpression, parseAnswer } from "@/engine/core/expression";
import {
  V,
  and,
  assignments,
  classify,
  equivalent,
  evaluate,
  iff,
  imp,
  not,
  or,
  resultColumn,
  subformulas,
  toLatex,
  toText,
  truthTable,
  variablesOf,
  xor,
  type Prop,
} from "@/engine/logic/proposition";
import {
  areDisjoint,
  cardinality,
  cartesianProduct,
  complement,
  difference,
  intersection,
  isProperSubset,
  isSubset,
  makeSet,
  powerSet,
  setEquals,
  symmetricDifference,
  toLatex as setLatex,
  union,
} from "@/engine/sets/sets";

const F = Fraction.of;

describe("Rng", () => {
  it("es determinista por semilla y varía entre semillas", () => {
    const a = new Rng("x");
    const b = new Rng("x");
    const seqA = Array.from({ length: 10 }, () => a.int(0, 1000));
    expect(Array.from({ length: 10 }, () => b.int(0, 1000))).toEqual(seqA);
    const c = new Rng("y");
    expect(Array.from({ length: 10 }, () => c.int(0, 1000))).not.toEqual(seqA);
  });
  it("respeta rangos y mezcla sin perder elementos", () => {
    const r = new Rng(1);
    for (let i = 0; i < 1000; i++) {
      const n = r.int(-3, 4);
      expect(n).toBeGreaterThanOrEqual(-3);
      expect(n).toBeLessThanOrEqual(4);
    }
    expect(r.shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
    expect(() => r.int(5, 1)).toThrow();
    expect(() => r.pick([])).toThrow();
  });
});

describe("Fraction", () => {
  it("normaliza y compara", () => {
    expect(F(2, 4).toString()).toBe("1/2");
    expect(F(1, -2).toString()).toBe("-1/2");
    expect(F(2, 4).equals(F(3, 6))).toBe(true);
    expect(F(0, 5).toString()).toBe("0");
    expect(F(1, 3).cmp(F(1, 2))).toBe(-1);
  });
  it("opera exactamente (sin error de coma flotante)", () => {
    expect(F(1, 10).add(F(2, 10)).equals(F(3, 10))).toBe(true);
    expect(F(1, 2).add(F(1, 3)).toString()).toBe("5/6");
    expect(F(-3, 4).mul(F(2, 3)).toString()).toBe("-1/2");
    expect(F(3, 4).div(F(3, 8)).toString()).toBe("2");
  });
  it("rechaza dominios inválidos", () => {
    expect(() => F(1, 0)).toThrow(/cero/);
    expect(() => F(1).div(F(0))).toThrow();
    expect(() => F(0).pow(0)).toThrow();
    expect(() => F(0).pow(-1)).toThrow();
    expect(() => F(2).pow(1000)).toThrow();
    expect(() => F(1.5)).toThrow();
  });
  it("potencias enteras, negativas incluidas", () => {
    expect(F(2, 3).pow(3).toString()).toBe("8/27");
    expect(F(2, 3).pow(-2).toString()).toBe("9/4");
    expect(F(-2).pow(3).toString()).toBe("-8");
    expect(F(5).pow(0).toString()).toBe("1");
  });
  it("parsea formatos de respuesta", () => {
    expect(Fraction.parse("3/4")?.toString()).toBe("3/4");
    expect(Fraction.parse("0,75")?.toString()).toBe("3/4");
    expect(Fraction.parse("0.75")?.toString()).toBe("3/4");
    expect(Fraction.parse("-1 1/2")?.toString()).toBe("-3/2");
    expect(Fraction.parse("−2")?.toString()).toBe("-2");
    expect(Fraction.parse("1/0")).toBeNull();
    expect(Fraction.parse("abc")).toBeNull();
    expect(Fraction.parse("")).toBeNull();
  });
  it("LaTeX", () => {
    expect(F(-3, 4).toLatex()).toBe("-\\frac{3}{4}");
    expect(F(6, 3).toLatex()).toBe("2");
  });
  it("propiedades (500 casos con semilla): inversas y conmutatividad", () => {
    const r = new Rng("fraction-props");
    const rand = (): Fraction => F(r.int(-50, 50), r.int(1, 30));
    for (let i = 0; i < 500; i++) {
      const a = rand();
      const b = rand();
      expect(a.add(b).equals(b.add(a))).toBe(true);
      expect(a.add(b).sub(b).equals(a)).toBe(true);
      if (!b.isZero()) expect(a.mul(b).div(b).equals(a)).toBe(true);
      expect(a.mul(b.add(F(1))).equals(a.mul(b).add(a))).toBe(true);
      expect(a.add(b).toNumber()).toBeCloseTo(a.toNumber() + b.toNumber(), 9);
      expect(a.cmp(b) + b.cmp(a)).toBe(0);
    }
  });
});

describe("evaluateExpression (sin eval)", () => {
  it("respeta prioridad de operaciones y signos", () => {
    expect(evaluateExpression("2+3*4").toString()).toBe("14");
    expect(evaluateExpression("(2+3)*4").toString()).toBe("20");
    expect(evaluateExpression("-2^2").toString()).toBe("-4");
    expect(evaluateExpression("(-2)^2").toString()).toBe("4");
    expect(evaluateExpression("2^3^2").toString()).toBe("512");
    expect(evaluateExpression("10-2-3").toString()).toBe("5");
    expect(evaluateExpression("8/2/2").toString()).toBe("2");
    expect(evaluateExpression("1/2+1/3").toString()).toBe("5/6");
    expect(evaluateExpression("2^-2").toString()).toBe("1/4");
    expect(evaluateExpression("3 − −2").toString()).toBe("5");
    expect(evaluateExpression("0,5×4").toString()).toBe("2");
  });
  it("rechaza entradas inválidas y maliciosas", () => {
    for (const bad of [
      "",
      "2+",
      "(1+2",
      "1+2)",
      "2^0.5",
      "alert(1)",
      "1/0",
      "0^0",
      "2**3",
      "process.exit()",
      "1;2",
      "2^999",
    ]) {
      expect(() => evaluateExpression(bad), bad).toThrow();
    }
    expect(() => evaluateExpression("1+".repeat(200) + "1")).toThrow(/larga/);
  });
  it("parseAnswer devuelve null en vez de lanzar", () => {
    expect(parseAnswer("3/4")?.toString()).toBe("3/4");
    expect(parseAnswer("1/2+1/4")?.toString()).toBe("3/4");
    expect(parseAnswer("hola")).toBeNull();
    expect(parseAnswer("1/0")).toBeNull();
  });
});

/** Referencia independiente: tablas de los conectivos como cadenas, filas en orden (p,q)=VV,VF,FV,FF. */
const REF = { and: "VFFF", or: "VVVF", imp: "VFVV", iff: "VFFV", xor: "FVVF" } as const;

describe("lógica proposicional", () => {
  const p = V("p");
  const q = V("q");

  it("negación", () => {
    expect(resultColumn(not(p))).toBe("FV");
  });
  it.each(Object.entries(REF))("conectivo %s coincide con la tabla de referencia", (kind, col) => {
    const f = { and, or, imp, iff, xor }[kind as keyof typeof REF](p, q);
    expect(resultColumn(f)).toBe(col);
  });
  it("orden de filas y asignaciones completas", () => {
    expect(assignments(["p", "q"]).map((e) => `${e.p ? "V" : "F"}${e.q ? "V" : "F"}`)).toEqual([
      "VV",
      "VF",
      "FV",
      "FF",
    ]);
    expect(assignments(["a", "b", "c"])).toHaveLength(8);
    expect(assignments([])).toHaveLength(1);
  });
  it("la tabla incluye subfórmulas y su última columna es la fórmula", () => {
    const f = imp(and(p, q), or(not(p), q));
    const t = truthTable(f);
    expect(t.variables).toEqual(["p", "q"]);
    expect(t.rows).toHaveLength(4);
    expect(toText(t.columns[t.columns.length - 1])).toBe(toText(f));
    t.rows.forEach((r) => expect(r.values[r.values.length - 1]).toBe(r.result));
  });
  it("clasificación", () => {
    expect(classify(or(p, not(p)))).toBe("tautologia");
    expect(classify(and(p, not(p)))).toBe("contradiccion");
    expect(classify(imp(p, q))).toBe("contingencia");
  });
  it("texto y LaTeX corresponden a la misma estructura", () => {
    const f = iff(imp(p, q), or(not(p), q));
    expect(toText(f)).toBe("(p → q) ↔ (~p ∨ q)");
    expect(toLatex(f)).toBe("(p \\Rightarrow q) \\Leftrightarrow (\\neg p \\lor q)");
  });
  it("subformulas sin repetir", () => {
    const f = and(or(p, q), or(p, q));
    expect(subformulas(f).map((s) => toText(s))).toEqual(["p ∨ q", "(p ∨ q) ∧ (p ∨ q)"]);
  });
  it("variable sin valor y exceso de variables lanzan error", () => {
    expect(() => evaluate(p, {})).toThrow();
    const many = ["a", "b", "c", "d", "e", "f", "g"].map(V).reduce((x, y) => and(x, y));
    expect(() => truthTable(many)).toThrow();
  });

  it("leyes clásicas son equivalencias (De Morgan, contrapositiva, condicional, bicondicional)", () => {
    expect(equivalent(not(and(p, q)), or(not(p), not(q)))).toBe(true);
    expect(equivalent(not(or(p, q)), and(not(p), not(q)))).toBe(true);
    expect(equivalent(imp(p, q), imp(not(q), not(p)))).toBe(true);
    expect(equivalent(imp(p, q), or(not(p), q))).toBe(true);
    expect(equivalent(iff(p, q), and(imp(p, q), imp(q, p)))).toBe(true);
    expect(equivalent(imp(p, q), imp(q, p))).toBe(false);
  });

  it("propiedades con fórmulas aleatorias (300 casos): evaluación = referencia independiente", () => {
    const r = new Rng("logic-props");
    const names = ["p", "q", "r"];
    const gen = (d: number): Prop => {
      if (d === 0 || r.next() < 0.25) return V(r.pick(names));
      if (r.next() < 0.2) return not(gen(d - 1));
      const kind = r.pick(["and", "or", "imp", "iff", "xor"] as const);
      return { and, or, imp, iff, xor }[kind](gen(d - 1), gen(d - 1));
    };
    // Referencia: reevaluar con el texto convertido a operadores JS (solo en el test).
    const ref = (f: Prop, env: Record<string, boolean>): boolean => {
      switch (f.k) {
        case "var":
          return env[f.name];
        case "not":
          return ref(f.a, env) === false;
        case "and":
          return ref(f.a, env) && ref(f.b, env);
        case "or":
          return ref(f.a, env) || ref(f.b, env);
        case "imp":
          return ref(f.a, env) ? ref(f.b, env) : true;
        case "iff":
          return ref(f.a, env) === ref(f.b, env);
        case "xor":
          return ref(f.a, env) !== ref(f.b, env);
      }
    };
    for (let i = 0; i < 300; i++) {
      const f = gen(4);
      for (const env of assignments(variablesOf(f))) {
        expect(evaluate(f, env)).toBe(ref(f, env));
      }
      // Doble negación y De Morgan sobre fórmulas arbitrarias
      expect(equivalent(not(not(f)), f)).toBe(true);
      const g = gen(3);
      expect(equivalent(not(and(f, g)), or(not(f), not(g)))).toBe(true);
    }
  });
});

describe("conjuntos", () => {
  const A = makeSet([1, 2, 3, 4]);
  const B = makeSet([3, 4, 5]);
  const U = makeSet([1, 2, 3, 4, 5, 6]);

  it("normaliza (sin repetidos, ordenado)", () => {
    expect(makeSet([3, 1, 3, 2, 1])).toEqual([1, 2, 3]);
    expect(makeSet(["b", "a", "b"])).toEqual(["a", "b"]);
  });
  it("unión, intersección, diferencias y complemento", () => {
    expect(union(A, B)).toEqual([1, 2, 3, 4, 5]);
    expect(intersection(A, B)).toEqual([3, 4]);
    expect(difference(A, B)).toEqual([1, 2]);
    expect(symmetricDifference(A, B)).toEqual([1, 2, 5]);
    expect(complement(A, U)).toEqual([5, 6]);
    expect(() => complement(makeSet([9]), U)).toThrow();
  });
  it("vacío y disjuntos", () => {
    expect(union([], A)).toEqual(A);
    expect(intersection([], A)).toEqual([]);
    expect(areDisjoint(makeSet([1]), makeSet([2]))).toBe(true);
    expect(isSubset([], A)).toBe(true);
    expect(isProperSubset(A, A)).toBe(false);
    expect(isProperSubset(makeSet([1]), A)).toBe(true);
    expect(setEquals(makeSet([2, 1]), makeSet([1, 2]))).toBe(true);
  });
  it("producto cartesiano y conjunto potencia", () => {
    expect(cartesianProduct(makeSet([1, 2]), makeSet(["a"]))).toEqual([
      [1, "a"],
      [2, "a"],
    ]);
    const P = powerSet(makeSet([1, 2, 3]));
    expect(P).toHaveLength(8);
    expect(P[0]).toEqual([]);
    expect(() => powerSet(makeSet(Array.from({ length: 13 }, (_, i) => i)))).toThrow();
  });
  it("LaTeX", () => {
    expect(setLatex(A)).toBe("\\{1, 2, 3, 4\\}");
    expect(setLatex([])).toBe("\\emptyset");
  });
  it("leyes con conjuntos aleatorios (300 casos)", () => {
    const r = new Rng("sets-props");
    const rs = () => makeSet(Array.from({ length: r.int(0, 6) }, () => r.int(1, 10)));
    const Uni = makeSet(Array.from({ length: 10 }, (_, i) => i + 1));
    for (let i = 0; i < 300; i++) {
      const a = rs();
      const b = rs();
      const c = rs();
      // De Morgan
      expect(setEquals(complement(union(a, b), Uni), intersection(complement(a, Uni), complement(b, Uni)))).toBe(true);
      expect(setEquals(complement(intersection(a, b), Uni), union(complement(a, Uni), complement(b, Uni)))).toBe(true);
      // Distributiva
      expect(setEquals(intersection(a, union(b, c)), union(intersection(a, b), intersection(a, c)))).toBe(true);
      // Inclusión-exclusión
      expect(cardinality(union(a, b))).toBe(cardinality(a) + cardinality(b) - cardinality(intersection(a, b)));
      // Complemento doble y A ∩ A' = ∅
      expect(setEquals(complement(complement(a, Uni), Uni), a)).toBe(true);
      expect(intersection(a, complement(a, Uni))).toEqual([]);
      // A ⊆ A ∪ B ; A ∩ B ⊆ A
      expect(isSubset(a, union(a, b))).toBe(true);
      expect(isSubset(intersection(a, b), a)).toBe(true);
    }
  });
});
