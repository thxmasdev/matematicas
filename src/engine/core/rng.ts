/**
 * Generador pseudoaleatorio determinista (mulberry32 + hash de cadena xmur3).
 * Misma semilla => misma secuencia. Permite reproducir cualquier ejercicio y test.
 */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export class Rng {
  private state: number;
  readonly seed: string;

  constructor(seed: string | number) {
    this.seed = String(seed);
    this.state = xmur3(this.seed)();
  }

  /** Flotante en [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Entero uniforme en [min, max] (ambos inclusive). */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new RangeError(`Rango inválido [${min}, ${max}]`);
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }

  bool(): boolean {
    return this.next() < 0.5;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError("No se puede elegir de una lista vacía");
    return items[this.int(0, items.length - 1)];
  }

  /** Mezcla Fisher–Yates (devuelve copia). */
  shuffle<T>(items: readonly T[]): T[] {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Subconjunto aleatorio sin repetición de `count` elementos. */
  sample<T>(items: readonly T[], count: number): T[] {
    if (count > items.length) throw new RangeError("count mayor que la cantidad disponible");
    return this.shuffle(items).slice(0, count);
  }
}
