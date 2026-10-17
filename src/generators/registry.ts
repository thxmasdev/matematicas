import { Rng } from "@/engine/core/rng";
import type { ExerciseTemplate, GeneratedExercise } from "@/engine/exercise";
import { AppError } from "@/lib/errors";
import type { Difficulty } from "@/types/module";
import { ALGEBRA_TEMPLATES } from "./algebra/templates";
import { FUNCTIONS_TEMPLATES } from "./functions/templates";
import { GEOMETRY_TEMPLATES } from "./geometry/templates";
import { LOGIC_TEMPLATES } from "./logic/templates";
import { NUMBERS_TEMPLATES } from "./numbers/templates";
import { SETS_TEMPLATES } from "./sets/templates";
import { TRIGONOMETRY_TEMPLATES } from "./trigonometry/templates";

// Registro de plantillas con resolución verificada
export const TEMPLATES: readonly ExerciseTemplate[] = [
  ...LOGIC_TEMPLATES,
  ...SETS_TEMPLATES,
  ...NUMBERS_TEMPLATES,
  ...FUNCTIONS_TEMPLATES,
  ...ALGEBRA_TEMPLATES,
  ...GEOMETRY_TEMPLATES,
  ...TRIGONOMETRY_TEMPLATES,
];

export const getTemplate = (id: string): ExerciseTemplate | undefined =>
  TEMPLATES.find((t) => t.id === id);

export const templatesForModule = (moduleId: number): ExerciseTemplate[] =>
  TEMPLATES.filter((t) => t.moduleId === moduleId);

export const templatesForTopic = (moduleId: number, topicId: string): ExerciseTemplate[] =>
  TEMPLATES.filter((t) => t.moduleId === moduleId && t.topicId === topicId);

// Límite de reintentos para evitar bucles infinitos
export const MAX_GENERATION_ATTEMPTS = 25;

export interface VerifiedExercise {
  exercise: GeneratedExercise;
  discarded: number;
  discardReasons: string[];
}

// Genera y valida matemáticamente la variante antes de retornarla
export function generateVerified(
  template: ExerciseTemplate,
  seed: string,
  difficulty: Difficulty,
): VerifiedExercise {
  if (!template.difficulties.includes(difficulty)) {
    throw new AppError(
      "VALIDATION_FAILED",
      `La plantilla ${template.id} no admite la dificultad "${difficulty}".`,
    );
  }
  const discardReasons: string[] = [];
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const subSeed = `${seed}#${attempt}`;
    let draft;
    try {
      draft = template.generate(new Rng(subSeed), difficulty);
    } catch (e) {
      discardReasons.push(`generate: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    const exercise: GeneratedExercise = {
      ...draft,
      instanceId: `${template.id}@${subSeed}`,
      seed: subSeed,
    };
    const problems = template.verify(exercise);
    const self = template.check(exercise, exercise.correctAnswer);
    if (!self.accepted) problems.push(`La respuesta correcta no es aceptada: ${self.message}`);
    if (problems.length === 0) {
      return { exercise, discarded: discardReasons.length, discardReasons };
    }
    discardReasons.push(...problems);
  }
  throw new AppError(
    "GENERATION_EXHAUSTED",
    `No se pudo generar una variante válida de ${template.id}.`,
    discardReasons.slice(0, 5),
  );
}
