import "fake-indexeddb/auto";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { getDb } from "@/storage/database";
import { HistoryRepository } from "@/storage/repositories";
import { Scoreboard } from "@/components/dashboard/Scoreboard";
import { UserModal } from "@/components/user/UserModal";
import ScoreboardPage from "@/app/scoreboard/page";

describe("Componentes de Scoreboard y UserModal", () => {
  beforeEach(async () => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
    const db = getDb();
    await db.history.clear();
    await db.settings.clear();
  });

  describe("Scoreboard", () => {
    it("muestra mensaje motivador de estado vacío si no hay registros", async () => {
      render(<Scoreboard />);

      await waitFor(() => {
        expect(screen.getByText("El Scoreboard está esperando tu primer récord")).toBeDefined();
      });

      expect(screen.getByText("Comenzar a practicar ahora →")).toBeDefined();
    });

    it("muestra tabla con ranking, medallas y puntaje cuando hay intentos", async () => {
      const historyRepo = new HistoryRepository();
      await historyRepo.recordAttempt({
        id: "att_1",
        moduleId: 1,
        topicId: "tablas",
        templateId: "t1",
        fingerprint: "fp1",
        difficulty: "facil",
        seed: "s1",
        timestamp: Date.now() - 1000,
        correct: true,
        userAnswer: "V",
        timeMs: 3000,
        sessionId: "ses1",
        userName: "Camila",
      });

      await historyRepo.recordAttempt({
        id: "att_2",
        moduleId: 2,
        topicId: "conjuntos",
        templateId: "t2",
        fingerprint: "fp2",
        difficulty: "dificil",
        seed: "s2",
        timestamp: Date.now(),
        correct: true,
        userAnswer: "A",
        timeMs: 4000,
        sessionId: "ses1",
        userName: "Camila",
      });

      render(<Scoreboard />);

      await waitFor(() => {
        expect(screen.getByText("Camila")).toBeDefined();
      });

      // 10 pts fácil + 50 pts difícil = 60 pts
      expect(screen.getByText("60")).toBeDefined();
      expect(screen.getByText("2 aciertos de 2")).toBeDefined();
      expect(screen.getByText("🥇")).toBeDefined();
    });
  });

  describe("UserModal", () => {
    it("permite guardar un nombre personalizado", async () => {
      render(<UserModal forceOpen={true} />);

      await waitFor(() => {
        expect(screen.getByText("¿Cómo querés ingresar?")).toBeDefined();
      });

      const input = screen.getByPlaceholderText("Ej: Franco, Sofía, Thomas...");
      fireEvent.change(input, { target: { value: "Lucas UNSE" } });

      const saveBtn = screen.getByText("Continuar con mi nombre →");
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(localStorage.getItem("active_user_name")).toBe("Lucas UNSE");
      });
    });

    it("asigna 'Usuario Anónimo' al presionar Continuar como Usuario Anónimo", async () => {
      render(<UserModal forceOpen={true} />);

      await waitFor(() => {
        expect(screen.getByText("Continuar como Usuario Anónimo")).toBeDefined();
      });

      const anonBtn = screen.getByText("Continuar como Usuario Anónimo");
      fireEvent.click(anonBtn);

      await waitFor(() => {
        expect(localStorage.getItem("active_user_name")).toBe("Usuario Anónimo");
      });
    });
  });

  describe("ScoreboardPage", () => {
    it("renderiza la página con las reglas de puntuación por dificultad", () => {
      render(<ScoreboardPage />);

      expect(screen.getByText("Scoreboard de Aspirantes")).toBeDefined();
      expect(screen.getByText("Nivel Fácil")).toBeDefined();
      expect(screen.getByText("Nivel Intermedio")).toBeDefined();
      expect(screen.getByText("Nivel Difícil")).toBeDefined();
      expect(screen.getByText("Nivel Avanzado")).toBeDefined();
      expect(screen.getByText("+10")).toBeDefined();
      expect(screen.getByText("+25")).toBeDefined();
      expect(screen.getByText("+50")).toBeDefined();
      expect(screen.getByText("+100")).toBeDefined();
    });
  });
});
