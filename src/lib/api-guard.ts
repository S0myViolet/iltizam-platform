// Shared API guard plumbing: translate AuthError into safe HTTP responses
// (no stack traces, no cross-tenant existence leaks).

import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("API error:", err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
