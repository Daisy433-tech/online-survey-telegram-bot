/**
 * Server-side Telegram Bot API client.
 *
 * SECURITY CONTRACT
 * -----------------
 * The bot token is read exclusively from the `TELEGRAM_BOT_TOKEN`
 * server-side environment variable. It is never logged, returned to the
 * browser, or exposed through any API route. Any route that reports
 * connection state returns booleans only.
 *
 * MOCK MODE
 * ---------
 * When TELEGRAM_BOT_TOKEN is absent the client switches to mock mode:
 * every outbound call is logged server-side and a synthetic `ok` response
 * is returned so the full bot logic can be exercised end-to-end without
 * a live Telegram connection. This is explicitly NOT a live connection.
 */

import type {
  InlineKeyboardMarkup,
  ReplyMarkup,
  SendMessagePayload,
  TelegramApiResponse,
  WebhookInfo,
} from "./types";

const API_BASE = "https://api.telegram.org";

function token(): string | undefined {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  return t && t.trim().length > 0 ? t.trim() : undefined;
}

/** True only when a token is present. Never reveals the token itself. */
export function isTelegramConfigured(): boolean {
  return Boolean(token());
}

/** Public, redacted status for dashboards. Contains no secrets. */
export function telegramConnectionStatus() {
  const configured = isTelegramConfigured();
  return {
    configured,
    mode: configured ? "live" : "mock",
    webhookSecretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
    adminChatConfigured: Boolean(process.env.ADMIN_TELEGRAM_CHAT_ID),
    botUsername: process.env.NEXT_PUBLIC_BOT_USERNAME ?? "OnlineSurveyMasterclassBot",
  } as const;
}

async function callApi<T>(
  method: string,
  body: Record<string, unknown>,
): Promise<TelegramApiResponse<T>> {
  const t = token();

  if (!t) {
    // Mock mode: simulate success, log server-side for local testing.
    console.info(
      `[telegram:mock] ${method} -> ${safePreview(body)} (TELEGRAM_BOT_TOKEN not set; message NOT delivered)`,
    );
    return { ok: true, result: undefined, description: "mock-mode" };
  }

  const res = await fetch(`${API_BASE}/bot${t}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as TelegramApiResponse<T>;
  if (!data.ok) {
    console.error(`[telegram] ${method} failed: ${data.description}`);
  }
  return data;
}

function safePreview(body: Record<string, unknown>): string {
  const clone = { ...body };
  if (typeof clone.text === "string" && clone.text.length > 120) {
    clone.text = clone.text.slice(0, 120) + "…";
  }
  try {
    return JSON.stringify(clone);
  } catch {
    return "[unserializable payload]";
  }
}

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

export async function sendMessage(
  chatId: string | number,
  text: string,
  extra?: Partial<Omit<SendMessagePayload, "chat_id" | "text">>,
) {
  return callApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

export async function sendInlineKeyboard(
  chatId: string | number,
  text: string,
  keyboard: InlineKeyboardMarkup,
) {
  return sendMessage(chatId, text, { reply_markup: keyboard });
}

export async function editMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  keyboard?: InlineKeyboardMarkup,
) {
  return callApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
) {
  return callApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

export async function sendReplyKeyboard(
  chatId: string | number,
  text: string,
  keyboard: ReplyMarkup,
) {
  return sendMessage(chatId, text, { reply_markup: keyboard });
}

/* ------------------------------------------------------------------ */
/* Webhook management                                                  */
/* ------------------------------------------------------------------ */

export async function setWebhook(url: string, secretToken: string) {
  return callApi("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

export async function deleteWebhook() {
  return callApi("deleteWebhook", { drop_pending_updates: true });
}

export async function getWebhookInfo() {
  return callApi<WebhookInfo>("getWebhookInfo", {});
}

export async function getMe() {
  return callApi<{ id: number; username: string; first_name: string }>(
    "getMe",
    {},
  );
}
