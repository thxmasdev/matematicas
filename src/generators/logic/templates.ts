import { AppError } from "@/lib/errors";
import {
  correct,
  equivalentButNotExpected,
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
  assignments,
  equivalent,
  evaluate,
  not,
  resultColumn,
  subformulas,
  toLatex,
  toText,
  truthTable,
  V,
  and,
  or,
  imp,
  variablesOf,
  type BinaryKind,
  type Env,
  type Prop,
} from "@/engine/logic/proposition";
import { flatSequence, parseFormula, tokenizeFormula, tryParseFormula } from "@/engine/logic/parser";
import type { Difficulty } from "@/types/module";
import {
  OPERATION_NAME,
  VAR_SETS,
  canonicalText,
  randomFormula,
  randomSentence,
  sentenceShapesFor,
  shapeFor,
  toLatexWithValues,
} from "./formulas";
import {
  parseAssignment,
  refClassify,
  refColumn,
  refEval,
  refVariables,
} from "./reference";

const MODULE_ID = 1;
const ALL: readonly Difficulty[] = ["facil", "intermedio", "dificil", "avanzado"];
const CONSTRAINT_CARTILLA = "Solo se usan los conectivos de la cartilla: ~, ∧, ∨, ⇒, ⇔.";

const toCartilla = (text: string): string => text.replace(/→/g, "⇒").replace(/↔/g, "⇔");
const tv = (b: boolean): "V" | "F" => (b ? "V" : "F");
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function normTV(input: string): "V" | "F" | null {
  const s = input.trim().toUpperCase();
  if (s === "V" || s === "VERDADERO") return "V";
  if (s === "F" || s === "FALSO") return "F";
  return null;
}

function checkChoice(ex: GeneratedExercise, input: string): CheckResult {
  if (ex.answerSpec.type !== "choice") return invalid("Este ejercicio no es de opción múltiple.");
  const picked = ex.answerSpec.options.find((o) => o.toLowerCase() === input.trim().toLowerCase());
  if (!picked) return invalid("Elegí una de las opciones propuestas.");
  return picked === ex.correctAnswer
    ? correct()
    : incorrect("No es esa. Revisá las pistas e intentá de nuevo.");
}

/* ------------------------------------------------------------------ */
/* 1. Valor de verdad de una fórmula con valores dados                  */
/* ------------------------------------------------------------------ */

