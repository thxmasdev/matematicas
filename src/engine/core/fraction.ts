import { AppError } from "@/lib/errors";

const ZERO = BigInt(0);
const ONE = BigInt(1);

function gcd(a: bigint, b: bigint): bigint {
  a = a < ZERO ? -a : a;
  b = b < ZERO ? -b : b;
  while (b !== ZERO) [a, b] = [b, a % b];
  return a;
}

// Límite de exponente en pow
export const MAX_POW_EXPONENT = 64;

// Número racional exacto irreducible con BigInt
export class Fraction {
  readonly num: bigint;
  readonly den: bigint;

  private constructor(num: bigint, den: bigint) {
    this.num = num;
    this.den = den;
  }

  static of(num: bigint | number, den: bigint | number = 1): Fraction {
    const n = typeof num === "number" ? BigInt(assertInt(num)) : num;
    let d = typeof den === "number" ? BigInt(assertInt(den)) : den;
    if (d === ZERO) {
      throw new AppError("MATH_INVALID_DOMAIN", "División por cero: el denominador no puede ser 0.");
    }
    let nn = n;
    if (d < ZERO) {
      nn = -nn;
      d = -d;
    }
    const g = gcd(nn, d);
    return g === ONE || g === ZERO ? new Fraction(nn, d) : new Fraction(nn / g, d / g);
  }

  static readonly ZERO = Fraction.of(0);
  static readonly ONE = Fraction.of(1);

  /**
   * Interpreta texto: entero ("-3"), fracción ("3/4"), decimal ("0,5" o "0.5"),
   * y número mixto ("1 1/2"). Devuelve null si no es válido.
   */
  static parse(text: string): Fraction | null {
    const s = text.trim().replace(/\u2212/g, "-").replace(/\s+/g, " ");
    if (s.length === 0 || s.length > 80) return null;
    const mixed = /^([+-]?)(\d+) (\d+)\/(\d+)$/.exec(s);
    if (mixed) {
      const whole = BigInt(mixed[2]);
      const d = BigInt(mixed[4]);
      if (d === ZERO) return null;
      const f = Fraction.of(whole * d + BigInt(mixed[3]), d);
      return mixed[1] === "-" ? f.neg() : f;
    }
    const frac = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(s);
    if (frac) {
      const d = BigInt(frac[2]);
      return d === ZERO ? null : Fraction.of(BigInt(frac[1]), d);
    }
    const dec = /^([+-]?)(\d+)(?:[.,](\d+))?$/.exec(s);
    if (dec) {
      const decimals = dec[3] ?? "";
      const f = Fraction.of(BigInt(dec[2] + decimals), BigInt("1" + "0".repeat(decimals.length)));
      return dec[1] === "-" ? f.neg() : f;
    }
    return null;
  }

  add(o: Fraction): Fraction {
    return Fraction.of(this.num * o.den + o.num * this.den, this.den * o.den);
  }
  sub(o: Fraction): Fraction {
    return Fraction.of(this.num * o.den - o.num * this.den, this.den * o.den);
  }
  mul(o: Fraction): Fraction {
    return Fraction.of(this.num * o.num, this.den * o.den);
  }
  div(o: Fraction): Fraction {
    if (o.num === ZERO) {
      throw new AppError("MATH_INVALID_DOMAIN", "División por cero.");
    }
    return Fraction.of(this.num * o.den, this.den * o.num);
  }
  neg(): Fraction {
    return new Fraction(-this.num, this.den);
  }
  abs(): Fraction {
    return this.num < ZERO ? this.neg() : this;
  }
  inv(): Fraction {
    return Fraction.ONE.div(this);
  }

  // Potencia entera
  pow(exp: number): Fraction {
    assertInt(exp);
    if (Math.abs(exp) > MAX_POW_EXPONENT) {
      throw new AppError("MATH_INVALID_DOMAIN", `Exponente demasiado grande (máx. ${MAX_POW_EXPONENT}).`);
    }
    if (this.num === ZERO && exp <= 0) {
      throw new AppError("MATH_INVALID_DOMAIN", "0 elevado a un exponente no positivo no está definido.");
    }
    const e = Math.abs(exp);
    let n = ONE;
    let d = ONE;
    for (let i = 0; i < e; i++) {
      n *= this.num;
      d *= this.den;
    }
    return exp >= 0 ? Fraction.of(n, d) : Fraction.of(d, n);
  }

  cmp(o: Fraction): -1 | 0 | 1 {
    const l = this.num * o.den;
    const r = o.num * this.den;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  equals(o: Fraction): boolean {
    return this.num === o.num && this.den === o.den;
  }
  isInteger(): boolean {
    return this.den === ONE;
  }
  isZero(): boolean {
    return this.num === ZERO;
  }
  sign(): -1 | 0 | 1 {
    return this.num < ZERO ? -1 : this.num > ZERO ? 1 : 0;
  }

  toNumber(): number {
    return Number(this.num) / Number(this.den);
  }
  toString(): string {
    return this.isInteger() ? this.num.toString() : `${this.num}/${this.den}`;
  }
  toLatex(): string {
    if (this.isInteger()) return this.num.toString();
    const sign = this.num < ZERO ? "-" : "";
    return `${sign}\\frac{${this.num < ZERO ? -this.num : this.num}}{${this.den}}`;
  }
}

function assertInt(n: number): number {
  if (!Number.isSafeInteger(n)) {
    throw new AppError("MATH_INVALID_DOMAIN", `Se esperaba un entero seguro y llegó ${n}.`);
  }
  return n;
}
