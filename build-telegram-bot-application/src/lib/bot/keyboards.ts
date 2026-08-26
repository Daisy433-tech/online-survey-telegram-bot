import type {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from "@/lib/telegram/types";
import { WEBINAR_SITE_URL } from "./config";

/** Persistent reply keyboard — the bot's main menu. */
export const mainMenuKeyboard: ReplyKeyboardMarkup = {
  resize_keyboard: true,
  is_persistent: true,
  keyboard: [
    [{ text: "Course Info" }, { text: "Register" }],
    [{ text: "Verify Completion" }, { text: "Support" }],
    [{ text: "Help" }],
  ],
};

export const MENU_BUTTONS = {
  course: "Course Info",
  register: "Register",
  verify: "Verify Completion",
  support: "Support",
  help: "Help",
} as const;

export function startInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "Explore the Masterclass", callback_data: "course:overview" }],
      [{ text: "Register for the next cohort", callback_data: "register:start" }],
      [{ text: "Visit website", url: WEBINAR_SITE_URL }],
    ],
  };
}

export function courseInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Curriculum", callback_data: "course:curriculum" },
        { text: "Pricing", callback_data: "course:pricing" },
      ],
      [{ text: "Affiliate program", callback_data: "course:affiliate" }],
      [{ text: "Register now", callback_data: "register:start" }],
      [{ text: "Main menu", callback_data: "menu:main" }],
    ],
  };
}

export function affiliateInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "Open affiliate portal (placeholder)", url: `${WEBINAR_SITE_URL}/affiliates` }],
      [{ text: "Back to course", callback_data: "course:overview" }],
    ],
  };
}

export function helpInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "Contact support", callback_data: "support:start" }],
      [{ text: "Read FAQ", callback_data: "help:faq" }],
      [{ text: "Main menu", callback_data: "menu:main" }],
    ],
  };
}

export function supportInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "Talk to a human", callback_data: "support:human" }],
      [{ text: "Browse FAQ", callback_data: "help:faq" }],
      [{ text: "Main menu", callback_data: "menu:main" }],
    ],
  };
}

export function verifyInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "Enter completion code", callback_data: "verify:code" }],
      [{ text: "I lost my code", callback_data: "support:start" }],
    ],
  };
}

export function registerConfirmKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "Confirm registration", callback_data: "register:confirm" }],
      [
        { text: "Start over", callback_data: "register:restart" },
        { text: "Cancel", callback_data: "flow:cancel" },
      ],
    ],
  };
}

export function certificateClaimKeyboard(url: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "Claim certificate on website", url }],
      [{ text: "Main menu", callback_data: "menu:main" }],
    ],
  };
}
