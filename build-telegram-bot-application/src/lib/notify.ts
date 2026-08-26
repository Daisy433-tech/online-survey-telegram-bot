import { db } from "@/db";
import { adminNotifications } from "@/db/schema";
import { isTelegramConfigured, sendMessage } from "@/lib/telegram/client";

/**
 * Admin notification structure.
 *
 * Every notification is persisted to `admin_notifications` first (a durable,
 * auditable queue). If an admin chat id is configured AND the Telegram token
 * is present, it is also relayed to the admin chat on Telegram — otherwise
 * it stays queued with delivery "mock".
 */
export async function notifyAdmins(
  type: "verification" | "registration" | "support_handoff" | "error" | "system",
  title: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
  const canRelay = isTelegramConfigured() && Boolean(adminChatId);
  let delivery: "queued" | "telegram" | "mock" = "queued";

  if (canRelay && adminChatId) {
    const summary = payload
      ? "\n" +
        Object.entries(payload)
          .slice(0, 8)
          .map(([k, v]) => `· ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
          .join("\n")
      : "";
    const res = await sendMessage(
      adminChatId,
      `<b>[${type.toUpperCase()}]</b> ${escapeHtml(title)}${escapeHtml(summary)}`,
    );
    delivery = res.ok ? "telegram" : "queued";
  } else {
    delivery = "mock";
    console.info(`[notify:mock] ${type}: ${title}`, payload ?? "");
  }

  try {
    await db.insert(adminNotifications).values({
      type,
      title,
      payload: payload ?? null,
      delivery,
    });
  } catch (err) {
    console.error("[notify] failed to persist notification:", err);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
