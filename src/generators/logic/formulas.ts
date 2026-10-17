import type { Rng } from "@/engine/core/rng";
import {
  and,
  iff,
  imp,
  not,
  or,
  subformulas,
  toLatex,
  toText,
  V,
  variablesOf,
  type BinaryKind,
  type Env,
  type Prop,
} from "@/engine/logic/proposition";
import type { Difficulty } from "@/types/module";

/** Conectivos de la cartilla (no se generan ⊻ porque no figuran en ella). */
export const CARTILLA_KINDS: readonly ("and" | "or" | "imp" | "iff")[] = ["and", "or", "imp", "iff"];

export const VAR_SETS: readonly (readonly string[])[] = [
  ["p", "q", "r", "s"],
  ["m", "t", "s", "w"],
];

export const OPERATION_NAME = {
  var: "Variable",
  not: "Negación",
  and: "Conjunción",
  or: "Disyunción",
  imp: "Condicional",
  iff: "Bicondicional",
  xor: "Disyunción exclusiva",
} as const;


export interface FormulaShape {
  vars: readonly string[];
  /** Cantidad de conectivos binarios. */
  binary: number;
  kinds?: readonly BinaryKind[];
  /** Probabilidad de negar una variable. */
  negLit?: number;
  /** Probabilidad de negar una subfórmula compuesta. */
  negCompound?: number;
}

/**
 * Fórmula aleatoria. Las hojas se reparten para que TODAS las variables aparezcan
 * (si hay hojas suficientes) y se evitan subfórmulas triviales tipo `p ∧ p`.
 */
export function randomFormula(rng: Rng, shape: FormulaShape): Prop {
  const kinds = shape.kinds ?? CARTILLA_KINDS;
  const leafCount = shape.binary + 1;
  for (let attempt = 0; attempt < 100; attempt++) {
    const extra = Math.max(0, leafCount - shape.vars.length);
    const pool = [...shape.vars, ...Array.from({ length: extra }, () => rng.pick(shape.vars))];
    const leaves = rng.shuffle(pool).slice(0, leafCount);
    let li = 0;
    const build = (n: number): Prop => {
      if (n === 0) {
        const v = V(leaves[li++]);
        return rng.next() < (shape.negLit ?? 0) ? not(v) : v;
      }
      const k = rng.int(0, n - 1);
      const a = build(k);
      const b = build(n - 1 - k);
      const kind = rng.pick(kinds);
      const real: Prop = { k: kind, a, b };
      return rng.next() < (shape.negCompound ?? 0) ? not(real) : real;
    };
    const f = build(shape.binary);
    if (!hasTrivialSubformula(f)) return f;
  }
  throw new Error("No se pudo generar una fórmula no trivial.");
}

function hasTrivialSubformula(f: Prop): boolean {
  return subformulas(f).some((s) => s.k !== "not" && s.k !== "var" && toText(s.a) === toText(s.b));
}

/** Texto canónico: ordena los operandos de ∧, ∨, ⇔ (conmutativos); ⇒ conserva el orden. */
export function canonicalText(p: Prop): string {
  switch (p.k) {
    case "var":
      return p.name;
    case "not":
      return `~${canonicalText(p.a)}`;
    default: {
      const a = canonicalText(p.a);
      const b = canonicalText(p.b);
      const sym = { and: "∧", or: "∨", imp: "→", iff: "↔", xor: "⊻" }[p.k];
      const [x, y] = p.k === "imp" ? [a, b] : [a, b].sort();
      return `(${x} ${sym} ${y})`;
    }
  }
}

/** LaTeX con las variables reemplazadas por sus valores (V/F). */
export function toLatexWithValues(p: Prop, env: Env, top = true): string {
  switch (p.k) {
    case "var":
      return env[p.name] ? "\\mathrm{V}" : "\\mathrm{F}";
    case "not":
      return `\\neg ${toLatexWithValues(p.a, env, false)}`;
    default: {
      const sym = {
        and: "\\land",
        or: "\\lor",
        imp: "\\to",
        iff: "\\leftrightarrow",
        xor: "\\veebar",
      }[p.k];
      const s = `${toLatexWithValues(p.a, env, false)} ${sym} ${toLatexWithValues(p.b, env, false)}`;
      return top ? s : `(${s})`;
    }
  }
}

/** Configuración de forma de fórmula según dificultad (parámetros matemáticos reales). */
export function shapeFor(
  difficulty: Difficulty,
  vars: readonly string[],
): FormulaShape {
  switch (difficulty) {
    case "facil":
      return { vars: vars.slice(0, 2), binary: 1, negLit: 0.3 };
    case "intermedio":
      return { vars: vars.slice(0, 3), binary: 2, negLit: 0.4 };
    case "dificil":
      return { vars: vars.slice(0, 3), binary: 3, negLit: 0.4, negCompound: 0.2 };
    case "avanzado":
      return { vars: vars.slice(0, 4), binary: 4, negLit: 0.4, negCompound: 0.35 };
  }
}

