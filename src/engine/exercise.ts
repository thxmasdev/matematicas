import type { Rng } from "@/engine/core/rng";
import type { Difficulty } from "@/types/module";

/** Valor serializable de un parámetro de ejercicio. */
export type ParamValue = string | number | boolean | readonly string[];

/** Tipo de respuesta que espera el ejercicio (define el control de entrada y la corrección). */
export type AnswerSpec =
  | { type: "truth-value" }
  | { type: "truth-column"; rows: number }
  | { type: "formula" }
  | { type: "choice"; options: readonly string[] };

export interface Step {
  text: string;
  latex?: string;
}

/** Ejercicio producido por un generador, antes de asignarle identidad de instancia. */
export interface ExerciseDraft {
  templateId: string;
  moduleId: number;
  topicId: string;
  difficulty: Difficulty;
  /** Parámetros usados (serializables y suficientes para re-verificar el ejercicio). */
  params: Record<string, ParamValue>;
  /** Enunciado; las fórmulas van entre `$...$` (LaTeX/KaTeX). */
  statement: string;
  answerSpec: AnswerSpec;
  /** Respuesta correcta canónica. */
  correctAnswer: string;
  /** Restricciones matemáticas aplicadas al generar. */
  constraints: string[];
  /** Pistas de menos a más específicas. Nunca revelan la respuesta final. */
  hints: string[];
  steps: Step[];
  explanation: string;
  /** Huella normalizada del problema matemático (entrada del servicio antirrepetición). */
  fingerprint: string;
}

export interface GeneratedExercise extends ExerciseDraft {
  instanceId: string;
  seed: string;
}

export type CheckStatus = "correct" | "equivalent" | "incorrect" | "invalid";

export interface CheckResult {
  status: CheckStatus;
  /** Solo `correct` cuenta como acierto. */
  accepted: boolean;
  message: string;
}

export const correct = (message = "¡Correcto!"): CheckResult => ({
  status: "correct",
  accepted: true,
  message,
});
export const incorrect = (message: string): CheckResult => ({
  status: "incorrect",
  accepted: false,
  message,
});
export const invalid = (message: string): CheckResult => ({
  status: "invalid",
  accepted: false,
  message,
});
export const equivalentButNotExpected = (message: string): CheckResult => ({
  status: "equivalent",
  accepted: false,
  message,
});

export interface ExerciseTemplate {
  id: string;
  moduleId: number;
  topicId: string;
  title: string;
  /** Niveles que esta plantilla soporta con parámetros matemáticos reales. */
  difficulties: readonly Difficulty[];
  generate(rng: Rng, difficulty: Difficulty): ExerciseDraft;
  check(exercise: GeneratedExercise, input: string): CheckResult;
  /**
   * Verificación independiente: recalcula la respuesta por otro camino a partir de los
   * parámetros. Devuelve la lista de problemas encontrados (vacía = válido).
   */
  verify(exercise: GeneratedExercise): string[];
}

export const makeFingerprint = (templateId: string, key: string): string => `${templateId}:${key}`;
