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

const MODULE_ID = 7;

// Ternas pitagóricas clásicas (a, b, c) donde a^2 + b^2 = c^2
const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [6, 8, 10],
  [8, 15, 17],
  [7, 24, 25],
  [9, 12, 15],
  [12, 16, 20],
] as const;

/* ------------------------------------------------------------------ */
/* 1. Teorema de Pitágoras                                            */
/* ------------------------------------------------------------------ */

const pitagoras: ExerciseTemplate = {
  id: "trigonometria.pitagoras",
  moduleId: MODULE_ID,
  topicId: "pitagoras",
  title: "Cálculo de lados con el Teorema de Pitágoras",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    const triple = rng.pick(TRIPLES);
    const [catA, catB, hip] = triple;
    const askHipotenusa = rng.bool();

    let statement: string;
    let ans: number;
    let steps: Step[];

    if (askHipotenusa) {
      ans = hip;
      statement = `En un triángulo rectángulo, los catetos miden $a = ${catA}\\text{ cm}$ y $b = ${catB}\\text{ cm}$. ¿Cuánto mide la hipotenusa $c$ en $\\text{cm}$?`;
      steps = [
        { text: `Por el Teorema de Pitágoras:`, latex: `c^2 = a^2 + b^2` },
        { text: `Sustituimos los catetos:`, latex: `c^2 = ${catA}^2 + ${catB}^2 = ${catA * catA} + ${catB * catB} = ${hip * hip}` },
        { text: `Despejamos la hipotenusa:`, latex: `c = \\sqrt{${hip * hip}} = ${hip}\\text{ cm}` },
      ];
    } else {
      const askA = rng.bool();
      const knownCat = askA ? catB : catA;
      ans = askA ? catA : catB;
      const catName = askA ? "a" : "b";
      const knownName = askA ? "b" : "a";

      statement = `En un triángulo rectángulo, la hipotenusa mide $c = ${hip}\\text{ cm}$ y uno de sus catetos mide $${knownName} = ${knownCat}\\text{ cm}$. ¿Cuánto mide el cateto $${catName}$ en $\\text{cm}$?`;
      steps = [
        { text: `Por el Teorema de Pitágoras:`, latex: `${catName}^2 + ${knownName}^2 = c^2 \\implies ${catName}^2 = c^2 - ${knownName}^2` },
        { text: `Sustituimos:`, latex: `${catName}^2 = ${hip}^2 - ${knownCat}^2 = ${hip * hip} - ${knownCat * knownCat} = ${ans * ans}` },
        { text: `Despejamos el cateto:`, latex: `${catName} = \\sqrt{${ans * ans}} = ${ans}\\text{ cm}` },
      ];
    }

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { catA, catB, hip, askHipotenusa, ans },
      statement: `${statement} Ingresá únicamente el valor numérico entero.`,
      answerSpec: { type: "formula" },
      correctAnswer: String(ans),
      constraints: ["Teorema de Pitágoras en triángulos rectángulos: c² = a² + b²."],
      hints: [
        "Recordá la fórmula fundamental: hipotenusa² = cateto1² + cateto2².",
        askHipotenusa
          ? "Sumá los cuadrados de los catetos y sacá la raíz cuadrada."
          : "Restá del cuadrado de la hipotenusa el cuadrado del cateto conocido, y luego extraé la raíz cuadrada.",
      ],
      steps,
      explanation: `La longitud buscada es ${ans} cm.`,
      fingerprint: makeFingerprint(this.id, `${triple.join(",")}|${askHipotenusa}`),
    };
  },
  check(ex, input) {
    const val = parseInt(input.trim(), 10);
    const expected = Number(ex.params.ans);
    if (isNaN(val)) return invalid("Ingresá un número entero.");
    return val === expected
      ? correct("¡Correcto! El cálculo con el Teorema de Pitágoras es exacto.")
      : incorrect("El valor no es correcto. Revisá los cuadrados y la raíz.");
  },
  verify(ex) {
    const problems: string[] = [];
    const ans = Number(ex.params.ans);
    if (isNaN(ans) || ans <= 0) problems.push("El resultado debe ser un entero positivo.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 2. Razones Trigonométricas en Triángulos Rectángulos               */
/* ------------------------------------------------------------------ */

const razonesTrig: ExerciseTemplate = {
  id: "trigonometria.razones",
  moduleId: MODULE_ID,
  topicId: "razones-trigonometricas",
  title: "Definición y cálculo de razones trigonométricas (sen, cos, tan)",
  difficulties: ["facil", "intermedio"],
  generate(rng, difficulty): ExerciseDraft {
    const [op, ady, hip] = rng.pick(TRIPLES);
    const ratioType = rng.pick(["sen", "cos", "tan"] as const);

    let num: number;
    let den: number;
    let ratioLatex: string;
    let definition: string;

    if (ratioType === "sen") {
      num = op;
      den = hip;
      ratioLatex = `\\operatorname{sen}(\\alpha)`;
      definition = `\\frac{\\text{cateto opuesto}}{\\text{hipotenusa}} = \\frac{${op}}{${hip}}`;
    } else if (ratioType === "cos") {
      num = ady;
      den = hip;
      ratioLatex = `\\cos(\\alpha)`;
      definition = `\\frac{\\text{cateto adyacente}}{\\text{hipotenusa}} = \\frac{${ady}}{${hip}}`;
    } else {
      num = op;
      den = ady;
      ratioLatex = `\\tan(\\alpha)`;
      definition = `\\frac{\\text{cateto opuesto}}{\\text{cateto adyacente}} = \\frac{${op}}{${ady}}`;
    }

    const frac = Fraction.of(num, den);
    const ansString = frac.toString();

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { op, ady, hip, ratioType, ans: ansString },
      statement: `En un triángulo rectángulo respecto a un ángulo agudo $\\alpha$, el cateto opuesto mide $${op}$, el cateto adyacente mide $${ady}$ y la hipotenusa mide $${hip}$. Hallá el valor exacto de $${ratioLatex}$ expresado como fracción irreducible (ej: 3/5 o 4/3).`,
      answerSpec: { type: "formula" },
      correctAnswer: ansString,
      constraints: ["Definiciones clásicas de razones trigonométricas en el triángulo rectángulo."],
      hints: [
        "sen(α) = cateto opuesto / hipotenusa",
        "cos(α) = cateto adyacente / hipotenusa",
        "tan(α) = cateto opuesto / cateto adyacente",
      ],
      steps: [
        { text: `Aplicamos la definición de $${ratioLatex}$:` },
        { text: `$${ratioLatex} = ${definition} = ${frac.toLatex()}$` },
      ],
      explanation: `El valor de $${ratioLatex}$ es $${frac.toLatex()}$.`,
      fingerprint: makeFingerprint(this.id, `${op}|${ady}|${hip}|${ratioType}`),
    };
  },
  check(ex, input) {
    const student = Fraction.parse(input);
    if (!student) return invalid("Ingresá una fracción válida (ej: 3/5) o un número.");
    const expected = Fraction.parse(ex.correctAnswer);
    if (!expected) return invalid("Error interno del ejercicio.");
    return student.equals(expected)
      ? correct("¡Correcto! Razón trigonométrica exacta.")
      : incorrect("La fracción ingresada no coincide con la razón trigonométrica pedida.");
  },
  verify(ex) {
    const problems: string[] = [];
    const expected = Fraction.parse(ex.correctAnswer);
    if (!expected) problems.push("La respuesta esperada no se puede parsear como fracción.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 3. Ángulos Notables (30°, 45°, 60°)                                */
/* ------------------------------------------------------------------ */

const NOTABLE_VALUES = [
  { func: "\\operatorname{sen}(30^\\circ)", value: "\\frac{1}{2}", text: "1/2" },
  { func: "\\cos(60^\\circ)", value: "\\frac{1}{2}", text: "1/2" },
  { func: "\\tan(45^\\circ)", value: "1", text: "1" },
  { func: "\\operatorname{sen}(90^\\circ)", value: "1", text: "1" },
  { func: "\\cos(0^\\circ)", value: "1", text: "1" },
  { func: "\\operatorname{sen}(0^\\circ)", value: "0", text: "0" },
  { func: "\\cos(90^\\circ)", value: "0", text: "0" },
  { func: "\\tan(0^\\circ)", value: "0", text: "0" },
] as const;

const angulosNotables: ExerciseTemplate = {
  id: "trigonometria.angulos-notables",
  moduleId: MODULE_ID,
  topicId: "razones-trigonometricas",
  title: "Valores exactos de ángulos notables",
  difficulties: ["facil", "intermedio"],
  generate(rng, difficulty): ExerciseDraft {
    const item = rng.pick(NOTABLE_VALUES);

    const options = rng.shuffle([
      item.value,
      item.value === "1" ? "0" : "1",
      item.value === "\\frac{1}{2}" ? "\\frac{\\sqrt{3}}{2}" : "\\frac{1}{2}",
      item.value === "0" ? "-1" : "0",
    ]);

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { func: item.func, value: item.value },
      statement: `Indicá el valor exacto de la siguiente razón trigonométrica: $$${item.func}$$`,
      answerSpec: { type: "choice", options },
      correctAnswer: item.value,
      constraints: ["Tabla de valores notables de la cartilla (0°, 30°, 45°, 60°, 90°)."],
      hints: [
        "Recordá la tabla de ángulos notables.",
        "sen(30°) = cos(60°) = 1/2, tan(45°) = 1.",
      ],
      steps: [
        { text: `Por la tabla trigonométrica de ángulos notables:` },
        { text: `$${item.func} = ${item.value}$` },
      ],
      explanation: `El valor exacto de $${item.func}$ es $${item.value}$.`,
      fingerprint: makeFingerprint(this.id, item.func),
    };
  },
  check(ex, input) {
    if (ex.answerSpec.type !== "choice") return invalid("Ejercicio inválido.");
    const chosen = ex.answerSpec.options.find((opt) => opt.trim() === input.trim());
    if (!chosen) return invalid("Seleccioná una de las opciones propuestas.");
    return chosen === ex.correctAnswer
      ? correct("¡Correcto! El valor notable es exacto.")
      : incorrect("La opción elegida no es el valor de la razón para ese ángulo.");
  },
  verify(ex) {
    const problems: string[] = [];
    if (ex.answerSpec.type !== "choice" || !ex.answerSpec.options.includes(ex.correctAnswer)) {
      problems.push("La respuesta no figura en las opciones.");
    }
    return problems;
  },
};

export const TRIGONOMETRY_TEMPLATES: readonly ExerciseTemplate[] = [
  pitagoras,
  razonesTrig,
  angulosNotables,
];
