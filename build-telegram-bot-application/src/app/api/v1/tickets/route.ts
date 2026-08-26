import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  participants,
  supportMessages,
  supportTickets,
} from "@/db/schema";
import { requireServerAuth } from "@/lib/auth";
import { sendMessage } from "@/lib/telegram/client";
import { copy } from "@/lib/bot/copy";
import { isTelegramConfigured } from "@/lib/telegram/client";

export const dynamic = "force-dynamic";

/**
 * Server-to-server support operations (for an admin console or, later,
 * the webinar website back office).
 *
 *   GET  /api/v1/tickets?status=pending_human
 *   POST /api/v1/tickets { ticketId, body, close? }
 *        - stores an admin reply and relays it to the participant's
 *          Telegram chat (mock-logged until TELEGRAM_BOT_TOKEN is set).
 */
export async function GET(req: Request) {
  const unauthorised = requireServerAuth(req);
  if (unauthorised) return unauthorised;

  const status = new URL(req.url).searchParams.get("status");

  const base = db
    .select({
      ticket: supportTickets,
      participant: {
        telegramUserId: participants.telegramUserId,
        username: participants.username,
        firstName: participants.firstName,
      },
    })
    .from(supportTickets)
    .leftJoin(participants, eq(supportTickets.participantId, participants.id))
    .orderBy(desc(supportTickets.updatedAt))
    .limit(50);

  const rows = status
    ? await base.where(eq(supportTickets.status, status))
    : await base;

  const withMessages = await Promise.all(
    rows.map(async (r) => ({
      ...r.ticket,
      participant: r.participant,
      messages: await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.ticketId, r.ticket.id))
        .orderBy(supportMessages.createdAt),
    })),
  );

  return NextResponse.json({ ok: true, count: withMessages.length, tickets: withMessages });
}

export async function POST(req: Request) {
  const unauthorised = requireServerAuth(req);
  if (unauthorised) return unauthorised;

  let body: { ticketId?: string; body?: string; close?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.ticketId || !body.body) {
    return NextResponse.json(
      { ok: false, error: "ticketId_and_body_required" },
      { status: 400 },
    );
  }

  const ticketRows = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, body.ticketId))
    .limit(1);
  const ticket = ticketRows[0];
  if (!ticket) {
    return NextResponse.json({ ok: false, error: "ticket_not_found" }, { status: 404 });
  }

  const pRows = await db
    .select()
    .from(participants)
    .where(eq(participants.id, ticket.participantId))
    .limit(1);

  await db.insert(supportMessages).values({
    ticketId: ticket.id,
    sender: "admin",
    body: body.body,
  });

  await db
    .update(supportTickets)
    .set({
      updatedAt: new Date(),
      status: body.close ? "resolved" : ticket.status,
    })
    .where(eq(supportTickets.id, ticket.id));

  let relay: "telegram" | "mock" | "skipped" = "skipped";
  if (pRows[0]) {
    const res = await sendMessage(
      pRows[0].chatId,
      `${copy.adminRelayPrefix}${body.body}`,
    );
    relay = isTelegramConfigured() && res.ok ? "telegram" : "mock";
  }

  return NextResponse.json({ ok: true, relay, closed: Boolean(body.close) });
}
