import { z } from "zod";

/** Versión del esquema de IndexedDB. Subir al cambiar stores/índices y añadir migración. */
export const DB_SCHEMA_VERSION = 1;
/** Versión del formato de archivo de exportación. */
export const BACKUP_FORMAT_VERSION = 1;
/** Límites de seguridad para importación. */
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
export const MAX_IMPORT_RECORDS = 200_000;

export const difficultySchema = z.enum(["facil", "intermedio", "dificil", "avanzado"]);
export type Difficulty = z.infer<typeof difficultySchema>;

export const historyRecordSchema = z.object({
  id: z.string().min(1).max(100),
  moduleId: z.number().int().min(1).max(7),
  topicId: z.string().min(1).max(100),
  templateId: z.string().min(1).max(100),
  fingerprint: z.string().min(1).max(500),
  difficulty: difficultySchema,
  seed: z.string().max(100),
  timestamp: z.number().int().nonnegative(),
  correct: z.boolean(),
  userAnswer: z.string().max(2000),
  timeMs: z.number().int().nonnegative(),
  sessionId: z.string().min(1).max(100),
  userName: z.string().max(100).optional(),
});
export type ExerciseHistoryRecord = z.infer<typeof historyRecordSchema>;

export interface UserScoreboardEntry {
  userName: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
  score: number;
  totalTimeMs: number;
  lastActive: number;
  modulesPlayed: number[];
}

/** Progreso agregado: siempre derivable del historial. */
export interface ProgressRecord {
  key: string; // `${moduleId}:${topicId}`
  moduleId: number;
  topicId: string;
  attempts: number;
  correct: number;
  updatedAt: number;
}

export const sessionRecordSchema = z.object({
  sessionId: z.string().min(1).max(100),
  startedAt: z.number().int().nonnegative(),
  endedAt: z.number().int().nonnegative().optional(),
  moduleId: z.number().int().min(1).max(7).optional(),
  userName: z.string().max(100).optional(),
});
export type SessionRecord = z.infer<typeof sessionRecordSchema>;

export const settingRecordSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.union([z.string().max(2000), z.number(), z.boolean(), z.null()]),
});
export type SettingRecord = z.infer<typeof settingRecordSchema>;

export const backupSchema = z.object({
  app: z.literal("matematicas-unse"),
  formatVersion: z.number().int().positive(),
  exportedAt: z.number().int().nonnegative(),
  history: z.array(historyRecordSchema),
  sessions: z.array(sessionRecordSchema),
  settings: z.array(settingRecordSchema),
});
export type BackupFile = z.infer<typeof backupSchema>;

export const progressKey = (moduleId: number, topicId: string): string =>
  `${moduleId}:${topicId}`;
