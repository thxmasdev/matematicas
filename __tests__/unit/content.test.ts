import { describe, it, expect } from "vitest";
import { getModules, getModuleBySlug, getTheoryBySlug } from "@/content/loader";
import { parseModule } from "@/content/schemas";
import { AppError, isAppError } from "@/lib/errors";

describe("contenido de módulos", () => {
  it("carga exactamente los siete módulos de la cartilla, en orden", () => {
    const mods = getModules();
    expect(mods).toHaveLength(7);
    expect(mods.map((m) => m.unit)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(mods.map((m) => m.slug)).toEqual([
      "logica",
      "conjuntos",
      "conjuntos-numericos",
      "relaciones-y-funciones",
      "expresiones-algebraicas",
      "geometria",
      "trigonometria",
    ]);
  });

  it("no repite identificadores de tema dentro de un módulo", () => {
    for (const m of getModules()) {
      const ids = m.topics.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("devuelve un módulo por slug y falla con AppError si no existe", () => {
    expect(getModuleBySlug("logica").title).toBe("Lógica");
    try {
      getModuleBySlug("inexistente");
      throw new Error("debía fallar");
    } catch (e) {
      expect(isAppError(e)).toBe(true);
      expect((e as AppError).code).toBe("CONTENT_NOT_FOUND");
    }
  });

  it("rechaza contenido que no cumple el esquema", () => {
    expect(() => parseModule({ id: "x" })).toThrowError(AppError);
    expect(() => parseModule({ schemaVersion: 99 })).toThrowError(AppError);
  });
});

describe("contenido teórico", () => {
  it("carga la teoría del módulo de lógica con sus secciones y temas válidos", () => {
    const theory = getTheoryBySlug("logica");
    expect(theory).not.toBeNull();
    if (!theory) return;
    expect(theory.moduleSlug).toBe("logica");
    expect(theory.sections.length).toBeGreaterThanOrEqual(3);

    const logicModule = getModuleBySlug("logica");
    const validTopicIds = new Set(logicModule.topics.map((t) => t.id));

    for (const section of theory.sections) {
      expect(validTopicIds.has(section.topicId)).toBe(true);
      expect(section.content.length).toBeGreaterThan(50);
      if (section.examples) {
        expect(section.examples.length).toBeGreaterThanOrEqual(1);
        for (const ex of section.examples) {
          expect(ex.title).toBeTruthy();
          expect(ex.statement).toBeTruthy();
          expect(ex.solution).toBeTruthy();
        }
      }
    }
  });

  it("devuelve null si un módulo no tiene teoría cargada o no existe", () => {
    expect(getTheoryBySlug("modulo-inexistente")).toBeNull();
  });

  it("los siete módulos de la cartilla tienen su teoría cargada y válida", () => {
    const slugs = [
      "logica",
      "conjuntos",
      "conjuntos-numericos",
      "relaciones-y-funciones",
      "expresiones-algebraicas",
      "geometria",
      "trigonometria",
    ];
    for (const slug of slugs) {
      const theory = getTheoryBySlug(slug);
      expect(theory).not.toBeNull();
      expect(theory?.sections.length).toBeGreaterThanOrEqual(3);
    }
  });
});

