export const CONTENT_SCHEMA_VERSION = 1;

export type Difficulty = "facil" | "intermedio" | "dificil" | "avanzado";

export const DIFFICULTIES: readonly Difficulty[] = [
  "facil",
  "intermedio",
  "dificil",
  "avanzado",
] as const;

export interface Topic {
  id: string;
  title: string;
  /** Subtemas tal como figuran en el índice de la cartilla. */
  subtopics: string[];
}

export interface MathModule {
  schemaVersion: number;
  id: string;
  order: number;
  /** Número de unidad en la cartilla. */
  unit: number;
  slug: string;
  title: string;
  description: string;
  topics: Topic[];
}
