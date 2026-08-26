import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { requireServerAuth } from "@/lib/auth";
import { completeMasterclass } from "@/lib/bot/service";
import { sendInlineKeyboard } from "@/lib/telegram/client";
import { copy } from "@/lib/bot/copy";
import { certificateClaimKeyboard } from "@/lib/bot/keyboards";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/completion   (server-to-server only)
 * Body: { "telegramUserId": string, "verificationKey"?: string }
 *
 * The webinar website calls this when a participant finishes the
 * masterclass there. The participant is verified, admins are notified,
 * and (once TELEGRAM_BOT_TOKEN is live) a congratulations message with a
 * certificate-claim link is pushed to the participant on Telegram.
 */
export async function POST(req: Request) {
  const unauthorised = requireServerAuth(req);
  if (unauthorised) return unauthorised;

  let body: { telegramUserId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.telegramUserId) {
    return NextResponse.json(
      { ok: false, error: "telegram_user_id_required" },
      { status: 400 },
    );
  }

  const rows = await db
    .select()
    .from(participants)
    .where(eq(participants.telegramUserId, String(body.telegramUserId)))
    .limit(1);

  const participant = rows[0];
  if (!participant) {
    return NextResponse.json(
      { ok: false, error: "participant_not_found" },
      { status: 404 },
    );
  }

  const { claimUrl } = await completeMasterclass(participant, "server");

  // Delivered only when Telegram is configured; mock-logged otherwise.
  await sendInlineKeyboard(
    participant.chatId,
    copy.verifySuccess(),
    certificateClaimKeyboard(claimUrl),
  );

  return NextResponse.json({ ok: true, completionStatus: "verified", claimUrl });
}