export const latexOf = (p: Prop): string => `$${toLatex(p)}$`;
export const varsText = (p: Prop): string[] => variablesOf(p);

/* ------------------------- Lenguaje natural ------------------------- */

export interface Atom {
  id: string;
  aff: string;
  neg: string;
}

/** Proposiciones simples de uso cotidiano (texto original, sin verdad matemática implicada). */
export const ATOMS: readonly Atom[] = [
  { id: "llueve", aff: "hoy llueve", neg: "hoy no llueve" },
  { id: "estudio", aff: "estudio", neg: "no estudio" },
  { id: "tiempo", aff: "tengo tiempo", neg: "no tengo tiempo" },
  { id: "calor", aff: "hace calor", neg: "no hace calor" },
  { id: "finca", aff: "voy a la finca", neg: "no voy a la finca" },
  { id: "examen", aff: "el examen es difícil", neg: "el examen no es difícil" },
  { id: "temprano", aff: "me levanto temprano", neg: "no me levanto temprano" },
  { id: "colectivo", aff: "el colectivo llega a horario", neg: "el colectivo no llega a horario" },
  { id: "guia", aff: "resuelvo la guía", neg: "no resuelvo la guía" },
  { id: "clase", aff: "hay clase de matemática", neg: "no hay clase de matemática" },
];

export type SentenceShape =
  | "binary-lits"
  | "imp-antecedent-compound"
  | "imp-consequent-compound"
  | "not-compound";

export interface Sentence {
  formula: Prop;
  text: string;
  /** Variable -> átomo, en orden de aparición (p, q, r…). */
  atoms: { variable: string; atom: Atom }[];
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function litText(a: Atom, negated: boolean): string {
  return negated ? a.neg : a.aff;
}

function renderBinary(kind: BinaryKind, a: string, b: string): string {
  switch (kind) {
    case "and":
      return `${a} y ${b}`;
    case "or":
      return `${a} o ${b}`;
    case "iff":
      return `${a} si y solo si ${b}`;
    default:
      throw new Error("Conectivo no soportado en lenguaje natural");
  }
}

/**
 * Genera una oración en español y su simbolización exacta. Las variables se asignan
 * en orden de aparición. Las formas con 3 átomos usan coma para evitar ambigüedad.
 */
export function randomSentence(
  rng: Rng,
  shape: SentenceShape,
  opts: { allowNegLits: boolean; varNames: readonly string[] },
): Sentence {
  const n = shape === "binary-lits" ? 2 : 3;
  const atoms = rng.sample(ATOMS, n);
  const vars = opts.varNames.slice(0, n);
  const neg = (): boolean => opts.allowNegLits && rng.next() < 0.4;
  const lit = (i: number, negated: boolean): { f: Prop; t: string } => ({
    f: negated ? not(V(vars[i])) : V(vars[i]),
    t: litText(atoms[i], negated),
  });
  const pair = rng.pick(["and", "or"] as const);
  let formula: Prop;
  let text: string;

  if (shape === "binary-lits") {
    const kind = rng.pick(CARTILLA_KINDS);
    const a = lit(0, neg());
    const b = lit(1, neg());
    if (kind === "imp") {
      formula = imp(a.f, b.f);
      text = `Si ${a.t}, entonces ${b.t}`;
    } else {
      formula = { and, or, iff }[kind](a.f, b.f);
      text = renderBinary(kind, a.t, b.t);
    }
  } else if (shape === "imp-antecedent-compound") {
    const a = lit(0, neg());
    const b = lit(1, neg());
    const c = lit(2, neg());
    formula = imp({ and, or }[pair](a.f, b.f), c.f);
    text = `Si ${renderBinary(pair, a.t, b.t)}, entonces ${c.t}`;
  } else if (shape === "imp-consequent-compound") {
    const a = lit(0, neg());
    const b = lit(1, neg());
    const c = lit(2, neg());
    formula = imp(a.f, { and, or }[pair](b.f, c.f));
    text = `Si ${a.t}, entonces ${renderBinary(pair, b.t, c.t)}`;
  } else {
    // not-compound: dentro del "No es cierto que" solo literales afirmativos.
    const a = lit(0, false);
    const b = lit(1, false);
    formula = not({ and, or }[pair](a.f, b.f));
    text = `No es cierto que ${renderBinary(pair, a.t, b.t)}`;
  }
  return {
    formula,
    text: `${cap(text)}.`,
    atoms: atoms.map((atom, i) => ({ variable: vars[i], atom })),
  };
}

/** Formas de oración disponibles por dificultad. */
export function sentenceShapesFor(difficulty: Difficulty): SentenceShape[] {
  switch (difficulty) {
    case "facil":
    case "intermedio":
      return ["binary-lits"];
    case "dificil":
      return ["imp-antecedent-compound", "imp-consequent-compound"];
    case "avanzado":
      return ["imp-antecedent-compound", "imp-consequent-compound", "not-compound"];
  }
}
