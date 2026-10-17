"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Difficulty, MathModule } from "@/types/module";
import type { ExerciseTemplate, GeneratedExercise } from "@/engine/exercise";
import { ExerciseUniquenessService, type UniquenessPolicy } from "@/engine/uniqueness";
import { HistoryRepository } from "@/storage/repositories";
import { getActiveUser } from "@/storage/scoreboard";
import { MathRenderer } from "@/components/math/MathRenderer";
import { AnswerInput } from "./AnswerInput";
import { HintsAccordion } from "./HintsAccordion";
import { StepByStepSolution } from "./StepByStepSolution";

interface PracticeSessionProps {
  module: MathModule;
  initialTopicId?: string;
  initialDifficulty?: Difficulty;
  initialPolicy?: UniquenessPolicy;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({
  module,
  initialTopicId,
  initialDifficulty = "facil",
  initialPolicy = "strict",
}) => {
  // Inicialización pura de sessionId único por sesión usando useId
  const uniqueId = React.useId();
  const sessionId = useMemo(
    () => `ses_${module.unit}_${uniqueId.replace(/[^a-zA-Z0-9]/g, "_")}`,
    [module.unit, uniqueId],
  );

  // Repositorios y servicio de unicidad
  const historyRepo = useMemo(() => new HistoryRepository(), []);
  const uniquenessService = useMemo(() => new ExerciseUniquenessService(historyRepo), [historyRepo]);

  // Controles de sesión
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [topicId, setTopicId] = useState<string | undefined>(initialTopicId);
  const [policy, setPolicy] = useState<UniquenessPolicy>(initialPolicy);
  const [userName, setUserName] = useState<string>("Usuario Anónimo");

  // Estado del ejercicio actual
  const [exercise, setExercise] = useState<GeneratedExercise | null>(null);
  const [template, setTemplate] = useState<ExerciseTemplate | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [unlockedHints, setUnlockedHints] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "evaluating" | "correct" | "incorrect" | "solution-revealed">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estadísticas de la sesión actual
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    streak: 0,
  });

  // Temporizador de resolución (inicia en 0, se actualiza en eventos)
  const startTimeRef = useRef<number>(0);
  const hasRecordedRef = useRef<boolean>(false);

  // Carga un nuevo ejercicio desde un evento de usuario
  const loadNextExercise = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setUserAnswer("");
    setUnlockedHints(0);
    setStatus("idle");
    setFeedback(null);
    hasRecordedRef.current = false;

    try {
      const result = await uniquenessService.getNextExercise({
        sessionId,
        moduleId: module.unit,
        topicId: topicId || undefined,
        difficulty,
        policy,
      });

      setExercise(result.exercise);
      setTemplate(result.template);
      startTimeRef.current = Date.now();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo generar un ejercicio.";
      setLoadError(msg);
      setExercise(null);
      setTemplate(null);
    } finally {
      setIsLoading(false);
    }
  }, [module.unit, topicId, difficulty, policy, sessionId, uniquenessService]);

  // Carga inicial y sincronización con cambios en los filtros
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [result, currentUserName] = await Promise.all([
          uniquenessService.getNextExercise({
            sessionId,
            moduleId: module.unit,
            topicId: topicId || undefined,
            difficulty,
            policy,
          }),
          getActiveUser(),
        ]);

        if (!active) return;
        setUserName(currentUserName);
        setExercise(result.exercise);
        setTemplate(result.template);
        startTimeRef.current = Date.now();
        setUserAnswer("");
        setUnlockedHints(0);
        setStatus("idle");
        setFeedback(null);
        hasRecordedRef.current = false;
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "No se pudo generar un ejercicio.");
        setExercise(null);
        setTemplate(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [module.unit, topicId, difficulty, policy, sessionId, uniquenessService]);

  // Comprobar respuesta
  const handleCheck = async () => {
    if (!exercise || !template || status === "correct" || status === "solution-revealed") return;

    if (!userAnswer.trim()) {
      setFeedback("Por favor, ingresá o seleccioná una respuesta antes de comprobar.");
      return;
    }

    const checkResult = template.check(exercise, userAnswer);
    const timeMs = Math.max(1000, Date.now() - startTimeRef.current);

    if (checkResult.accepted) {
      setStatus("correct");
      setFeedback(checkResult.message ?? "¡Excelente! Respuesta correcta.");

      if (!hasRecordedRef.current) {
        hasRecordedRef.current = true;
        setSessionStats((prev) => ({
          total: prev.total + 1,
          correct: prev.correct + 1,
          streak: prev.streak + 1,
        }));

        // Registrar intento en IndexedDB
        await historyRepo.recordAttempt({
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          moduleId: module.unit,
          topicId: exercise.topicId,
          templateId: template.id,
          fingerprint: exercise.fingerprint,
          difficulty: exercise.difficulty,
          seed: exercise.seed,
          timestamp: Date.now(),
          correct: true,
          userAnswer,
          timeMs,
          sessionId,
          userName,
        });
      }
    } else {
      setStatus("incorrect");
      setFeedback(checkResult.message ?? "No es correcto. Revisá los cálculos o pedí una pista.");

      if (!hasRecordedRef.current) {
        hasRecordedRef.current = true;
        setSessionStats((prev) => ({
          total: prev.total + 1,
          correct: prev.correct,
          streak: 0,
        }));

        // Registrar error en IndexedDB para modo repaso
        await historyRepo.recordAttempt({
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          moduleId: module.unit,
          topicId: exercise.topicId,
          templateId: template.id,
          fingerprint: exercise.fingerprint,
          difficulty: exercise.difficulty,
          seed: exercise.seed,
          timestamp: Date.now(),
          correct: false,
          userAnswer,
          timeMs,
          sessionId,
          userName,
        });
      }
    }
  };

  // Revelar solución
  const handleRevealSolution = () => {
    setStatus("solution-revealed");
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de sesión */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={`/modulos/${module.slug}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted transition-colors hover:text-foreground"
            title="Volver al módulo"
          >
            ←
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-2">
                Unidad {module.unit}
              </span>
              <span className="text-muted">·</span>
              <span className="text-xs text-muted">{module.title}</span>
              <span className="text-muted">·</span>
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                👤 {userName}
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground">Sesión de Práctica</h2>
          </div>
        </div>

        {/* Indicadores de progreso en sesión */}
        <div className="flex items-center gap-4 text-sm font-semibold">
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5" title="Ejercicios resueltos">
            <span className="text-muted">Resueltos:</span>
            <span className="text-foreground">{sessionStats.correct}/{sessionStats.total}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              sessionStats.streak > 0 ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30" : "bg-surface-2 text-muted"
            }`}
            title="Racha de aciertos seguidos"
          >
            <span>🔥 Racha:</span>
            <span className="font-bold">{sessionStats.streak}</span>
          </div>
        </div>
      </div>

      {/* Selector de filtros y configuración de práctica */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-surface/50 p-3 text-xs">
        {/* Selector de Dificultad */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-muted">Dificultad:</span>
          {(["facil", "intermedio", "dificil", "avanzado"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`rounded-md px-2.5 py-1 font-medium capitalize transition-all ${
                difficulty === d
                  ? "bg-accent text-background font-bold shadow-sm"
                  : "bg-surface-2 text-muted hover:bg-surface-2/80 hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Selector de Tema */}
        <div className="flex items-center gap-1.5 sm:ml-auto">
          <span className="font-semibold text-muted">Tema:</span>
          <select
            value={topicId ?? ""}
            onChange={(e) => setTopicId(e.target.value || undefined)}
            className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:border-accent focus:outline-none"
          >
            <option value="">Todos los temas</option>
            {module.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Modo */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPolicy(policy === "review" ? "strict" : "review")}
            className={`rounded-md px-2.5 py-1 font-medium transition-all ${
              policy === "review"
                ? "bg-purple-500 text-white font-bold shadow-sm"
                : "bg-surface-2 text-muted hover:bg-surface-2/80 hover:text-foreground"
            }`}
          >
            {policy === "review" ? "Modo Repaso Activo" : "Repasar Errores"}
          </button>
        </div>
      </div>

      {/* Estado de Carga / Error */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-muted">Generando ejercicio único verificado...</p>
        </div>
      )}

      {loadError && !isLoading && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 text-center">
          <h3 className="text-base font-bold text-rose-300">No se pudo obtener un ejercicio</h3>
          <p className="mt-1 text-sm text-muted">{loadError}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setTopicId(undefined);
                setPolicy("session-only");
                loadNextExercise();
              }}
              className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-background transition-transform hover:scale-105"
            >
              Probar todos los temas
            </button>
          </div>
        </div>
      )}

      {/* Ejercicio activo */}
      {exercise && template && !isLoading && (
        <div className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-md backdrop-blur-sm">
          {/* Cabecera del ejercicio */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-accent">{template.title}</span>
              <span>·</span>
              <span className="capitalize">{exercise.difficulty}</span>
            </div>
            <span className="font-mono text-[11px] text-muted/60">ID: {exercise.instanceId.slice(0, 16)}</span>
          </div>

          {/* Enunciado */}
          <div className="text-lg leading-relaxed text-foreground">
            <MathRenderer content={exercise.statement} />
          </div>

          {/* Entrada de respuesta */}
          <div className="pt-2">
            <AnswerInput
              spec={exercise.answerSpec}
              value={userAnswer}
              onChange={setUserAnswer}
              onSubmit={handleCheck}
              disabled={status === "correct" || status === "solution-revealed"}
            />
          </div>

          {/* Mensaje de Feedback */}
          {feedback && (
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 text-sm transition-all ${
                status === "correct"
                  ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
                  : status === "incorrect"
                  ? "border-rose-500/30 bg-rose-950/30 text-rose-200"
                  : "border-border bg-surface-2 text-muted"
              }`}
            >
              <span className="mt-0.5 text-base">
                {status === "correct" ? "🎉" : status === "incorrect" ? "❌" : "ℹ️"}
              </span>
              <div className="flex-1 font-medium">
                <MathRenderer content={feedback} />
              </div>
            </div>
          )}

          {/* Botones de acción principales */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <div className="flex gap-2">
              {status !== "correct" && status !== "solution-revealed" && (
                <button
                  type="button"
                  onClick={handleCheck}
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-background transition-transform hover:scale-105 active:scale-95 shadow-md shadow-accent/25"
                >
                  Comprobar respuesta
                </button>
              )}

              {status === "incorrect" && (
                <button
                  type="button"
                  onClick={handleRevealSolution}
                  className="rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold text-muted hover:border-accent hover:text-foreground transition-colors"
                >
                  Ver resolución completa
                </button>
              )}
            </div>

            {(status === "correct" || status === "solution-revealed") && (
              <button
                type="button"
                onClick={loadNextExercise}
                className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-background transition-transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/25 ml-auto"
              >
                Siguiente ejercicio →
              </button>
            )}
          </div>

          {/* Pistas Progresivas */}
          {exercise.hints.length > 0 && status !== "solution-revealed" && (
            <div className="pt-2">
              <HintsAccordion
                hints={exercise.hints}
                unlockedCount={unlockedHints}
                onUnlockNext={() => setUnlockedHints((prev) => prev + 1)}
                disabled={status === "correct"}
              />
            </div>
          )}

          {/* Resolución paso a paso */}
          {status === "solution-revealed" && (
            <div className="pt-2">
              <StepByStepSolution
                steps={exercise.steps}
                explanation={exercise.explanation}
                correctAnswer={exercise.correctAnswer}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
