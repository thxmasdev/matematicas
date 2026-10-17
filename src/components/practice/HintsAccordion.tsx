"use client";

import React from "react";
import { MathRenderer } from "@/components/math/MathRenderer";

interface HintsAccordionProps {
  hints: readonly string[];
  unlockedCount: number;
  onUnlockNext: () => void;
  disabled?: boolean;
}

export const HintsAccordion: React.FC<HintsAccordionProps> = ({
  hints,
  unlockedCount,
  onUnlockNext,
  disabled = false,
}) => {
  if (hints.length === 0) return null;

  const hasMore = unlockedCount < hints.length;

  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-surface/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">
          Pistas disponibles ({unlockedCount}/{hints.length})
        </span>
        {hasMore && (
          <button
            type="button"
            disabled={disabled}
            onClick={onUnlockNext}
            className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/25 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            <span>Pedir pista {unlockedCount + 1}</span>
          </button>
        )}
      </div>

      {unlockedCount > 0 && (
        <div className="space-y-2.5 pt-2">
          {hints.slice(0, unlockedCount).map((hint, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200/90"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                {idx + 1}
              </span>
              <div className="flex-1">
                <MathRenderer content={hint} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
