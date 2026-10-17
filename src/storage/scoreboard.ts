import { getDb } from "./database";
import { SettingsRepository } from "./repositories";
import type { Difficulty, ExerciseHistoryRecord, UserScoreboardEntry } from "./types";
import {
  fetchScoreboardFromSupabase,
  isSupabaseConfigured,
  syncScoreboardProfileToSupabase,
} from "@/lib/supabase";

export const DEFAULT_USER_NAME = "Usuario Anónimo";
export const STORAGE_KEY_ACTIVE_USER = "active_user_name";
export const STORAGE_KEY_PROMPTED = "has_prompted_username";
export const PURGE_STORAGE_KEY_V1 = "storage_purged_reset_v1";

export const POINTS_BY_DIFFICULTY: Record<Difficulty, number> = {
  facil: 10,
  intermedio: 25,
  dificil: 50,
  avanzado: 100,
};

/**
 * Purga y reinicia el almacenamiento local (IndexedDB y localStorage)
 * para asegurar que cualquier navegador comience en estado limpio y solicite el nombre.
 */
export async function purgePreviousStorageIfNeeded(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(PURGE_STORAGE_KEY_V1) === "true") return false;

  try {
    const db = getDb();
    await Promise.all([
      db.history.clear().catch(() => {}),
      db.progress.clear().catch(() => {}),
      db.sessions.clear().catch(() => {}),
      db.settings.clear().catch(() => {}),
    ]);
  } catch {
    // Si la BD no estaba disponible
  }

  // Limpiar localStorage anterior
  localStorage.clear();

  // Establecer flag de purga
  localStorage.setItem(PURGE_STORAGE_KEY_V1, "true");
  return true;
}

/**
 * Obtiene el nombre del estudiante activo actual.
 * Prioriza localStorage para lectura síncrona en cliente y sincroniza con SettingsRepository.
 */
export async function getActiveUser(): Promise<string> {
  await purgePreviousStorageIfNeeded();
  if (typeof window !== "undefined") {
    const local = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (local && local.trim().length > 0) return local.trim();
  }
  try {
    const settings = new SettingsRepository();
    const stored = await settings.get(STORAGE_KEY_ACTIVE_USER);
    if (typeof stored === "string" && stored.trim().length > 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_ACTIVE_USER, stored.trim());
      }
      return stored.trim();
    }
  } catch {
    // Fallback silencioso si la BD está inaccesible
  }
  return DEFAULT_USER_NAME;
}

/**
 * Establece el nombre del estudiante activo actual.
 */
export async function setActiveUser(rawName: string): Promise<string> {
  const trimmed = rawName.trim();
  const finalName = trimmed.length > 0 ? trimmed.slice(0, 50) : DEFAULT_USER_NAME;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, finalName);
    localStorage.setItem(STORAGE_KEY_PROMPTED, "true");
    localStorage.setItem(PURGE_STORAGE_KEY_V1, "true");
  }

  try {
    const settings = new SettingsRepository();
    await settings.set(STORAGE_KEY_ACTIVE_USER, finalName);
  } catch {
    // Persistencia asegurada en localStorage
  }

  return finalName;
}

// Verifica si ya se solicitó el nombre
export function hasPromptedUsername(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY_PROMPTED) === "true";
}

// Marca que ya se presentó el selector de usuario
export function markPromptedUsername(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_PROMPTED, "true");
  }
}

// Agrupa historial por estudiante y calcula ranking
export function computeScoreboard(
  history: readonly ExerciseHistoryRecord[],
): UserScoreboardEntry[] {
  const userMap = new Map<
    string,
    {
      totalAttempts: number;
      correctCount: number;
      score: number;
      totalTimeMs: number;
      lastActive: number;
      modulesSet: Set<number>;
    }
  >();

  for (const rec of history) {
    const name = (rec.userName && rec.userName.trim().length > 0 ? rec.userName.trim() : DEFAULT_USER_NAME);
    let entry = userMap.get(name);
    if (!entry) {
      entry = {
        totalAttempts: 0,
        correctCount: 0,
        score: 0,
        totalTimeMs: 0,
        lastActive: 0,
        modulesSet: new Set<number>(),
      };
      userMap.set(name, entry);
    }

    entry.totalAttempts += 1;
    entry.totalTimeMs += rec.timeMs || 0;
    if (rec.timestamp > entry.lastActive) {
      entry.lastActive = rec.timestamp;
    }
    entry.modulesSet.add(rec.moduleId);

    if (rec.correct) {
      entry.correctCount += 1;
      const pts = POINTS_BY_DIFFICULTY[rec.difficulty] ?? 10;
      entry.score += pts;
    } else {
      // 1 punto por intento y perseverancia
      entry.score += 1;
    }
  }

  const results: UserScoreboardEntry[] = [];
  for (const [userName, data] of userMap.entries()) {
    const accuracy =
      data.totalAttempts > 0
        ? Math.round((data.correctCount / data.totalAttempts) * 100)
        : 0;
    results.push({
      userName,
      totalAttempts: data.totalAttempts,
      correctCount: data.correctCount,
      accuracy,
      score: data.score,
      totalTimeMs: data.totalTimeMs,
      lastActive: data.lastActive,
      modulesPlayed: Array.from(data.modulesSet).sort((a, b) => a - b),
    });
  }

  // Ordenar: primero mayor score, luego mayor efectividad, luego más intentos
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.totalAttempts - a.totalAttempts;
  });

  return results;
}

/**
 * Obtiene el Scoreboard unificado:
 * - Si Supabase está configurado, consulta los perfiles globales en la nube compartidos entre todos los dispositivos.
 * - Si hay cambios o intentos locales no sincronizados, los actualiza en segundo plano.
 * - Si está sin configurar o sin conexión, recurre al cálculo local en IndexedDB.
 */
export async function getLiveScoreboard(
  history: readonly ExerciseHistoryRecord[],
): Promise<UserScoreboardEntry[]> {
  const localList = computeScoreboard(history);

  if (isSupabaseConfigured()) {
    try {
      const remoteList = await fetchScoreboardFromSupabase();
      if (remoteList && remoteList.length > 0) {
        const userMap = new Map<string, UserScoreboardEntry>();
        for (const entry of remoteList) {
          userMap.set(entry.userName, entry);
        }

        // Combinar con perfiles locales activos
        for (const local of localList) {
          const remote = userMap.get(local.userName);
          if (!remote || local.score > remote.score || local.totalAttempts > remote.totalAttempts) {
            userMap.set(local.userName, local);
            // Sincronizar actualización más reciente a Supabase
            void syncScoreboardProfileToSupabase(local);
          }
        }

        const merged = Array.from(userMap.values());
        merged.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
          return b.totalAttempts - a.totalAttempts;
        });

        return merged;
      }
    } catch {
      // Fallback a local
    }
  }

  return localList;
}
