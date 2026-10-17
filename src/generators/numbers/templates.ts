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
import {
  intervalIntersection,
  intervalsEqual,
  intervalToLatex,
  intervalToText,
  makeInterval,
  parseInterval,
  type BoundaryType,
  type RealInterval,
} from "@/engine/numbers/intervals";
import type { Difficulty } from "@/types/module";

const MODULE_ID = 3;
const ALL: readonly Difficulty[] = ["facil", "intermedio", "dificil", "avanzado"];

/* ------------------------------------------------------------------ */
/* 1. Operaciones Combinadas con Fracciones                           */
/* ------------------------------------------------------------------ */

const fraccionesCombinadas: ExerciseTemplate = {
  id: "numeros.fracciones-combinadas",
  moduleId: MODULE_ID,
  topicId: "operaciones-reales",
  title: "Operaciones combinadas con fracciones",
  difficulties: ALL,
  generate(rng, difficulty): ExerciseDraft {
    let f1: Fraction;
    let f2: Fraction;
    let f3: Fraction;
    let result: Fraction;
    let latexStatement: string;
    let steps: Step[] = [];

    if (difficulty === "facil") {
      // (a/b + c/d) * e/f con números pequeños
      f1 = Fraction.of(rng.int(1, 4), rng.pick([2, 3, 4]));
      f2 = Fraction.of(rng.int(1, 4), rng.pick([2, 3, 4]));
      const op1 = rng.pick(["+", "-"] as const);
      const intermediate = op1 === "+" ? f1.add(f2) : f1.sub(f2);
      f3 = Fraction.of(rng.int(1, 3), rng.pick([2, 3, 5]));

      result = intermediate.mul(f3);
      latexStatement = `\\left( ${f1.toLatex()} ${op1} ${f2.toLatex()} \\right) \\cdot ${f3.toLatex()}`;
      steps = [
        {
          text: `Resolvemos primero el paréntesis:`,
          latex: `${f1.toLatex()} ${op1} ${f2.toLatex()} = ${intermediate.toLatex()}`,
        },
        {
          text: `Multiplicamos por la fracción exterior y simplificamos:`,
          latex: `${intermediate.toLatex()} \\cdot ${f3.toLatex()} = ${result.toLatex()}`,
        },
      ];
    } else if (difficulty === "intermedio") {
      // a/b + c/d : e/f
      f1 = Fraction.of(rng.int(1, 5), rng.pick([2, 3, 4, 5]));
      f2 = Fraction.of(rng.int(1, 4), rng.pick([2, 3, 4]));
      f3 = Fraction.of(rng.int(1, 4), rng.pick([2, 3, 5]));
      const multOrDiv = rng.pick(["\\cdot", "\\div"] as const);
      const term2 = multOrDiv === "\\cdot" ? f2.mul(f3) : f2.div(f3);
      const op = rng.pick(["+", "-"] as const);
      result = op === "+" ? f1.add(term2) : f1.sub(term2);

      latexStatement = `${f1.toLatex()} ${op} ${f2.toLatex()} ${multOrDiv} ${f3.toLatex()}`;
      steps = [
        {
          text: `Por jerarquía de operaciones, resolvemos primero la multiplicación/división:`,
          latex: `${f2.toLatex()} ${multOrDiv} ${f3.toLatex()} = ${term2.toLatex()}`,
        },
        {
          text: `Efectuamos la suma/resta final:`,
          latex: `${f1.toLatex()} ${op} ${term2.toLatex()} = ${result.toLatex()}`,
        },
      ];
    } else if (difficulty === "dificil") {
      // (a/b)^2 - c/d * e/f
      f1 = Fraction.of(rng.int(1, 3), rng.pick([2, 3, 4]));
      const f1Squared = f1.pow(2);
      f2 = Fraction.of(rng.int(1, 3), rng.pick([2, 3, 5]));
      f3 = Fraction.of(rng.int(1, 4), rng.pick([2, 3, 4]));
      const prod = f2.mul(f3);
      result = f1Squared.sub(prod);

      latexStatement = `\\left( ${f1.toLatex()} \\right)^2 - ${f2.toLatex()} \\cdot ${f3.toLatex()}`;
      steps = [
        {
          text: `Resolvemos la potencia:`,
          latex: `\\left( ${f1.toLatex()} \\right)^2 = ${f1Squared.toLatex()}`,
        },
        {
          text: `Resolvemos el producto:`,
          latex: `${f2.toLatex()} \\cdot ${f3.toLatex()} = ${prod.toLatex()}`,
        },
        {
          text: `Efectuamos la resta:`,
          latex: `${f1Squared.toLatex()} - ${prod.toLatex()} = ${result.toLatex()}`,
        },
      ];
    } else {
      // Avanzado: Exponente negativo: (a/b)^(-1) + (c/d)^(-2) : e/f
      f1 = Fraction.of(rng.int(1, 3), rng.pick([2, 3]));
      const inv1 = f1.pow(-1);
      f2 = Fraction.of(rng.int(1, 2), rng.pick([2, 3]));
      const inv2 = f2.pow(-2);
      f3 = Fraction.of(rng.int(1, 3), rng.pick([2, 4]));
      const divTerm = inv2.div(f3);
      result = inv1.add(divTerm);

      latexStatement = `\\left( ${f1.toLatex()} \\right)^{-1} + \\left( ${f2.toLatex()} \\right)^{-2} \\div ${f3.toLatex()}`;
      steps = [
        {
          text: `Invertimos las bases para calcular los exponentes negativos:`,
          latex: `\\left( ${f1.toLatex()} \\right)^{-1} = ${inv1.toLatex()}, \\quad \\left( ${f2.toLatex()} \\right)^{-2} = ${inv2.toLatex()}`,
        },
        {
          text: `Resolvemos la división:`,
          latex: `${inv2.toLatex()} \\div ${f3.toLatex()} = ${divTerm.toLatex()}`,
        },
        {
          text: `Sumamos y simplificamos:`,
          latex: `${inv1.toLatex()} + ${divTerm.toLatex()} = ${result.toLatex()}`,
        },
      ];
    }

    const expectedStr = result.toString();

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: {
        expression: latexStatement,
        expected: expectedStr,
      },
      statement: `Calculá el valor exacto de la siguiente expresión y expresá el resultado como fracción irreducible (o número entero): $$${latexStatement}$$`,
      answerSpec: { type: "formula" },
      correctAnswer: expectedStr,
      constraints: [
        "El resultado debe escribirse en forma irreducible p/q o como número entero p.",
        "Se respetan las reglas de precedencia aritmética de la cartilla.",
      ],
      hints: [
        "Recordá la jerarquía de operaciones: primero potencias, luego productos y divisiones, y al final sumas y restas.",
        "Para sumar fracciones con distinto denominador, hallá el mínimo común múltiplo (m.c.m.).",
      ],
      steps,
      explanation: `El resultado final irreducible es $${result.toLatex()}$.`,
      fingerprint: makeFingerprint(this.id, latexStatement),
    };
  },
  check(ex, input) {
    const student = Fraction.parse(input);
    if (!student) {
      return invalid("Ingresá una fracción válida (ej: 3/4, -5/2) o un número entero (ej: 2).");
    }
    const expected = Fraction.parse(ex.correctAnswer);
    if (!expected) return invalid("Error interno del ejercicio.");

    if (student.equals(expected)) {
      return correct("¡Exacto! El resultado es correcto y está simplificado.");
    }
    return incorrect(`No es correcto. El valor calculado no coincide con la solución esperada.`);
  },
  verify(ex) {
    const problems: string[] = [];
    const expected = Fraction.parse(ex.correctAnswer);
    if (!expected) problems.push("La respuesta esperada no se puede parsear como fracción.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 2. Radicales: Suma de semejantes y Racionalización                 */
/* ------------------------------------------------------------------ */

const radicales: ExerciseTemplate = {
  id: "numeros.radicales",
  moduleId: MODULE_ID,
  topicId: "radicales",
  title: "Suma de radicales semejantes y racionalización",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    if (difficulty === "facil" || difficulty === "intermedio") {
      // Suma/resta de radicales semejantes: a*sqrt(r) + b*sqrt(r) - c*sqrt(r)
      const radBase = rng.pick([2, 3, 5, 7]);
      const c1 = rng.int(2, 6);
      const c2 = rng.int(2, 5);
      const c3 = rng.int(1, 4);
      const coef = c1 + c2 - c3;
      const statementLatex = `${c1}\\sqrt{${radBase}} + ${c2}\\sqrt{${radBase}} - ${c3}\\sqrt{${radBase}}`;
      const ansLatex = coef === 1 ? `\\sqrt{${radBase}}` : `${coef}\\sqrt{${radBase}}`;

      const options = rng.shuffle([
        ansLatex,
        `${c1 + c2}\\sqrt{${radBase}}`,
        `${coef + 1}\\sqrt{${radBase}}`,
        `${coef}\\sqrt{${radBase * 2}}`,
      ]);

      return {
        templateId: this.id,
        moduleId: MODULE_ID,
        topicId: this.topicId,
        difficulty,
        params: { statement: statementLatex, ans: ansLatex },
        statement: `Simplificá la siguiente suma algebraica de radicales semejantes: $$${statementLatex}$$`,
        answerSpec: { type: "choice", options },
        correctAnswer: ansLatex,
        constraints: ["Los términos tienen el mismo índice y radicando; se suman y restan sus coeficientes."],
        hints: [
          "Como los radicales tienen el mismo radicando (son semejantes), podés sacar factor común el radical.",
          `Calculá: (${c1} + ${c2} - ${c3}) · √${radBase}.`,
        ],
        steps: [
          {
            text: `Identificamos que todos los términos comparten el radical $\\sqrt{${radBase}}$:`,
            latex: `(${c1} + ${c2} - ${c3})\\sqrt{${radBase}}`,
          },
          {
            text: `Operamos con los coeficientes:`,
            latex: `${c1 + c2 - c3}\\sqrt{${radBase}} = ${ansLatex}`,
          },
        ],
        explanation: `La expresión simplificada es $${ansLatex}$.`,
        fingerprint: makeFingerprint(this.id, statementLatex),
      };
    }

    // Dificil: Racionalización de monomio a / sqrt(b)
    const b = rng.pick([2, 3, 5, 7]);
    const mult = rng.int(2, 5);
    const a = mult * b; // Para que se simplifique a mult * sqrt(b)
    const statementLatex = `\\frac{${a}}{\\sqrt{${b}}}`;
    const ansLatex = mult === 1 ? `\\sqrt{${b}}` : `${mult}\\sqrt{${b}}`;

    const options = rng.shuffle([
      ansLatex,
      `${a}\\sqrt{${b}}`,
      `\\frac{${mult}\\sqrt{${b}}}{${b}}`,
      `${mult * 2}\\sqrt{${b}}`,
    ]);

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { a, b, ans: ansLatex },
      statement: `Racionalizá el denominador y simplificá al máximo la siguiente expresión: $$${statementLatex}$$`,
      answerSpec: { type: "choice", options },
      correctAnswer: ansLatex,
      constraints: ["Racionalización de monomios con raíz cuadrada multiplicando por el mismo radical."],
      hints: [
        "Multiplicá tanto el numerador como el denominador por el radical del denominador.",
        "Recordá que √b · √b = b.",
      ],
      steps: [
        {
          text: `Multiplicamos numerador y denominador por $\\sqrt{${b}}$:`,
          latex: `\\frac{${a} \\cdot \\sqrt{${b}}}{\\sqrt{${b}} \\cdot \\sqrt{${b}}} = \\frac{${a}\\sqrt{${b}}}{${b}}`,
        },
        {
          text: `Simplificamos la fracción dividiendo ${a} por ${b}:`,
          latex: `\\frac{${a}}{${b}}\\sqrt{${b}} = ${ansLatex}`,
        },
      ],
      explanation: `Racionalizando y simplificando obtenemos $${ansLatex}$.`,
      fingerprint: makeFingerprint(this.id, `${a}/${b}`),
    };
  },
  check(ex, input) {
    if (ex.answerSpec.type !== "choice") return invalid("Ejercicio inválido.");
    const chosen = ex.answerSpec.options.find(
      (opt) => opt.trim().toLowerCase() === input.trim().toLowerCase(),
    );
    if (!chosen) return invalid("Seleccioná una de las opciones.");
    return chosen === ex.correctAnswer
      ? correct("¡Correcto! Racionalización y simplificación exactas.")
      : incorrect("La opción seleccionada no es la simplificación correcta.");
  },
  verify(ex) {
    const problems: string[] = [];
    if (ex.answerSpec.type !== "choice" || !ex.answerSpec.options.includes(ex.correctAnswer)) {
      problems.push("La respuesta correcta no se encuentra entre las opciones.");
    }
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 3. Logaritmos: Definición y Propiedades                            */
/* ------------------------------------------------------------------ */

const logaritmos: ExerciseTemplate = {
  id: "numeros.logaritmos",
  moduleId: MODULE_ID,
  topicId: "logaritmos-valor-absoluto-intervalos",
  title: "Cálculo de logaritmos por definición y propiedades",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    let base: number;
    let exp: number;
    let statementLatex: string;
    let steps: Step[];

    if (difficulty === "facil") {
      base = rng.pick([2, 3, 5, 10]);
      exp = rng.int(1, 4);
      const arg = Math.pow(base, exp);
      statementLatex = base === 10 ? `\\log(${arg})` : `\\log_{${base}}(${arg})`;
      steps = [
        {
          text: `Por definición de logaritmo: $\\log_b(a) = c \\iff b^c = a$.`,
        },
        {
          text: `Buscamos el exponente $c$ tal que $${base}^c = ${arg}$:`,
          latex: `${base}^{${exp}} = ${arg} \\implies c = ${exp}`,
        },
      ];
    } else if (difficulty === "intermedio") {
      // Exponente negativo o fracción: log_b(1 / b^exp) = -exp
      base = rng.pick([2, 3, 5]);
      exp = -rng.int(1, 3);
      const den = Math.pow(base, -exp);
      statementLatex = `\\log_{${base}}\\left(\\frac{1}{${den}}\\right)`;
      steps = [
        {
          text: `Expresamos el argumento como potencia de la base:`,
          latex: `\\frac{1}{${den}} = \\frac{1}{${base}^{${-exp}}} = ${base}^{${exp}}`,
        },
        {
          text: `Aplicamos la definición $\\log_b(b^c) = c$:`,
          latex: `\\log_{${base}}(${base}^{${exp}}) = ${exp}`,
        },
      ];
    } else {
      // Dificil: Propiedad de suma o resta: log_b(x) + log_b(y) = log_b(xy)
      base = rng.pick([2, 3]);
      const e1 = rng.int(1, 3);
      const e2 = rng.int(1, 2);
      exp = e1 + e2;
      const x = Math.pow(base, e1);
      const y = Math.pow(base, e2);
      statementLatex = `\\log_{${base}}(${x}) + \\log_{${base}}(${y})`;
      steps = [
        {
          text: `Aplicamos la propiedad del logaritmo de un producto: $\\log_b(x) + \\log_b(y) = \\log_b(x \\cdot y)$:`,
          latex: `\\log_{${base}}(${x} \\cdot ${y}) = \\log_{${base}}(${x * y})`,
        },
        {
          text: `Como $${base}^{${exp}} = ${x * y}$, el resultado es:`,
          latex: `${exp}`,
        },
      ];
    }

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { base, exp, statement: statementLatex },
      statement: `Determiná el valor numérico del siguiente logaritmo aplicando su definición o propiedades: $$${statementLatex}$$`,
      answerSpec: { type: "formula" },
      correctAnswer: String(exp),
      constraints: ["La base es positiva y distinta de 1; el argumento es estrictamente positivo."],
      hints: [
        "Recordá la definición: log_b(a) = c significa que b elevado a la c es igual a a.",
        "Si el argumento es una fracción 1/k, el exponente será negativo.",
      ],
      steps,
      explanation: `El valor del logaritmo es ${exp}.`,
      fingerprint: makeFingerprint(this.id, statementLatex),
    };
  },
  check(ex, input) {
    const val = parseInt(input.trim(), 10);
    const expected = parseInt(ex.correctAnswer, 10);
    if (isNaN(val)) return invalid("Ingresá un número entero (ej: 3 o -2).");
    return val === expected
      ? correct("¡Correcto! El valor del logaritmo es exacto.")
      : incorrect("El valor no es correcto. Revisá la potencia de la base.");
  },
  verify(ex) {
    const problems: string[] = [];
    const exp = parseInt(ex.correctAnswer, 10);
    if (isNaN(exp)) problems.push("La respuesta no es un número válido.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 4. Intervalos Reales: Intersección                                 */
/* ------------------------------------------------------------------ */

const intervalosReales: ExerciseTemplate = {
  id: "numeros.intervalos",
  moduleId: MODULE_ID,
  topicId: "logaritmos-valor-absoluto-intervalos",
  title: "Intersección de intervalos en la recta real",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    let intA: RealInterval;
    let intB: RealInterval;

    if (difficulty === "facil") {
      // Acotados con solapamiento simple
      const a = rng.int(-6, -1);
      const b = rng.int(a + 3, a + 7);
      const c = rng.int(a + 1, b - 1);
      const d = rng.int(b + 1, b + 5);
      intA = makeInterval(a, "closed", b, "closed"); // [a, b]
      intB = makeInterval(c, "closed", d, "closed"); // [c, d]
    } else if (difficulty === "intermedio") {
      // Mezcla de abiertos y cerrados
      const a = rng.int(-6, -1);
      const b = rng.int(a + 3, a + 7);
      const c = rng.int(a + 1, b - 1);
      const d = rng.int(b + 1, b + 5);
      const tA1: BoundaryType = rng.pick(["open", "closed"]);
      const tA2: BoundaryType = rng.pick(["open", "closed"]);
      const tB1: BoundaryType = rng.pick(["open", "closed"]);
      const tB2: BoundaryType = rng.pick(["open", "closed"]);
      intA = makeInterval(a, tA1, b, tA2);
      intB = makeInterval(c, tB1, d, tB2);
    } else {
      // Dificil: Intervalos infinitos, ej (-inf, b] ∩ [c, inf) o disjuntos
      const disj = rng.bool();
      if (disj) {
        intA = makeInterval(-4, "closed", -1, "open");
        intB = makeInterval(1, "closed", 5, "closed");
      } else {
        const c = rng.int(-2, 3);
        const b = rng.int(c + 1, 7);
        intA = makeInterval(-Infinity, "open", b, "closed");
        intB = makeInterval(c, "open", Infinity, "open");
      }
    }

    const inter = intervalIntersection(intA, intB);
    const ansText = intervalToText(inter);
    const ansLatex = intervalToLatex(inter);

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: {
        A: intervalToText(intA),
        B: intervalToText(intB),
        expected: ansText,
      },
      statement: `Dados los intervalos $A = ${intervalToLatex(intA)}$ y $B = ${intervalToLatex(intB)}$, hallá su intersección $A \\cap B$. Expresá el resultado en notación de intervalos (ej: [1, 4), (-inf, 2]) o escribí ∅ si es vacío.`,
      answerSpec: { type: "formula" },
      correctAnswer: ansText,
      constraints: [
        "Un corchete [ o ] incluye al extremo (cerrado).",
        "Un paréntesis ( o ) excluye al extremo (abierto).",
        "La intersección reúne los puntos que pertenecen a ambos intervalos a la vez.",
      ],
      hints: [
        "Ubicá ambos intervalos en la recta numérica real.",
        "La intersección es el tramo común donde se solapan ambos intervalos.",
      ],
      steps: [
        {
          text: `Graficamos o analizamos los extremos comunes:`,
          latex: `A = ${intervalToLatex(intA)}, \\quad B = ${intervalToLatex(intB)}`,
        },
        {
          text: `Determinamos el extremo izquierdo (el mayor de los inicios) y el derecho (el menor de los finales):`,
          latex: `A \\cap B = ${ansLatex}`,
        },
      ],
      explanation: `La intersección resultante es $${ansLatex}$.`,
      fingerprint: makeFingerprint(this.id, `${intervalToText(intA)}|${intervalToText(intB)}`),
    };
  },
  check(ex, input) {
    const student = parseInterval(input);
    if (!student) {
      return invalid("Formato no válido. Usá notación de intervalos, por ejemplo: [1, 5), (-inf, 3] o ∅.");
    }
    const expected = parseInterval(ex.correctAnswer);
    if (!expected) return invalid("Error interno del ejercicio.");

    return intervalsEqual(student, expected)
      ? correct("¡Correcto! Los extremos y la inclusión/exclusión son exactos.")
      : incorrect("El intervalo no coincide con la intersección esperada. Verificá los extremos y si son abiertos o cerrados.");
  },
  verify(ex) {
    const problems: string[] = [];
    const expected = parseInterval(ex.correctAnswer);
    if (!expected) problems.push("La respuesta esperada no se puede parsear como intervalo.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 5. Regla de Tres Simple y Porcentajes                              */
/* ------------------------------------------------------------------ */

const reglaDeTres: ExerciseTemplate = {
  id: "numeros.regla-de-tres",
  moduleId: MODULE_ID,
  topicId: "regla-de-tres",
  title: "Regla de tres simple directa e inversa y porcentajes",
  difficulties: ["facil", "intermedio"],
  generate(rng, difficulty): ExerciseDraft {
    if (difficulty === "facil") {
      // Regla de tres directa o porcentaje
      const isPercent = rng.bool();
      if (isPercent) {
        const total = rng.pick([200, 300, 400, 500, 800, 1200]);
        const percent = rng.pick([5, 10, 15, 20, 25, 30, 50]);
        const ans = (total * percent) / 100;
        return {
          templateId: this.id,
          moduleId: MODULE_ID,
          topicId: this.topicId,
          difficulty,
          params: { total, percent, ans },
          statement: `En una tienda, un artículo cuesta $${total} pesos. Si tiene un descuento del ${percent}\\%, ¿cuántos pesos se descuentan?`,
          answerSpec: { type: "formula" },
          correctAnswer: String(ans),
          constraints: ["El porcentaje se calcula como (total * porcentaje) / 100."],
          hints: ["Planteá: 100% es el total, x es el porcentaje buscado."],
          steps: [
            { text: `Planteamos la proporción directa:` },
            { text: `\\frac{100\\%}{${total}} = \\frac{${percent}\\%}{x} \\implies x = \\frac{${total} \\cdot ${percent}}{100} = ${ans}` },
          ],
          explanation: `El descuento es de $${ans} pesos.`,
          fingerprint: makeFingerprint(this.id, `pct|${total}|${percent}`),
        };
      }

      // Regla de tres directa clásica
      const unitCost = rng.int(15, 60);
      const q1 = rng.int(2, 5);
      const c1 = unitCost * q1;
      const q2 = rng.int(6, 12);
      const ans = unitCost * q2;
      return {
        templateId: this.id,
        moduleId: MODULE_ID,
        topicId: this.topicId,
        difficulty,
        params: { q1, c1, q2, ans },
        statement: `Si ${q1} kilogramos de manzanas cuestan $${c1} pesos, ¿cuánto costarán ${q2} kilogramos al mismo precio unitario?`,
        answerSpec: { type: "formula" },
        correctAnswer: String(ans),
        constraints: ["Magnitudes directamente proporcionales."],
        hints: ["A mayor cantidad de kilogramos, mayor costo. Planteá una regla de tres directa: x = (c1 * q2) / q1."],
        steps: [
          { text: `Identificamos que a mayor peso, mayor costo (proporcionalidad directa):` },
          { text: `x = \\frac{${c1} \\cdot ${q2}}{${q1}} = ${ans}` },
        ],
        explanation: `El costo de ${q2} kg es de $${ans} pesos.`,
        fingerprint: makeFingerprint(this.id, `r3d|${q1}|${c1}|${q2}`),
      };
    }

    // Intermedio: Regla de tres inversa
    const workers1 = rng.pick([2, 3, 4, 6]);
    const days1 = rng.pick([6, 8, 12, 18, 24]);
    const totalWork = workers1 * days1;
    // Buscamos workers2 divisor de totalWork
    const candidates = [2, 3, 4, 6, 8, 12].filter((w) => w !== workers1 && totalWork % w === 0);
    const workers2 = rng.pick(candidates.length > 0 ? candidates : [1]);
    const ans = totalWork / workers2;

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { workers1, days1, workers2, ans },
      statement: `Si ${workers1} obreros realizan una obra en ${days1} días trabajando al mismo ritmo, ¿cuántos días tardarán ${workers2} obreros en realizar la misma obra?`,
      answerSpec: { type: "formula" },
      correctAnswer: String(ans),
      constraints: ["Magnitudes inversamente proporcionales: el producto obreros * días se mantiene constante."],
      hints: [
        "A mayor cantidad de obreros, menor tiempo tardarán.",
        "En proporcionalidad inversa se cumple: x = (obreros1 · días1) / obreros2.",
      ],
      steps: [
        { text: `Identificamos que es proporcionalidad inversa (más obreros tardan menos días):` },
        { text: `x = \\frac{${workers1} \\cdot ${days1}}{${workers2}} = \\frac{${totalWork}}{${workers2}} = ${ans}` },
      ],
      explanation: `Tardarán ${ans} días en completar la obra.`,
      fingerprint: makeFingerprint(this.id, `r3i|${workers1}|${days1}|${workers2}`),
    };
  },
  check(ex, input) {
    const val = parseInt(input.trim(), 10);
    const expected = parseInt(ex.correctAnswer, 10);
    if (isNaN(val)) return invalid("Ingresá un número entero.");
    return val === expected
      ? correct("¡Correcto! El cálculo de la proporción es exacto.")
      : incorrect("El resultado no es correcto. Revisá si la proporcionalidad es directa o inversa.");
  },
  verify(ex) {
    const problems: string[] = [];
    const ans = parseInt(ex.correctAnswer, 10);
    if (isNaN(ans) || ans <= 0) problems.push("La respuesta debe ser un número entero positivo.");
    return problems;
  },
};

export const NUMBERS_TEMPLATES: readonly ExerciseTemplate[] = [
  fraccionesCombinadas,
  radicales,
  logaritmos,
  intervalosReales,
  reglaDeTres,
];
