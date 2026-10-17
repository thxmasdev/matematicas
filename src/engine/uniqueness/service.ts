import { Rng } from "@/engine/core/rng";
import type { ExerciseTemplate, GeneratedExercise } from "@/engine/exercise";
import { generateVerified, templatesForModule, templatesForTopic } from "@/generators/registry";
import { AppError } from "@/lib/errors";
import { HistoryRepository } from "@/storage/repositories";
import type { Difficulty } from "@/types/module";

export type UniquenessPolicy = "strict" | "session-only" | "review";

export interface UniquenessOptions {
  sessionId: string;
  moduleId: number;
  topicId?: string;
  difficulty: Difficulty;
  policy?: UniquenessPolicy;
  baseSeed?: string;
  maxAttemptsPerTemplate?: number;
}

export interface NextExerciseResult {
  exercise: GeneratedExercise;
  template: ExerciseTemplate;
  isReview: boolean;
  policyUsed: UniquenessPolicy;
}

export class ExerciseUniquenessService {
  // Huellas presentadas en memoria por sesión
  private readonly sessionFingerprints = new Map<string, Set<string>>();

  constructor(private readonly historyRepo: HistoryRepository = new HistoryRepository()) {}

  // Marca una huella como vista en la sesión activa
  markAsPresented(sessionId: string, fingerprint: string): void {
    let set = this.sessionFingerprints.get(sessionId);
    if (!set) {
      set = new Set<string>();
      this.sessionFingerprints.set(sessionId, set);
    }
    set.add(fingerprint);
  }

  // Comprueba si una huella ya se presentó en la sesión
  hasBeenPresentedInSession(sessionId: string, fingerprint: string): boolean {
    return this.sessionFingerprints.get(sessionId)?.has(fingerprint) ?? false;
  }

  // Limpia el caché en memoria de la sesión
  clearSession(sessionId: string): void {
    this.sessionFingerprints.delete(sessionId);
  }

  // Siguiente ejercicio aplicando política de repetición
  async getNextExercise(options: UniquenessOptions): Promise<NextExerciseResult> {
    const {
      sessionId,
      moduleId,
      topicId,
      difficulty,
      policy = "strict",
      baseSeed = Date.now().toString(),
      maxAttemptsPerTemplate = 20,
    } = options;

    // 1. Obtener plantillas candidatas para el módulo/tema y dificultad
    const allTemplates = topicId
      ? templatesForTopic(moduleId, topicId)
      : templatesForModule(moduleId);

    const eligibleTemplates = allTemplates.filter((t) => t.difficulties.includes(difficulty));

    if (eligibleTemplates.length === 0) {
      throw new AppError(
        "CONTENT_NOT_FOUND",
        `No hay plantillas disponibles para el módulo ${moduleId}${topicId ? `, tema ${topicId}` : ""} en dificultad "${difficulty}".`,
      );
    }

    // 2. Obtener historial del módulo para saber qué fue resuelto correctamente y qué no
    let historyRecords: import("@/storage/types").ExerciseHistoryRecord[] = [];
    try {
      historyRecords = await this.historyRepo.listByModule(moduleId);
    } catch {
      // Si IndexedDB no está disponible, operamos solo con la memoria de la sesión
      historyRecords = [];
    }

    const correctFingerprints = new Set<string>();
    const incorrectFingerprints = new Set<string>();

    for (const rec of historyRecords) {
      if (rec.correct) {
        correctFingerprints.add(rec.fingerprint);
      } else {
        incorrectFingerprints.add(rec.fingerprint);
      }
    }

    const sessionSet = this.sessionFingerprints.get(sessionId) ?? new Set<string>();

    // 3. Selección y generación según la política
    const rng = new Rng(baseSeed);
    const shuffledTemplates = rng.shuffle([...eligibleTemplates]);

    // Función auxiliar para intentar generar una variante aceptada
    const tryGenerateWithPolicy = (
      currentPolicy: UniquenessPolicy,
    ): NextExerciseResult | null => {
      for (const template of shuffledTemplates) {
        for (let attempt = 0; attempt < maxAttemptsPerTemplate; attempt++) {
          const seed = `${baseSeed}#${template.id}#${currentPolicy}#${attempt}`;
          let verified;
          try {
            verified = generateVerified(template, seed, difficulty);
          } catch {
            continue;
          }

          const { exercise } = verified;
          const fp = exercise.fingerprint;

          // Regla inquebrantable 1: NUNCA repetir en la misma sesión
          if (sessionSet.has(fp)) {
            continue;
          }

          if (currentPolicy === "strict") {
            // No repetir ejercicios resueltos correctamente previamente
            if (correctFingerprints.has(fp)) {
              continue;
            }
            // Aceptado bajo política estricta
            this.markAsPresented(sessionId, fp);
            return {
              exercise,
              template,
              isReview: false,
              policyUsed: "strict",
            };
          } else if (currentPolicy === "review") {
            // En modo repaso, priorizamos variantes con huella previamente errónea
            const isHistoricalError = incorrectFingerprints.has(fp);
            if (isHistoricalError || !correctFingerprints.has(fp)) {
              this.markAsPresented(sessionId, fp);
              return {
                exercise,
                template,
                isReview: isHistoricalError,
                policyUsed: "review",
              };
            }
          } else {
            // "session-only": solo exige no repetir dentro de la sesión actual
            this.markAsPresented(sessionId, fp);
            return {
              exercise,
              template,
              isReview: false,
              policyUsed: "session-only",
            };
          }
        }
      }
      return null;
    };

    // Intentamos primero con la política solicitada
    const result = tryGenerateWithPolicy(policy);
    if (result) return result;

    // Si falló bajo "strict" o "review" porque el espacio disponible ya fue resuelto,
    // relajamos ordenadamente a "session-only" (nunca repite dentro de la misma sesión).
    if (policy === "strict" || policy === "review") {
      const fallbackResult = tryGenerateWithPolicy("session-only");
      if (fallbackResult) return fallbackResult;
    }

    // Si aún así no hay variantes nuevas (la sesión agotó todas las variantes posibles de estas plantillas)
    throw new AppError(
      "GENERATION_EXHAUSTED",
      `Se han agotado las variantes únicas disponibles en esta sesión para el módulo ${moduleId} con dificultad "${difficulty}". Intentá con otro tema o nivel de dificultad.`,
    );
  }
}
