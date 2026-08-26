import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { handoffTokens, participants, type Participant } from "@/db/schema";

/**
 * Secure Telegram → website handoff-token system.
 *
 * Properties:
 *  - Raw tokens are 256-bit random values; only their SHA-256 hash is stored.
 *  - Tokens are single-use (`usedAt`) and short-lived (`expiresAt`).
 *  - Tokens are purpose-scoped so a certificate claim token can never be
 *    redeemed as an account-link token, etc.
 *
 * Flow: the bot mints a token and sends the user a link to the webinar
 * website (`WEBINAR_SITE_URL`). The website's server redeems it via
 * `POST /api/v1/handoff/redeem` authenticated with SERVER_API_KEY.
 */

export type HandoffPurpose = "certificate_claim" | "account_link" | "webinar_connect";

const DEFAULT_TTL_MINUTES = 30;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createHandoffToken(
  participantId: string,
  purpose: HandoffPurpose,
  payload?: Record<string, unknown>,
  ttlMinutes: number = DEFAULT_TTL_MINUTES,
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  await db.insert(handoffTokens).values({
    tokenHash: hashToken(rawToken),
    participantId,
    purpose,
    payload: payload ?? null,
    expiresAt,
  });

  return { rawToken, expiresAt };
}

export type RedeemResult =
  | { ok: true; participant: Participant; purpose: string; payload: unknown }
  | { ok: false; reason: "not_found" | "expired" | "used" | "purpose_mismatch" };

export async function redeemHandoffToken(
  rawToken: string,
  expectedPurpose?: HandoffPurpose,
): Promise<RedeemResult> {
  const rows = await db
    .select()
    .from(handoffTokens)
    .where(eq(handoffTokens.tokenHash, hashToken(rawToken)))
    .limit(1);

  const row = rows[0];
  if (!row) return { ok: false, reason: "not_found" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (expectedPurpose && row.purpose !== expectedPurpose) {
    return { ok: false, reason: "purpose_mismatch" };
  }

  // Atomic consume: only mark used if still unused.
  const consumed = await db
    .update(handoffTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(handoffTokens.id, row.id), isNull(handoffTokens.usedAt)))
    .returning({ id: handoffTokens.id });

  if (consumed.length === 0) return { ok: false, reason: "used" };

  const p = await db
    .select()
    .from(participants)
    .where(eq(participants.id, row.participantId))
    .limit(1);

  if (!p[0]) return { ok: false, reason: "not_found" };
  return {
    ok: true,
    participant: p[0],
    purpose: row.purpose,
    payload: row.payload,
  };
}

/** Constant-time comparison helper for secrets of arbitrary length. */
export function safeSecretEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
