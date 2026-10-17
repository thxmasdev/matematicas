import "fake-indexeddb/auto";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { getDb } from "@/storage/database";
import { HistoryRepository } from "@/storage/repositories";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import HistorialPage from "@/app/historial/page";
import ConfiguracionPage from "@/app/configuracion/page";
import type { ExerciseHistoryRecord } from "@/storage/types";

describe("Dashboard y Páginas de Fase 8", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.history.clear();
    await db.progress.clear();
    await db.sessions.clear();
    await db.settings.clear();
  });

  describe("DashboardStats", () => {
    it("muestra estadísticas en cero cuando no hay historial", async () => {
      render(<DashboardStats />);

      await waitFor(() => {
        expect(screen.getByText("Efectividad")).toBeDefined();
      });

      expect(screen.getByText(/0 intentos/)).toBeDefined();
      expect(screen.getByText(/de 7 unidades/)).toBeDefined();
      expect(screen.getByText("Comenzá tu primera práctica")).toBeDefined();
    });

    it("calcula y muestra estadísticas correctamente cuando hay ejercicios resueltos", async () => {
      const histRepo = new HistoryRepository();
      const records: ExerciseHistoryRecord[] = [
        {
          id: "h1",
          moduleId: 1,
          topicId: "tablas",
          templateId: "t1",
          fingerprint: "fp1",
          difficulty: "facil",
          seed: "s1",
          timestamp: Date.now() - 1000,
          correct: true,
          userAnswer: "V",
          timeMs: 4000,
          sessionId: "sess-1",
        },
        {
          id: "h2",
          moduleId: 1,
          topicId: "tablas",
          templateId: "t2",
          fingerprint: "fp2",
          difficulty: "intermedio",
          seed: "s2",
          timestamp: Date.now() - 500,
          correct: false,
          userAnswer: "F",
          timeMs: 6000,
          sessionId: "sess-1",
        },
        {
          id: "h3",
          moduleId: 2,
          topicId: "conjuntos",
          templateId: "t3",
          fingerprint: "fp3",
          difficulty: "facil",
          seed: "s3",
          timestamp: Date.now(),
          correct: true,
          userAnswer: "A",
          timeMs: 5000,
          sessionId: "sess-1",
        },
      ];

      for (const r of records) {
        await histRepo.recordAttempt(r);
      }

      render(<DashboardStats />);

      await waitFor(() => {
        // 2 correctos de 3 intentos = 67%
        expect(screen.getAllByText("67%").length).toBeGreaterThan(0);
      });

      expect(screen.getByText(/3 intentos/)).toBeDefined();
      expect(screen.getByText(/de 7 unidades/)).toBeDefined();
    });
  });

  describe("HistorialPage", () => {
    it("muestra mensaje de lista vacía cuando no hay intentos", async () => {
      render(<HistorialPage />);

      await waitFor(() => {
        expect(screen.getByText("No hay registros que coincidan con los filtros.")).toBeDefined();
      });
      expect(screen.getByText("Ir a practicar →")).toBeDefined();
    });

    it("muestra y filtra ejercicios registrados por módulo y estado", async () => {
      const histRepo = new HistoryRepository();
      await histRepo.recordAttempt({
        id: "h1",
        moduleId: 1,
        topicId: "logica",
        templateId: "t1",
        fingerprint: "fp1",
        difficulty: "facil",
        seed: "s1",
        timestamp: 1700000000000,
        correct: true,
        userAnswer: "V",
        timeMs: 2500,
        sessionId: "sess-1",
      });

      await histRepo.recordAttempt({
        id: "h2",
        moduleId: 3,
        topicId: "numeros",
        templateId: "t2",
        fingerprint: "fp2",
        difficulty: "dificil",
        seed: "s2",
        timestamp: 1700000010000,
        correct: false,
        userAnswer: "1/2",
        timeMs: 5000,
        sessionId: "sess-1",
      });

      render(<HistorialPage />);

      await waitFor(() => {
        expect(screen.getByText("Historial y Estadísticas")).toBeDefined();
      });

      expect(screen.getByText("50%")).toBeDefined();
      expect(screen.getByText("Unidad 1")).toBeDefined();
      expect(screen.getByText("Unidad 3")).toBeDefined();

      const errorFilterBtn = screen.getByText("Errores");
      fireEvent.click(errorFilterBtn);

      await waitFor(() => {
        expect(screen.queryByText("Unidad 1")).toBeNull();
        expect(screen.getByText("Unidad 3")).toBeDefined();
      });
    });
  });

  describe("ConfiguracionPage", () => {
    it("renderiza botones de exportación, importación y zona de peligro", () => {
      render(<ConfiguracionPage />);

      expect(screen.getByText("Configuración y Datos")).toBeDefined();
      expect(screen.getByText("Descargar copia (.json)")).toBeDefined();
      expect(screen.getByText("Seleccionar archivo JSON...")).toBeDefined();
      expect(screen.getByText("Zona de Peligro")).toBeDefined();
    });

    it("requiere escribir 'BORRAR' para confirmar la eliminación de datos", async () => {
      render(<ConfiguracionPage />);

      const openDeleteBtn = screen.getByText("Borrar todo mi progreso...");
      fireEvent.click(openDeleteBtn);

      const confirmBtn = screen.getByText("Confirmar y borrar todo");
      expect(confirmBtn).toHaveProperty("disabled", true);

      const input = screen.getByPlaceholderText("Escribí BORRAR");
      fireEvent.change(input, { target: { value: "BORRAR" } });

      expect(confirmBtn).toHaveProperty("disabled", false);

      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Todos los datos y el progreso local han sido eliminados de este navegador."),
        ).toBeDefined();
      });
    });
  });
});
