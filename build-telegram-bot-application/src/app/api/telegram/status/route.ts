import { NextResponse } from "next/server";
import {
  getWebhookInfo,
  telegramConnectionStatus,
} from "@/lib/telegram/client";
import { isServerApiConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Redacted connection status for the dashboard.
 * NEVER returns the bot token or any secret — booleans only.
 */
export async function GET() {
  const status = telegramConnectionStatus();

  let webhook: Record<string, unknown> | null = null;
  if (status.configured) {
    try {
      const info = await getWebhookInfo();
      if (info.ok && info.result) {
        webhook = {
          url: info.result.url,
          pendingUpdateCount: info.result.pending_update_count,
          lastErrorMessage: info.result.last_error_message ?? null,
        };
      }
    } catch {
      webhook = null;
    }
  }

  return NextResponse.json({
    ok: true,
    telegram: status,
    serverApi: { configured: isServerApiConfigured() },
    webhook,
    timestamp: new Date().toISOString(),
  });
}
