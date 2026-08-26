import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

/**
 * Append-only analytics events. Every meaningful bot interaction funnels
 * through `track()` so funnels can be analysed later.
 * Failures are logged but never thrown — analytics must not break the bot.
 */
export async function track(
  event: string,
  data?: {
    participantId?: string | null;
    telegramUserId?: string | number | null;
    chatId?: string | number | null;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      event,
      participantId: data?.participantId ?? null,
      telegramUserId:
        data?.telegramUserId != null ? String(data.telegramUserId) : null,
      chatId: data?.chatId != null ? String(data.chatId) : null,
      payload: data?.payload ?? null,
    });
  } catch (err) {
    console.error(`[analytics] failed to record "${event}":`, err);
  }
}
