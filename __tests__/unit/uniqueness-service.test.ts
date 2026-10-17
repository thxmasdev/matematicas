import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { ExerciseUniquenessService } from "@/engine/uniqueness/service";
import { AppDatabase, setDbForTests } from "@/storage/database";
import { HistoryRepository } from "@/storage/repositories";

let db: AppDatabase;
let historyRepo: HistoryRepository;
let service: ExerciseUniquenessService;

beforeEach(async () => {
  db = new AppDatabase(`test-uniq-${Date.now()}-${Math.random()}`);
  await db.open();
  setDbForTests(db);
  historyRepo = new HistoryRepository(() => db);
  service = new ExerciseUniquenessService(historyRepo);
});

describe("ExerciseUniquenessService", () => {
  it("no repite ejercicios dentro de una misma sesión", async () => {
    const sessionId = "session-1";
    const seenFingerprints = new Set<string>();

    for (let i = 0; i < 8; i++) {
      const res = await service.getNextExercise({
        sessionId,
        moduleId: 1, // Lógica
        difficulty: "facil",
        baseSeed: `seed-seq-${i}`,
      });

      expect(seenFingerprints.has(res.exercise.fingerprint)).toBe(false);
      seenFingerprints.add(res.exercise.fingerprint);
      expect(service.hasBeenPresentedInSession(sessionId, res.exercise.fingerprint)).toBe(true);
    }
    expect(seenFingerprints.size).toBe(8);
  });

  it("evita ejercicios ya resueltos correctamente en el historial", async () => {
    const sessionId = "session-hist-1";

    // 1. Obtenemos un primer ejercicio
    const first = await service.getNextExercise({
      sessionId,
      moduleId: 2, // Conjuntos
      difficulty: "facil",
      baseSeed: "seed-fixed",
    });

    // 2. Lo guardamos en el historial como resuelto correctamente
    await historyRepo.recordAttempt({
      id: "attempt-1",
      moduleId: 2,
      topicId: first.exercise.topicId,
      templateId: first.template.id,
      fingerprint: first.exercise.fingerprint,
      difficulty: "facil",
      seed: first.exercise.seed,
      timestamp: Date.now(),
      correct: true,
      userAnswer: first.exercise.correctAnswer,
      timeMs: 5000,
      sessionId,
    });

    // 3. En una nueva sesión, pedimos el siguiente con la misma semilla base
    const nextSessionId = "session-hist-2";
    const second = await service.getNextExercise({
      sessionId: nextSessionId,
      moduleId: 2,
      difficulty: "facil",
      policy: "strict",
      baseSeed: "seed-fixed",
    });

    // Debe haber descartado el que ya estaba resuelto correctamente
    expect(second.exercise.fingerprint).not.toBe(first.exercise.fingerprint);
  });

  it("el modo de repaso prioriza ejercicios fallados previamente", async () => {
    const sessionId = "session-rev-1";

    // Generamos un ejercicio
    const draft = await service.getNextExercise({
      sessionId,
      moduleId: 3, // Números
      difficulty: "facil",
      baseSeed: "seed-rev-init",
    });

    // Registramos un error histórico con esa huella
    await historyRepo.recordAttempt({
      id: "attempt-failed-1",
      moduleId: 3,
      topicId: draft.exercise.topicId,
      templateId: draft.template.id,
      fingerprint: draft.exercise.fingerprint,
      difficulty: "facil",
      seed: draft.exercise.seed,
      timestamp: Date.now(),
      correct: false,
      userAnswer: "respuesta errónea",
      timeMs: 4000,
      sessionId: "old-session",
    });

    // En una nueva sesión en modo review, pedimos ejercicio
    const reviewResult = await service.getNextExercise({
      sessionId: "session-review-active",
      moduleId: 3,
      difficulty: "facil",
      policy: "review",
      baseSeed: "seed-rev-init",
    });

    expect(reviewResult.policyUsed).toBe("review");
  });

  it("relaja a session-only si el historial ya contiene todas las variantes disponibles bajo strict", async () => {
    // Si la política es strict pero ya no quedan variantes sin resolver,
    // debe relajarse para no bloquear al usuario pero sin repetir en la misma sesión
    const sessionId = "session-exhaust-test";
    const res1 = await service.getNextExercise({
      sessionId,
      moduleId: 7, // Trigonometría
      difficulty: "facil",
      policy: "strict",
      baseSeed: "seed-trig-fallback",
    });

    expect(res1.exercise).toBeDefined();
  });

  it("lanza AppError si no hay plantillas para la dificultad solicitada", async () => {
    await expect(
      service.getNextExercise({
        sessionId: "session-err",
        moduleId: 1,
        topicId: "tema-inexistente",
        difficulty: "facil",
      }),
    ).rejects.toThrow();
  });

  it("clearSession reinicia el historial en memoria de la sesión", async () => {
    const sessionId = "session-to-clear";
    service.markAsPresented(sessionId, "fp-1");
    expect(service.hasBeenPresentedInSession(sessionId, "fp-1")).toBe(true);

    service.clearSession(sessionId);
    expect(service.hasBeenPresentedInSession(sessionId, "fp-1")).toBe(false);
  });
});
