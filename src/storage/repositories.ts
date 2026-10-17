import { AppError } from "@/lib/errors";
import { syncHistoryRecordToSupabase } from "@/lib/supabase";
import { getDb, type AppDatabase } from "./database";
import {
  historyRecordSchema,
  progressKey,
  type ExerciseHistoryRecord,
  type ProgressRecord,
  type SessionRecord,
  type SettingRecord,
} from "./types";

function wrap<T>(op: () => Promise<T>): Promise<T> {
  return op().catch((cause: unknown) => {
    if (cause instanceof AppError) throw cause;
    throw new AppError("STORAGE_FAILURE", "Falló una operación de almacenamiento local.", cause);
  });
}

function applyAttempt(
  prev: ProgressRecord | undefined,
  rec: ExerciseHistoryRecord,
): ProgressRecord {
  return {
    key: progressKey(rec.moduleId, rec.topicId),
    moduleId: rec.moduleId,
    topicId: rec.topicId,
    attempts: (prev?.attempts ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (rec.correct ? 1 : 0),
    updatedAt: rec.timestamp,
  };
}

// Agrega progreso a partir del historial
export function computeProgress(history: readonly ExerciseHistoryRecord[]): ProgressRecord[] {
  const map = new Map<string, ProgressRecord>();
  for (const rec of history) {
    const key = progressKey(rec.moduleId, rec.topicId);
    map.set(key, applyAttempt(map.get(key), rec));
  }
  return [...map.values()];
}

export class HistoryRepository {
  constructor(private readonly db: () => AppDatabase = getDb) {}

  // Guarda intento y actualiza progreso atómicamente
  recordAttempt(record: ExerciseHistoryRecord): Promise<boolean> {
    const parsed = historyRecordSchema.parse(record);
    return wrap(async () => {
      const db = this.db();
      const added = await db.transaction("rw", db.history, db.progress, async () => {
        if (await db.history.get(parsed.id)) return false;
        await db.history.add(parsed);
        const key = progressKey(parsed.moduleId, parsed.topicId);
        await db.progress.put(applyAttempt(await db.progress.get(key), parsed));
        return true;
      });

      if (added) {
        // Sincronizar en segundo plano con Supabase si está disponible
        void syncHistoryRecordToSupabase(parsed);
      }
      return added;
    });
  }

  listByModule(moduleId: number): Promise<ExerciseHistoryRecord[]> {
    return wrap(() => this.db().history.where("moduleId").equals(moduleId).sortBy("timestamp"));
  }

  listAll(): Promise<ExerciseHistoryRecord[]> {
    return wrap(() => this.db().history.orderBy("timestamp").toArray());
  }

  // Huellas ya vistas para el filtro de repeticiones
  fingerprintsForModule(moduleId: number): Promise<Set<string>> {
    return wrap(async () => {
      const rows = await this.db().history.where("moduleId").equals(moduleId).toArray();
      return new Set(rows.map((r) => r.fingerprint));
    });
  }

  count(): Promise<number> {
    return wrap(() => this.db().history.count());
  }
}

export class ProgressRepository {
  constructor(private readonly db: () => AppDatabase = getDb) {}

  all(): Promise<ProgressRecord[]> {
    return wrap(() => this.db().progress.toArray());
  }

  byModule(moduleId: number): Promise<ProgressRecord[]> {
    return wrap(() => this.db().progress.where("moduleId").equals(moduleId).toArray());
  }
}

export class SessionRepository {
  constructor(private readonly db: () => AppDatabase = getDb) {}

  start(session: SessionRecord): Promise<void> {
    return wrap(async () => {
      await this.db().sessions.put(session);
    });
  }

  end(sessionId: string, endedAt: number): Promise<void> {
    return wrap(async () => {
      await this.db().sessions.update(sessionId, { endedAt });
    });
  }

  all(): Promise<SessionRecord[]> {
    return wrap(() => this.db().sessions.orderBy("startedAt").toArray());
  }
}

export class SettingsRepository {
  constructor(private readonly db: () => AppDatabase = getDb) {}

  get(key: string): Promise<SettingRecord["value"] | undefined> {
    return wrap(async () => (await this.db().settings.get(key))?.value);
  }

  set(key: string, value: SettingRecord["value"]): Promise<void> {
    return wrap(async () => {
      await this.db().settings.put({ key, value });
    });
  }

  all(): Promise<SettingRecord[]> {
    return wrap(() => this.db().settings.toArray());
  }
}
