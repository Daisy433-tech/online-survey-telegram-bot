import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Online Survey Masterclass — Telegram bot persistence layer.
 *
 * All Telegram identifiers are stored as text to avoid Postgres bigint /
 * JS number precision issues. Timestamps are UTC.
 */

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    telegramUserId: text("telegram_user_id").notNull(),
    chatId: text("chat_id").notNull(),
    username: text("username"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    languageCode: text("language_code"),
    /** Finite-state-machine state for conversational flows. */
    state: text("state").notNull().default("idle"),
    /** Arbitrary flow data captured while `state` is active. */
    statePayload: jsonb("state_payload"),
    /** completionStatus: unverified | pending | verified | rejected */
    completionStatus: text("completion_status").notNull().default("unverified"),
    completionCode: text("completion_code"),
    masterclassCompletedAt: timestamp("masterclass_completed_at", {
      withTimezone: true,
    }),
    /** Where the participant came from (deep-link payload, manual, etc.) */
    referralSource: text("referral_source"),
    /** Link slot for the future webinar website account id. */
    webinarUserId: text("webinar_user_id"),
    metadata: jsonb("metadata"),
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("participants_telegram_user_id_idx").on(t.telegramUserId),
    index("participants_chat_id_idx").on(t.chatId),
  ],
);

export const masterclassVerifications = pgTable(
  "masterclass_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    /** method: code | handoff | server | manual */
    method: text("method").notNull().default("code"),
    code: text("code"),
    /** status: pending | verified | rejected */
    status: text("status").notNull().default("pending"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("verifications_participant_idx").on(t.participantId)],
);

export const handoffTokens = pgTable(
  "handoff_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** SHA-256 hash of the raw token. Raw tokens are never stored. */
    tokenHash: text("token_hash").notNull(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    /** purpose: certificate_claim | account_link | webinar_connect */
    purpose: text("purpose").notNull(),
    payload: jsonb("payload"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("handoff_tokens_hash_idx").on(t.tokenHash)],
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    /** status: open | pending_human | resolved */
    status: text("status").notNull().default("open"),
    subject: text("subject"),
    channel: text("channel").notNull().default("telegram"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("support_tickets_participant_idx").on(t.participantId)],
);

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    /** sender: participant | admin | system */
    sender: text("sender").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("support_messages_ticket_idx").on(t.ticketId)],
);

export const adminNotifications = pgTable(
  "admin_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** type: verification | registration | support_handoff | error | system */
    type: text("type").notNull(),
    title: text("title").notNull(),
    payload: jsonb("payload"),
    /** delivery: queued | telegram | mock */
    delivery: text("delivery").notNull().default("queued"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("admin_notifications_type_idx").on(t.type)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    event: text("event").notNull(),
    participantId: uuid("participant_id"),
    telegramUserId: text("telegram_user_id"),
    chatId: text("chat_id"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("analytics_events_event_idx").on(t.event)],
);

export type Participant = typeof participants.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type MasterclassVerification = typeof masterclassVerifications.$inferSelect;
export type HandoffToken = typeof handoffTokens.$inferSelect;
