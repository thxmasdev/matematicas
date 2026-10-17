import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ExerciseHistoryRecord, UserScoreboardEntry } from "@/storage/types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Indica si las credenciales de Supabase están configuradas en el entorno.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("your-project")
  );
}

/**
 * Cliente de Supabase inicializado con la clave pública (anon).
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client && supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}

/**
 * Sincroniza un intento individual de ejercicio en Supabase.
 */
export async function syncHistoryRecordToSupabase(record: ExerciseHistoryRecord): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from("exercise_history").upsert(
      {
        id: record.id,
        module_id: record.moduleId,
        topic_id: record.topicId,
        template_id: record.templateId,
        fingerprint: record.fingerprint,
        difficulty: record.difficulty,
        seed: record.seed,
        timestamp: record.timestamp,
        correct: record.correct,
        user_answer: record.userAnswer,
        time_ms: record.timeMs,
        session_id: record.sessionId,
        user_name: (record.userName && record.userName.trim().length > 0) ? record.userName.trim() : "Usuario Anónimo",
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("Aviso: No se pudo sincronizar el intento con Supabase:", err);
  }
}

/**
 * Obtiene el Scoreboard global de todos los aspirantes desde Supabase.
 */
export async function fetchScoreboardFromSupabase(): Promise<UserScoreboardEntry[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("scoreboard_profiles")
      .select("*")
      .order("score", { ascending: false })
      .order("accuracy", { ascending: false })
      .order("total_attempts", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("Aviso: Error consultando scoreboard en Supabase:", error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row) => ({
      userName: row.user_name as string,
      totalAttempts: Number(row.total_attempts ?? 0),
      correctCount: Number(row.correct_count ?? 0),
      accuracy: Number(row.accuracy ?? 0),
      score: Number(row.score ?? 0),
      totalTimeMs: Number(row.total_time_ms ?? 0),
      lastActive: Number(row.last_active ?? Date.now()),
      modulesPlayed: Array.isArray(row.modules_played) ? (row.modules_played as number[]) : [],
    }));
  } catch (err) {
    console.warn("Aviso: Excepción consultando Supabase:", err);
    return null;
  }
}

/**
 * Actualiza o inserta el perfil de puntuación de un usuario en Supabase.
 */
export async function syncScoreboardProfileToSupabase(entry: UserScoreboardEntry): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from("scoreboard_profiles").upsert(
      {
        user_name: entry.userName,
        score: entry.score,
        correct_count: entry.correctCount,
        total_attempts: entry.totalAttempts,
        accuracy: entry.accuracy,
        total_time_ms: entry.totalTimeMs,
        modules_played: entry.modulesPlayed,
        last_active: entry.lastActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_name" }
    );
  } catch (err) {
    console.warn("Aviso: No se pudo sincronizar el perfil con Supabase:", err);
  }
}
