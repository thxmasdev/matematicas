import { z } from "zod";
import { CONTENT_SCHEMA_VERSION, type MathModule } from "@/types/module";
import { AppError } from "@/lib/errors";

const topicSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  subtopics: z.array(z.string().min(1)).min(1),
});

export const moduleSchema = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  id: z.string().regex(/^module-\d{2}-[a-z-]+$/),
  order: z.number().int().min(1).max(7),
  unit: z.number().int().min(1).max(7),
  slug: z.string().regex(/^[a-z-]+$/),
  title: z.string().min(1),
  description: z.string().min(1),
  topics: z.array(topicSchema).min(1),
});

/** Valida contenido estático; lanza AppError (nunca oculta el fallo). */
export function parseModule(raw: unknown): MathModule {
  const result = moduleSchema.safeParse(raw);
  if (!result.success) {
    throw new AppError("CONTENT_INVALID", "El contenido del módulo no cumple el esquema", result.error.issues);
  }
  return result.data;
}

export const theoryExampleSchema = z.object({
  title: z.string().min(1),
  statement: z.string().min(1),
  solution: z.string().min(1),
  explanation: z.string().optional(),
});

export const theoryCalloutSchema = z.object({
  type: z.enum(["info", "warning", "tip", "remember"]),
  title: z.string().optional(),
  content: z.string().min(1),
});

export const theorySectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  topicId: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  content: z.string().min(1),
  examples: z.array(theoryExampleSchema).optional(),
  callouts: z.array(theoryCalloutSchema).optional(),
});

export const moduleTheorySchema = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  moduleId: z.string().regex(/^module-\d{2}-[a-z-]+$/),
  moduleSlug: z.string().regex(/^[a-z-]+$/),
  title: z.string().min(1),
  sections: z.array(theorySectionSchema).min(1),
});

export function parseTheory(raw: unknown) {
  const result = moduleTheorySchema.safeParse(raw);
  if (!result.success) {
    throw new AppError("CONTENT_INVALID", "El contenido teórico no cumple el esquema", result.error.issues);
  }
  return result.data;
}

