import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

/**
 * Returns the current user's id from the NextAuth session, or null.
 * Server-side equivalent of Meteor's `this.userId`.
 */
export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

/** Thrown by requireUserId when there is no authenticated user. */
export class UnauthorizedError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Returns the current user's id or throws UnauthorizedError.
 * Use inside route handlers wrapped by `handle()`.
 */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) throw new UnauthorizedError();
  return userId;
}

type Handler = () => Promise<NextResponse | Response>;

/**
 * Wraps a route handler body with consistent error handling that mirrors the
 * old Meteor.Error semantics (401 for auth, 400 for validation, 500 otherwise).
 */
export async function handle(fn: Handler): Promise<NextResponse | Response> {
  try {
    return await fn();
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = err?.message || "Internal server error";
    if (status >= 500) console.error("API error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** Throw to return a specific HTTP status from within a handler. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
