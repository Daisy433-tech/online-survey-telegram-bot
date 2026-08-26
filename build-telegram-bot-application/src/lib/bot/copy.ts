import { BOT_NAME, BOT_USERNAME, COURSE, FAQ } from "./config";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const copy = {
  welcome: (firstName?: string) =>
    [
      `<b>Welcome to the ${esc(BOT_NAME)}</b>${firstName ? `, ${esc(firstName)}` : ""}.`,
      "",
      `I am the official assistant for @${esc(BOT_USERNAME)}. Here is what I can do:`,
      "· Walk you through the masterclass curriculum and pricing",
      "· Register you for the next cohort",
      "· Verify your masterclass completion and issue your certificate claim link",
      "· Connect you with a human on our support team",
      "",
      "Use the menu below, the buttons, or type a command to begin.",
    ].join("\n"),

  courseOverview: () =>
    [
      `<b>${esc(COURSE.name)}</b>`,
      `<i>${esc(COURSE.tagline)}</i>`,
      "",
      `<b>Format:</b> ${esc(COURSE.format)}`,
      `<b>Schedule:</b> ${esc(COURSE.nextCohort)}`,
      `<b>Enrollment:</b> ${esc(COURSE.price)}`,
      "",
      "Tap below for the full curriculum, pricing, or our affiliate program.",
    ].join("\n"),

  curriculum: () =>
    [
      "<b>Curriculum — 6 modules</b>",
      "",
      ...COURSE.modules.map((m, i) => `${i + 1}. ${esc(m)}`),
      "",
      "<i>Module list is mock content — update before launch.</i>",
    ].join("\n"),

  pricing: () =>
    [
      "<b>Enrollment options</b>",
      "",
      `Standard seat — ${esc(COURSE.price)}`,
      "Includes all live sessions, recordings, and the graduate certificate.",
      "",
      "<i>Pricing is mock data. Final checkout happens on the webinar website.</i>",
    ].join("\n"),

  affiliate: () =>
    [
      "<b>Affiliate program</b>",
      "",
      `Commission: ${esc(COURSE.affiliate.commission)}`,
      `Payouts: ${esc(COURSE.affiliate.payout)}`,
      "",
      "Share your referral link and earn on every enrollment it generates.",
      "<i>Affiliate terms are placeholders until the portal goes live.</i>",
    ].join("\n"),

  help: () =>
    [
      "<b>How I can help</b>",
      "",
      "/start — welcome message and main menu",
      "/course — curriculum, pricing and affiliate info",
      "/register — guided registration for the next cohort",
      "/verify — verify your masterclass completion",
      "/support — FAQ and human support handoff",
      "/menu — show the main menu again",
      "/cancel — cancel the current action",
      "/help — this message",
    ].join("\n"),

  faq: () =>
    [
      "<b>Frequently asked questions</b>",
      "",
      ...COURSE_FAQ_LINES(),
      "",
      "Still stuck? Use /support to reach a human.",
    ].join("\n"),

  supportIntro: () =>
    [
      "<b>Support</b>",
      "",
      "Browse the FAQ for instant answers, or request a human handoff and an agent will pick up your ticket.",
    ].join("\n"),

  humanHandoffStarted: () =>
    [
      "<b>You are now in the human-support queue.</b>",
      "",
      "Describe your issue in a single message and I will open a ticket for our team.",
      "Type /done when you are finished, or /cancel to leave the queue.",
    ].join("\n"),

  ticketCreated: (ref: string) =>
    `Ticket <code>${esc(ref)}</code> opened. Our team has been notified and will reply right here in this chat.`,

  humanClosed: () =>
    "Thanks — I have logged that message on your ticket. Anything else? Type /done to exit support mode.",

  registerAskName: () =>
    "Let's get you registered for the next cohort. First — what is your <b>full name</b>?",

  registerAskEmail: (name: string) =>
    `Thanks, ${esc(name)}. What <b>email address</b> should we use for your enrollment?`,

  registerConfirm: (name: string, email: string) =>
    [
      "<b>Please confirm your registration</b>",
      "",
      `Name: ${esc(name)}`,
      `Email: ${esc(email)}`,
      "",
      "This records your seat intent here in Telegram. Final checkout and scheduling happen on the webinar website.",
    ].join("\n"),

  registerDone: () =>
    "Registration intent recorded. Our team will contact you with checkout next steps. You will also be able to link your webinar-site account here later — that integration is currently in mock mode.",

  verifyAskCode: () =>
    "Please reply with your <b>completion code</b> as shown on your certificate screen (for example <code>OSM-XXXX-000</code>).",

  verifySuccess: () =>
    "<b>Completion verified — congratulations, graduate.</b> Your masterclass record has been updated. Use the button below to claim your certificate on the website.",

  verifyFailed: (attemptsLeft: number) =>
    `That code did not check out. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before this request is flagged for a manual review by support.`,

  verifyLocked: () =>
    "Too many invalid attempts. I have flagged your account for manual verification — a human will follow up. Meanwhile you can open /support.",

  cancelled: () => "Cancelled. You are back at the main menu.",

  fallback: () =>
    "I did not understand that. Use the menu below or type /help to see everything I can do.",

  done: () => "Closed. Anything else? The main menu is right there.",

  adminRelayPrefix: "<b>Support team:</b> ",
};

function COURSE_FAQ_LINES(): string[] {
  return FAQ.flatMap((f) => [`<b>${esc(f.q)}</b>`, esc(f.a), ""]);
}
