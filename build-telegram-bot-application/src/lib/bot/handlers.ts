import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  masterclassVerifications,
  supportMessages,
  supportTickets,
  type Participant,
} from "@/db/schema";
import { track } from "@/lib/analytics";
import { notifyAdmins } from "@/lib/notify";
import {
  answerCallbackQuery,
  editMessageText,
  sendInlineKeyboard,
  sendMessage,
  sendReplyKeyboard,
} from "@/lib/telegram/client";
import type {
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from "@/lib/telegram/types";
import { copy } from "./copy";
import {
  affiliateInlineKeyboard,
  certificateClaimKeyboard,
  courseInlineKeyboard,
  helpInlineKeyboard,
  mainMenuKeyboard,
  MENU_BUTTONS,
  registerConfirmKeyboard,
  startInlineKeyboard,
  supportInlineKeyboard,
  verifyInlineKeyboard,
} from "./keyboards";
import {
  checkCompletionCode,
  completeMasterclass,
  setParticipantState,
  upsertParticipant,
} from "./service";

const MAX_VERIFY_ATTEMPTS = 5;

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  if (update.message) await handleMessage(update.message);
  if (update.callback_query) await handleCallbackQuery(update.callback_query);
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

async function handleMessage(message: TelegramMessage): Promise<unknown> {
  if (!message.from) return;

  const text = message.text?.trim() ?? "";
  const isCommand = text.startsWith("/");

  // /start may carry a deep-link payload; use it as the referral source.
  const startPayload = text.startsWith("/start")
    ? text.split(/\s+/)[1]
    : undefined;

  const participant = await upsertParticipant(
    message.from,
    message.chat,
    startPayload ? `deep_link:${startPayload}` : undefined,
  );
  const chatId = message.chat.id;

  if (isCommand) {
    await track("command", {
      participantId: participant.id,
      telegramUserId: participant.telegramUserId,
      chatId,
      payload: { text: text.slice(0, 64) },
    });
    return handleCommand(participant, chatId, text, startPayload);
  }

  // Plain text: state machine first, then main-menu buttons, then fallback.
  if (participant.state !== "idle") {
    return handleStatefulText(participant, chatId, text);
  }

  switch (text) {
    case MENU_BUTTONS.course:
      return sendCourseOverview(participant, chatId);
    case MENU_BUTTONS.register:
      return beginRegistration(participant, chatId);
    case MENU_BUTTONS.verify:
      return sendInlineKeyboard(chatId, copy.verifyAskCode(), verifyInlineKeyboard());
    case MENU_BUTTONS.support:
      return sendInlineKeyboard(chatId, copy.supportIntro(), supportInlineKeyboard());
    case MENU_BUTTONS.help:
      return sendInlineKeyboard(chatId, copy.help(), helpInlineKeyboard());
    default:
      await track("unhandled_text", {
        participantId: participant.id,
        chatId,
        payload: { text: text.slice(0, 64) },
      });
      return sendMessage(chatId, copy.fallback());
  }
}

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */

async function handleCommand(
  participant: Participant,
  chatId: number,
  text: string,
  startPayload?: string,
): Promise<unknown> {
  const command = text.split(/\s+/)[0].split("@")[0].toLowerCase();

  switch (command) {
    case "/start":
      await sendReplyKeyboard(
        chatId,
        copy.welcome(participant.firstName ?? undefined),
        mainMenuKeyboard,
      );
      await sendInlineKeyboard(
        chatId,
        "Quick actions:",
        startInlineKeyboard(),
      );
      if (startPayload?.startsWith("verify_")) {
        const code = startPayload.slice("verify_".length);
        return attemptVerification(participant, chatId, code);
      }
      if (startPayload === "register") return beginRegistration(participant, chatId);
      return;

    case "/course":
      return sendCourseOverview(participant, chatId);

    case "/help":
      return sendInlineKeyboard(chatId, copy.help(), helpInlineKeyboard());

    case "/support":
      return sendInlineKeyboard(chatId, copy.supportIntro(), supportInlineKeyboard());

    case "/register":
      return beginRegistration(participant, chatId);

    case "/verify":
      await setParticipantState(participant.id, "awaiting_verification_code", {
        attempts: 0,
      });
      return sendInlineKeyboard(chatId, copy.verifyAskCode(), verifyInlineKeyboard());

    case "/menu":
      return sendReplyKeyboard(chatId, "Main menu:", mainMenuKeyboard);

    case "/cancel":
      await setParticipantState(participant.id, "idle", null);
      await track("flow_cancelled", {
        participantId: participant.id,
        chatId,
        payload: { previousState: participant.state },
      });
      return sendReplyKeyboard(chatId, copy.cancelled(), mainMenuKeyboard);

    case "/done":
      if (participant.state === "support_message") {
        await setParticipantState(participant.id, "idle", null);
        return sendReplyKeyboard(chatId, copy.done(), mainMenuKeyboard);
      }
      return sendMessage(chatId, copy.fallback());

    default:
      return sendMessage(chatId, copy.fallback());
  }
}

/* ------------------------------------------------------------------ */
/* Callback queries (inline buttons)                                   */
/* ------------------------------------------------------------------ */

async function handleCallbackQuery(query: TelegramCallbackQuery) {
  const data = query.data ?? "";
  const message = query.message;
  await answerCallbackQuery(query.id);

  if (!message) return;
  const participant = await upsertParticipant(query.from, message.chat);
  const chatId = message.chat.id;
  const messageId = message.message_id;

  await track("callback_query", {
    participantId: participant.id,
    telegramUserId: participant.telegramUserId,
    chatId,
    payload: { data },
  });

  switch (data) {
    case "course:overview":
      return editMessageText(
        chatId,
        messageId,
        copy.courseOverview(),
        courseInlineKeyboard(),
      );
    case "course:curriculum":
      return editMessageText(
        chatId,
        messageId,
        copy.curriculum(),
        courseInlineKeyboard(),
      );
    case "course:pricing":
      return editMessageText(
        chatId,
        messageId,
        copy.pricing(),
        courseInlineKeyboard(),
      );
    case "course:affiliate":
      await track("affiliate_viewed", { participantId: participant.id, chatId });
      return editMessageText(
        chatId,
        messageId,
        copy.affiliate(),
        affiliateInlineKeyboard(),
      );
    case "menu:main":
      return sendReplyKeyboard(chatId, "Main menu:", mainMenuKeyboard);
    case "help:faq":
      return editMessageText(chatId, messageId, copy.faq(), helpInlineKeyboard());
    case "support:start":
      return editMessageText(
        chatId,
        messageId,
        copy.supportIntro(),
        supportInlineKeyboard(),
      );
    case "support:human":
      return beginHumanHandoff(participant, chatId);
    case "verify:code":
      await setParticipantState(participant.id, "awaiting_verification_code", {
        attempts: 0,
      });
      return sendMessage(chatId, copy.verifyAskCode());
    case "register:start":
      return beginRegistration(participant, chatId);
    case "register:restart":
      return beginRegistration(participant, chatId);
    case "register:confirm":
      return confirmRegistration(participant, chatId, messageId);
    case "flow:cancel":
      await setParticipantState(participant.id, "idle", null);
      await editMessageText(chatId, messageId, copy.cancelled());
      return sendReplyKeyboard(chatId, copy.cancelled(), mainMenuKeyboard);
    default:
      return;
  }
}

/* ------------------------------------------------------------------ */
/* Flows                                                               */
/* ------------------------------------------------------------------ */

async function sendCourseOverview(participant: Participant, chatId: number) {
  await track("course_viewed", {
    participantId: participant.id,
    telegramUserId: participant.telegramUserId,
    chatId,
  });
  return sendInlineKeyboard(chatId, copy.courseOverview(), courseInlineKeyboard());
}

/** Registration assistance: name → email → confirm. */
async function beginRegistration(participant: Participant, chatId: number) {
  await setParticipantState(participant.id, "register_name", {});
  await track("registration_started", {
    participantId: participant.id,
    chatId,
  });
  return sendMessage(chatId, copy.registerAskName());
}

async function confirmRegistration(
  participant: Participant,
  chatId: number,
  messageId?: number,
) {
  const draft = (participant.statePayload ?? {}) as { name?: string; email?: string };
  if (!draft.name || !draft.email) {
    await setParticipantState(participant.id, "idle", null);
    return sendMessage(chatId, copy.fallback());
  }

  await setParticipantState(participant.id, "idle", {
    registration: { name: draft.name, email: draft.email, at: new Date().toISOString() },
  });

  await track("registration_completed", {
    participantId: participant.id,
    telegramUserId: participant.telegramUserId,
    chatId,
    payload: { email_domain: draft.email.split("@")[1] ?? "unknown" },
  });

  await notifyAdmins("registration", "New registration intent", {
    name: draft.name,
    participant: participant.username ?? participant.telegramUserId,
  });

  if (messageId) await editMessageText(chatId, messageId, copy.registerDone());
  else await sendMessage(chatId, copy.registerDone());
  return sendReplyKeyboard(chatId, "What next?", mainMenuKeyboard);
}

/** Human-support handoff: open a ticket and collect the user's message. */
async function beginHumanHandoff(participant: Participant, chatId: number) {
  const ticket = await db
    .insert(supportTickets)
    .values({
      participantId: participant.id,
      status: "pending_human",
      subject: "Human support request",
    })
    .returning();

  await setParticipantState(participant.id, "support_message", {
    ticketId: ticket[0].id,
  });

  await track("support_handoff_started", {
    participantId: participant.id,
    chatId,
    payload: { ticketId: ticket[0].id },
  });

  await notifyAdmins("support_handoff", "Human support requested", {
    participant: participant.username ?? participant.firstName ?? participant.telegramUserId,
    ticketId: ticket[0].id,
  });

  await sendMessage(chatId, copy.humanHandoffStarted());
  return sendMessage(chatId, copy.ticketCreated(ticket[0].id.slice(0, 8)));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handleStatefulText(
  participant: Participant,
  chatId: number,
  text: string,
) {
  const payload = (participant.statePayload ?? {}) as Record<string, unknown>;

  switch (participant.state) {
    case "register_name": {
      if (text.length < 2) return sendMessage(chatId, "Please send your full name.");
      await setParticipantState(participant.id, "register_email", {
        ...payload,
        name: text,
      });
      return sendMessage(chatId, copy.registerAskEmail(text));
    }

    case "register_email": {
      if (!EMAIL_RE.test(text)) {
        return sendMessage(chatId, "That does not look like a valid email — try again, or /cancel.");
      }
      const name = String(payload.name ?? "");
      await setParticipantState(participant.id, "register_confirm", {
        ...payload,
        email: text,
      });
      return sendInlineKeyboard(
        chatId,
        copy.registerConfirm(name, text),
        registerConfirmKeyboard(),
      );
    }

    case "awaiting_verification_code":
      return attemptVerification(participant, chatId, text);

    case "support_message": {
      const ticketId = String(payload.ticketId ?? "");
      if (ticketId) {
        await db.insert(supportMessages).values({
          ticketId,
          sender: "participant",
          body: text,
        });
        await db
          .update(supportTickets)
          .set({ updatedAt: new Date() })
          .where(eq(supportTickets.id, ticketId));
      }
      await track("support_message_received", {
        participantId: participant.id,
        chatId,
        payload: { ticketId },
      });
      return sendMessage(chatId, copy.humanClosed());
    }

    default:
      await setParticipantState(participant.id, "idle", null);
      return sendMessage(chatId, copy.fallback());
  }
}

/** Completion verification: check code, run pipeline or count attempts. */
async function attemptVerification(
  participant: Participant,
  chatId: number,
  code: string,
) {
  const payload = (participant.statePayload ?? {}) as { attempts?: number };
  const attempts = (payload.attempts ?? 0) + 1;

  if (checkCompletionCode(code)) {
    await setParticipantState(participant.id, "idle", null);
    const { claimUrl } = await completeMasterclass(participant, "code", code);
    return sendInlineKeyboard(
      chatId,
      copy.verifySuccess(),
      certificateClaimKeyboard(claimUrl),
    );
  }

  await db.insert(masterclassVerifications).values({
    participantId: participant.id,
    method: "code",
    code: code.slice(0, 64),
    status: "rejected",
  });

  await track("verification_failed", {
    participantId: participant.id,
    chatId,
    payload: { attempts },
  });

  if (attempts >= MAX_VERIFY_ATTEMPTS) {
    await setParticipantState(participant.id, "idle", null);
    await notifyAdmins("verification", "Verification locked after failed attempts", {
      participant: participant.username ?? participant.telegramUserId,
      attempts,
    });
    return sendInlineKeyboard(
      chatId,
      copy.verifyLocked(),
      supportInlineKeyboard(),
    );
  }

  await setParticipantState(participant.id, "awaiting_verification_code", {
    attempts,
  });
  return sendMessage(chatId, copy.verifyFailed(MAX_VERIFY_ATTEMPTS - attempts));
}
