import { NextResponse } from "next/server";
import { requireServerAuth } from "@/lib/auth";
import {
  deleteWebhook,
  getWebhookInfo,
  isTelegramConfigured,
  setWebhook,
} from "@/lib/telegram/client";

export const dynamic = "force-dynamic";

/**
 * Operator-only webhook management (Bearer SERVER_API_KEY).
 *
 *   POST { "action": "set",    "url": "https://your-domain.com/api/telegram/webhook" }
 *   POST { "action": "delete" }
 *   POST { "action": "info" }
 *
 * If `url` is omitted for "set", WEBHOOK_BASE_URL env + the webhook path is used.
 */
export async function POST(req: Request) {
  const unauthorised = requireServerAuth(req);
  if (unauthorised) return unauthorised;

  if (!isTelegramConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "telegram_not_configured",
        message:
          "TELEGRAM_BOT_TOKEN is not set. Webhook registration is unavailable until the token is provided at deployment time.",
      },
      { status: 409 },
    );
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  let body: { action?: string; url?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* body optional for delete/info */
  }

  switch (body.action) {
    case "set": {
      const url =
        body.url ??
        (process.env.WEBHOOK_BASE_URL
          ? `${process.env.WEBHOOK_BASE_URL.replace(/\/$/, "")}/api/telegram/webhook`
          : undefined);
      if (!url || !secret) {
        return NextResponse.json(
          {
            ok: false,
            error: "missing_configuration",
            message:
              "Provide a webhook url (or set WEBHOOK_BASE_URL) and TELEGRAM_WEBHOOK_SECRET.",
          },
          { status: 400 },
        );
      }
      const res = await setWebhook(url, secret);
      return NextResponse.json({ ok: res.ok, telegram: res }, { status: res.ok ? 200 : 502 });
    }
    case "delete": {
      const res = await deleteWebhook();
      return NextResponse.json({ ok: res.ok, telegram: res });
    }
    case "info": {
      const res = await getWebhookInfo();
      return NextResponse.json({ ok: res.ok, webhook: res.result ?? null });
    }
    default:
      return NextResponse.json(
        { ok: false, error: "unknown_action", allowed: ["set", "delete", "info"] },
        { status: 400 },
      );
  }
}
