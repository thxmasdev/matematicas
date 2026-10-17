import {
  correct,
  incorrect,
  invalid,
  makeFingerprint,
  type ExerciseDraft,
  type ExerciseTemplate,
} from "@/engine/exercise";

const MODULE_ID = 5;

/* ------------------------------------------------------------------ */
/* 1. Suma, Resta y Producto de Polinomios                            */
/* ------------------------------------------------------------------ */

const operacionesPolinomios: ExerciseTemplate = {
  id: "algebra.operaciones-polinomios",
  moduleId: MODULE_ID,
  topicId: "polinomios",
  title: "Suma, resta y multiplicación de polinomios",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    if (difficulty === "facil") {
      // Suma o resta de polinomios de grado 2: P(x) = a x^2 + b x + c, Q(x) = d x^2 + e x + f
      const a = rng.int(1, 4);
      const b = rng.int(-5, 5);
      const c = rng.int(-6, 6);
      const d = rng.int(1, 3);
      const e = rng.int(-5, 5);
      const f = rng.int(-6, 6);
      const isSum = rng.bool();

      const resA = isSum ? a + d : a - d;
      const resB = isSum ? b + e : b - e;
      const resC = isSum ? c + f : c - f;

      const formatP = (c2: number, c1: number, c0: number) => {
        const t2 = c2 === 1 ? "x^2" : `${c2}x^2`;
        const s1 = c1 >= 0 ? `+ ${c1}x` : `- ${Math.abs(c1)}x`;
        const s0 = c0 >= 0 ? `+ ${c0}` : `- ${Math.abs(c0)}`;
        return `${t2} ${s1} ${s0}`;
      };

      const pStr = formatP(a, b, c);
      const qStr = formatP(d, e, f);
      const opSymbol = isSum ? "+" : "-";
      const statementLatex = `(${pStr}) ${opSymbol} (${qStr})`;
      const ansPoly = formatP(resA, resB, resC);

      const options = rng.shuffle([
        ansPoly,
        formatP(resA, resB + 2, resC),
        formatP(a + d, b + e, c + f),
        formatP(resA, resB, resC - 3),
      ]);

      return {
        templateId: this.id,
        moduleId: MODULE_ID,
        topicId: this.topicId,
        difficulty,
        params: { statement: statementLatex, ans: ansPoly },
        statement: `Efectuá la siguiente operación de polinomios y seleccioná la expresión reducida: $$${statementLatex}$$`,
        answerSpec: { type: "choice", options },
        correctAnswer: ansPoly,
        constraints: ["Suma o resta de monomios semejantes agrupando coeficientes."],
        hints: [
          "Eliminá los paréntesis (atención al signo menos si es una resta).",
          "Agrupá los términos que tengan la misma potencia de x: x², x y término independiente.",
        ],
        steps: [
          { text: `Escribimos los polinomios agrupando términos semejantes:` },
          { text: `(${a} ${opSymbol} ${d})x^2 + (${b} ${opSymbol} (${e}))x + (${c} ${opSymbol} (${f}))` },
          { text: `Resultado: $${ansPoly}$.` },
        ],
        explanation: `El polinomio reducido es $${ansPoly}$.`,
        fingerprint: makeFingerprint(this.id, statementLatex),
      };
    }

    // Intermedio/Dificil: Producto de binomios (ax + b)(cx + d)
    const a = rng.pick([1, 2, 3]);
    const b = rng.int(-4, 4);
    const c = rng.pick([1, 2]);
    const d = rng.int(-4, 4);

    const resA = a * c;
    const resB = a * d + b * c;
    const resC = b * d;

    const term1 = `${a === 1 ? "" : a}x ${b >= 0 ? "+ " + b : "- " + Math.abs(b)}`;
    const term2 = `${c === 1 ? "" : c}x ${d >= 0 ? "+ " + d : "- " + Math.abs(d)}`;
    const statementLatex = `(${term1})(${term2})`;

    const formatRes = (c2: number, c1: number, c0: number) => {
      const t2 = c2 === 1 ? "x^2" : `${c2}x^2`;
      let t1 = "";
      if (c1 !== 0) {
        t1 = c1 > 0 ? ` + ${c1 === 1 ? "" : c1}x` : ` - ${Math.abs(c1) === 1 ? "" : Math.abs(c1)}x`;
      }
      let t0 = "";
      if (c0 !== 0) {
        t0 = c0 > 0 ? ` + ${c0}` : ` - ${Math.abs(c0)}`;
      }
      return `${t2}${t1}${t0}`;
    };

    const ansPoly = formatRes(resA, resB, resC);
    const options = rng.shuffle([
      ansPoly,
      formatRes(resA, resB + 2, resC),
      formatRes(resA, resB, resC + 3),
      formatRes(resA + 1, resB, resC),
    ]);

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { statement: statementLatex, ans: ansPoly },
      statement: `Desarrollá el producto de los binomios aplicando la propiedad distributiva: $$${statementLatex}$$`,
      answerSpec: { type: "choice", options },
      correctAnswer: ansPoly,
      constraints: ["Propiedad distributiva del producto respecto de la suma."],
      hints: [
        "Multiplicá cada término del primer paréntesis por cada término del segundo paréntesis.",
        "Sumá los términos semejantes de grado 1.",
      ],
      steps: [
        { text: `Aplicamos propiedad distributiva:` },
        { text: `(${a}x)(${c}x) + (${a}x)(${d}) + (${b})(${c}x) + (${b})(${d})` },
        { text: `Agrupando y reduciendo: $${ansPoly}$.` },
      ],
      explanation: `El desarrollo resultante es $${ansPoly}$.`,
      fingerprint: makeFingerprint(this.id, statementLatex),
    };
  },
  check(ex, input) {
    if (ex.answerSpec.type !== "choice") return invalid("Ejercicio inválido.");
    const chosen = ex.answerSpec.options.find((opt) => opt.trim() === input.trim());
    if (!chosen) return invalid("Seleccioná una de las opciones propuestas.");
    return chosen === ex.correctAnswer
      ? correct("¡Correcto! El desarrollo polinómico es exacto.")
      : incorrect("La opción elegida no coincide con la reducción polinómica.");
  },
  verify(ex) {
    const problems: string[] = [];
    if (ex.answerSpec.type !== "choice" || !ex.answerSpec.options.includes(ex.correctAnswer)) {
      problems.push("La respuesta no se encuentra entre las opciones.");
    }
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 2. Teorema del Resto                                               */
/* ------------------------------------------------------------------ */

const teoremaResto: ExerciseTemplate = {
  id: "algebra.resto",
  moduleId: MODULE_ID,
  topicId: "ruffini-y-resto",
  title: "Teorema del resto para división de polinomios",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    // P(x) = a x^3 + b x^2 + c x + d dividido por (x - k)
    const k = rng.pick([-2, -1, 1, 2]);
    const a = rng.pick([1, 2]);
    const b = rng.int(-3, 3);
    const c = rng.int(-4, 4);
    const d = rng.int(-5, 5);

    // Resto = P(k) = a*k^3 + b*k^2 + c*k + d
    const remainder = a * Math.pow(k, 3) + b * Math.pow(k, 2) + c * k + d;

    const divSign = k >= 0 ? `- ${k}` : `+ ${Math.abs(k)}`;
    const divisor = `(x ${divSign})`;

    const formatTerm = (coef: number, p: number, isFirst = false) => {
      if (coef === 0) return "";
      const sign = coef > 0 ? (isFirst ? "" : "+ ") : "- ";
      const absC = Math.abs(coef);
      let varStr = "";
      if (p === 3) varStr = absC === 1 ? "x^3" : `${absC}x^3`;
      else if (p === 2) varStr = absC === 1 ? "x^2" : `${absC}x^2`;
      else if (p === 1) varStr = absC === 1 ? "x" : `${absC}x`;
      else varStr = `${absC}`;
      return `${sign}${varStr} `;
    };

    const pPoly = (
      formatTerm(a, 3, true) +
      formatTerm(b, 2) +
      formatTerm(c, 1) +
      formatTerm(d, 0)
    ).trim();

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { a, b, c, d, k, remainder },
      statement: `Aplicando el **teorema del resto**, hallá el resto de dividir el polinomio $P(x) = ${pPoly}$ por el binomio $Q(x) = ${divisor}$.`,
      answerSpec: { type: "formula" },
      correctAnswer: String(remainder),
      constraints: ["El resto de dividir P(x) por (x - a) es igual al valor numérico P(a)."],
      hints: [
        `Identificá el valor de a en el divisor (x - a): en este caso a = ${k}.`,
        `Calculá el valor numérico sustituyendo x por ${k} en P(x): P(${k}).`,
      ],
      steps: [
        { text: `Por el teorema del resto, el resto es $R = P(${k})$.` },
        {
          text: `Evaluamos el polinomio en $x = ${k}$:`,
          latex: `P(${k}) = ${a}(${k})^3 + (${b})(${k})^2 + (${c})(${k}) + (${d}) = ${remainder}`,
        },
      ],
      explanation: `El resto de la división es ${remainder}.`,
      fingerprint: makeFingerprint(this.id, `${pPoly}|${k}`),
    };
  },
  check(ex, input) {
    const val = parseInt(input.trim(), 10);
    const expected = Number(ex.params.remainder);
    if (isNaN(val)) return invalid("Ingresá un número entero.");
    return val === expected
      ? correct("¡Correcto! El resto obtenido por el teorema es exacto.")
      : incorrect("El valor del resto no es correcto. Revisá la sustitución numérica de x.");
  },
  verify(ex) {
    const problems: string[] = [];
    const exp = Number(ex.params.remainder);
    if (isNaN(exp)) problems.push("El resto no es un número válido.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 3. Factorización de Polinomios                                     */
/* ------------------------------------------------------------------ */

const factorizacionPolinomios: ExerciseTemplate = {
  id: "algebra.factorizacion",
  moduleId: MODULE_ID,
  topicId: "factorizacion",
  title: "Casos de factorización de polinomios",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    const caseType = rng.pick(["diferencia-cuadrados", "trinomio-cuadrado-perfecto", "factor-comun"] as const);

    let statementLatex: string;
    let factoredLatex: string;
    let explanation: string;
    let options: string[];

    if (caseType === "diferencia-cuadrados") {
      const a = rng.int(2, 9);
      const a2 = a * a;
      statementLatex = `x^2 - ${a2}`;
      factoredLatex = `(x - ${a})(x + ${a})`;
      explanation = `Es una diferencia de cuadrados $a^2 - b^2 = (a - b)(a + b)$ con bases $x$ y $${a}$.`;
      options = rng.shuffle([
        factoredLatex,
        `(x - ${a})^2`,
        `(x + ${a})^2`,
        `(x - ${a2})(x + 1)`,
      ]);
    } else if (caseType === "trinomio-cuadrado-perfecto") {
      const a = rng.int(1, 6);
      const isMinus = rng.bool();
      const cConst = a * a;
      const signStr = isMinus ? `- ${2 * a}x` : `+ ${2 * a}x`;
      statementLatex = `x^2 ${signStr} + ${cConst}`;
      factoredLatex = isMinus ? `(x - ${a})^2` : `(x + ${a})^2`;
      explanation = `Es un trinomio cuadrado perfecto de la forma $x^2 \\pm 2ax + a^2 = (x \\pm a)^2$.`;
      options = rng.shuffle([
        factoredLatex,
        isMinus ? `(x + ${a})^2` : `(x - ${a})^2`,
        `(x - ${a})(x + ${a})`,
        `(x + ${cConst})^2`,
      ]);
    } else {
      // Factor común
      const factor = rng.pick([2, 3, 4, 5]);
      const c1 = rng.int(1, 4);
      const c0 = rng.int(1, 5);
      const p1 = factor * c1;
      const p0 = factor * c0;
      statementLatex = `${p1}x + ${p0}`;
      factoredLatex = `${factor}(${c1 === 1 ? "" : c1}x + ${c0})`;
      explanation = `Sacamos factor común ${factor}, que divide a ambos términos.`;
      options = rng.shuffle([
        factoredLatex,
        `${factor * 2}(${c1}x + ${c0})`,
        `${factor}(${c1}x - ${c0})`,
        `x(${p1} + ${p0})`,
      ]);
    }

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { statement: statementLatex, ans: factoredLatex },
      statement: `Factorizá al máximo la siguiente expresión algebraica: $$${statementLatex}$$`,
      answerSpec: { type: "choice", options },
      correctAnswer: factoredLatex,
      constraints: ["Casos clásicos de factoreo de la cartilla."],
      hints: [
        "Fijate si hay dos términos restados con raíces cuadradas exactas (diferencia de cuadrados).",
        "Si son tres términos, comprobá si es el desarrollo de un binomio al cuadrado.",
      ],
      steps: [
        { text: `Identificamos el caso de factoreo correspondinte: ${explanation}` },
        { text: `Expresión factorizada: $${factoredLatex}$.` },
      ],
      explanation,
      fingerprint: makeFingerprint(this.id, statementLatex),
    };
  },
  check(ex, input) {
    if (ex.answerSpec.type !== "choice") return invalid("Ejercicio inválido.");
    const chosen = ex.answerSpec.options.find((opt) => opt.trim() === input.trim());
    if (!chosen) return invalid("Seleccioná una de las opciones.");
    return chosen === ex.correctAnswer
      ? correct("¡Correcto! La factorización es exacta.")
      : incorrect("La opción seleccionada no es la factorización correcta.");
  },
  verify(ex) {
    const problems: string[] = [];
    if (ex.answerSpec.type !== "choice" || !ex.answerSpec.options.includes(ex.correctAnswer)) {
      problems.push("La respuesta no figura en las opciones.");
    }
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 4. Expresiones Algebraicas Fraccionarias                            */
/* ------------------------------------------------------------------ */

const fraccionesAlgebraicas: ExerciseTemplate = {
  id: "algebra.fracciones-algebraicas",
  moduleId: MODULE_ID,
  topicId: "expresiones-fraccionarias",
  title: "Simplificación de expresiones algebraicas fraccionarias",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    const a = rng.int(2, 6);
    const a2 = a * a;
    // (x^2 - a^2) / (x - a) = x + a, o (x^2 - a^2) / (x + a) = x - a
    const isDenominatorMinus = rng.bool();
    const denStr = isDenominatorMinus ? `x - ${a}` : `x + ${a}`;
    const ansStr = isDenominatorMinus ? `x + ${a}` : `x - ${a}`;

    const statementLatex = `\\frac{x^2 - ${a2}}{${denStr}}`;
    const options = rng.shuffle([
      ansStr,
      isDenominatorMinus ? `x - ${a}` : `x + ${a}`,
      `x - ${a2}`,
      `\\frac{1}{${ansStr}}`,
    ]);

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { a, statement: statementLatex, ans: ansStr },
      statement: `Simplificá al máximo la siguiente expresión algebraica fraccionaria (suponiendo denominadores no nulos): $$${statementLatex}$$`,
      answerSpec: { type: "choice", options },
      correctAnswer: ansStr,
      constraints: ["Factorización de numerador y simplificación de factores comunes no nulos."],
      hints: [
        "Factorizá el numerador usando diferencia de cuadrados: x² - a² = (x - a)(x + a).",
        "Cancelá el factor común que figura tanto en el numerador como en el denominador.",
      ],
      steps: [
        {
          text: `Factorizamos el numerador por diferencia de cuadrados:`,
          latex: `x^2 - ${a2} = (x - ${a})(x + ${a})`,
        },
        {
          text: `Simplificamos el factor común $${denStr}$:`,
          latex: `\\frac{(x - ${a})(x + ${a})}{${denStr}} = ${ansStr}`,
        },
      ],
      explanation: `La expresión simplificada es $${ansStr}$.`,
      fingerprint: makeFingerprint(this.id, statementLatex),
    };
  },
  check(ex, input) {
    if (ex.answerSpec.type !== "choice") return invalid("Ejercicio inválido.");
    const chosen = ex.answerSpec.options.find((opt) => opt.trim() === input.trim());
    if (!chosen) return invalid("Seleccioná una de las opciones.");
    return chosen === ex.correctAnswer
      ? correct("¡Correcto! Simplificación algebraica exacta.")
      : incorrect("La opción seleccionada no es la simplificación correcta.");
  },
  verify(ex) {
    const problems: string[] = [];
    if (ex.answerSpec.type !== "choice" || !ex.answerSpec.options.includes(ex.correctAnswer)) {
      problems.push("La respuesta no figura en las opciones.");
    }
    return problems;
  },
};

export const ALGEBRA_TEMPLATES: readonly ExerciseTemplate[] = [
  operacionesPolinomios,
  teoremaResto,
  factorizacionPolinomios,
  fraccionesAlgebraicas,
];
