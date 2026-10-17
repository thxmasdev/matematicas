import { AppError } from "@/lib/errors";
import {
  and,
  iff,
  imp,
  not,
  or,
  V,
  type BinaryKind,
  type Prop,
} from "./proposition";

/**
 * Parser de fórmulas lógicas con las reglas de prioridad de la cartilla (1.2.4):
 *   Nivel 1: ~   (más ligado)
 *   Nivel 2: ∧, ∨ (mismo nivel)
 *   Nivel 3: ⇒
 *   Nivel 4: ⇔   (más débil: se resuelve último)
 * Como ∧ y ∨ comparten nivel, mezclarlos sin paréntesis es AMBIGUO y se rechaza.
 * Encadenar ⇒ o ⇔ sin paréntesis también se rechaza. Nunca se usa eval.
 */

export const MAX_FORMULA_LENGTH = 200;

export type FormulaToken = "(" | ")" | "~" | "∧" | "∨" | "⇒" | "⇔" | string;

const SYMBOLS: [string, FormulaToken][] = [
  ["<->", "⇔"],
  ["<=>", "⇔"],
  ["⟺", "⇔"],
  ["⇔", "⇔"],
  ["↔", "⇔"],
  ["->", "⇒"],
  ["=>", "⇒"],
  ["⟹", "⇒"],
  ["⇒", "⇒"],
  ["→", "⇒"],
  ["∧", "∧"],
  ["^", "∧"],
  ["&", "∧"],
  ["∨", "∨"],
  ["|", "∨"],
  ["~", "~"],
  ["∼", "~"],
  ["¬", "~"],
  ["(", "("],
  [")", ")"],
];

function fail(message: string): never {
  throw new AppError("VALIDATION_FAILED", message);
}

/** Convierte texto en tokens normalizados (variables = una letra minúscula). */
export function tokenizeFormula(text: string): FormulaToken[] {
  if (text.length > MAX_FORMULA_LENGTH) fail("La fórmula es demasiado larga.");
  const tokens: FormulaToken[] = [];
  let i = 0;
  outer: while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    for (const [sym, tok] of SYMBOLS) {
      if (text.startsWith(sym, i)) {
        tokens.push(tok);
        i += sym.length;
        continue outer;
      }
    }
    if (/[a-z]/.test(c)) {
      tokens.push(c);
      i++;
      continue;
    }
    fail(`Carácter no permitido: "${c}".`);
  }
  return tokens;
}

/** Secuencia de operandos y conectivos sin paréntesis (para comparar "misma fórmula, otros paréntesis"). */
export function flatSequence(text: string): string {
  return tokenizeFormula(text)
    .filter((t) => t !== "(" && t !== ")")
    .join("");
}

const BIN_KIND: Record<string, BinaryKind> = { "∧": "and", "∨": "or", "⇒": "imp", "⇔": "iff" };
const BUILD = { and, or, imp, iff } as const;

export function parseFormula(text: string): Prop {
  const tokens = tokenizeFormula(text);
  if (tokens.length === 0) fail("La fórmula está vacía.");
  let pos = 0;
  const peek = (): FormulaToken | undefined => tokens[pos];

  function parseIff(): Prop {
    const left = parseImp();
    if (peek() === "⇔") {
      pos++;
      const right = parseImp();
      if (peek() === "⇔") fail("Expresión ambigua: encadenaste ⇔ sin paréntesis.");
      return iff(left, right);
    }
    return left;
  }
  function parseImp(): Prop {
    const left = parseAndOr();
    if (peek() === "⇒") {
      pos++;
      const right = parseAndOr();
      if (peek() === "⇒") fail("Expresión ambigua: encadenaste ⇒ sin paréntesis.");
      return imp(left, right);
    }
    return left;
  }
  function parseAndOr(): Prop {
    let acc = parseUnary();
    let kind: "∧" | "∨" | null = null;
    while (peek() === "∧" || peek() === "∨") {
      const op = peek() as "∧" | "∨";
      if (kind !== null && kind !== op) {
        fail("Expresión ambigua: ∧ y ∨ tienen el mismo nivel; usá paréntesis para mezclarlos.");
      }
      kind = op;
      pos++;
      const rhs = parseUnary();
      acc = BUILD[BIN_KIND[op] as "and" | "or"](acc, rhs);
    }
    return acc;
  }
  function parseUnary(): Prop {
    const t = peek();
    if (t === undefined) return fail("La fórmula está incompleta.");
    if (t === "~") {
      pos++;
      return not(parseUnary());
    }
    if (t === "(") {
      pos++;
      const inner = parseIff();
      if (peek() !== ")") fail("Falta cerrar un paréntesis.");
      pos++;
      return inner;
    }
    if (/^[a-z]$/.test(t)) {
      pos++;
      return V(t);
    }
    return fail(`Símbolo inesperado: "${t}".`);
  }

  const result = parseIff();
  if (pos < tokens.length) fail(`Símbolo inesperado: "${tokens[pos]}".`);
  return result;
}

export type ParseOutcome = { ok: true; value: Prop } | { ok: false; message: string };

/** Versión sin excepciones para entrada del usuario. */
export function tryParseFormula(text: string): ParseOutcome {
  try {
    return { ok: true, value: parseFormula(text) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Fórmula inválida." };
  }
}
