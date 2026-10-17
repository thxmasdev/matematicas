import { AppError } from "@/lib/errors";
import { getDb, type AppDatabase } from "./database";
import { computeProgress } from "./repositories";
import {
  BACKUP_FORMAT_VERSION,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_RECORDS,
  backupSchema,
  type BackupFile,
} from "./types";

// Migración de versiones de backup
export function migrateBackup(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const data = raw as { formatVersion?: unknown };
  if (typeof data.formatVersion === "number" && data.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new AppError(
      "IMPORT_INVALID",
      `El archivo es de una versión más nueva (${data.formatVersion}) que la soportada (${BACKUP_FORMAT_VERSION}). Actualizá la aplicación.`,
    );
  }
  return raw;
}

export async function exportBackup(db: AppDatabase = getDb()): Promise<BackupFile> {
  try {
    const [history, sessions, settings] = await Promise.all([
      db.history.orderBy("timestamp").toArray(),
      db.sessions.toArray(),
      db.settings.toArray(),
    ]);
    return {
      app: "matematicas-unse",
      formatVersion: BACKUP_FORMAT_VERSION,
      exportedAt: Date.now(),
      history,
      sessions,
      settings,
    };
  } catch (cause) {
    throw new AppError("STORAGE_FAILURE", "No se pudo leer los datos para exportar.", cause);
  }
}

export const serializeBackup = (backup: BackupFile): string => JSON.stringify(backup);

// Valida JSON de backup
export function parseBackup(text: string): BackupFile {
  if (text.length > MAX_IMPORT_BYTES) {
    throw new AppError("IMPORT_INVALID", "El archivo supera el tamaño máximo permitido (20 MB).");
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (cause) {
    throw new AppError("IMPORT_INVALID", "El archivo no es un JSON válido.", cause);
  }
  const migrated = migrateBackup(json);
  const result = backupSchema.safeParse(migrated);
  if (!result.success) {
    throw new AppError(
      "IMPORT_INVALID",
      "El archivo no tiene el formato esperado de la aplicación.",
      result.error.issues.slice(0, 5),
    );
  }
  const b = result.data;
  if (b.history.length + b.sessions.length + b.settings.length > MAX_IMPORT_RECORDS) {
    throw new AppError("IMPORT_INVALID", "El archivo contiene demasiados registros.");
  }
  const ids = new Set(b.history.map((h) => h.id));
  if (ids.size !== b.history.length) {
    throw new AppError("IMPORT_INVALID", "El historial contiene registros duplicados.");
  }
  return b;
}

export type ImportMode = "replace" | "merge";

export interface ImportSummary {
  mode: ImportMode;
  historyAdded: number;
  historySkipped: number;
}

// Importación transaccional con rollback automático
export async function importBackup(
  text: string,
  mode: ImportMode = "replace",
  db: AppDatabase = getDb(),
): Promise<ImportSummary> {
  const backup = parseBackup(text);
  try {
    return await db.transaction("rw", db.history, db.progress, db.sessions, db.settings, async () => {
      let added = backup.history.length;
      let skipped = 0;
      if (mode === "replace") {
        await Promise.all([db.history.clear(), db.sessions.clear(), db.settings.clear()]);
        await db.history.bulkPut(backup.history);
      } else {
        const existing = new Set(await db.history.toCollection().primaryKeys());
        const fresh = backup.history.filter((h) => !existing.has(h.id));
        skipped = backup.history.length - fresh.length;
        added = fresh.length;
        await db.history.bulkPut(fresh);
      }
      await db.sessions.bulkPut(backup.sessions);
      await db.settings.bulkPut(backup.settings);
      await db.progress.clear();
      await db.progress.bulkPut(computeProgress(await db.history.toArray()));
      return { mode, historyAdded: added, historySkipped: skipped };
    });
  } catch (cause) {
    throw new AppError(
      "STORAGE_FAILURE",
      "La importación falló y se revirtió: tus datos actuales quedaron intactos.",
      cause,
    );
  }
}

// Borrado total de la base local
export async function deleteAllData(
  confirmation: "BORRAR",
  db: AppDatabase = getDb(),
): Promise<void> {
  if (confirmation !== "BORRAR") {
    throw new AppError("VALIDATION_FAILED", "Falta la confirmación explícita para borrar datos.");
  }
  try {
    await db.transaction("rw", db.history, db.progress, db.sessions, db.settings, async () => {
      await Promise.all([
        db.history.clear(),
        db.progress.clear(),
        db.sessions.clear(),
        db.settings.clear(),
      ]);
    });
  } catch (cause) {
    throw new AppError("STORAGE_FAILURE", "No se pudieron borrar los datos.", cause);
  }
}
