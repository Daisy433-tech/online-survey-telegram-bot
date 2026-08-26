import { NextResponse } from "next/server";
import { safeSecretEqual } from "./handoff";

/**
 * Server-to-server authentication for the /api/v1/* surface.
 * The future webinar website authenticates with:
 *     Authorization: Bearer ${SERVER_API_KEY}
 * The key is compared in constant time against the SERVER_API_KEY env var.
 */

export function isServerApiConfigured(): boolean {
  return Boolean(process.env.SERVER_API_KEY?.trim());
}

/** Returns null when authorised, otherwise a 401/503 response. */
export function requireServerAuth(req: Request): NextResponse | null {
  const expected = process.env.SERVER_API_KEY?.trim();
  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        error: "server_api_not_configured",
        message:
          "SERVER_API_KEY is not set on this deployment. Set it to enable server-to-server access.",
      },
      { status: 503 },
    );
  }

  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!provided || !safeSecretEqual(provided, expected)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  return null;
}
