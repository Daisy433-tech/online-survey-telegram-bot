import { NextResponse } from "next/server";
import { handleUpdate } from "@/lib/bot/handlers";
import { isTelegramConfigured } from "@/lib/telegram/client";
import { track } from "@/lib/analytics";
import type { TelegramUpdate } from "@/lib/telegram/types";

export const dynamic = "force-dynamic";

/**
 * Telegram webhook receiver.
 *
 * Security:
 *  - Telegram authenticates itself via the `X-Telegram-Bot-Api-Secret-Token`
 *    header, which we set at `setWebhook` time and compare here against the
 *    `TELEGRAM_WEBHOOK_SECRET` environment variable.
 *  - The handler ALWAYS answers 200 after accepting an update so Telegram
 *    does not retry endlessly; internal errors are trapped, logged, and
 *    recorded as analytics events.
 *
 * Note: reaching this endpoint from real Telegram traffic requires
 * TELEGRAM_BOT_TOKEN + webhook registration. Without them the endpoint is
 * only usable for local, dry-run testing (mock mode).
 */
export async function POST(req: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  if (!expectedSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "webhook_secret_not_configured",
        message:
          "Set TELEGRAM_WEBHOOK_SECRET on this deployment before registering the webhook.",
      },
      { status: 503 },
    );
  }

  const providedSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  try {
    await handleUpdate(update);
  } catch (err) {
    console.error("[webhook] unhandled error while processing update:", err);
    await track("error", {
      payload: {
        source: "webhook",
        message: err instanceof Error ? err.message : String(err),
      },
    });
  }

  if (!isTelegramConfigured()) {
    console.info(
      "[webhook] processed in MOCK mode — no TELEGRAM_BOT_TOKEN set, replies were not delivered.",
    );
  }

  return NextResponse.json({ ok: true });
}

/** Lightweight liveness probe (no secrets). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "telegram-webhook",
    telegramConfigured: isTelegramConfigured(),
    mockMode: !isTelegramConfigured(),
  });
}
