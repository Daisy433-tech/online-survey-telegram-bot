import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { requireServerAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Server-to-server participant directory for the webinar website.
 *
 *   GET  /api/v1/participants                       (latest 50)
 *   GET  /api/v1/participants?telegramUserId=123    (single lookup)
 *   POST /api/v1/participants { telegramUserId, webinarUserId }
 *        — links (or pre-creates) a webinar-site account on a participant.
 */
export async function GET(req: Request) {
  const unauthorised = requireServerAuth(req);
  if (unauthorised) return unauthorised;

  const url = new URL(req.url);
  const telegramUserId = url.searchParams.get("telegramUserId");

  if (telegramUserId) {
    const rows = await db
      .select()
      .from(participants)
      .where(eq(participants.telegramUserId, telegramUserId))
      .limit(1);
    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, participant: rows[0] });
  }

  const rows = await db
    .select()
    .from(participants)
    .orderBy(desc(participants.registeredAt))
    .limit(50);

  return NextResponse.json({ ok: true, count: rows.length, participants: rows });
}

export async function POST(req: Request) {
  const unauthorised = requireServerAuth(req);
  if (unauthorised) return unauthorised;

  let body: { telegramUserId?: string; webinarUserId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.telegramUserId || !body.webinarUserId) {
    return NextResponse.json(
      { ok: false, error: "telegramUserId_and_webinarUserId_required" },
      { status: 400 },
    );
  }

  const updated = await db
    .update(participants)
    .set({ webinarUserId: body.webinarUserId })
    .where(eq(participants.telegramUserId, String(body.telegramUserId)))
    .returning({ id: participants.id });

  if (updated.length === 0) {
    return NextResponse.json(
      { ok: false, error: "participant_not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, participantId: updated[0].id });
}
