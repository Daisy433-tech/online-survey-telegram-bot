import { NextResponse } from "next/server";
import { requireServerAuth } from "@/lib/auth";
import { redeemHandoffToken, type HandoffPurpose } from "@/lib/handoff";
import { track } from "@/lib/analytics";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/handoff/redeem   (server-to-server only)
 * Body: { "token": string, "purpose"?: "certificate_claim" | "account_link" | "webinar_connect" }
 *
 * Called by the webinar website when a user arrives with a handoff token
 * minted by the Telegram bot. Single-use; expiring; purpose-scoped.
 */
export async function POST(req: Request) {
  const unauthorised = requireServerAuth(req);
  if (unauthorised) return unauthorised;

  let body: { token?: string; purpose?: HandoffPurpose };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ ok: false, error: "token_required" }, { status: 400 });
  }

  const result = await redeemHandoffToken(body.token, body.purpose);

  if (!result.ok) {
    const status =
      result.reason === "not_found" ? 404 : result.reason === "expired" || result.reason === "used" ? 410 : 409;
    await track("handoff_redeem_failed", { payload: { reason: result.reason } });
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  await track("handoff_redeemed", {
    participantId: result.participant.id,
    payload: { purpose: result.purpose },
  });

  const p = result.participant;
  return NextResponse.json({
    ok: true,
    purpose: result.purpose,
    participant: {
      id: p.id,
      telegramUserId: p.telegramUserId,
      username: p.username,
      firstName: p.firstName,
      lastName: p.lastName,
      completionStatus: p.completionStatus,
      masterclassCompletedAt: p.masterclassCompletedAt,
      webinarUserId: p.webinarUserId,
    },
  });
}
