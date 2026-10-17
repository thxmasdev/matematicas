import {
  correct,
  incorrect,
  invalid,
  makeFingerprint,
  type ExerciseDraft,
  type ExerciseTemplate,
  type Step,
} from "@/engine/exercise";

const MODULE_ID = 6;

/* ------------------------------------------------------------------ */
/* 1. Ángulos Complementarios, Suplementarios y Triángulos           */
/* ------------------------------------------------------------------ */

const angulos: ExerciseTemplate = {
  id: "geometria.angulos",
  moduleId: MODULE_ID,
  topicId: "elementos-y-angulos",
  title: "Ángulos complementarios, suplementarios y suma interior en triángulos",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    if (difficulty === "facil") {
      const isComp = rng.bool();
      if (isComp) {
        // Complementarios suman 90°
        const a = rng.int(15, 75);
        const ans = 90 - a;
        return {
          templateId: this.id,
          moduleId: MODULE_ID,
          topicId: this.topicId,
          difficulty,
          params: { a, ans, type: "complementarios" },
          statement: `Dos ángulos $\\alpha$ y $\\beta$ son complementarios. Si $\\alpha = ${a}^\\circ$, ¿cuánto mide el ángulo $\\beta$ en grados sexagesimales?`,
          answerSpec: { type: "formula" },
          correctAnswer: String(ans),
          constraints: ["Dos ángulos son complementarios si su suma es 90°."],
          hints: ["Recordá que α + β = 90°. Despejá β = 90° - α."],
          steps: [
            { text: `Por definición de ángulos complementarios: $\\alpha + \\beta = 90^\\circ$.` },
            { text: `Sustituimos el valor conocido:`, latex: `${a}^\\circ + \\beta = 90^\\circ \\implies \\beta = 90^\\circ - ${a}^\\circ = ${ans}^\\circ` },
          ],
          explanation: `El ángulo $\\beta$ mide ${ans}°.`,
          fingerprint: makeFingerprint(this.id, `comp|${a}`),
        };
      } else {
        // Suplementarios suman 180°
        const a = rng.int(20, 160);
        const ans = 180 - a;
        return {
          templateId: this.id,
          moduleId: MODULE_ID,
          topicId: this.topicId,
          difficulty,
          params: { a, ans, type: "suplementarios" },
          statement: `Dos ángulos $\\alpha$ y $\\beta$ son suplementarios. Si $\\alpha = ${a}^\\circ$, ¿cuánto mide el ángulo $\\beta$ en grados sexagesimales?`,
          answerSpec: { type: "formula" },
          correctAnswer: String(ans),
          constraints: ["Dos ángulos son suplementarios si su suma es 180°."],
          hints: ["Recordá que α + β = 180°. Despejá β = 180° - α."],
          steps: [
            { text: `Por definición de ángulos suplementarios: $\\alpha + \\beta = 180^\\circ$.` },
            { text: `Sustituimos:`, latex: `${a}^\\circ + \\beta = 180^\\circ \\implies \\beta = 180^\\circ - ${a}^\\circ = ${ans}^\\circ` },
          ],
          explanation: `El ángulo $\\beta$ mide ${ans}°.`,
          fingerprint: makeFingerprint(this.id, `sup|${a}`),
        };
      }
    }

    // Intermedio/Dificil: Suma de ángulos interiores de un triángulo
    const a1 = rng.int(30, 80);
    const a2 = rng.int(30, 180 - a1 - 20);
    const ans = 180 - a1 - a2;

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { a1, a2, ans },
      statement: `En un triángulo, dos de sus ángulos interiores miden $\\alpha = ${a1}^\\circ$ y $\\beta = ${a2}^\\circ$. ¿Cuánto mide el tercer ángulo interior $\\gamma$?`,
      answerSpec: { type: "formula" },
      correctAnswer: String(ans),
      constraints: ["La suma de los ángulos interiores de todo triángulo en geometría euclídea es 180°."],
      hints: [
        "La suma de los tres ángulos interiores de cualquier triángulo es siempre igual a 180°.",
        "γ = 180° - (α + β).",
      ],
      steps: [
        { text: `Propiedad de los ángulos interiores: $\\alpha + \\beta + \\gamma = 180^\\circ$.` },
        { text: `Sustituimos los ángulos conocidos:`, latex: `${a1}^\\circ + ${a2}^\\circ + \\gamma = 180^\\circ \\implies ${a1 + a2}^\\circ + \\gamma = 180^\\circ` },
        { text: `Despejamos $\\gamma$:`, latex: `\\gamma = 180^\\circ - ${a1 + a2}^\\circ = ${ans}^\\circ` },
      ],
      explanation: `El tercer ángulo $\\gamma$ mide ${ans}°.`,
      fingerprint: makeFingerprint(this.id, `tri|${a1}|${a2}`),
    };
  },
  check(ex, input) {
    const val = parseInt(input.trim().replace("°", ""), 10);
    const expected = Number(ex.params.ans);
    if (isNaN(val)) return invalid("Ingresá un número entero correspondiente a los grados.");
    return val === expected
      ? correct("¡Correcto! El valor angular es exacto.")
      : incorrect("El ángulo calculado no es correcto. Revisá la suma.");
  },
  verify(ex) {
    const problems: string[] = [];
    const ans = Number(ex.params.ans);
    if (isNaN(ans) || ans <= 0 || ans >= 180) problems.push("El ángulo solución está fuera de rango (0°, 180°).");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 2. Figuras Planas: Área y Perímetro                                */
/* ------------------------------------------------------------------ */

const figurasPlanas: ExerciseTemplate = {
  id: "geometria.figuras-planas",
  moduleId: MODULE_ID,
  topicId: "figuras-planas",
  title: "Cálculo de área y perímetro de figuras planas",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    const shape = rng.pick(["rectangulo", "triangulo", "trapecio", "rombo"] as const);

    let statement: string;
    let ans: number;
    let steps: Step[];
    let explanation: string;

    if (shape === "rectangulo") {
      const b = rng.int(4, 15);
      const h = rng.int(3, 10);
      const askArea = rng.bool();
      if (askArea) {
        ans = b * h;
        statement = `Un rectángulo tiene base $b = ${b}\\text{ cm}$ y altura $h = ${h}\\text{ cm}$. ¿Cuál es su área en $\\text{cm}^2$?`;
        steps = [
          { text: `Fórmula del área del rectángulo:`, latex: `A = b \\cdot h` },
          { text: `Calculamos:`, latex: `A = ${b} \\cdot ${h} = ${ans}\\text{ cm}^2` },
        ];
        explanation = `El área del rectángulo es ${ans} cm².`;
      } else {
        ans = 2 * (b + h);
        statement = `Un rectángulo tiene base $b = ${b}\\text{ cm}$ y altura $h = ${h}\\text{ cm}$. ¿Cuál es su perímetro en $\\text{cm}$?`;
        steps = [
          { text: `Fórmula del perímetro del rectángulo:`, latex: `P = 2b + 2h` },
          { text: `Calculamos:`, latex: `P = 2(${b}) + 2(${h}) = ${2 * b} + ${2 * h} = ${ans}\\text{ cm}` },
        ];
        explanation = `El perímetro del rectángulo es ${ans} cm.`;
      }
    } else if (shape === "triangulo") {
      const b = rng.pick([4, 6, 8, 10, 12]);
      const h = rng.int(3, 11);
      ans = (b * h) / 2;
      statement = `Un triángulo tiene una base de $${b}\\text{ cm}$ y una altura correspondiente de $${h}\\text{ cm}$. ¿Cuál es su área en $\\text{cm}^2$?`;
      steps = [
        { text: `Fórmula del área del triángulo:`, latex: `A = \\frac{b \\cdot h}{2}` },
        { text: `Sustituimos:`, latex: `A = \\frac{${b} \\cdot ${h}}{2} = \\frac{${b * h}}{2} = ${ans}\\text{ cm}^2` },
      ];
      explanation = `El área del triángulo es ${ans} cm².`;
    } else if (shape === "rombo") {
      const D = rng.pick([6, 8, 10, 12, 14]);
      const d = rng.pick([4, 6, 8]);
      ans = (D * d) / 2;
      statement = `Un rombo tiene una diagonal mayor $D = ${D}\\text{ cm}$ y una diagonal menor $d = ${d}\\text{ cm}$. ¿Cuál es su área en $\\text{cm}^2$?`;
      steps = [
        { text: `Fórmula del área del rombo:`, latex: `A = \\frac{D \\cdot d}{2}` },
        { text: `Calculamos:`, latex: `A = \\frac{${D} \\cdot ${d}}{2} = ${ans}\\text{ cm}^2` },
      ];
      explanation = `El área del rombo es ${ans} cm².`;
    } else {
      // Trapecio
      const B = rng.pick([8, 10, 12, 14]);
      const b = rng.pick([4, 6]);
      const h = rng.pick([3, 4, 5, 6]);
      ans = ((B + b) * h) / 2;
      statement = `Un trapecio tiene base mayor $B = ${B}\\text{ cm}$, base menor $b = ${b}\\text{ cm}$ y altura $h = ${h}\\text{ cm}$. ¿Cuál es su área en $\\text{cm}^2$?`;
      steps = [
        { text: `Fórmula del área del trapecio:`, latex: `A = \\frac{(B + b) \\cdot h}{2}` },
        { text: `Calculamos:`, latex: `A = \\frac{(${B} + ${b}) \\cdot ${h}}{2} = \\frac{${B + b} \\cdot ${h}}{2} = ${ans}\\text{ cm}^2` },
      ];
      explanation = `El área del trapecio es ${ans} cm².`;
    }

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { shape, ans },
      statement: `${statement} Ingresá únicamente el valor numérico.`,
      answerSpec: { type: "formula" },
      correctAnswer: String(ans),
      constraints: ["Fórmulas clásicas de áreas y perímetros de figuras poligonales."],
      hints: [
        "Identificá la figura y su correspondiente fórmula de área o perímetro.",
        "Realizá las multiplicaciones y divisiones correspondientes cuidando las unidades.",
      ],
      steps,
      explanation,
      fingerprint: makeFingerprint(this.id, `${shape}|${ans}|${statement.slice(0, 30)}`),
    };
  },
  check(ex, input) {
    const val = parseInt(input.trim(), 10);
    const expected = Number(ex.params.ans);
    if (isNaN(val)) return invalid("Ingresá un número entero.");
    return val === expected
      ? correct("¡Correcto! El cálculo de la magnitud geométrica es exacto.")
      : incorrect("El resultado no es correcto. Revisá la fórmula y las operaciones.");
  },
  verify(ex) {
    const problems: string[] = [];
    const ans = Number(ex.params.ans);
    if (isNaN(ans) || ans <= 0) problems.push("El resultado debe ser positivo.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 3. Cuerpos Geométricos: Volumen de Cubo, Prisma y Cilindro        */
/* ------------------------------------------------------------------ */

const cuerposGeometricos: ExerciseTemplate = {
  id: "geometria.cuerpos",
  moduleId: MODULE_ID,
  topicId: "cuerpos-geometricos",
  title: "Volumen de cuerpos geométricos (cubo y prisma)",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    const isCube = rng.bool();
    let statement: string;
    let ans: number;
    let steps: Step[];
    let explanation: string;

    if (isCube) {
      const a = rng.int(2, 6);
      ans = a * a * a;
      statement = `Un cubo tiene aristas de longitud $a = ${a}\\text{ cm}$. ¿Cuál es su volumen en $\\text{cm}^3$?`;
      steps = [
        { text: `Fórmula del volumen del cubo:`, latex: `V = a^3` },
        { text: `Calculamos:`, latex: `V = ${a}^3 = ${ans}\\text{ cm}^3` },
      ];
      explanation = `El volumen del cubo es ${ans} cm³.`;
    } else {
      const a = rng.int(2, 6);
      const b = rng.int(2, 5);
      const c = rng.int(3, 8);
      ans = a * b * c;
      statement = `Un prisma recto de base rectangular (paralelepípedo) tiene dimensiones $a = ${a}\\text{ cm}$, $b = ${b}\\text{ cm}$ y altura $h = ${c}\\text{ cm}$. ¿Cuál es su volumen en $\\text{cm}^3$?`;
      steps = [
        { text: `Fórmula del volumen del prisma rectangular:`, latex: `V = a \\cdot b \\cdot h` },
        { text: `Calculamos:`, latex: `V = ${a} \\cdot ${b} \\cdot ${c} = ${ans}\\text{ cm}^3` },
      ];
      explanation = `El volumen del prisma es ${ans} cm³.`;
    }

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { isCube, ans },
      statement: `${statement} Ingresá únicamente el valor numérico.`,
      answerSpec: { type: "formula" },
      correctAnswer: String(ans),
      constraints: ["Volumen de poliedros regulares y prismas: V = base * altura."],
      hints: [
        "Para un cubo: V = arista³.",
        "Para un prisma rectangular: V = largo · ancho · alto.",
      ],
      steps,
      explanation,
      fingerprint: makeFingerprint(this.id, `${isCube}|${ans}`),
    };
  },
  check(ex, input) {
    const val = parseInt(input.trim(), 10);
    const expected = Number(ex.params.ans);
    if (isNaN(val)) return invalid("Ingresá un número entero.");
    return val === expected
      ? correct("¡Correcto! El volumen calculado es exacto.")
      : incorrect("El valor del volumen no es correcto.");
  },
  verify(ex) {
    const problems: string[] = [];
    const ans = Number(ex.params.ans);
    if (isNaN(ans) || ans <= 0) problems.push("El volumen debe ser un número positivo.");
    return problems;
  },
};

export const GEOMETRY_TEMPLATES: readonly ExerciseTemplate[] = [
  angulos,
  figurasPlanas,
  cuerposGeometricos,
];
