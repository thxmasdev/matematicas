import Dexie, { type Table } from "dexie";
import { AppError } from "@/lib/errors";
import type {
  ExerciseHistoryRecord,
  ProgressRecord,
  SessionRecord,
  SettingRecord,
} from "./types";

export const DB_NAME = "matematicas-unse";

// Esquema IndexedDB con Dexie
export class AppDatabase extends Dexie {
  history!: Table<ExerciseHistoryRecord, string>;
  progress!: Table<ProgressRecord, string>;
  sessions!: Table<SessionRecord, string>;
  settings!: Table<SettingRecord, string>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(1).stores({
      history: "id, moduleId, templateId, fingerprint, timestamp, [moduleId+topicId]",
      progress: "key, moduleId",
      sessions: "sessionId, startedAt",
      settings: "key",
    });
    this.version(2).stores({
      history: "id, moduleId, templateId, fingerprint, timestamp, [moduleId+topicId], userName",
      sessions: "sessionId, startedAt, userName",
    });
  }
}

let instance: AppDatabase | null = null;

export function getDb(): AppDatabase {
  if (!instance) instance = new AppDatabase();
  return instance;
}

// Para aislar la base en tests unitarios
export function setDbForTests(db: AppDatabase | null): void {
  instance = db;
}

// Verifica disponibilidad de IndexedDB en el navegador
export async function ensureStorageAvailable(db: AppDatabase = getDb()): Promise<void> {
  if (typeof indexedDB === "undefined") {
    throw new AppError(
      "STORAGE_UNAVAILABLE",
      "Tu navegador no ofrece almacenamiento local (IndexedDB). Podés practicar, pero el progreso no se guardará al cerrar la pestaña.",
    );
  }
  try {
    await db.open();
  } catch (cause) {
    throw new AppError(
      "STORAGE_UNAVAILABLE",
      "No se pudo abrir el almacenamiento local (¿modo privado o permisos bloqueados?). El progreso no se guardará.",
      cause,
    );
  }
}
