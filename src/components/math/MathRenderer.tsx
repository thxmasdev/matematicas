import React from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Renderiza texto mezclado con LaTeX:
 * - $$expresión$$ -> modo bloque (displayMode: true)
 * - $expresión$   -> modo en línea (displayMode: false)
 * - texto plano   -> escapado como texto React
 */
export const MathRenderer: React.FC<MathRendererProps> = React.memo(({ content, className, inline }) => {
  if (!content) return null;

  // Si se solicita modo inline explícito para una fórmula completa sin signos de $
  if (inline) {
    try {
      const html = katex.renderToString(content, {
        displayMode: false,
        throwOnError: false,
      });
      return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span className={className}>{content}</span>;
    }
  }

  // Tokenizamos buscando $$...$$ y $...$
  const tokens: Array<{ type: "text" | "block" | "inline"; raw: string }> = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        raw: content.substring(lastIndex, match.index),
      });
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith("$$") && matchedStr.endsWith("$$")) {
      tokens.push({
        type: "block",
        raw: matchedStr.slice(2, -2).trim(),
      });
    } else {
      tokens.push({
        type: "inline",
        raw: matchedStr.slice(1, -1).trim(),
      });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    tokens.push({
      type: "text",
      raw: content.substring(lastIndex),
    });
  }

  return (
    <div className={className}>
      {tokens.map((token, idx) => {
        if (token.type === "text") {
          return <span key={idx}>{token.raw}</span>;
        }

        const isBlock = token.type === "block";
        let html = "";
        try {
          html = katex.renderToString(token.raw, {
            displayMode: isBlock,
            throwOnError: false,
          });
        } catch {
          return <span key={idx} className="text-red-400">{token.raw}</span>;
        }

        return isBlock ? (
          <div
            key={idx}
            className="my-3 overflow-x-auto text-center"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <span
            key={idx}
            className="inline-block px-0.5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
});

MathRenderer.displayName = "MathRenderer";
