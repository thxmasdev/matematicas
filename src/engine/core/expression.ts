import { AppError } from "@/lib/errors";
import { Fraction } from "./fraction";

/** Límites defensivos para entrada del usuario. */
export const MAX_EXPRESSION_LENGTH = 200;

type Token =
  | { t: "num"; v: Fraction }
  | { t: "op"; v: "+" | "-" | "*" | "/" | "^" | "(" | ")" };

function invalid(msg: string): never {
  throw new AppError("VALIDATION_FAILED", msg);
}

function tokenize(input: string): Token[] {
  const s = input
    .replace(/\u2212/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/");
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") {
      i++;
    } else if (/\d/.test(c)) {
      let j = i;
      while (j < s.length && /[\d.,]/.test(s[j])) j++;
      const f = Fraction.parse(s.slice(i, j));
      if (!f) invalid(`Número inválido: "${s.slice(i, j)}".`);
      tokens.push({ t: "num", v: f });
      i = j;
    } else if ("+-*/^()".includes(c)) {
      tokens.push({ t: "op", v: c as "+" });
      i++;
    } else {
      invalid(`Carácter no permitido: "${c}".`);
    }
  }
  return tokens;
}

/**
 * Evalúa una expresión numérica exacta (+ − × ÷ ^ y paréntesis) con fracciones.
 * Parser descendente recursivo propio: NO usa eval ni Function.
 * Exponentes: solo enteros. Lanza AppError(VALIDATION_FAILED | MATH_INVALID_DOMAIN).
 */
export function evaluateExpression(input: string): Fraction {
  if (input.length > MAX_EXPRESSION_LENGTH) invalid("La expresión es demasiado larga.");
  const tokens = tokenize(input);
  if (tokens.length === 0) invalid("La expresión está vacía.");
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];
  const isOp = (v: string): boolean => {
    const k = peek();
    return k !== undefined && k.t === "op" && k.v === v;
  };

  function expr(): Fraction {
    let acc = term();
    while (isOp("+") || isOp("-")) {
      const op = (tokens[pos++] as { v: string }).v;
      const rhs = term();
      acc = op === "+" ? acc.add(rhs) : acc.sub(rhs);
    }
    return acc;
  }
  function term(): Fraction {
    let acc = unary();
    while (isOp("*") || isOp("/")) {
      const op = (tokens[pos++] as { v: string }).v;
      const rhs = unary();
      acc = op === "*" ? acc.mul(rhs) : acc.div(rhs);
    }
    return acc;
  }
  function unary(): Fraction {
    if (isOp("-")) {
      pos++;
      return unary().neg();
    }
    if (isOp("+")) {
      pos++;
      return unary();
    }
    return power();
  }
  function power(): Fraction {
    const base = atom();
    if (isOp("^")) {
      pos++;
      const exp = unary();
      if (!exp.isInteger()) invalid("Solo se admiten exponentes enteros.");
      const e = Number(exp.num);
      return base.pow(e);
    }
    return base;
  }
  function atom(): Fraction {
    const k = peek();
    if (!k) invalid("La expresión está incompleta.");
    if (k.t === "num") {
      pos++;
      return k.v;
    }
    if (k.v === "(") {
      pos++;
      const v = expr();
      if (!isOp(")")) invalid("Falta cerrar un paréntesis.");
      pos++;
      return v;
    }
    return invalid(`Símbolo inesperado: "${k.v}".`);
  }

  const result = expr();
  if (pos < tokens.length) invalid("Sobran símbolos al final de la expresión.");
  return result;
}

/** Interpreta la respuesta de un estudiante: acepta "3/4", "0,75", "1 1/2" o una expresión. */
export function parseAnswer(input: string): Fraction | null {
  const direct = Fraction.parse(input);
  if (direct) return direct;
  try {
    return evaluateExpression(input);
  } catch {
    return null;
  }
}
