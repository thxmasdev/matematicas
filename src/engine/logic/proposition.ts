/** Motor de lógica proposicional: AST, evaluación, tablas de verdad y clasificación. */

export type Prop =
  | { k: "var"; name: string }
  | { k: "not"; a: Prop }
  | { k: "and" | "or" | "imp" | "iff" | "xor"; a: Prop; b: Prop };

export type BinaryKind = "and" | "or" | "imp" | "iff" | "xor";

export const V = (name: string): Prop => ({ k: "var", name });
export const not = (a: Prop): Prop => ({ k: "not", a });
export const and = (a: Prop, b: Prop): Prop => ({ k: "and", a, b });
export const or = (a: Prop, b: Prop): Prop => ({ k: "or", a, b });
export const imp = (a: Prop, b: Prop): Prop => ({ k: "imp", a, b });
export const iff = (a: Prop, b: Prop): Prop => ({ k: "iff", a, b });
export const xor = (a: Prop, b: Prop): Prop => ({ k: "xor", a, b });

export type Env = Readonly<Record<string, boolean>>;

export function evaluate(p: Prop, env: Env): boolean {
  switch (p.k) {
    case "var": {
      const v = env[p.name];
      if (v === undefined) throw new Error(`Variable sin valor: ${p.name}`);
      return v;
    }
    case "not":
      return !evaluate(p.a, env);
    case "and":
      return evaluate(p.a, env) && evaluate(p.b, env);
    case "or":
      return evaluate(p.a, env) || evaluate(p.b, env);
    case "imp":
      return !evaluate(p.a, env) || evaluate(p.b, env);
    case "iff":
      return evaluate(p.a, env) === evaluate(p.b, env);
    case "xor":
      return evaluate(p.a, env) !== evaluate(p.b, env);
  }
}

/** Variables en orden alfabético, sin repetir. */
export function variablesOf(p: Prop): string[] {
  const set = new Set<string>();
  const walk = (q: Prop): void => {
    if (q.k === "var") set.add(q.name);
    else if (q.k === "not") walk(q.a);
    else {
      walk(q.a);
      walk(q.b);
    }
  };
  walk(p);
  return [...set].sort();
}

/** Todas las asignaciones, en el orden clásico: VV…V primero, FF…F al final. */
export function assignments(vars: readonly string[]): Env[] {
  const n = vars.length;
  const out: Env[] = [];
  for (let i = 0; i < 2 ** n; i++) {
    const env: Record<string, boolean> = {};
    vars.forEach((name, idx) => {
      env[name] = ((i >> (n - 1 - idx)) & 1) === 0;
    });
    out.push(env);
  }
  return out;
}

/** Máximo de variables admitido en una tabla (2^6 = 64 filas). */
export const MAX_TRUTH_TABLE_VARS = 6;

/** Texto canónico (ASCII-seguro, completamente parentizado salvo el nivel superior). */
export function toText(p: Prop, top = true): string {
  switch (p.k) {
    case "var":
      return p.name;
    case "not":
      return `~${toText(p.a, false)}`;
    default: {
      const sym = { and: "∧", or: "∨", imp: "→", iff: "↔", xor: "⊻" }[p.k];
      const s = `${toText(p.a, false)} ${sym} ${toText(p.b, false)}`;
      return top ? s : `(${s})`;
    }
  }
}

export function toLatex(p: Prop, top = true): string {
  switch (p.k) {
    case "var":
      return p.name;
    case "not":
      return `\\neg ${toLatex(p.a, false)}`;
    default: {
      const sym = {
        and: "\\land",
        or: "\\lor",
        imp: "\\Rightarrow",
        iff: "\\Leftrightarrow",
        xor: "\\veebar",
      }[p.k];
      const s = `${toLatex(p.a, false)} ${sym} ${toLatex(p.b, false)}`;
      return top ? s : `(${s})`;
    }
  }
}

/** Subfórmulas no triviales en orden de evaluación (hijos antes que padres), sin repetir. */
export function subformulas(p: Prop): Prop[] {
  const seen = new Set<string>();
  const out: Prop[] = [];
  const walk = (q: Prop): void => {
    if (q.k === "var") return;
    if (q.k === "not") walk(q.a);
    else {
      walk(q.a);
      walk(q.b);
    }
    const key = toText(q);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(q);
    }
  };
  walk(p);
  return out;
}

export interface TruthTable {
  variables: string[];
  /** Columnas: variables y luego subfórmulas; la última es la fórmula completa. */
  columns: Prop[];
  rows: { env: Env; values: boolean[]; result: boolean }[];
}

export function truthTable(p: Prop): TruthTable {
  const vars = variablesOf(p);
  if (vars.length > MAX_TRUTH_TABLE_VARS) {
    throw new RangeError(`Demasiadas variables (${vars.length}) para una tabla de verdad.`);
  }
  const subs = subformulas(p);
  const columns = [...vars.map(V), ...subs];
  const rows = assignments(vars).map((env) => {
    const values = columns.map((c) => evaluate(c, env));
    return { env, values, result: evaluate(p, env) };
  });
  return { variables: vars, columns, rows };
}

export type Classification = "tautologia" | "contradiccion" | "contingencia";

export function classify(p: Prop): Classification {
  const results = assignments(variablesOf(p)).map((e) => evaluate(p, e));
  if (results.every(Boolean)) return "tautologia";
  if (results.every((r) => !r)) return "contradiccion";
  return "contingencia";
}

/** Dos fórmulas son equivalentes si coinciden en todas las asignaciones de sus variables unidas. */
export function equivalent(a: Prop, b: Prop): boolean {
  const vars = [...new Set([...variablesOf(a), ...variablesOf(b)])].sort();
  return assignments(vars).every((e) => evaluate(a, e) === evaluate(b, e));
}

/** Atajo: cada fila de resultado como cadena "VFVF" (útil para comparar respuestas). */
export function resultColumn(p: Prop): string {
  return truthTable(p)
    .rows.map((r) => (r.result ? "V" : "F"))
    .join("");
}
