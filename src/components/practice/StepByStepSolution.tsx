"use client";

import React from "react";
import type { Step } from "@/engine/exercise";
import { MathRenderer } from "@/components/math/MathRenderer";

interface StepByStepSolutionProps {
  steps: readonly Step[];
  explanation: string;
  correctAnswer: string;
}

export const StepByStepSolution: React.FC<StepByStepSolutionProps> = ({
  steps,
  explanation,
  correctAnswer,
}) => {
  return (
    <div className="space-y-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-indigo-500/20 pb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
          ✓
        </span>
        <h4 className="text-base font-semibold text-indigo-200">Resolución paso a paso</h4>
      </div>

      <div className="space-y-3.5">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 text-sm text-foreground/90">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface-2 text-xs font-semibold text-muted">
              {idx + 1}
            </span>
            <div className="flex-1 space-y-1.5">
              <div className="text-muted">
                <MathRenderer content={step.text} />
              </div>
              {step.latex && (
                <div className="rounded-lg bg-surface/60 p-2 text-center text-foreground font-mono">
                  <MathRenderer content={`$$${step.latex}$$`} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-indigo-500/20 pt-3">
        <div className="flex flex-col gap-1 rounded-lg bg-indigo-500/10 p-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Respuesta esperada:
          </span>
          <p className="font-semibold text-foreground">
            {correctAnswer.includes("$") || correctAnswer.includes("\\") ? (
              <MathRenderer content={correctAnswer.startsWith("$") ? correctAnswer : `$${correctAnswer}$`} />
            ) : (
              correctAnswer
            )}
          </p>
          {explanation && (
            <div className="mt-1 text-xs text-muted">
              <MathRenderer content={explanation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