const valorDeVerdad: ExerciseTemplate = {
  id: "logica.valor-de-verdad",
  moduleId: MODULE_ID,
  topicId: "prioridad-y-evaluacion",
  title: "Valor de verdad de una proposición compuesta",
  difficulties: ALL,
  generate(rng, difficulty): ExerciseDraft {
    const vars = rng.pick(VAR_SETS);
    const f = randomFormula(rng, shapeFor(difficulty, vars));
    const names = variablesOf(f);
    const env: Record<string, boolean> = {};
    for (const n of names) env[n] = rng.bool();
    const result = tv(evaluate(f, env));
    const given = names.map((n) => `$${n}$ es ${tv(env[n])}`);
    const list =
      given.length === 1 ? given[0] : `${given.slice(0, -1).join(", ")} y ${given[given.length - 1]}`;
    const steps: Step[] = [
      { text: "Reemplazamos cada variable por su valor de verdad.", latex: toLatexWithValues(f, env) },
      ...subformulas(f).map((s) => ({
        text: `Resolvemos esta parte (${OPERATION_NAME[s.k]}):`,
        latex: `${toLatexWithValues(s, env)} = \\mathrm{${tv(evaluate(s, env))}}`,
      })),
    ];
    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: {
        formula: toText(f),
        values: names.map((n) => `${n}=${tv(env[n])}`).join(","),
      },
      statement: `Si ${list}, hallá el valor de verdad de $${toLatex(f)}$.`,
      answerSpec: { type: "choice", options: ["V", "F"] },
      correctAnswer: result,
      constraints: [
        CONSTRAINT_CARTILLA,
        "Todas las variables del enunciado aparecen en la fórmula.",
        "La fórmula se muestra totalmente parentizada: ∧ y ∨ nunca se mezclan sin paréntesis.",
      ],
      hints: [
        "Reemplazá cada variable por V o F y resolvé de adentro hacia afuera.",
        `La operación principal (la que se resuelve última) es la ${OPERATION_NAME[f.k]}.`,
        "Resolvé primero las negaciones y lo que está entre los paréntesis más internos.",
      ],
      steps,
      explanation: `La operación principal es la ${OPERATION_NAME[f.k].toLowerCase()}; con los valores dados, la proposición resulta ${result}.`,
      fingerprint: makeFingerprint(
        this.id,
        `${canonicalText(f)}|${[...names].sort().map((n) => `${n}${tv(env[n])}`).join("")}`,
      ),
    };
  },
  check(ex, input) {
    const given = normTV(input);
    if (!given) return invalid("Respondé V (verdadero) o F (falso).");
    return given === ex.correctAnswer ? correct() : incorrect("El valor de verdad no coincide. Revisá cada operación paso a paso.");
  },
  verify(ex) {
    const problems: string[] = [];
    try {
      const f = parseFormula(String(ex.params.formula));
      const env = parseAssignment(String(ex.params.values));
      const vars = [...new Set(refVariables(f))];
      if (vars.some((v) => env[v] === undefined)) problems.push("Falta el valor de una variable.");
      if (Object.keys(env).some((k) => !vars.includes(k))) problems.push("Sobra una variable en los valores.");
      if (refEval(f, env) !== ex.correctAnswer) problems.push("La respuesta no coincide con la referencia.");
      if (!ex.statement.includes(toLatex(f))) problems.push("El enunciado no contiene la fórmula.");
    } catch (e) {
      problems.push(`Error de verificación: ${(e as Error).message}`);
    }
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 2. Columna de resultado de una tabla de verdad                       */
/* ------------------------------------------------------------------ */

const tablaVerdad: ExerciseTemplate = {
  id: "logica.tabla-verdad",
  moduleId: MODULE_ID,
  topicId: "operadores-logicos",
  title: "Completar una tabla de verdad",
  difficulties: ALL,
  generate(rng, difficulty): ExerciseDraft {
    const vars = rng.pick(VAR_SETS);
    let f: Prop | null = null;
    for (let i = 0; i < 80 && !f; i++) {
      const candidate =
        difficulty === "facil" && rng.next() < 0.2
          ? not(V(rng.pick(vars.slice(0, 2))))
          : randomFormula(rng, difficulty === "facil" ? { vars: vars.slice(0, 2), binary: 1 } : shapeFor(difficulty, vars));
      const col = resultColumn(candidate);
      if (col.includes("V") && col.includes("F")) f = candidate;
    }
    if (!f) throw new AppError("GENERATION_EXHAUSTED", "No se halló una fórmula contingente.");
    const table = truthTable(f);
    const names = table.variables;
    const rows = table.rows.length;
    const answer = resultColumn(f);
    const order = assignments(names)
      .map((e) => names.map((n) => tv(e[n])).join(""))
      .join(", ");
    const steps: Step[] = subformulas(f).map((s) => ({
      text: `Columna de $${toLatex(s)}$: ${columnFor(s, names)}`,
    }));
    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { formula: toText(f) },
      statement: `Completá la columna de resultado de la tabla de verdad de $${toLatex(f)}$. Las filas, en orden (${names.join(", ")}), son: ${order}. Escribí los ${rows} valores seguidos, usando V y F (por ejemplo: ${"V".repeat(rows)}).`,
      answerSpec: { type: "truth-column", rows },
      correctAnswer: answer,
      constraints: [
        CONSTRAINT_CARTILLA,
        "El resultado no es constante: contiene al menos una V y una F.",
        "Se consideran todas las combinaciones posibles de las variables.",
      ],
      hints: [
        "Armá una columna auxiliar por cada parte de la fórmula, de adentro hacia afuera.",
        "Conjunción: V solo si ambas son V. Disyunción: F solo si ambas son F. Condicional: F solo si V ⇒ F. Bicondicional: V si ambas coinciden.",
        `Empezá por la fila ${names.map(() => "V").join("")}: reemplazá y resolvé solo esa fila.`,
      ],
      steps,
      explanation: `Evaluando la fórmula en las ${rows} filas se obtiene la columna ${answer}.`,
      fingerprint: makeFingerprint(this.id, canonicalText(f)),
    };
  },
  check(ex, input) {
    if (ex.answerSpec.type !== "truth-column") return invalid("Ejercicio mal configurado.");
    const s = input.toUpperCase().replace(/[\s,;-]/g, "");
    if (!/^[VF]*$/.test(s) || s.length === 0) return invalid("Usá solo las letras V y F.");
    if (s.length !== ex.answerSpec.rows) {
      return invalid(`La tabla tiene ${ex.answerSpec.rows} filas; ingresaste ${s.length} valores.`);
    }
    if (s === ex.correctAnswer) return correct();
    const wrong = [...s].filter((c, i) => c !== ex.correctAnswer[i]).length;
    return incorrect(`Hay ${wrong} fila${wrong === 1 ? "" : "s"} incorrecta${wrong === 1 ? "" : "s"}. Revisá las columnas auxiliares.`);
  },
  verify(ex) {
    const problems: string[] = [];
    try {
      const f = parseFormula(String(ex.params.formula));
      const ref = refColumn(f);
      if (ref !== ex.correctAnswer) problems.push("La columna no coincide con la referencia.");
      const vars = new Set(refVariables(f)).size;
      if (ex.answerSpec.type !== "truth-column" || ex.answerSpec.rows !== 2 ** vars) {
        problems.push("La cantidad de filas no es 2^n.");
      }
      if (!ref.includes("V") || !ref.includes("F")) problems.push("El resultado es constante.");
      if (!ex.statement.includes(toLatex(f))) problems.push("El enunciado no contiene la fórmula.");
    } catch (e) {
      problems.push(`Error de verificación: ${(e as Error).message}`);
    }
    return problems;
  },
};

