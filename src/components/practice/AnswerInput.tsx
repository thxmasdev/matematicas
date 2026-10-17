"use client";

import React, { useRef, useState } from "react";
import type { AnswerSpec } from "@/engine/exercise";
import { MathRenderer } from "@/components/math/MathRenderer";
import { MathKeyboard } from "./MathKeyboard";

interface AnswerInputProps {
  spec: AnswerSpec;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  spec,
  value,
  onChange,
  onSubmit,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSymbolInsert = (symbol: string) => {
    if (!inputRef.current) {
      onChange(value + symbol);
      return;
    }
    const input = inputRef.current;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const nextValue = value.substring(0, start) + symbol + value.substring(end);
    onChange(nextValue);

    // Reposicionamos el cursor tras insertar
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 10);
  };

  // 1. Opción múltiple (choice)
  if (spec.type === "choice") {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-muted">Seleccioná una respuesta:</label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {spec.options.map((opt, idx) => {
            const isSelected = value === opt;
            const letter = String.fromCharCode(65 + idx); // A, B, C, D...
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt)}
                className={`flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-accent bg-accent/15 text-foreground shadow-sm shadow-accent/20 ring-2 ring-accent"
                    : "border-border bg-surface text-muted hover:border-border/80 hover:bg-surface-2 hover:text-foreground"
                } disabled:pointer-events-none disabled:opacity-60`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isSelected ? "bg-accent text-background" : "bg-surface-2 text-muted"
                  }`}
                >
                  {letter}
                </span>
                <span className="text-base font-medium">
                  {/* Si la opción contiene LaTeX ($ o \\) lo renderizamos con MathRenderer */}
                  {opt.includes("$") || opt.includes("\\") ? (
                    <MathRenderer content={opt.startsWith("$") ? opt : `$${opt}$`} />
                  ) : (
                    opt
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Valor de verdad (truth-value)
  if (spec.type === "truth-value") {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-muted">Determiná el valor de verdad:</label>
        <div className="flex gap-4">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("V")}
            className={`flex-1 rounded-xl border p-4 text-center text-lg font-bold transition-all ${
              value === "V"
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500"
                : "border-border bg-surface text-muted hover:border-emerald-500/50 hover:bg-surface-2 hover:text-foreground"
            } disabled:pointer-events-none disabled:opacity-60`}
          >
            Verdadero (V)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("F")}
            className={`flex-1 rounded-xl border p-4 text-center text-lg font-bold transition-all ${
              value === "F"
                ? "border-rose-500 bg-rose-500/15 text-rose-300 ring-2 ring-rose-500"
                : "border-border bg-surface text-muted hover:border-rose-500/50 hover:bg-surface-2 hover:text-foreground"
            } disabled:pointer-events-none disabled:opacity-60`}
          >
            Falso (F)
          </button>
        </div>
      </div>
    );
  }

  // 3. Fórmula / Expresión / Texto matemático
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="answer-input" className="block text-sm font-semibold text-muted">
          Tu respuesta:
        </label>
        <button
          type="button"
          onClick={() => setShowKeyboard(!showKeyboard)}
          className="text-xs font-semibold text-accent hover:underline focus:outline-none"
        >
          {showKeyboard ? "Ocultar teclado de símbolos" : "Teclado de símbolos matemáticos"}
        </button>
      </div>

      {showKeyboard && (
        <div className="mb-2">
          <MathKeyboard onInsert={handleSymbolInsert} />
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id="answer-input"
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          placeholder="Escribí tu respuesta aquí (ej: 3/4, {1, 2}, x=2, etc.)"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-lg font-mono text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
        />
      </div>

      {/* Previsualización en vivo si tiene símbolos LaTeX */}
      {value.trim().length > 0 && (value.includes("/") || value.includes("^") || value.includes("{") || value.includes("sqrt")) && (
        <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-surface-2/30 px-3 py-1.5 text-xs text-muted">
          <span>Vista preliminar:</span>
          <span className="font-mono text-sm text-foreground">
            <MathRenderer content={`$${value}$`} />
          </span>
        </div>
      )}
    </div>
  );
};
