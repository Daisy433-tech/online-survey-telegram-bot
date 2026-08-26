# Online Survey Masterclass — Telegram Bot Deployment & Connection Guide

Backend for **@OnlineSurveyMasterclassBot** (Online Survey Masterclass).

> **Connection status:** the Telegram Bot API integration is fully implemented
> but intentionally **inactive** until the `TELEGRAM_BOT_TOKEN` environment
> variable is set during deployment. Until then every outbound Telegram call
> runs in an explicit **mock mode** (server-logged, not delivered). Nothing in
> this repository claims a live Telegram connection.

---

## 1. Environment variables

| Variable | Required | Purpose | Exposure |
|---|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection (platform-provisioned) | server |
| `TELEGRAM_BOT_TOKEN` | **yes, at deployment** | Bot token from @BotFather | server only — **never** sent to the browser |
| `TELEGRAM_WEBHOOK_SECRET` | yes, at deployment | Random string; authenticates incoming webhook calls from Telegram (`openssl rand -hex 32`) | server |
| `SERVER_API_KEY` | yes | Bearer key for the server-to-server `/api/v1/*` surface shared with the webinar website | server |
| `WEBHOOK_BASE_URL` | recommended | Public base URL of this deployment, e.g. `https://osm-bot.example.com` | server |
| `WEBINAR_SITE_URL` | recommended | Base URL of the webinar website (links + handoffs) | server (sent into Telegram messages) |
| `ADMIN_TELEGRAM_CHAT_ID` | optional | Telegram chat id for admin notifications | server |
| `MOCK_COMPLETION_CODES` | optional (dev) | Comma-separated codes accepted by `/verify` in testing | server |
| `NEXT_PUBLIC_BOT_USERNAME` | optional | Display-only bot username | browser-safe |

## 2. Deployment requirements

1. Node.js 20+, PostgreSQL 14+ (both provisioned by this platform).
2. `npm ci && npm run build && npm start`.
3. Apply the database schema: `npx drizzle-kit push`.
4. HTTPS public URL — Telegram only delivers webhooks over HTTPS.
5. Set the environment variables above in your host's secret manager.

## 3. Webhook configuration

1. Create the bot with @BotFather and copy the token into `TELEGRAM_BOT_TOKEN`.
2. Generate `TELEGRAM_WEBHOOK_SECRET` (`openssl rand -hex 32`).
3. Deploy, then register the webhook by calling the operator endpoint:

```bash
curl -X POST https://YOUR_DOMAIN/api/telegram/setup \
  -H "Authorization: Bearer $SERVER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"set"}'
```

Equivalent raw Bot API call (also acceptable):

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR_DOMAIN/api/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
  -d "allowed_updates=[\"message\",\"callback_query\"]"
```

4. Verify with `{"action":"info"}` on the setup endpoint, or `getWebhookInfo`.
5. The webhook route rejects any request without the matching
   `X-Telegram-Bot-Api-Secret-Token` header.

## 4. Bot surface

- **Commands:** `/start` (deep-link payloads supported, e.g. `?start=register`,
  `?start=verify_<CODE>`), `/course`, `/register`, `/verify`, `/support`,
  `/help`, `/menu`, `/cancel`, `/done`.
- **Main menu:** persistent reply keyboard — Course Info · Register ·
  Verify Completion · Support · Help.
- **Inline buttons:** course overview / curriculum / pricing / affiliate,
  registration confirm, verification, support + human handoff.
- **Flows:** guided registration (name → email → confirm), completion
  verification with attempt limiting and admin flagging, human-support
  ticketing.

## 5. Server-to-server API (for the webinar website)

All under `/api/v1/*`, all require `Authorization: Bearer $SERVER_API_KEY`:

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/handoff/redeem` | Redeem a single-use handoff token minted by the bot (certificate claim, account link). |
| `POST /api/v1/completion` | Report masterclass completion from the webinar site → verifies the participant, notifies admins, messages the user. |
| `GET/POST /api/v1/participants` | Look up / list participants; link a webinar-site account id. |
| `GET/POST /api/v1/tickets` | Read support tickets; post admin replies relayed into Telegram. |

## 6. Connecting the deployed backend to Telegram — step by step

1. Talk to `@BotFather` → `/newbot` → name `Online Survey Masterclass` →
   username `OnlineSurveyMasterclassBot` → receive token.
2. Set commands in BotFather (`/setcommands`): start, course, register,
   verify, support, help.
3. Put the token in `TELEGRAM_BOT_TOKEN` (host secret manager — not in code,
   not in the browser).
4. Generate and set `TELEGRAM_WEBHOOK_SECRET`; set `WEBHOOK_BASE_URL` and
   `SERVER_API_KEY`.
5. Redeploy/restart, register the webhook (section 3), confirm with
   `{"action":"info"}`.
6. Open Telegram → `@OnlineSurveyMasterclassBot` → `/start`. The dashboard at
   `/` shows participants, analytics events, tickets and notifications in
   real time; the status cards will switch from STANDBY to LIVE.

## 7. Mock/test data in use

- Course curriculum, pricing, affiliate terms: placeholders in
  `src/lib/bot/config.ts`.
- Completion codes: `MOCK_COMPLETION_CODES` (default `SURVEY-DEMO-2026`,
  `OSM-GRAD-001`).
- Seeded participants/tickets/events on the dashboard are demo rows.
- The webinar website domain is `WEBINAR_SITE_URL` (placeholder default).