function columnFor(p: Prop, names: string[]): string {
  return assignments(names)
    .map((e: Env) => tv(evaluate(p, e)))
    .join("");
}

/* ------------------------------------------------------------------ */
/* 3. Colocar paréntesis según la operación principal                   */
/* ------------------------------------------------------------------ */

const FLAT_SYMBOL = { "∧": "and", "∨": "or", "⇒": "imp", "⇔": "iff" } as const;
type FlatConn = keyof typeof FLAT_SYMBOL;
const LATEX_TOKEN: Record<string, string> = {
  "~": "\\neg ",
  "∧": "\\land",
  "∨": "\\lor",
  "⇒": "\\Rightarrow",
  "⇔": "\\Leftrightarrow",
};
const tokensToLatex = (tokens: string[]): string =>
  tokens.map((t) => LATEX_TOKEN[t] ?? t).join(" ").replace(/\\neg\s+/g, "\\neg ");

type Target = BinaryKind | "not";

function rootKind(text: string): Target | null {
  const r = tryParseFormula(text);
  return r.ok ? (r.value.k === "var" ? null : r.value.k) : null;
}

const parentesizar: ExerciseTemplate = {
  id: "logica.parentesizar",
  moduleId: MODULE_ID,
  topicId: "prioridad-y-evaluacion",
  title: "Colocar paréntesis según la operación principal",
  difficulties: ALL,
  generate(rng, difficulty): ExerciseDraft {
    const operands = { facil: 3, intermedio: 3, dificil: 4, avanzado: 5 }[difficulty];
    const negProb = { facil: 0, intermedio: 0.35, dificil: 0.35, avanzado: 0.4 }[difficulty];
    const letters = ["p", "q", "r", "s", "t"];
    for (let attempt = 0; attempt < 120; attempt++) {
      const ops = Array.from({ length: operands }, (_, i) => ({
        neg: rng.next() < negProb,
        v: letters[i],
      }));
      const conns = Array.from({ length: operands - 1 }, () => rng.pick(["∧", "∨", "⇒", "⇔"] as FlatConn[]));
      const opTokens = (from: number, to: number): string[] =>
        ops.slice(from, to).flatMap((o) => (o.neg ? ["~", o.v] : [o.v]));
      const flatTokens: string[] = [];
      ops.forEach((o, i) => {
        flatTokens.push(...opTokens(i, i + 1));
        if (i < conns.length) flatTokens.push(conns[i]);
      });
      const flat = flatTokens.join(" ");
      const candidates: { target: Target; solution: string }[] = conns.map((c, k) => {
        const side = (from: number, to: number): string => {
          const toks: string[] = [];
          for (let i = from; i < to; i++) {
            toks.push(...opTokens(i, i + 1));
            if (i < to - 1) toks.push(conns[i]);
          }
          const text = toks.join(" ");
          return to - from > 1 ? `(${text})` : text;
        };
        return { target: FLAT_SYMBOL[c] as Target, solution: `${side(0, k + 1)} ${c} ${side(k + 1, operands)}` };
      });
      if (ops[0].neg && operands >= 3) {
        candidates.push({ target: "not", solution: `~(${flatTokens.slice(1).join(" ")})` });
      }
      const pick = rng.pick(candidates);
      const solved = checkParenthesization(flat, pick.target, pick.solution);
      if (solved.status !== "correct") continue;
      // Preferimos ejercicios donde la fórmula plana NO cumple ya la consigna.
      if (attempt < 80 && checkParenthesization(flat, pick.target, flat).status === "correct") continue;
      const name = OPERATION_NAME[pick.target];
      return {
        templateId: this.id,
        moduleId: MODULE_ID,
        topicId: this.topicId,
        difficulty,
        params: { flat, target: pick.target },
        statement: `Colocá paréntesis (si es necesario) para que la operación principal sea la ${name}: $${tokensToLatex(flatTokens)}$. Escribí la fórmula completa con ~, ∧, ∨, ⇒, ⇔ y paréntesis, sin cambiar el orden de los símbolos.`,
        answerSpec: { type: "formula" },
        correctAnswer: pick.solution,
        constraints: [
          "∧ y ∨ tienen el mismo nivel: mezclarlos exige paréntesis.",
          "Se acepta cualquier colocación válida cuya operación principal sea la pedida.",
          "Solo se agregan paréntesis: no se cambian variables ni conectivos.",
        ],
        hints: [
          "La operación principal es la que se resuelve última: queda por fuera de todos los paréntesis.",
          pick.target === "not"
            ? "La negación principal afecta a toda la expresión que la sigue: encerrala entre paréntesis."
            : `Ubicá el símbolo de la ${name.toLowerCase()} y agrupá con paréntesis lo que queda a su izquierda y a su derecha.`,
          "Prioridad: ~ primero; luego ∧ y ∨ (mismo nivel); luego ⇒; por último ⇔.",
        ],
        steps: [
          { text: `Buscamos el símbolo sobre el que debe dividirse la fórmula para que la ${name.toLowerCase()} sea la operación principal.` },
          {
            text: "Agrupamos con paréntesis lo que queda a cada lado:",
            latex: tokensToLatex(tokenizeFormula(pick.solution)),
          },
        ],
        explanation: `Con esos paréntesis la ${name.toLowerCase()} es lo último que se resuelve, así que es la operación principal.`,
        fingerprint: makeFingerprint(this.id, `${flat}|${pick.target}`),
      };
    }
    throw new AppError("GENERATION_EXHAUSTED", "No se pudo generar un ejercicio de paréntesis.");
  },
  check(ex, input) {
    return checkParenthesization(String(ex.params.flat), ex.params.target as Target, input);
  },
  verify(ex) {
    const problems: string[] = [];
    const flat = String(ex.params.flat);
    const target = ex.params.target as Target;
    const res = checkParenthesization(flat, target, ex.correctAnswer);
    if (res.status !== "correct") problems.push(`La solución no pasa su propia corrección: ${res.message}`);
    try {
      const tokens = tokenizeFormula(flat);
      const wanted = tokens.filter((t) => t in FLAT_SYMBOL || t === "~");
      if (target === "not") {
        if (tokens[0] !== "~") problems.push("Objetivo ~ sin negación inicial.");
      } else if (!wanted.some((t) => FLAT_SYMBOL[t as FlatConn] === target)) {
        problems.push("La operación pedida no aparece en la fórmula.");
      }
      if (!ex.statement.includes(OPERATION_NAME[target])) problems.push("El enunciado no nombra la operación.");
    } catch (e) {
      problems.push(`Error de verificación: ${(e as Error).message}`);
    }
    return problems;
  },
};

