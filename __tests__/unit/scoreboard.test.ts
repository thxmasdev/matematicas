import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  computeScoreboard,
  DEFAULT_USER_NAME,
  getActiveUser,
  setActiveUser,
} from "@/storage/scoreboard";
import type { ExerciseHistoryRecord } from "@/storage/types";

describe("Sistema de Usuarios y Scoreboard", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  describe("getActiveUser y setActiveUser", () => {
    it("retorna 'Usuario Anónimo' por defecto cuando no hay usuario configurado", async () => {
      const user = await getActiveUser();
      expect(user).toBe(DEFAULT_USER_NAME);
    });

    it("guarda y recupera el nombre de usuario recortando espacios", async () => {
      const saved = await setActiveUser("   Thomas UNSE   ");
      expect(saved).toBe("Thomas UNSE");

      const retrieved = await getActiveUser();
      expect(retrieved).toBe("Thomas UNSE");
    });

    it("asigna 'Usuario Anónimo' si se intenta guardar un nombre vacío", async () => {
      const saved = await setActiveUser("     ");
      expect(saved).toBe(DEFAULT_USER_NAME);
    });
  });

  describe("computeScoreboard", () => {
    it("devuelve una lista vacía si no hay registros", () => {
      const scoreboard = computeScoreboard([]);
      expect(scoreboard).toEqual([]);
    });

    it("agrupa por usuario y calcula puntos ponderados y efectividad correctamente", () => {
      const records: ExerciseHistoryRecord[] = [
        // Thomas: 1 fácil correcto (+10), 1 difícil correcto (+50), 1 intermedio incorrecto (+1) -> Total = 61 pts, 2/3 aciertos = 67%
        {
          id: "r1",
          moduleId: 1,
          topicId: "tablas",
          templateId: "t1",
          fingerprint: "fp1",
          difficulty: "facil",
          seed: "s1",
          timestamp: 1000,
          correct: true,
          userAnswer: "V",
          timeMs: 2000,
          sessionId: "ses1",
          userName: "Thomas",
        },
        {
          id: "r2",
          moduleId: 1,
          topicId: "tablas",
          templateId: "t2",
          fingerprint: "fp2",
          difficulty: "dificil",
          seed: "s2",
          timestamp: 2000,
          correct: true,
          userAnswer: "F",
          timeMs: 3000,
          sessionId: "ses1",
          userName: "Thomas",
        },
        {
          id: "r3",
          moduleId: 2,
          topicId: "conjuntos",
          templateId: "t3",
          fingerprint: "fp3",
          difficulty: "intermedio",
          seed: "s3",
          timestamp: 3000,
          correct: false,
          userAnswer: "A",
          timeMs: 4000,
          sessionId: "ses1",
          userName: "Thomas",
        },
        // Sofía: 1 avanzado correcto (+100) -> Total = 100 pts, 1/1 acierto = 100%
        {
          id: "r4",
          moduleId: 3,
          topicId: "numeros",
          templateId: "t4",
          fingerprint: "fp4",
          difficulty: "avanzado",
          seed: "s4",
          timestamp: 4000,
          correct: true,
          userAnswer: "2",
          timeMs: 5000,
          sessionId: "ses2",
          userName: "Sofía",
        },
        // Anónimo: 1 fácil correcto (+10)
        {
          id: "r5",
          moduleId: 1,
          topicId: "tablas",
          templateId: "t5",
          fingerprint: "fp5",
          difficulty: "facil",
          seed: "s5",
          timestamp: 5000,
          correct: true,
          userAnswer: "V",
          timeMs: 1500,
          sessionId: "ses3",
          // sin userName explícito
        },
      ];

      const scoreboard = computeScoreboard(records);

      expect(scoreboard.length).toBe(3);

      // Primer puesto: Sofía con 100 pts
      expect(scoreboard[0].userName).toBe("Sofía");
      expect(scoreboard[0].score).toBe(100);
      expect(scoreboard[0].accuracy).toBe(100);
      expect(scoreboard[0].correctCount).toBe(1);
      expect(scoreboard[0].totalAttempts).toBe(1);
      expect(scoreboard[0].modulesPlayed).toEqual([3]);

      // Segundo puesto: Thomas con 61 pts
      expect(scoreboard[1].userName).toBe("Thomas");
      expect(scoreboard[1].score).toBe(61);
      expect(scoreboard[1].accuracy).toBe(67);
      expect(scoreboard[1].correctCount).toBe(2);
      expect(scoreboard[1].totalAttempts).toBe(3);
      expect(scoreboard[1].modulesPlayed).toEqual([1, 2]);

      // Tercer puesto: Usuario Anónimo con 10 pts
      expect(scoreboard[2].userName).toBe("Usuario Anónimo");
      expect(scoreboard[2].score).toBe(10);
      expect(scoreboard[2].accuracy).toBe(100);
      expect(scoreboard[2].correctCount).toBe(1);
      expect(scoreboard[2].totalAttempts).toBe(1);
    });
  });
});
