import { parseFormula } from "@/engine/logic/parser";
import type { Prop } from "@/engine/logic/proposition";

/**
 * Evaluador de REFERENCIA, escrito aparte de `evaluate()` del motor: usa las tablas de
 * los conectivos como cadenas (filas pq = VV, VF, FV, FF). Sirve para verificar ejercicios
 * por un camino de cálculo distinto al del generador.
 */
const TABLE = { and: "VFFF", or: "VVVF", imp: "VFVV", iff: "VFFV", xor: "FVVF" } as const;

export function refEval(p: Prop, env: Record<string, "V" | "F">): "V" | "F" {
  if (p.k === "var") {
    const v = env[p.name];
    if (v === undefined) throw new Error(`Falta valor de ${p.name}`);
    return v;
  }
  if (p.k === "not") return refEval(p.a, env) === "V" ? "F" : "V";
  const a = refEval(p.a, env);
  const b = refEval(p.b, env);
  const idx = (a === "V" ? 0 : 2) + (b === "V" ? 0 : 1);
  return TABLE[p.k][idx] as "V" | "F";
}

export function refVariables(p: Prop): string[] {
  if (p.k === "var") return [p.name];
  if (p.k === "not") return refVariables(p.a);
  return [...refVariables(p.a), ...refVariables(p.b)];
}

/** Columna de resultado con las filas ordenadas VV…V → FF…F, calculada por producto cartesiano. */
export function refColumn(p: Prop): string {
  const vars = [...new Set(refVariables(p))].sort();
  let envs: Record<string, "V" | "F">[] = [{}];
  for (const v of vars) {
    envs = envs.flatMap((e) => [
      { ...e, [v]: "V" as const },
      { ...e, [v]: "F" as const },
    ]);
  }
  return envs.map((e) => refEval(p, e)).join("");
}

export function refClassify(p: Prop): "Tautología" | "Contradicción" | "Contingencia" {
  const col = refColumn(p);
  if (!col.includes("F")) return "Tautología";
  if (!col.includes("V")) return "Contradicción";
  return "Contingencia";
}

/** "p=V,q=F" -> { p: "V", q: "F" } */
export function parseAssignment(text: string): Record<string, "V" | "F"> {
  const env: Record<string, "V" | "F"> = {};
  for (const part of text.split(",")) {
    const [k, v] = part.split("=");
    if (!k || (v !== "V" && v !== "F")) throw new Error(`Asignación inválida: ${part}`);
    env[k] = v;
  }
  return env;
}

export const parseParamFormula = (text: unknown): Prop => parseFormula(String(text));
