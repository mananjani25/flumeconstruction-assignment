import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

// Thin helpers to keep route handlers consistent: uniform JSON shapes,
// validation, and error handling.

export function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(
    data,
    typeof init === "number" ? { status: init } : init
  );
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: message, details: extra }, { status });
}

/** Domain error that a route can throw to produce a specific status code. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Parse and validate a JSON request body against a Zod schema. */
export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError("Validation failed", 422);
  }
  return result.data;
}

/** Same as parseBody but returns field-level issues for the client. */
export async function parseBodyDetailed<T>(req: Request, schema: ZodType<T>) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false as const, response: fail("Invalid JSON body", 400) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false as const,
      response: fail("Validation failed", 422, fieldErrors(result.error)),
    };
  }
  return { ok: true as const, data: result.data };
}

function fieldErrors(error: ZodError) {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path.join(".") || "_";
    if (!acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
}

/** Wrap a handler so thrown ApiErrors become clean JSON responses. */
export function handle(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  return fn().catch((err) => {
    if (err instanceof ApiError) return fail(err.message, err.status);
    console.error(err);
    return fail("Internal server error", 500);
  });
}
