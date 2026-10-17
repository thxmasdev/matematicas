"use client";

import React from "react";
import { MathRenderer } from "@/components/math/MathRenderer";

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
  className?: string;
}

interface SymbolGroup {
  name: string;
  symbols: Array<{ label: string; latex: string; insert: string }>;
}

const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    name: "Conjuntos y Lógica",
    symbols: [
      { label: "∈", latex: "\\in", insert: "∈" },
      { label: "∉", latex: "\\notin", insert: "∉" },
      { label: "⊂", latex: "\\subset", insert: "⊂" },
      { label: "⊄", latex: "\\not\\subset", insert: "⊄" },
      { label: "∪", latex: "\\cup", insert: "∪" },
      { label: "∩", latex: "\\cap", insert: "∩" },
      { label: "∅", latex: "\\emptyset", insert: "∅" },
      { label: "Δ", latex: "\\Delta", insert: "Δ" },
      { label: "{", latex: "\\{", insert: "{" },
      { label: "}", latex: "\\}", insert: "}" },
      { label: "¬", latex: "\\neg", insert: "¬" },
      { label: "∧", latex: "\\land", insert: "∧" },
      { label: "∨", latex: "\\lor", insert: "∨" },
      { label: "⇒", latex: "\\Rightarrow", insert: "⇒" },
      { label: "⇔", latex: "\\Leftrightarrow", insert: "⇔" },
    ],
  },
  {
    name: "Operaciones y Símbolos",
    symbols: [
      { label: "√", latex: "\\sqrt{\\phantom{x}}", insert: "sqrt(" },
      { label: "x²", latex: "x^2", insert: "^2" },
      { label: "±", latex: "\\pm", insert: "±" },
      { label: "·", latex: "\\cdot", insert: "·" },
      { label: "/", latex: "/", insert: "/" },
      { label: "≤", latex: "\\le", insert: "≤" },
      { label: "≥", latex: "\\ge", insert: "≥" },
      { label: "π", latex: "\\pi", insert: "π" },
      { label: "∞", latex: "\\infty", insert: "inf" },
      { label: "(", latex: "(", insert: "(" },
      { label: ")", latex: ")", insert: ")" },
      { label: "[", latex: "[", insert: "[" },
      { label: "]", latex: "]", insert: "]" },
    ],
  },
];

export const MathKeyboard: React.FC<MathKeyboardProps> = ({ onInsert, className }) => {
  const [activeGroup, setActiveGroup] = React.useState<number>(0);

  return (
    <div className={`rounded-xl border border-border bg-surface-2/60 p-2.5 backdrop-blur-sm ${className ?? ""}`}>
      {/* Selector de pestañas de grupos */}
      <div className="mb-2 flex items-center justify-between border-b border-border pb-1.5 text-xs">
        <span className="font-semibold text-muted">Símbolos matemáticos:</span>
        <div className="flex gap-1">
          {SYMBOL_GROUPS.map((group, idx) => (
            <button
              key={group.name}
              type="button"
              onClick={() => setActiveGroup(idx)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                activeGroup === idx
                  ? "bg-accent/20 text-accent font-semibold"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Botones de símbolos */}
      <div className="flex flex-wrap gap-1.5">
        {SYMBOL_GROUPS[activeGroup].symbols.map((sym) => (
          <button
            key={sym.insert}
            type="button"
            onClick={() => onInsert(sym.insert)}
            title={`Insertar ${sym.label}`}
            className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-border/80 bg-surface px-2 text-sm font-semibold text-foreground transition-all hover:scale-105 hover:border-accent hover:bg-surface-2 active:scale-95"
          >
            <MathRenderer content={sym.latex} inline />
          </button>
        ))}
      </div>
    </div>
  );
};
