import {
  correct,
  incorrect,
  invalid,
  makeFingerprint,
  type ExerciseDraft,
  type ExerciseTemplate,
  type GeneratedExercise,
  type CheckResult,
  type Step,
} from "@/engine/exercise";
import {
  complement,
  difference,
  intersection,
  makeSet,
  parseSet,
  setEquals,
  symmetricDifference,
  toLatex as setLatex,
  toText as setText,
  union,
  type FiniteSet,
} from "@/engine/sets/sets";

import type { Difficulty } from "@/types/module";

const MODULE_ID = 2;
const ALL: readonly Difficulty[] = ["facil", "intermedio", "dificil", "avanzado"];

function checkChoice(ex: GeneratedExercise, input: string): CheckResult {
  if (ex.answerSpec.type !== "choice") return invalid("Este ejercicio no es de opción múltiple.");
  const picked = ex.answerSpec.options.find((o) => o.toLowerCase() === input.trim().toLowerCase());
  if (!picked) return invalid("Elegí una de las opciones propuestas.");
  return picked === ex.correctAnswer
    ? correct()
    : incorrect("No es esa opción. Revisá las definiciones e intentá nuevamente.");
}

/* ------------------------------------------------------------------ */
/* 1. Relación de Pertenencia e Inclusión                             */
/* ------------------------------------------------------------------ */

const REL_OPTIONS = ["∈", "∉", "⊂", "⊄"] as const;

export interface RelItem {
  leftText: string;
  leftLatex: string;
  rightText: string;
  rightLatex: string;
  relation: "∈" | "∉" | "⊂" | "⊄";
  explanation: string;
}

