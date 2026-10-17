// Códigos de error de la aplicación
export type AppErrorCode =
  | "CONTENT_INVALID"
  | "CONTENT_NOT_FOUND"
  | "STORAGE_UNAVAILABLE"
  | "STORAGE_FAILURE"
  | "IMPORT_INVALID"
  | "MATH_INVALID_DOMAIN"
  | "GENERATION_EXHAUSTED"
  | "VALIDATION_FAILED";

// Error base de la app
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

// Tipo Result para retornos controlados
export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
