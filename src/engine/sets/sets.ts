/** Motor de conjuntos finitos (valores inmutables, siempre normalizados: sin repetidos y ordenados). */

export type Elem = number | string;
export type FiniteSet = readonly Elem[];

const cmpElem = (a: Elem, b: Elem): number => {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "number") return -1;
  if (typeof b === "number") return 1;
  return a < b ? -1 : a > b ? 1 : 0;
};

export function makeSet(items: Iterable<Elem>): FiniteSet {
  return [...new Set(items)].sort(cmpElem);
}

export const emptySet: FiniteSet = [];

export const contains = (s: FiniteSet, x: Elem): boolean => s.includes(x);
export const cardinality = (s: FiniteSet): number => s.length;

export const union = (a: FiniteSet, b: FiniteSet): FiniteSet => makeSet([...a, ...b]);
export const intersection = (a: FiniteSet, b: FiniteSet): FiniteSet =>
  makeSet(a.filter((x) => b.includes(x)));
export const difference = (a: FiniteSet, b: FiniteSet): FiniteSet =>
  makeSet(a.filter((x) => !b.includes(x)));
export const symmetricDifference = (a: FiniteSet, b: FiniteSet): FiniteSet =>
  union(difference(a, b), difference(b, a));

/** Complemento respecto de un universo; exige A ⊆ U para ser un complemento bien definido. */
export function complement(a: FiniteSet, universe: FiniteSet): FiniteSet {
  if (!isSubset(a, universe)) {
    throw new RangeError("El conjunto no está contenido en el universo.");
  }
  return difference(universe, a);
}

export const isSubset = (a: FiniteSet, b: FiniteSet): boolean => a.every((x) => b.includes(x));
export const isProperSubset = (a: FiniteSet, b: FiniteSet): boolean =>
  isSubset(a, b) && a.length < b.length;
export const setEquals = (a: FiniteSet, b: FiniteSet): boolean =>
  a.length === b.length && isSubset(a, b);
export const areDisjoint = (a: FiniteSet, b: FiniteSet): boolean => intersection(a, b).length === 0;

export function cartesianProduct(a: FiniteSet, b: FiniteSet): [Elem, Elem][] {
  return a.flatMap((x) => b.map((y): [Elem, Elem] => [x, y]));
}

/** Conjunto potencia (máx. 12 elementos => 4096 subconjuntos). */
export function powerSet(a: FiniteSet): FiniteSet[] {
  if (a.length > 12) throw new RangeError("Conjunto demasiado grande para listar su conjunto potencia.");
  let out: FiniteSet[] = [[]];
  for (const x of a) out = [...out, ...out.map((s) => makeSet([...s, x]))];
  return out.sort((p, q) => p.length - q.length || compareSets(p, q));
}

function compareSets(a: FiniteSet, b: FiniteSet): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const c = cmpElem(a[i], b[i]);
    if (c !== 0) return c;
  }
  return a.length - b.length;
}

export const toLatex = (s: FiniteSet): string =>
  s.length === 0 ? "\\emptyset" : `\\{${s.join(", ")}\\}`;
export const toText = (s: FiniteSet): string => (s.length === 0 ? "∅" : `{${s.join(", ")}}`);

/**
 * Interpreta una respuesta de conjunto escrita por el usuario.
 * Acepta "{1, 2, 3}", "1, 2, 3", "∅", "vacio", "{}" etc.
 * Normaliza y devuelve null si el formato no es válido.
 */
export function parseSet(input: string): FiniteSet | null {
  const s = input.trim();
  if (s.length === 0 || s.length > 200) return null;
  const lower = s.toLowerCase();
  if (lower === "∅" || lower === "{}" || lower === "vacio" || lower === "vacío" || lower === "\\emptyset") {
    return emptySet;
  }
  let inner = s;
  if (inner.startsWith("{") && inner.endsWith("}")) {
    inner = inner.slice(1, -1).trim();
  }
  if (inner.length === 0) return emptySet;

  const parts = inner.split(/[,;\s]+/).filter((p) => p.length > 0);
  const elems: Elem[] = [];
  for (const p of parts) {
    if (/^[+-]?\d+$/.test(p)) {
      const n = parseInt(p, 10);
      if (!Number.isSafeInteger(n)) return null;
      elems.push(n);
    } else if (/^[a-zA-Z0-9_-]+$/.test(p)) {
      elems.push(p);
    } else {
      return null;
    }
  }
  return makeSet(elems);
}

