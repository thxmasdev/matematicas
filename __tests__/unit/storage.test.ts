import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { AppDatabase } from "@/storage/database";
import {
  HistoryRepository,
  ProgressRepository,
  SettingsRepository,
  computeProgress,
} from "@/storage/repositories";
import {
  deleteAllData,
  exportBackup,
  importBackup,
  parseBackup,
  serializeBackup,
} from "@/storage/backup";
import type { ExerciseHistoryRecord } from "@/storage/types";

let n = 0;
const rec = (over: Partial<ExerciseHistoryRecord> = {}): ExerciseHistoryRecord => ({
  id: `h${++n}`,
  moduleId: 1,
  topicId: "tablas",
  templateId: "t1",
  fingerprint: `fp${n}`,
  difficulty: "facil",
  seed: "s",
  timestamp: 1000 + n,
  correct: true,
  userAnswer: "V",
  timeMs: 500,
  sessionId: "ses1",
  ...over,
});

let db: AppDatabase;
let history: HistoryRepository;
let progress: ProgressRepository;

beforeEach(async () => {
  db = new AppDatabase(`test-${Math.random()}`);
  await db.open();
  history = new HistoryRepository(() => db);
  progress = new ProgressRepository(() => db);
});

describe("almacenamiento vacío", () => {
  it("devuelve colecciones vacías", async () => {
    expect(await history.listAll()).toEqual([]);
    expect(await progress.all()).toEqual([]);
    expect((await exportBackup(db)).history).toEqual([]);
  });
});

describe("recordAttempt", () => {
  it("guarda historial y progreso", async () => {
    await history.recordAttempt(rec({ correct: true }));
    await history.recordAttempt(rec({ correct: false }));
    const [p] = await progress.byModule(1);
    expect(p).toMatchObject({ attempts: 2, correct: 1 });
  });

  it("es idempotente: el mismo id no cuenta dos veces", async () => {
    const r = rec();
    expect(await history.recordAttempt(r)).toBe(true);
    expect(await history.recordAttempt(r)).toBe(false);
    expect(await history.count()).toBe(1);
    expect((await progress.all())[0].attempts).toBe(1);
  });

  it("rechaza registros inválidos", () => {
    expect(() => history.recordAttempt(rec({ moduleId: 99 }))).toThrow();
  });

  it("expone huellas por módulo", async () => {
    await history.recordAttempt(rec({ moduleId: 1, fingerprint: "a" }));
    await history.recordAttempt(rec({ moduleId: 2, fingerprint: "b" }));
    expect([...(await history.fingerprintsForModule(1))]).toEqual(["a"]);
  });
});

describe("settings", () => {
  it("guarda y lee", async () => {
    const s = new SettingsRepository(() => db);
    await s.set("tema", "oscuro");
    expect(await s.get("tema")).toBe("oscuro");
    expect(await s.get("nada")).toBeUndefined();
  });
});

describe("export/import", () => {
  it("round-trip conserva datos y recalcula progreso", async () => {
    await history.recordAttempt(rec());
    await history.recordAttempt(rec({ correct: false }));
    const text = serializeBackup(await exportBackup(db));

    const db2 = new AppDatabase(`test-${Math.random()}`);
    await db2.open();
    const s = await importBackup(text, "replace", db2);
    expect(s.historyAdded).toBe(2);
    expect(await db2.history.count()).toBe(2);
    expect((await db2.progress.toArray())[0]).toMatchObject({ attempts: 2, correct: 1 });
  });

  it("merge no duplica ni cuenta doble", async () => {
    await history.recordAttempt(rec());
    const text = serializeBackup(await exportBackup(db));
    const s = await importBackup(text, "merge", db);
    expect(s).toMatchObject({ historyAdded: 0, historySkipped: 1 });
    expect((await progress.all())[0].attempts).toBe(1);
  });

  it("rechaza archivos corruptos o inválidos sin tocar datos", async () => {
    await history.recordAttempt(rec());
    await expect(importBackup("{no es json", "replace", db)).rejects.toMatchObject({
      code: "IMPORT_INVALID",
    });
    await expect(importBackup('{"app":"otra"}', "replace", db)).rejects.toMatchObject({
      code: "IMPORT_INVALID",
    });
    expect(await history.count()).toBe(1);
  });

  it("rechaza versión futura y duplicados", () => {
    const base = { app: "matematicas-unse", exportedAt: 1, history: [], sessions: [], settings: [] };
    expect(() => parseBackup(JSON.stringify({ ...base, formatVersion: 99 }))).toThrow(/más nueva/);
    const r = rec();
    expect(() =>
      parseBackup(JSON.stringify({ ...base, formatVersion: 1, history: [r, r] })),
    ).toThrow(/duplicados/);
  });

  it("si la transacción falla, se revierte y los datos quedan intactos", async () => {
    await history.recordAttempt(rec({ id: "original" }));
    const text = serializeBackup({
      app: "matematicas-unse",
      formatVersion: 1,
      exportedAt: 1,
      history: [rec({ id: "nuevo" })],
      sessions: [],
      settings: [],
    });
    const original = db.progress.bulkPut.bind(db.progress);
    db.progress.bulkPut = (() => Promise.reject(new Error("fallo simulado"))) as never;
    await expect(importBackup(text, "replace", db)).rejects.toMatchObject({
      code: "STORAGE_FAILURE",
    });
    db.progress.bulkPut = original;
    const ids = (await history.listAll()).map((h) => h.id);
    expect(ids).toEqual(["original"]);
  });
});

describe("borrado total", () => {
  it("exige confirmación explícita", async () => {
    await history.recordAttempt(rec());
    await expect(deleteAllData("no" as never, db)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
    expect(await history.count()).toBe(1);
    await deleteAllData("BORRAR", db);
    expect(await history.count()).toBe(0);
    expect(await progress.all()).toEqual([]);
  });
});

describe("computeProgress", () => {
  it("agrega por módulo y tema", () => {
    const p = computeProgress([rec(), rec({ correct: false }), rec({ topicId: "otro" })]);
    expect(p).toHaveLength(2);
  });
});
