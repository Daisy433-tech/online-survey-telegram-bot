import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  masterclassVerifications,
  participants,
  type Participant,
} from "@/db/schema";
import { MOCK_COMPLETION_CODES, WEBINAR_SITE_URL } from "./config";
import { createHandoffToken } from "@/lib/handoff";
import { notifyAdmins } from "@/lib/notify";
import { track } from "@/lib/analytics";
import type { TelegramChat, TelegramUser } from "@/lib/telegram/types";

/** Create or refresh a participant row from a Telegram user/chat pair. */
export async function upsertParticipant(
  from: TelegramUser,
  chat: TelegramChat,
  referralSource?: string,
): Promise<Participant> {
  const telegramUserId = String(from.id);
  const chatId = String(chat.id);

  const existing = await db
    .select()
    .from(participants)
    .where(eq(participants.telegramUserId, telegramUserId))
    .limit(1);

  if (existing[0]) {
    const updated = await db
      .update(participants)
      .set({
        chatId,
        username: from.username ?? null,
        firstName: from.first_name ?? null,
        lastName: from.last_name ?? null,
        languageCode: from.language_code ?? null,
        lastSeenAt: new Date(),
        ...(referralSource && !existing[0].referralSource
          ? { referralSource }
          : {}),
      })
      .where(eq(participants.id, existing[0].id))
      .returning();
    return updated[0];
  }

  const inserted = await db
    .insert(participants)
    .values({
      telegramUserId,
      chatId,
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
      languageCode: from.language_code ?? null,
      referralSource: referralSource ?? "organic",
    })
    .returning();

  await track("participant_joined", {
    participantId: inserted[0].id,
    telegramUserId,
    chatId,
    payload: { referralSource: referralSource ?? "organic" },
  });

  return inserted[0];
}

export async function setParticipantState(
  participantId: string,
  state: string,
  statePayload?: Record<string, unknown> | null,
): Promise<void> {
  await db
    .update(participants)
    .set({ state, statePayload: statePayload ?? null, lastSeenAt: new Date() })
    .where(eq(participants.id, participantId));
}

/** Mock code check. Real verification arrives via the server-to-server API. */
export function checkCompletionCode(code: string): boolean {
  const normalised = code.trim().toUpperCase();
  return MOCK_COMPLETION_CODES.includes(normalised);
}

export type CompletionMethod = "code" | "handoff" | "server" | "manual";

/**
 * Masterclass completion pipeline: mark verified, persist an audit record,
 * notify admins, and mint a certificate-claim handoff token pointing at the
 * webinar website.
 */
export async function completeMasterclass(
  participant: Participant,
  method: CompletionMethod,
  code?: string,
): Promise<{ claimUrl: string }> {
  const now = new Date();

  await db
    .update(participants)
    .set({
      completionStatus: "verified",
      masterclassCompletedAt: now,
      completionCode: code ?? null,
    })
    .where(eq(participants.id, participant.id));

  await db.insert(masterclassVerifications).values({
    participantId: participant.id,
    method,
    code: code ?? null,
    status: "verified",
    verifiedAt: now,
  });

  await track("masterclass_verified", {
    participantId: participant.id,
    telegramUserId: participant.telegramUserId,
    chatId: participant.chatId,
    payload: { method },
  });

  await notifyAdmins("verification", "Masterclass completion verified", {
    participant: participant.username ?? participant.firstName ?? participant.telegramUserId,
    method,
  });

  const { rawToken } = await createHandoffToken(
    participant.id,
    "certificate_claim",
    { completionStatus: "verified", method },
  );

  return { claimUrl: `${WEBINAR_SITE_URL}/claim?t=${rawToken}` };
}
