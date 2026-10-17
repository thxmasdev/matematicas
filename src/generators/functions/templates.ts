import { Fraction } from "@/engine/core/fraction";
import {
  correct,
  incorrect,
  invalid,
  makeFingerprint,
  type ExerciseDraft,
  type ExerciseTemplate,
  type Step,
} from "@/engine/exercise";

const MODULE_ID = 4;

/* ------------------------------------------------------------------ */
/* 1. Pares Ordenados, Relaciones y Funciones                         */
/* ------------------------------------------------------------------ */

const paresRelaciones: ExerciseTemplate = {
  id: "funciones.pares-relaciones",
  moduleId: MODULE_ID,
  topicId: "pares-y-relaciones",
  title: "Definición de función: existencia y unicidad",
  difficulties: ["facil", "intermedio"],
  generate(rng, difficulty): ExerciseDraft {
    const domain = [1, 2, 3, 4];
    const codomain = [2, 4, 6, 8, 10];
    const isFunction = rng.bool();

    let pairs: Array<[number, number]>;
    let explanation: string;

    if (isFunction) {
      // Cada elemento del dominio tiene exactamente una imagen
      pairs = domain.map((x) => [x, rng.pick(codomain)]);
      explanation = "Es función: todo elemento del conjunto de partida tiene una y solo una imagen en el conjunto de llegada (cumple existencia y unicidad).";
    } else {
      const defect = rng.pick(["no-existencia", "no-unicidad"] as const);
      if (defect === "no-unicidad") {
        // Un elemento tiene 2 imágenes
        const dupX = rng.pick(domain);
        const y2 = codomain[1];
        pairs = domain.map((x) => [x, rng.pick(codomain)]);
        pairs.push([dupX, y2 !== pairs.find(([x]) => x === dupX)?.[1] ? y2 : codomain[2]]);
        explanation = `No es función: el elemento ${dupX} del conjunto de partida tiene más de una imagen (no cumple unicidad).`;
      } else {
        // Falta un elemento del dominio
        const omitted = rng.pick(domain);
        pairs = domain.filter((x) => x !== omitted).map((x) => [x, rng.pick(codomain)]);
        explanation = `No es función: el elemento ${omitted} del conjunto de partida no tiene imagen asignada (no cumple existencia).`;
      }
    }

    const pairsText = "{" + pairs.map(([x, y]) => `(${x}, ${y})`).join(", ") + "}";
    const pairsLatex = "\\{" + pairs.map(([x, y]) => `(${x}, ${y})`).join(", ") + "\\}";

    const correctAnswer = isFunction ? "Sí" : "No";

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { pairs: pairsText, isFunction },
      statement: `Sea el conjunto de partida $A = \\{1, 2, 3, 4\\}$ y el conjunto de llegada $B = \\{2, 4, 6, 8, 10\\}$. Determiná si la relación $R = ${pairsLatex}$ es una función de $A$ en $B$.`,
      answerSpec: { type: "choice", options: ["Sí", "No"] },
      correctAnswer,
      constraints: [
        "Una relación f: A -> B es función si y solo si cumple las condiciones de existencia y unicidad.",
      ],
      hints: [
        "Existencia: todo elemento de A debe figurar como primera componente.",
        "Unicidad: ningún elemento de A puede repetirse con distintas segundas componentes.",
      ],
      steps: [
        { text: `Revisamos las primeras componentes de los pares: ${pairs.map(([x]) => x).join(", ")}.` },
        { text: explanation },
      ],
      explanation,
      fingerprint: makeFingerprint(this.id, pairsText),
    };
  },
  check(ex, input) {
    const val = input.trim().toLowerCase();
    const isYes = val === "sí" || val === "si" || val === "yes";
    const isNo = val === "no";
    if (!isYes && !isNo) return invalid("Respondé 'Sí' o 'No'.");
    const chosen = isYes ? "Sí" : "No";
    return chosen === ex.correctAnswer
      ? correct("¡Correcto! Identificaste correctamente si es función.")
      : incorrect("Respuesta incorrecta. Revisá las condiciones de existencia y unicidad.");
  },
  verify(ex) {
    const problems: string[] = [];
    if (ex.correctAnswer !== "Sí" && ex.correctAnswer !== "No") {
      problems.push("Respuesta inválida en verificación.");
    }
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 2. Ecuaciones Lineales de Primer Grado                             */
/* ------------------------------------------------------------------ */

const ecuacionLineal: ExerciseTemplate = {
  id: "funciones.ecuacion-lineal",
  moduleId: MODULE_ID,
  topicId: "primer-grado",
  title: "Ecuaciones lineales de primer grado con una incógnita",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    let a: number;
    let b: number;
    let c: number;
    let d: number;
    let sol: Fraction;
    let statementLatex: string;
    let steps: Step[];

    if (difficulty === "facil") {
      // ax + b = c con solución entera
      a = rng.pick([2, 3, 4, 5]);
      const xVal = rng.int(-5, 8);
      b = rng.int(-10, 10);
      c = a * xVal + b;
      sol = Fraction.of(xVal);

      const signB = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
      statementLatex = `${a}x ${signB} = ${c}`;
      steps = [
        { text: `Pasamos el término independiente al segundo miembro:`, latex: `${a}x = ${c} - (${b}) = ${c - b}` },
        { text: `Dividimos por el coeficiente de $x$:`, latex: `x = \\frac{${c - b}}{${a}} = ${xVal}` },
      ];
    } else if (difficulty === "intermedio") {
      // ax + b = cx + d con coeficientes enteros y solución fraccionaria o entera
      a = rng.int(2, 6);
      c = rng.int(-4, 1);
      if (a === c) c = c + 1;
      b = rng.int(-8, 8);
      // a*x + b = c*x + d => d = (a - c)*x + b
      // Queremos que d sea entero, así que ajustamos:
      const aMinusC = a - c;
      const xNum = rng.int(-6, 8);
      sol = Fraction.of(xNum, aMinusC);
      // d = aMinusC * sol + b = xNum + b (entero)
      d = xNum + b;

      const signB = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
      const signD = d >= 0 ? `+ ${d}` : `- ${Math.abs(d)}`;
      const cStr = c === 1 ? "x" : c === -1 ? "-x" : `${c}x`;
      statementLatex = `${a}x ${signB} = ${cStr} ${signD}`;
      steps = [
        { text: `Agrupamos los términos con incógnita en el primer miembro y los números en el segundo:` },
        { text: `(${a} - (${c}))x = ${d} - (${b}) \\implies ${a - c}x = ${d - b}` },
        { text: `Despejamos $x$:`, latex: `x = \\frac{${d - b}}{${a - c}} = ${sol.toLatex()}` },
      ];
    } else {
      // Dificil: Fracciones con paréntesis: a(x - b) / d = c
      const divDen = rng.pick([2, 3, 4]);
      const factor = rng.pick([2, 3, 5]);
      const xVal = rng.int(-4, 6);
      const bVal = rng.int(-5, 5);
      const cVal = factor * (xVal - bVal);
      // factor*(x - bVal) / divDen = cVal / divDen
      const rhsFrac = Fraction.of(cVal, divDen);
      sol = Fraction.of(xVal);

      const signB = bVal >= 0 ? `- ${bVal}` : `+ ${Math.abs(bVal)}`;
      statementLatex = `\\frac{${factor}(x ${signB})}{${divDen}} = ${rhsFrac.toLatex()}`;
      steps = [
        { text: `Multiplicamos ambos miembros por ${divDen} para eliminar denominadores:`, latex: `${factor}(x ${signB}) = ${cVal}` },
        { text: `Dividimos por ${factor}:`, latex: `x ${signB} = ${cVal / factor}` },
        { text: `Despejamos $x$:`, latex: `x = ${sol.toLatex()}` },
      ];
    }

    const expectedStr = sol.toString();

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { statement: statementLatex, expected: expectedStr },
      statement: `Resolvé la siguiente ecuación lineal y expresá el valor de $x$ como número entero o fracción irreducible: $$${statementLatex}$$`,
      answerSpec: { type: "formula" },
      correctAnswer: expectedStr,
      constraints: ["Ecuación lineal con una única solución en los números reales."],
      hints: [
        "Agrupá los términos que tienen x de un lado de la igualdad y los números constantes del otro.",
        "Dividí ambos lados por el coeficiente que multiplica a la x.",
      ],
      steps,
      explanation: `La solución de la ecuación es $x = ${sol.toLatex()}$.`,
      fingerprint: makeFingerprint(this.id, statementLatex),
    };
  },
  check(ex, input) {
    const student = Fraction.parse(input);
    if (!student) return invalid("Ingresá un número entero (ej: 4) o una fracción irreducible (ej: -3/2).");
    const expected = Fraction.parse(ex.correctAnswer);
    if (!expected) return invalid("Error interno del ejercicio.");
    return student.equals(expected)
      ? correct("¡Correcto! El valor de x es la solución exacta.")
      : incorrect("El valor ingresado no verifica la ecuación.");
  },
  verify(ex) {
    const problems: string[] = [];
    const expected = Fraction.parse(ex.correctAnswer);
    if (!expected) problems.push("La solución no se puede parsear.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 3. Sistemas Lineales 2x2                                           */
/* ------------------------------------------------------------------ */

const sistema2x2: ExerciseTemplate = {
  id: "funciones.sistema-2x2",
  moduleId: MODULE_ID,
  topicId: "primer-grado",
  title: "Sistemas de dos ecuaciones lineales con dos incógnitas (2x2)",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    const xSol = rng.int(-4, 5);
    const ySol = rng.int(-4, 5);

    let a1: number;
    let b1: number;
    let a2: number;
    let b2: number;

    if (difficulty === "facil") {
      // Coeficientes unitarios simples
      a1 = 1;
      b1 = rng.pick([1, -1]);
      a2 = rng.pick([2, 3]);
      b2 = rng.pick([1, -1]);
    } else {
      a1 = rng.pick([2, 3, 4]);
      b1 = rng.pick([-3, -2, 2, 3]);
      a2 = rng.pick([1, 2, 3]);
      b2 = rng.pick([-2, -1, 1, 2]);
      // Asegurar que el determinante delta sea distinto de cero
      if (a1 * b2 - a2 * b1 === 0) {
        b2 = b2 + 1;
      }
    }

    const c1 = a1 * xSol + b1 * ySol;
    const c2 = a2 * xSol + b2 * ySol;

    const formatEq = (a: number, b: number, c: number) => {
      const aStr = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
      const bAbs = Math.abs(b);
      const bStr = bAbs === 1 ? "y" : `${bAbs}y`;
      const sign = b >= 0 ? "+" : "-";
      return `${aStr} ${sign} ${bStr} = ${c}`;
    };

    const eq1 = formatEq(a1, b1, c1);
    const eq2 = formatEq(a2, b2, c2);
    const statementLatex = `\\begin{cases} ${eq1} \\\\ ${eq2} \\end{cases}`;

    const ansString = `(${xSol}, ${ySol})`;

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { a1, b1, c1, a2, b2, c2, xSol, ySol },
      statement: `Resolvé el siguiente sistema de ecuaciones lineales 2x2. Escribí el par solución $(x, y)$ entre paréntesis, por ejemplo: (${xSol}, ${ySol}). $$${statementLatex}$$`,
      answerSpec: { type: "formula" },
      correctAnswer: ansString,
      constraints: ["Sistema compatible determinado con solución única."],
      hints: [
        "Podés usar el método de sustitución, igualación, reducción por suma y resta o regla de Cramer.",
        "Despejá una de las incógnitas de la primera ecuación y sustituila en la segunda.",
      ],
      steps: [
        { text: `Planteamos el sistema:` },
        { text: statementLatex },
        {
          text: `Resolvemos despejando o reduciendo. Obtenemos $x = ${xSol}$ e $y = ${ySol}$.`,
          latex: `(x, y) = (${xSol}, ${ySol})`,
        },
      ],
      explanation: `El conjunto solución es $\\{( ${xSol}, ${ySol} )\\}$.`,
      fingerprint: makeFingerprint(this.id, `${a1}|${b1}|${c1}|${a2}|${b2}|${c2}`),
    };
  },
  check(ex, input) {
    const clean = input.trim().replace(/\s+/g, "");
    const match = /^\(?([+-]?\d+)[,;]([+-]?\d+)\)?$/.exec(clean);
    if (!match) {
      return invalid("Formato no válido. Escribí el par como (x, y) con números enteros, por ejemplo: (2, -1).");
    }
    const studentX = parseInt(match[1], 10);
    const studentY = parseInt(match[2], 10);
    const expX = Number(ex.params.xSol);
    const expY = Number(ex.params.ySol);

    if (studentX === expX && studentY === expY) {
      return correct("¡Exacto! El par (x, y) satisface simultáneamente ambas ecuaciones.");
    }
    return incorrect(`El par (${studentX}, ${studentY}) no verifica el sistema.`);
  },
  verify(ex) {
    const problems: string[] = [];
    const expX = Number(ex.params.xSol);
    const expY = Number(ex.params.ySol);
    const a1 = Number(ex.params.a1);
    const b1 = Number(ex.params.b1);
    const c1 = Number(ex.params.c1);
    if (a1 * expX + b1 * expY !== c1) {
      problems.push("La solución no satisface la primera ecuación.");
    }
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 4. Ecuaciones Cuadráticas y Vértice                                */
/* ------------------------------------------------------------------ */

const ecuacionCuadratica: ExerciseTemplate = {
  id: "funciones.ecuacion-cuadratica",
  moduleId: MODULE_ID,
  topicId: "segundo-grado",
  title: "Ecuaciones de segundo grado y discriminante",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    let a: number;
    let b: number;
    let c: number;
    let r1: number;
    let r2: number;

    if (difficulty === "facil") {
      // Raíces enteras simples con a = 1
      a = 1;
      r1 = rng.int(-4, 4);
      r2 = rng.int(-4, 4);
      // (x - r1)(x - r2) = x^2 - (r1 + r2)x + r1*r2
      b = -(r1 + r2);
      c = r1 * r2;
    } else if (difficulty === "intermedio") {
      // a = 2 o -1 con raíces enteras
      a = rng.pick([2, -1, 3]);
      r1 = rng.int(-3, 3);
      r2 = rng.int(-3, 3);
      b = -a * (r1 + r2);
      c = a * r1 * r2;
    } else {
      // Dificil: Ecuación incompleta o con raíces opuestas
      a = rng.pick([1, 2, 4]);
      r1 = rng.int(1, 5);
      r2 = -r1;
      b = 0;
      c = a * r1 * r2;
    }

    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    const delta = b * b - 4 * a * c;

    const formatPoly = (a: number, b: number, c: number) => {
      const aStr = a === 1 ? "x^2" : a === -1 ? "-x^2" : `${a}x^2`;
      let bStr = "";
      if (b !== 0) {
        const bSign = b > 0 ? "+ " : "- ";
        const bAbs = Math.abs(b) === 1 ? "x" : `${Math.abs(b)}x`;
        bStr = ` ${bSign}${bAbs}`;
      }
      let cStr = "";
      if (c !== 0) {
        const cSign = c > 0 ? "+ " : "- ";
        cStr = ` ${cSign}${Math.abs(c)}`;
      }
      return `${aStr}${bStr}${cStr} = 0`;
    };

    const statementLatex = formatPoly(a, b, c);
    const ansString = minR === maxR ? String(minR) : `${minR}, ${maxR}`;

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { a, b, c, delta, minR, maxR },
      statement: `Hallá las raíces reales de la ecuación cuadrática $$${statementLatex}$$. Si tiene dos raíces, escribilas separadas por coma (ej: -2, 3); si tiene una raíz doble, escribí ese único número.`,
      answerSpec: { type: "formula" },
      correctAnswer: ansString,
      constraints: ["Ecuación cuadrática con discriminante Δ >= 0 y raíces reales."],
      hints: [
        "Usá la fórmula resolvente de Bhaskara: x = (-b ± √(b² - 4ac)) / (2a).",
        `Identificá los coeficientes: a = ${a}, b = ${b}, c = ${c}.`,
      ],
      steps: [
        { text: `Calculamos el discriminante:`, latex: `\\Delta = b^2 - 4ac = (${b})^2 - 4(${a})(${c}) = ${delta}` },
        { text: `Aplicamos la fórmula resolvente:`, latex: `x = \\frac{-(${b}) \\pm \\sqrt{${delta}}}{2(${a})}` },
        { text: `Las soluciones son $x_1 = ${minR}$ y $x_2 = ${maxR}$.` },
      ],
      explanation: `Las raíces de la ecuación cuadrática son ${ansString}.`,
      fingerprint: makeFingerprint(this.id, `${a}|${b}|${c}`),
    };
  },
  check(ex, input) {
    const clean = input.trim().replace(/\s+/g, "");
    const parts = clean.split(/[,;]/).map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
    if (parts.length === 0) return invalid("Ingresá las raíces como números enteros separados por coma (ej: 2, -3).");

    const expectedMin = Number(ex.params.minR);
    const expectedMax = Number(ex.params.maxR);

    if (expectedMin === expectedMax) {
      if (parts.length === 1 && parts[0] === expectedMin) return correct("¡Correcto! Es una raíz real doble.");
      if (parts.length === 2 && parts[0] === expectedMin && parts[1] === expectedMin) return correct("¡Correcto!");
    } else {
      if (parts.length === 2) {
        const sorted = [...parts].sort((a, b) => a - b);
        if (sorted[0] === expectedMin && sorted[1] === expectedMax) return correct("¡Correcto! Ambas raíces coinciden.");
      }
    }
    return incorrect("Las raíces calculadas no son correctas.");
  },
  verify(ex) {
    const problems: string[] = [];
    const a = Number(ex.params.a);
    const b = Number(ex.params.b);
    const c = Number(ex.params.c);
    const r1 = Number(ex.params.minR);
    const r2 = Number(ex.params.maxR);
    if (a * r1 * r1 + b * r1 + c !== 0) problems.push("r1 no anula el polinomio.");
    if (a * r2 * r2 + b * r2 + c !== 0) problems.push("r2 no anula el polinomio.");
    return problems;
  },
};

export const FUNCTIONS_TEMPLATES: readonly ExerciseTemplate[] = [
  paresRelaciones,
  ecuacionLineal,
  sistema2x2,
  ecuacionCuadratica,
];