function checkParenthesization(flat: string, target: Target, input: string): CheckResult {
  const parsed = tryParseFormula(input);
  if (!parsed.ok) return invalid(parsed.message);
  if (flatSequence(input) !== flatSequence(flat)) {
    return incorrect("Cambiaste variables o conectivos: solo podés agregar paréntesis.");
  }
  const kind = rootKind(input);
  if (kind === target) return correct();
  return incorrect(
    `Con esos paréntesis la operación principal es la ${kind ? OPERATION_NAME[kind].toLowerCase() : "variable"}, no la ${OPERATION_NAME[target].toLowerCase()}.`,
  );
}

/* ------------------------------------------------------------------ */
/* 4. Simbolizar una proposición                                        */
/* ------------------------------------------------------------------ */

function sentenceMarkersOk(sentence: string, f: Prop, atoms: { v: string; aff: string; neg: string }[]): string[] {
  const problems: string[] = [];
  const s = sentence.toLowerCase();
  if (f.k === "not" && !s.startsWith("no es cierto que")) problems.push("Falta 'No es cierto que'.");
  if (f.k === "imp" && !(s.startsWith("si ") && s.includes(", entonces "))) problems.push("Falta 'Si…, entonces…'.");
  if (f.k === "iff" && !s.includes(" si y solo si ")) problems.push("Falta 'si y solo si'.");
  if (f.k === "and" && !s.includes(" y ")) problems.push("Falta 'y'.");
  if (f.k === "or" && !s.includes(" o ")) problems.push("Falta 'o'.");
  const used = new Set(variablesOf(f));
  for (const a of atoms) {
    if (used.has(a.v) && !s.includes(a.aff) && !s.includes(a.neg)) problems.push(`No aparece el átomo ${a.v}.`);
  }
  return problems;
}

