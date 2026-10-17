import { Fraction } from "@/engine/core/fraction";

export type BoundaryType = "open" | "closed";

export interface Endpoint {
  value: number; // For finite, numeric value; for infinite: -Infinity or Infinity
  type: BoundaryType;
}

export interface RealInterval {
  left: Endpoint;
  right: Endpoint;
  empty?: boolean;
}

/**
 * Crea un intervalo real.
 * Si left.value > right.value, o left.value === right.value y alguno es open, es vacío.
 */
export function makeInterval(
  leftVal: number,
  leftType: BoundaryType,
  rightVal: number,
  rightType: BoundaryType,
): RealInterval {
  if (leftVal > rightVal) {
    return {
      left: { value: 0, type: "open" },
      right: { value: 0, type: "open" },
      empty: true,
    };
  }
  if (leftVal === rightVal && (leftType === "open" || rightType === "open")) {
    return {
      left: { value: leftVal, type: "open" },
      right: { value: rightVal, type: "open" },
      empty: true,
    };
  }
  return {
    left: { value: leftVal, type: leftVal === -Infinity ? "open" : leftType },
    right: { value: rightVal, type: rightVal === Infinity ? "open" : rightType },
    empty: false,
  };
}

export function intervalIntersection(a: RealInterval, b: RealInterval): RealInterval {
  if (a.empty || b.empty) {
    return makeInterval(1, "open", 0, "open");
  }

  // max of left endpoints
  let leftVal: number;
  let leftType: BoundaryType;
  if (a.left.value > b.left.value) {
    leftVal = a.left.value;
    leftType = a.left.type;
  } else if (b.left.value > a.left.value) {
    leftVal = b.left.value;
    leftType = b.left.type;
  } else {
    leftVal = a.left.value;
    // Both same value: closed only if both closed
    leftType = a.left.type === "closed" && b.left.type === "closed" ? "closed" : "open";
  }

  // min of right endpoints
  let rightVal: number;
  let rightType: BoundaryType;
  if (a.right.value < b.right.value) {
    rightVal = a.right.value;
    rightType = a.right.type;
  } else if (b.right.value < a.right.value) {
    rightVal = b.right.value;
    rightType = b.right.type;
  } else {
    rightVal = a.right.value;
    rightType = a.right.type === "closed" && b.right.type === "closed" ? "closed" : "open";
  }

  return makeInterval(leftVal, leftType, rightVal, rightType);
}

export function intervalToText(inv: RealInterval): string {
  if (inv.empty) return "∅";
  const leftBracket = inv.left.type === "closed" ? "[" : "(";
  const rightBracket = inv.right.type === "closed" ? "]" : ")";
  const leftStr = inv.left.value === -Infinity ? "-inf" : String(inv.left.value);
  const rightStr = inv.right.value === Infinity ? "+inf" : String(inv.right.value);
  return `${leftBracket}${leftStr}, ${rightStr}${rightBracket}`;
}

export function intervalToLatex(inv: RealInterval): string {
  if (inv.empty) return "\\emptyset";
  const leftBracket = inv.left.type === "closed" ? "[" : "(";
  const rightBracket = inv.right.type === "closed" ? "]" : ")";
  const leftStr = inv.left.value === -Infinity ? "-\\infty" : String(inv.left.value);
  const rightStr = inv.right.value === Infinity ? "+\\infty" : String(inv.right.value);
  return `${leftBracket}${leftStr}, ${rightStr}${rightBracket}`;
}

/**
 * Parsea un intervalo escrito por el estudiante, e.g. "[2, 5)", "(-inf, 3]", "∅", "vacio", "empty".
 */
export function parseInterval(input: string): RealInterval | null {
  const clean = input.trim().toLowerCase().replace(/\s+/g, "");
  if (clean === "∅" || clean === "vacio" || clean === "vacío" || clean === "empty" || clean === "{}") {
    return makeInterval(1, "open", 0, "open");
  }

  const match = /^([[(])([+-]?\d+(?:\.\d+)?|-inf|\\-infty|infty|\+?inf),([+-]?\d+(?:\.\d+)?|\+?inf|inf|\\infty)([\])])$/.exec(clean);
  if (!match) return null;

  const leftBracket = match[1];
  const rawLeftVal = match[2];
  const rawRightVal = match[3];
  const rightBracket = match[4];

  let leftVal: number;
  if (rawLeftVal === "-inf" || rawLeftVal === "-\\infty") {
    leftVal = -Infinity;
  } else {
    const parsed = Fraction.parse(rawLeftVal);
    if (!parsed) return null;
    leftVal = parsed.toNumber();
  }

  let rightVal: number;
  if (rawRightVal === "inf" || rawRightVal === "+inf" || rawRightVal === "\\infty" || rawRightVal === "+\\infty") {
    rightVal = Infinity;
  } else {
    const parsed = Fraction.parse(rawRightVal);
    if (!parsed) return null;
    rightVal = parsed.toNumber();
  }

  const leftType: BoundaryType = leftBracket === "[" ? "closed" : "open";
  const rightType: BoundaryType = rightBracket === "]" ? "closed" : "open";

  return makeInterval(leftVal, leftType, rightVal, rightType);
}

export function intervalsEqual(a: RealInterval, b: RealInterval): boolean {
  if (a.empty && b.empty) return true;
  if (a.empty !== b.empty) return false;
  return (
    a.left.value === b.left.value &&
    a.left.type === b.left.type &&
    a.right.value === b.right.value &&
    a.right.type === b.right.type
  );
}