const pertenenciaInclusion: ExerciseTemplate = {
  id: "conjuntos.pertenencia-inclusion",
  moduleId: MODULE_ID,
  topicId: "conjuntos-especiales",
  title: "Pertenencia e Inclusión entre elementos y conjuntos",
  difficulties: ["facil", "intermedio"],
  generate(rng, difficulty): ExerciseDraft {
    // Generamos universos y conjuntos típicos de la cartilla
    const items: RelItem[] = [];
    const nums = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const setA = makeSet(nums.slice(0, 4));
    const elemInside = nums[0];
    const elemOutside = nums[5];
    const subsetA = makeSet([nums[0], nums[1]]);
    const notSubsetA = makeSet([nums[0], nums[5]]);

    if (difficulty === "facil") {
      items.push(
        {
          leftText: String(elemInside),
          leftLatex: String(elemInside),
          rightText: setText(setA),
          rightLatex: setLatex(setA),
          relation: "∈",
          explanation: `${elemInside} es un elemento que figura dentro del conjunto ${setText(setA)}. Por tanto, pertenece (∈).`,
        },
        {
          leftText: String(elemOutside),
          leftLatex: String(elemOutside),
          rightText: setText(setA),
          rightLatex: setLatex(setA),
          relation: "∉",
          explanation: `${elemOutside} no es un elemento del conjunto ${setText(setA)}. Por tanto, no pertenece (∉).`,
        },
        {
          leftText: setText(subsetA),
          leftLatex: setLatex(subsetA),
          rightText: setText(setA),
          rightLatex: setLatex(setA),
          relation: "⊂",
          explanation: `Todos los elementos de ${setText(subsetA)} están dentro de ${setText(setA)}. Es una relación entre conjuntos: está incluido (⊂).`,
        },
        {
          leftText: setText(notSubsetA),
          leftLatex: setLatex(notSubsetA),
          rightText: setText(setA),
          rightLatex: setLatex(setA),
          relation: "⊄",
          explanation: `El elemento ${nums[5]} de ${setText(notSubsetA)} no pertenece a ${setText(setA)}. Por tanto, no está incluido (⊄).`,
        },
      );
    } else {
      // Casos especiales de la cartilla: vacío, conjuntos que contienen conjuntos
      items.push(
        {
          leftText: "∅",
          leftLatex: "\\emptyset",
          rightText: setText(setA),
          rightLatex: setLatex(setA),
          relation: "⊂",
          explanation: "El conjunto vacío está incluido en todo conjunto por definición formal (∅ ⊂ A).",
        },
        {
          leftText: String(nums[0]),
          leftLatex: String(nums[0]),
          rightText: `{{${nums[0]}}, {${nums[1]}}}`,
          rightLatex: `\\{\\{${nums[0]}\\}, \\{${nums[1]}\\}\\}`,
          relation: "∉",
          explanation: `El número ${nums[0]} no es elemento de ese conjunto; el elemento es el conjunto {${nums[0]}}. Por tanto, ${nums[0]} ∉ {{${nums[0]}}, {${nums[1]}}}.`,
        },
        {
          leftText: `{${nums[0]}}`,
          leftLatex: `\\{${nums[0]}\\}`,
          rightText: `{{${nums[0]}}, {${nums[1]}}}`,
          rightLatex: `\\{\\{${nums[0]}\\}, \\{${nums[1]}\\}\\}`,
          relation: "∈",
          explanation: `{${nums[0]}} es uno de los elementos directos que pertenecen al conjunto. Por tanto, {${nums[0]}} ∈ {{${nums[0]}}, {${nums[1]}}}.`,
        },
        {
          leftText: `{{${nums[0]}}}`,
          leftLatex: `\\{\\{${nums[0]}\\}\\}`,
          rightText: `{{${nums[0]}}, {${nums[1]}}}`,
          rightLatex: `\\{\\{${nums[0]}\\}, \\{${nums[1]}\\}\\}`,
          relation: "⊂",
          explanation: `El conjunto {{${nums[0]}}} contiene a {${nums[0]}}, que es elemento del conjunto mayor. Al ser relación entre conjuntos, corresponde inclusión (⊂).`,
        },
      );
    }

    const item = rng.pick(items);
    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: {
        left: item.leftText,
        right: item.rightText,
        relation: item.relation,
      },
      statement: `Completá el espacio con el símbolo que corresponda ($\\in$, $\\notin$, $\\subset$ o $\\not\\subset$): $${item.leftLatex} \\quad \\_\\_\\_ \\quad ${item.rightLatex}$.`,
      answerSpec: { type: "choice", options: REL_OPTIONS },
      correctAnswer: item.relation,
      constraints: [
        "Pertenencia (∈, ∉) se evalúa estrictamente entre un elemento y un conjunto.",
        "Inclusión (⊂, ⊄) se evalúa estrictamente entre dos conjuntos.",
        "El conjunto vacío está incluido en cualquier conjunto.",
      ],
      hints: [
        "Fijate si a la izquierda hay un elemento o un conjunto (las llaves { } denotan conjunto).",
        "Pertenencia (∈, ∉) conecta un elemento con un conjunto. Inclusión (⊂, ⊄) conecta dos conjuntos.",
      ],
      steps: [
        { text: `Analizamos el término de la izquierda: ${item.leftText}.` },
        { text: `Analizamos el conjunto de la derecha: ${item.rightText}.` },
        { text: item.explanation },
      ],
      explanation: item.explanation,
      fingerprint: makeFingerprint(this.id, `${item.leftText}|${item.rightText}|${item.relation}`),
    };
  },
  check: checkChoice,
  verify(ex) {
    const problems: string[] = [];
    const rel = ex.params.relation as string;
    if (!REL_OPTIONS.includes(rel as "∈")) problems.push("Relación no admitida.");
    if (ex.correctAnswer !== rel) problems.push("La respuesta no coincide con la relación del ejercicio.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 2. Operaciones entre Conjuntos Finitos                              */
/* ------------------------------------------------------------------ */

export type SetOpKind = "union" | "intersection" | "diff-AB" | "diff-BA" | "complement" | "combined";

const operacionesConjuntos: ExerciseTemplate = {
  id: "conjuntos.operaciones",
  moduleId: MODULE_ID,
  topicId: "operaciones-conjuntos",
  title: "Operaciones con conjuntos (Unión, Intersección, Diferencia, Complemento)",
  difficulties: ALL,
  generate(rng, difficulty): ExerciseDraft {
    const universeSize = { facil: 6, intermedio: 8, dificil: 9, avanzado: 10 }[difficulty];
    const universe = makeSet(Array.from({ length: universeSize }, (_, i) => i + 1));
    const sizeA = rng.int(3, Math.min(5, universeSize - 1));
    const sizeB = rng.int(3, Math.min(5, universeSize - 1));
    const A = makeSet(rng.sample(universe, sizeA));
    const B = makeSet(rng.sample(universe, sizeB));
    const C = makeSet(rng.sample(universe, rng.int(2, 4)));

    let targetOp: SetOpKind;
    let result: FiniteSet;
    let opLatex: string;
    let opText: string;
    let explanationSteps: Step[] = [];

    if (difficulty === "facil") {
      targetOp = rng.pick(["union", "intersection"]);
      if (targetOp === "union") {
        result = union(A, B);
        opLatex = "A \\cup B";
        opText = "A ∪ B";
        explanationSteps = [
          { text: `Juntamos todos los elementos de $A$ y de $B$, sin repetirlos:`, latex: `A \\cup B = ${setLatex(result)}` },
        ];
      } else {
        result = intersection(A, B);
        opLatex = "A \\cap B";
        opText = "A ∩ B";
        explanationSteps = [
          { text: `Buscamos los elementos comunes que están simultáneamente en $A$ y en $B$:`, latex: `A \\cap B = ${setLatex(result)}` },
        ];
      }
    } else if (difficulty === "intermedio") {
      targetOp = rng.pick(["diff-AB", "diff-BA", "complement"]);
      if (targetOp === "diff-AB") {
        result = difference(A, B);
        opLatex = "A - B";
        opText = "A - B";
        explanationSteps = [
          { text: `Tomamos los elementos de $A$ que no pertenecen a $B$:`, latex: `A - B = ${setLatex(result)}` },
        ];
      } else if (targetOp === "diff-BA") {
        result = difference(B, A);
        opLatex = "B - A";
        opText = "B - A";
        explanationSteps = [
          { text: `Tomamos los elementos de $B$ que no pertenecen a $A$:`, latex: `B - A = ${setLatex(result)}` },
        ];
      } else {
        result = complement(A, universe);
        opLatex = "A^c";
        opText = "A^c";
        explanationSteps = [
          { text: `Tomamos todos los elementos del universo $U$ que no están en $A$:`, latex: `A^c = ${setLatex(result)}` },
        ];
      }
    } else if (difficulty === "dificil") {
      targetOp = "combined";
      const combType = rng.pick(["comp-union", "diff-inter", "union-diff"]);
      if (combType === "comp-union") {
        const uAB = union(A, B);
        result = complement(uAB, universe);
        opLatex = "(A \\cup B)^c";
        opText = "(A ∪ B)^c";
        explanationSteps = [
          { text: `Calculamos la unión: $A \\cup B = ${setLatex(uAB)}$.` },
          { text: `Tomamos el complemento respecto al universo $U$: $(A \\cup B)^c = ${setLatex(result)}$.` },
        ];
      } else if (combType === "diff-inter") {
        const intAB = intersection(A, B);
        result = difference(A, intAB);
        opLatex = "A - (A \\cap B)";
        opText = "A - (A ∩ B)";
        explanationSteps = [
          { text: `Calculamos la intersección: $A \\cap B = ${setLatex(intAB)}$.` },
          { text: `Restamos esa intersección de $A$: $A - (A \\cap B) = ${setLatex(result)}$.` },
        ];
      } else {
        const diffBC = difference(B, C);
        result = union(A, diffBC);
        opLatex = "A \\cup (B - C)";
        opText = "A ∪ (B - C)";
        explanationSteps = [
          { text: `Calculamos la diferencia: $B - C = ${setLatex(diffBC)}$.` },
          { text: `Unimos el resultado con $A$: $A \\cup (B - C) = ${setLatex(result)}$.` },
        ];
      }
    } else {
      // avanzado: 3 conjuntos o diferencia simétrica
      targetOp = "combined";
      const isSym = rng.bool();
      if (isSym) {
        result = symmetricDifference(A, B);
        opLatex = "A \\mathbin{\\Delta} B";
        opText = "A Δ B";
        explanationSteps = [
          { text: `La diferencia simétrica reúne los elementos exclusivos de $A$ o de $B$: $(A - B) \\cup (B - A)$.` },
          { text: `$A - B = ${setLatex(difference(A, B))}$ y $B - A = ${setLatex(difference(B, A))}$.` },
          { text: `Unión: $A \\mathbin{\\Delta} B = ${setLatex(result)}$.` },
        ];
      } else {
        result = intersection(A, intersection(B, C));
        opLatex = "A \\cap B \\cap C";
        opText = "A ∩ B ∩ C";
        explanationSteps = [
          { text: `Buscamos los elementos comunes simultáneos a $A$, $B$ y $C$:` },
          { text: `$A \\cap B = ${setLatex(intersection(A, B))}$.` },
          { text: `Intersecamos con $C$: $A \\cap B \\cap C = ${setLatex(result)}$.` },
        ];
      }
    }

    const includeUniverse = targetOp === "complement" || opLatex.includes("^c");
    const statementVars = includeUniverse
      ? `Dados $U = ${setLatex(universe)}$, $A = ${setLatex(A)}$, $B = ${setLatex(B)}$` + (opLatex.includes("C") ? `, $C = ${setLatex(C)}$` : "")
      : `Dados $A = ${setLatex(A)}$, $B = ${setLatex(B)}$` + (opLatex.includes("C") ? `, $C = ${setLatex(C)}$` : "");

    const ansString = setText(result);

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: {
        A: setText(A),
        B: setText(B),
        C: setText(C),
        U: setText(universe),
        op: opText,
        expected: ansString,
      },
      statement: `${statementVars}, determiná por extensión el conjunto $${opLatex}$. Escribí los elementos entre llaves, por ejemplo {1, 2, 3}, o ∅ si es vacío.`,
      answerSpec: { type: "formula" },
      correctAnswer: ansString,
      constraints: [
        "Los elementos del conjunto solución están normalizados (ordenados y sin repetir).",
        "Si la intersección o diferencia resulta vacía, se acepta ∅, {}, o conjunto vacío.",
      ],
      hints: [
        "Unión (∪): juntar todos los elementos sin repetir.",
        "Intersección (∩): solo los elementos compartidos que están en ambos.",
        "Diferencia (A - B): elementos que están en A pero NO en B.",
        "Complemento (A^c): elementos del universo U que no están en A.",
      ],
      steps: explanationSteps,
      explanation: `El conjunto resultante es $${setLatex(result)}$.`,
      fingerprint: makeFingerprint(this.id, `${setText(A)}|${setText(B)}|${opText}`),
    };
  },
  check(ex, input) {
    const student = parseSet(input);
    if (student === null) {
      return invalid("Formato no válido. Escribí los elementos entre llaves separados por coma (ej: {1, 2, 3}) o ∅ para conjunto vacío.");
    }
    const expected = parseSet(ex.correctAnswer);
    if (!expected) return invalid("Error en el ejercicio.");

    if (setEquals(student, expected)) {
      return correct("¡Exacto! El conjunto calculado es correcto.");
    }

    // Diagnósticos amigables
    const missing = difference(expected, student);
    const extra = difference(student, expected);
    if (missing.length > 0 && extra.length === 0) {
      return incorrect(`Te faltaron elementos: ${setText(missing)}.`);
    }
    if (extra.length > 0 && missing.length === 0) {
      return incorrect(`Agregaste elementos que no corresponden: ${setText(extra)}.`);
    }
    return incorrect(`El conjunto no coincide con el resultado esperado.`);
  },
  verify(ex) {
    const problems: string[] = [];
    const studentCheck = parseSet(ex.correctAnswer);
    if (studentCheck === null) problems.push("La respuesta correcta no se puede parsear.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 3. Cardinal de Conjuntos y Principio de Inclusión-Exclusión         */
/* ------------------------------------------------------------------ */

const cardinalConjuntos: ExerciseTemplate = {
  id: "conjuntos.cardinal",
  moduleId: MODULE_ID,
  topicId: "nocion-y-representacion",
  title: "Cardinal de un conjunto finito y principio de inclusión-exclusión",
  difficulties: ["facil", "intermedio", "dificil"],
  generate(rng, difficulty): ExerciseDraft {
    if (difficulty === "facil") {
      const size = rng.int(3, 7);
      const elems = makeSet(rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], size));
      return {
        templateId: this.id,
        moduleId: MODULE_ID,
        topicId: this.topicId,
        difficulty,
        params: { set: setText(elems) },
        statement: `Determiná el cardinal del conjunto $A = ${setLatex(elems)}$.`,
        answerSpec: { type: "formula" },
        correctAnswer: String(size),
        constraints: ["El cardinal de un conjunto finito es la cantidad de elementos distintos que posee."],
        hints: ["El cardinal, denotado card(A) o #A, es simplemente el número de elementos que contiene el conjunto."],
        steps: [
          { text: `Contamos la cantidad de elementos distintos dentro de $A$:` },
          { text: `Los elementos son ${elems.join(", ")}, por lo que $\\mathrm{card}(A) = ${size}$.` },
        ],
        explanation: `El conjunto $A$ tiene ${size} elementos, por tanto $\\mathrm{card}(A) = ${size}$.`,
        fingerprint: makeFingerprint(this.id, setText(elems)),
      };
    }

    // Intermedio/Difícil: Inclusión-Exclusión: card(A ∪ B) = card(A) + card(B) - card(A ∩ B)
    const cardA = rng.int(10, 25);
    const cardB = rng.int(10, 25);
    const maxInter = Math.min(cardA, cardB) - 2;
    const cardInter = rng.int(2, maxInter);
    const cardUnion = cardA + cardB - cardInter;

    const askWhat = rng.pick(["union", "inter", "cardB"] as const);
    let statement: string;
    let answer: number;
    let steps: Step[];

    if (askWhat === "union") {
      statement = `Sean dos conjuntos finitos $A$ y $B$ tales que $\\mathrm{card}(A) = ${cardA}$, $\\mathrm{card}(B) = ${cardB}$ y $\\mathrm{card}(A \\cap B) = ${cardInter}$. Hallá $\\mathrm{card}(A \\cup B)$.`;
      answer = cardUnion;
      steps = [
        { text: "Aplicamos el principio de inclusión-exclusión:", latex: "\\mathrm{card}(A \\cup B) = \\mathrm{card}(A) + \\mathrm{card}(B) - \\mathrm{card}(A \\cap B)" },
        { text: `Sustituimos los valores dados:`, latex: `\\mathrm{card}(A \\cup B) = ${cardA} + ${cardB} - ${cardInter} = ${answer}` },
      ];
    } else if (askWhat === "inter") {
      statement = `Sean dos conjuntos finitos $A$ y $B$ tales que $\\mathrm{card}(A) = ${cardA}$, $\\mathrm{card}(B) = ${cardB}$ y $\\mathrm{card}(A \\cup B) = ${cardUnion}$. Hallá $\\mathrm{card}(A \\cap B)$.`;
      answer = cardInter;
      steps = [
        { text: "Despejamos la intersección del principio de inclusión-exclusión:", latex: "\\mathrm{card}(A \\cap B) = \\mathrm{card}(A) + \\mathrm{card}(B) - \\mathrm{card}(A \\cup B)" },
        { text: `Sustituimos los valores dados:`, latex: `\\mathrm{card}(A \\cap B) = ${cardA} + ${cardB} - ${cardUnion} = ${answer}` },
      ];
    } else {
      statement = `Sean dos conjuntos finitos $A$ y $B$ tales que $\\mathrm{card}(A) = ${cardA}$, $\\mathrm{card}(A \\cap B) = ${cardInter}$ y $\\mathrm{card}(A \\cup B) = ${cardUnion}$. Hallá $\\mathrm{card}(B)$.`;
      answer = cardB;
      steps = [
        { text: "Despejamos $\\mathrm{card}(B)$ del principio de inclusión-exclusión:", latex: "\\mathrm{card}(B) = \\mathrm{card}(A \\cup B) - \\mathrm{card}(A) + \\mathrm{card}(A \\cap B)" },
        { text: `Sustituimos los valores dados:`, latex: `\\mathrm{card}(B) = ${cardUnion} - ${cardA} + ${cardInter} = ${answer}` },
      ];
    }

    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { cardA, cardB, cardInter, cardUnion, askWhat },
      statement,
      answerSpec: { type: "formula" },
      correctAnswer: String(answer),
      constraints: ["Respeta el principio de inclusión-exclusión card(A ∪ B) = card(A) + card(B) - card(A ∩ B)."],
      hints: [
        "Recordá la fórmula de inclusión-exclusión: el cardinal de la unión es la suma de los cardinales menos los elementos repetidos (intersección).",
      ],
      steps,
      explanation: `El valor pedido es ${answer}.`,
      fingerprint: makeFingerprint(this.id, `${cardA}|${cardB}|${cardInter}|${askWhat}`),
    };
  },
  check(ex, input) {
    const n = parseInt(input.trim(), 10);
    if (isNaN(n) || n < 0) return invalid("Ingresá un número entero no negativo.");
    return n === parseInt(ex.correctAnswer, 10)
      ? correct("¡Correcto!")
      : incorrect(`El valor no es correcto.`);
  },
  verify(ex) {
    const problems: string[] = [];
    const ans = parseInt(ex.correctAnswer, 10);
    if (isNaN(ans) || ans < 0) problems.push("La respuesta no es un número válido.");
    return problems;
  },
};

export const SETS_TEMPLATES: readonly ExerciseTemplate[] = [
  pertenenciaInclusion,
  operacionesConjuntos,
  cardinalConjuntos,
];