function parseAtoms(list: readonly string[]): { v: string; aff: string; neg: string }[] {
  return list.map((entry) => {
    const [v, aff, neg] = entry.split("|");
    return { v, aff, neg };
  });
}

const simbolizar: ExerciseTemplate = {
  id: "logica.simbolizar",
  moduleId: MODULE_ID,
  topicId: "operadores-logicos",
  title: "Simbolizar una proposición compuesta",
  difficulties: ALL,
  generate(rng, difficulty): ExerciseDraft {
    const sent = randomSentence(rng, rng.pick(sentenceShapesFor(difficulty)), {
      allowNegLits: difficulty !== "facil",
      varNames: rng.pick(VAR_SETS),
    });
    const f = sent.formula;
    const ops = subformulas(f);
    const atomsText = sent.atoms.map((a) => `$${a.variable}$: «${cap(a.atom.aff)}»`).join("; ");
    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: {
        formula: toText(f),
        sentence: sent.text,
        atoms: sent.atoms.map((a) => `${a.variable}|${a.atom.aff}|${a.atom.neg}`),
      },
      statement: `Sean ${atomsText}. Simbolizá la proposición «${sent.text}» (interpretá la "o" como disyunción inclusiva). Escribí la fórmula con ~, ∧, ∨, ⇒, ⇔ y paréntesis cuando haga falta.`,
      answerSpec: { type: "formula" },
      correctAnswer: toCartilla(toText(f)),
      constraints: [
        "La oración y la fórmula se generan desde la misma estructura lógica.",
        "Las comas de la oración indican la agrupación; la 'o' es inclusiva.",
        "Se acepta el orden de operandos de ∧, ∨ y ⇔ en cualquier orden, pero no otra estructura.",
      ],
      hints: [
        "Identificá primero las proposiciones simples y la variable de cada una.",
        "Buscá las expresiones de enlace ('y', 'o', 'no es cierto que', 'si… entonces', 'si y solo si') y qué operación lógica representa cada una.",
        "Cuando hay dos conectivos, la coma te indica qué parte queda agrupada: usá paréntesis.",
      ],
      steps: [
        { text: `Proposiciones simples: ${sent.atoms.map((a) => `${a.variable} = «${a.atom.aff}»`).join("; ")}.` },
        { text: `Operaciones involucradas: ${ops.map((o) => OPERATION_NAME[o.k]).join(", ")}.` },
        { text: "Simbolizamos respetando la agrupación de la oración:", latex: toLatex(f) },
      ],
      explanation: `La oración se simboliza como ${toCartilla(toText(f))}.`,
      fingerprint: makeFingerprint(this.id, `${canonicalText(f)}|${sent.atoms.map((a) => a.atom.id).join(",")}`),
    };
  },
  check(ex, input) {
    const student = tryParseFormula(input);
    if (!student.ok) return invalid(student.message);
    const expected = parseFormula(ex.correctAnswer);
    if (canonicalText(student.value) === canonicalText(expected)) return correct();
    if (equivalent(student.value, expected)) {
      return equivalentButNotExpected(
        "Tu fórmula es lógicamente equivalente, pero la simbolización directa de la oración es otra: respetá los conectivos del enunciado.",
      );
    }
    return incorrect("Revisá qué operación representa cada expresión de enlace y dónde van los paréntesis.");
  },
  verify(ex) {
    const problems: string[] = [];
    try {
      const f = parseFormula(String(ex.params.formula));
      if (toText(parseFormula(toText(f))) !== toText(f)) problems.push("La fórmula no sobrevive a un ciclo texto→AST.");
      const atoms = parseAtoms(ex.params.atoms as string[]);
      problems.push(...sentenceMarkersOk(String(ex.params.sentence), f, atoms));
      if (!ex.statement.includes(String(ex.params.sentence))) problems.push("El enunciado no contiene la oración.");
      if (canonicalText(parseFormula(ex.correctAnswer)) !== canonicalText(f)) problems.push("La respuesta no coincide con la fórmula.");
    } catch (e) {
      problems.push(`Error de verificación: ${(e as Error).message}`);
    }
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 5. Identificar la operación lógica principal                         */
/* ------------------------------------------------------------------ */

const OPERATION_OPTIONS = ["Negación", "Conjunción", "Disyunción", "Condicional", "Bicondicional"] as const;
const MARKER = {
  var: "",
  not: "No es cierto que …",
  imp: "Si …, entonces …",
  iff: "… si y solo si …",
  and: "… y …",
  or: "… o …",
  xor: "",
} as const;

const identificarOperacion: ExerciseTemplate = {
  id: "logica.identificar-operacion",
  moduleId: MODULE_ID,
  topicId: "operadores-logicos",
  title: "Identificar la operación lógica principal",
  difficulties: ALL,
  generate(rng, difficulty): ExerciseDraft {
    const sent = randomSentence(rng, rng.pick(sentenceShapesFor(difficulty)), {
      allowNegLits: difficulty !== "facil",
      varNames: ["p", "q", "r"],
    });
    const f = sent.formula;
    const answer = OPERATION_NAME[f.k];
    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: {
        formula: toText(f),
        sentence: sent.text,
        atoms: sent.atoms.map((a) => `${a.variable}|${a.atom.aff}|${a.atom.neg}`),
      },
      statement: `En la proposición «${sent.text}», ¿cuál es la operación lógica principal? (Interpretá la "o" como inclusiva.)`,
      answerSpec: { type: "choice", options: OPERATION_OPTIONS },
      correctAnswer: answer,
      constraints: ["La oración se genera desde una estructura lógica conocida.", "Se evita la ambigüedad del lenguaje natural usando comas."],
      hints: [
        "Una proposición compuesta se arma con expresiones de enlace entre proposiciones simples.",
        "La operación principal es la que organiza toda la oración: mirá si empieza con 'Si' o 'No es cierto que', o si hay dos partes unidas por una sola expresión.",
      ],
      steps: [
        { text: `La expresión de enlace que organiza toda la oración es «${MARKER[f.k]}».` },
        { text: `Esa expresión corresponde a la ${answer.toLowerCase()}.` },
      ],
      explanation: `La operación principal es la ${answer.toLowerCase()}.`,
      fingerprint: makeFingerprint(this.id, `${canonicalText(f)}|${sent.atoms.map((a) => a.atom.id).join(",")}`),
    };
  },
  check: checkChoice,
  verify(ex) {
    const problems: string[] = [];
    try {
      const f = parseFormula(String(ex.params.formula));
      if (f.k === "var") problems.push("La fórmula es una variable.");
      else {
        if (OPERATION_NAME[f.k] !== ex.correctAnswer) problems.push("La operación no coincide con la fórmula.");
        const atoms = parseAtoms(ex.params.atoms as string[]);
        problems.push(...sentenceMarkersOk(String(ex.params.sentence), f, atoms));
      }
    } catch (e) {
      problems.push(`Error de verificación: ${(e as Error).message}`);
    }
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 6. ¿Es una proposición?                                              */
/* ------------------------------------------------------------------ */

export interface PropositionItem {
  id: string;
  text: string;
  /** LaTeX opcional para expresiones puramente matemáticas. */
  tex?: string;
  isProposition: boolean;
  level: "facil" | "intermedio";
  reason: string;
}

/** Banco curado: cada elemento está clasificado y justificado a mano. */
export const PROPOSITION_BANK: readonly PropositionItem[] = [
  { id: "p01", text: "3 es un número entero", isProposition: true, level: "facil", reason: "Es una oración declarativa y es verdadera (V)." },
  { id: "p02", text: "1,5 es un número natural", isProposition: true, level: "facil", reason: "Es una oración declarativa y es falsa (F): 1,5 no es natural." },
  { id: "p03", text: "El Sol es un planeta", isProposition: true, level: "facil", reason: "Es declarativa y es falsa (F): el Sol es una estrella." },
  { id: "p04", text: "La Luna es el satélite natural de la Tierra", isProposition: true, level: "facil", reason: "Es declarativa y es verdadera (V)." },
  { id: "p05", text: "12 + 3 = 5", tex: "12 + 3 = 5", isProposition: true, level: "facil", reason: "Es una igualdad con valor de verdad definido: es falsa (F)." },
  { id: "p06", text: "9 es un número primo", isProposition: true, level: "facil", reason: "Es declarativa y es falsa (F): 9 = 3 · 3." },
  { id: "n01", text: "¿Existe la injusticia?", isProposition: false, level: "facil", reason: "Es una oración interrogativa: no se puede decir que sea verdadera o falsa." },
  { id: "n02", text: "¡Ojalá llueva!", isProposition: false, level: "facil", reason: "Es una oración exclamativa (un deseo): no es verdadera ni falsa." },
  { id: "n03", text: "Por favor, estudien.", isProposition: false, level: "facil", reason: "Es una oración imperativa (un pedido): no es verdadera ni falsa." },
  { id: "n04", text: "¿Puedo llegarme hasta tu casa?", isProposition: false, level: "facil", reason: "Es una pregunta: no tiene valor de verdad." },
  { id: "n05", text: "¡Qué examen difícil!", isProposition: false, level: "facil", reason: "Es una exclamación: no tiene valor de verdad." },
  { id: "p07", text: "La suma de dos números pares siempre es par", isProposition: true, level: "intermedio", reason: "Es declarativa y es verdadera (V)." },
  { id: "p08", text: "El número 1 es irracional", isProposition: true, level: "intermedio", reason: "Es declarativa y es falsa (F): 1 es racional." },
  { id: "p09", text: "−1 + 4,5 = 3,5", tex: "-1 + 4{,}5 = 3{,}5", isProposition: true, level: "intermedio", reason: "Es una igualdad con valor de verdad definido: es verdadera (V)." },
  { id: "p10", text: "Todo número primo es impar", isProposition: true, level: "intermedio", reason: "Es declarativa y es falsa (F): 2 es primo y es par." },
  { id: "p11", text: "5 es un número impar", isProposition: true, level: "intermedio", reason: "Es declarativa y es verdadera (V)." },
  { id: "n06", text: "x + 3 = 5", tex: "x + 3 = 5", isProposition: false, level: "intermedio", reason: "Depende de x: mientras no se le asigne un valor a x, no es verdadera ni falsa." },
  { id: "n07", text: "x + y > 5", tex: "x + y > 5", isProposition: false, level: "intermedio", reason: "Depende de x e y: sin valores asignados no se puede decidir si es verdadera o falsa." },
  { id: "n08", text: "2z − 1 < 7", tex: "2z - 1 < 7", isProposition: false, level: "intermedio", reason: "Depende de z: sin un valor para z no tiene valor de verdad." },
  { id: "n09", text: "Compra cinco azules y cuatro rojas.", isProposition: false, level: "intermedio", reason: "Es una orden (imperativa): no es verdadera ni falsa." },
  { id: "n10", text: "Resolvé el ejercicio 3.", isProposition: false, level: "intermedio", reason: "Es una orden (imperativa): no tiene valor de verdad." },
];

const PROP_OPTIONS = ["Es una proposición", "No es una proposición"] as const;

const esProposicion: ExerciseTemplate = {
  id: "logica.es-proposicion",
  moduleId: MODULE_ID,
  topicId: "proposiciones",
  title: "¿Es una proposición?",
  difficulties: ["facil", "intermedio"],
  generate(rng, difficulty): ExerciseDraft {
    const pool = PROPOSITION_BANK.filter((i) => i.level === difficulty);
    const item = rng.pick(pool);
    const shown = item.tex ? `$${item.tex}$` : `«${item.text}»`;
    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { itemId: item.id },
      statement: `¿La siguiente expresión es una proposición? ${shown}`,
      answerSpec: { type: "choice", options: PROP_OPTIONS },
      correctAnswer: item.isProposition ? PROP_OPTIONS[0] : PROP_OPTIONS[1],
      constraints: ["Los elementos pertenecen a un banco curado y clasificado manualmente (espacio finito)."],
      hints: [
        "Una proposición es una oración declarativa de la que tiene sentido decir si es verdadera o falsa.",
        "Descartá preguntas, órdenes y exclamaciones, y también las expresiones con variables sin valor asignado.",
      ],
      steps: [{ text: item.reason }],
      explanation: item.reason,
      fingerprint: makeFingerprint(this.id, item.id),
    };
  },
  check: checkChoice,
  verify(ex) {
    const item = PROPOSITION_BANK.find((i) => i.id === ex.params.itemId);
    if (!item) return ["El elemento no existe en el banco."];
    const problems: string[] = [];
    if ((item.isProposition ? PROP_OPTIONS[0] : PROP_OPTIONS[1]) !== ex.correctAnswer) problems.push("La clasificación no coincide con el banco.");
    if (!ex.statement.includes(item.tex ?? item.text)) problems.push("El enunciado no contiene la expresión.");
    return problems;
  },
};

/* ------------------------------------------------------------------ */
/* 7. Clasificar: tautología, contradicción o contingencia (ampliación) */
/* ------------------------------------------------------------------ */

const CLASS_OPTIONS = ["Tautología", "Contradicción", "Contingencia"] as const;

const clasificar: ExerciseTemplate = {
  id: "logica.clasificar",
  moduleId: MODULE_ID,
  topicId: "prioridad-y-evaluacion",
  title: "Tautología, contradicción o contingencia",
  difficulties: ["dificil", "avanzado"],
  generate(rng, difficulty): ExerciseDraft {
    const target = rng.pick(CLASS_OPTIONS);
    const vars = rng.pick(VAR_SETS);
    const A = (): Prop =>
      difficulty === "dificil"
        ? randomFormula(rng, { vars: vars.slice(0, 2), binary: 1, negLit: 0.3 })
        : randomFormula(rng, { vars: vars.slice(0, 3), binary: 2, negLit: 0.3 });
    const B = (): Prop =>
      difficulty === "dificil"
        ? rng.bool() ? V(vars[1]) : not(V(vars[1]))
        : randomFormula(rng, { vars: vars.slice(0, 2), binary: 1, negLit: 0.3 });
    let f: Prop | null = null;
    for (let i = 0; i < 100 && !f; i++) {
      let c: Prop;
      if (target === "Contingencia") {
        c = randomFormula(rng, shapeFor(difficulty, vars));
      } else {
        const a = A();
        const b = B();
        const schemata: Prop[] =
          target === "Tautología"
            ? [or(a, not(a)), imp(and(a, b), a), imp(a, or(a, b)), not(and(a, not(a)))]
            : [and(a, not(a)), not(imp(a, a)), and(and(a, b), not(a)), not(or(a, not(a)))];
        c = rng.pick(schemata);
      }
      if (refClassify(c) === target) f = c;
    }
    if (!f) throw new AppError("GENERATION_EXHAUSTED", "No se halló una fórmula de la clase pedida.");
    const names = variablesOf(f);
    const col = resultColumn(f);
    return {
      templateId: this.id,
      moduleId: MODULE_ID,
      topicId: this.topicId,
      difficulty,
      params: { formula: toText(f) },
      statement: `Clasificá la fórmula $${toLatex(f)}$ como tautología, contradicción o contingencia.`,
      answerSpec: { type: "choice", options: CLASS_OPTIONS },
      correctAnswer: target,
      constraints: [
        "Contenido de ampliación: la clasificación no figura en el temario de la cartilla.",
        CONSTRAINT_CARTILLA,
      ],
      hints: [
        "Tautología: V en todas las filas. Contradicción: F en todas. Contingencia: hay V y F.",
        "Armá la tabla de verdad completa: una sola fila no alcanza para decidir.",
      ],
      steps: [
        { text: `Armamos la tabla de verdad con ${2 ** names.length} filas (variables: ${names.join(", ")}).` },
        { text: `La columna final, en orden de filas, es ${col}.` },
        { text: `${col.includes("V") && col.includes("F") ? "Contiene V y F" : col.includes("F") ? "Es F en todas las filas" : "Es V en todas las filas"}: es una ${target.toLowerCase()}.` },
      ],
      explanation: `La columna final es ${col}; por eso la fórmula es una ${target.toLowerCase()}.`,
      fingerprint: makeFingerprint(this.id, canonicalText(f)),
    };
  },
  check: checkChoice,
  verify(ex) {
    try {
      const f = parseFormula(String(ex.params.formula));
      return refClassify(f) === ex.correctAnswer ? [] : ["La clasificación no coincide con la referencia."];
    } catch (e) {
      return [`Error de verificación: ${(e as Error).message}`];
    }
  },
};

export const LOGIC_TEMPLATES: readonly ExerciseTemplate[] = [
  esProposicion,
  identificarOperacion,
  simbolizar,
  tablaVerdad,
  valorDeVerdad,
  parentesizar,
  clasificar,
];
