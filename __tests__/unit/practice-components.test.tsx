import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MathRenderer } from "@/components/math/MathRenderer";
import { MathKeyboard } from "@/components/practice/MathKeyboard";
import { AnswerInput } from "@/components/practice/AnswerInput";
import { HintsAccordion } from "@/components/practice/HintsAccordion";
import { StepByStepSolution } from "@/components/practice/StepByStepSolution";

describe("MathRenderer", () => {
  it("renderiza texto simple y fórmulas con KaTeX sin errores", () => {
    const { container } = render(
      <MathRenderer content="Sea el valor de $x^2 + 1$ y la ecuación $$\frac{a}{b} = c$$ en el texto." />,
    );
    expect(container.textContent).toContain("Sea el valor de");
    expect(container.querySelector(".katex")).not.toBeNull();
  });

  it("renderiza fórmula inline directa", () => {
    const { container } = render(<MathRenderer content="x = 2" inline />);
    expect(container.querySelector(".katex")).not.toBeNull();
  });
});

describe("MathKeyboard", () => {
  it("invoca onInsert con el símbolo correspondiente al hacer click", () => {
    const handleInsert = vi.fn();
    render(<MathKeyboard onInsert={handleInsert} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(5);

    // Click en el primer botón de símbolo (∈)
    fireEvent.click(buttons[2]); // Después de los 2 botones de grupos
    expect(handleInsert).toHaveBeenCalled();
  });
});

describe("AnswerInput", () => {
  it("renderiza opciones múltiples para spec choice y responde al click", () => {
    const handleChange = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <AnswerInput
        spec={{ type: "choice", options: ["Opción A", "Opción B", "Opción C"] }}
        value=""
        onChange={handleChange}
        onSubmit={handleSubmit}
      />,
    );

    const optionBtn = screen.getByText("Opción B");
    fireEvent.click(optionBtn);
    expect(handleChange).toHaveBeenCalledWith("Opción B");
  });

  it("renderiza botones de verdad para spec truth-value", () => {
    const handleChange = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <AnswerInput
        spec={{ type: "truth-value" }}
        value=""
        onChange={handleChange}
        onSubmit={handleSubmit}
      />,
    );

    const vBtn = screen.getByText("Verdadero (V)");
    fireEvent.click(vBtn);
    expect(handleChange).toHaveBeenCalledWith("V");

    const fBtn = screen.getByText("Falso (F)");
    fireEvent.click(fBtn);
    expect(handleChange).toHaveBeenCalledWith("F");
  });

  it("renderiza input de texto para spec formula y emite enter", () => {
    const handleChange = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <AnswerInput
        spec={{ type: "formula" }}
        value="3/4"
        onChange={handleChange}
        onSubmit={handleSubmit}
      />,
    );

    const input = screen.getByPlaceholderText(/Escribí tu respuesta aquí/i);
    expect(input).toBeDefined();

    fireEvent.change(input, { target: { value: "5/8" } });
    expect(handleChange).toHaveBeenCalledWith("5/8");

    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(handleSubmit).toHaveBeenCalled();
  });
});

describe("HintsAccordion", () => {
  it("muestra pistas desbloqueadas y permite pedir más", () => {
    const handleUnlock = vi.fn();
    const hints = ["Primera pista general", "Segunda pista específica"];

    const { rerender } = render(
      <HintsAccordion hints={hints} unlockedCount={0} onUnlockNext={handleUnlock} />,
    );

    expect(screen.queryByText("Primera pista general")).toBeNull();

    const askBtn = screen.getByText("Pedir pista 1");
    fireEvent.click(askBtn);
    expect(handleUnlock).toHaveBeenCalled();

    rerender(<HintsAccordion hints={hints} unlockedCount={1} onUnlockNext={handleUnlock} />);
    expect(screen.getByText("Primera pista general")).toBeDefined();
  });
});

describe("StepByStepSolution", () => {
  it("muestra todos los pasos y la explicación final", () => {
    const steps = [
      { text: "Paso 1: Identificar términos" },
      { text: "Paso 2: Calcular el resultado", latex: "x = 4" },
    ];

    render(
      <StepByStepSolution
        steps={steps}
        explanation="Explicación final demostrada"
        correctAnswer="4"
      />,
    );

    expect(screen.getByText("Resolución paso a paso")).toBeDefined();
    expect(screen.getByText("Paso 1: Identificar términos")).toBeDefined();
    expect(screen.getByText("Explicación final demostrada")).toBeDefined();
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
  });
});
