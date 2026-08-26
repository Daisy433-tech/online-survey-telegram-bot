/**
 * Central bot configuration.
 *
 * Everything in `COURSE` is MOCK / PLACEHOLDER content. Replace with real
 * course data (or wire to environment variables) before going live.
 */

export const BOT_USERNAME =
  process.env.NEXT_PUBLIC_BOT_USERNAME ?? "OnlineSurveyMasterclassBot";

export const BOT_NAME = "Online Survey Masterclass";

/** Placeholder URL of the future webinar website. Override via env. */
export const WEBINAR_SITE_URL =
  process.env.WEBINAR_SITE_URL ?? "https://your-webinar-site.example.com";

export const COURSE = {
  name: "Online Survey Masterclass",
  tagline: "Turn paid online surveys into a structured, reliable side income.",
  format: "6-week live online masterclass · 12 sessions · recordings included",
  nextCohort: "Next cohort: dates announced soon (placeholder)",
  price: "$199 (mock pricing — configure before launch)",
  affiliate: {
    commission: "30% per referred enrollment (mock terms)",
    payout: "Monthly payouts via the affiliate portal (placeholder)",
    url: `${WEBINAR_SITE_URL}/affiliates`,
  },
  modules: [
    "Foundations: how legitimate survey panels actually work",
    "Panel portfolio: vetting and joining high-paying panels",
    "Profile optimisation: qualifying for more surveys",
    "Workflow systems: routing, tracking and time-boxing",
    "Scaling: referrals, focus groups and product testing",
    "Payouts & taxes: cashing out safely and staying compliant",
  ],
} as const;

/**
 * Mock completion codes for local testing of the verification flow.
 * In production this check should be replaced (or complemented) by the
 * server-to-server completion callback from the webinar website.
 */
export const MOCK_COMPLETION_CODES: string[] = (
  process.env.MOCK_COMPLETION_CODES ?? "SURVEY-DEMO-2026,OSM-GRAD-001"
)
  .split(",")
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean);

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Is this masterclass live or recorded?",
    a: "Sessions run live with Q&A, and every session is recorded so you can rewatch at any time. (Mock answer — replace with real policy.)",
  },
  {
    q: "How do I get my certificate?",
    a: "Finish all modules, then use the Verify Completion option in the main menu and enter your completion code. Verified graduates receive a certificate claim link.",
  },
  {
    q: "How does the affiliate program work?",
    a: "Share your referral link; when someone enrolls through it you earn a commission. Use /course and open the affiliate section for details. (Mock terms.)",
  },
];
