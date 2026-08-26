import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Bot,
  CircleAlert,
  ClipboardList,
  Database,
  Handshake,
  KeyRound,
  LifeBuoy,
  Link2,
  Radio,
  RefreshCw,
  Send,
  Server,
  ShieldCheck,
  ShieldQuestion,
  TicketCheck,
  UserPlus,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import CopyBlock from "@/components/CopyBlock";
import StatusPill from "@/components/StatusPill";
import { telegramConnectionStatus } from "@/lib/telegram/client";
import { isServerApiConfigured } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const BOT_USERNAME =
  process.env.NEXT_PUBLIC_BOT_USERNAME ?? "OnlineSurveyMasterclassBot";

function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const COMMANDS = [
  { cmd: "/start", desc: "Welcome, main menu, deep-link payloads", icon: Zap },
  { cmd: "/course", desc: "Curriculum, pricing, affiliate info", icon: BookOpen },
  { cmd: "/register", desc: "Guided registration assistance flow", icon: UserPlus },
  { cmd: "/verify", desc: "Masterclass completion verification", icon: BadgeCheck },
  { cmd: "/support", desc: "FAQ + human-support handoff", icon: LifeBuoy },
  { cmd: "/help", desc: "Command reference and quick actions", icon: ShieldQuestion },
];

const CAPABILITIES = [
  "Webhook endpoint with secret-token auth",
  "/start with deep-link attribution",
  "/course information centre",
  "/help & /support commands",
  "Inline buttons on every surface",
  "Persistent main menu keyboard",
  "Participant database structure",
  "Completion verification pipeline",
  "Secure one-time handoff tokens",
  "Course & affiliate section",
  "Registration assistance flow",
  "Human-support handoff queue",
  "Admin notification structure",
  "Analytics event stream",
  "Contained error handling",
  "Server-to-server API (/api/v1)",
  "Mock mode until token is set",
];

const ENV_ROWS = [
  ["TELEGRAM_BOT_TOKEN", "required at deploy", "Bot token from @BotFather — server-side only, never in the browser"],
  ["TELEGRAM_WEBHOOK_SECRET", "required at deploy", "Authenticates incoming Telegram webhook calls"],
  ["SERVER_API_KEY", "required", "Bearer key for the /api/v1 server-to-server surface"],
  ["WEBHOOK_BASE_URL", "recommended", "Public base URL used when registering the webhook"],
  ["WEBINAR_SITE_URL", "recommended", "Future webinar website base URL for links & handoffs"],
  ["ADMIN_TELEGRAM_CHAT_ID", "optional", "Chat id receiving admin notifications"],
  ["MOCK_COMPLETION_CODES", "dev only", "Codes accepted by /verify during local testing"],
] as const;

export default async function DashboardPage() {
  const tg = telegramConnectionStatus();
  const s2s = isServerApiConfigured();
  const data = await getDashboardData();

  const heroSub =
    "Complete backend operations for the masterclass bot — webhook pipeline, participant CRM, completion verification, support handoff and the server-to-server bridge for the webinar website.";

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* backdrop */}
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[760px]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-signal/10 blur-[140px]" />

      {/* ------------------------------ header ------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-abyss/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-signal glow-signal">
              <Bot size={18} />
            </span>
            <div className="leading-tight">
              <p className="font-mono text-[13px] font-semibold tracking-[0.22em] text-ink">
                OSM<span className="text-signal">/</span>CONTROL
              </p>
              <p className="font-mono text-[10px] tracking-[0.18em] text-dim">
                @{BOT_USERNAME.toUpperCase()}
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 font-mono text-[11px] tracking-[0.16em] text-dim md:flex">
            <a href="#data" className="transition-colors hover:text-ink">DATA</a>
            <a href="#commands" className="transition-colors hover:text-ink">COMMANDS</a>
            <a href="#runbook" className="transition-colors hover:text-ink">RUNBOOK</a>
            <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer"
               className="flex items-center gap-1.5 text-signal transition-opacity hover:opacity-80">
              BOT <ArrowUpRight size={12} />
            </a>
          </nav>
          <StatusPill />
        </div>
      </header>

      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-14 md:pt-28">
        <p className="fade-up font-mono text-[11px] tracking-[0.3em] text-signal uppercase">
          Telegram Bot Infrastructure — v1.0
        </p>
        <h1 className="fade-up mt-6 text-[13vw] leading-[0.92] font-bold tracking-tight md:text-[92px]" style={{ animationDelay: "80ms" }}>
          ONLINE SURVEY
          <br />
          <span className="text-stroke">MASTERCLASS</span>
        </h1>
        <div className="fade-up mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between" style={{ animationDelay: "160ms" }}>
          <p className="max-w-xl text-[15px] leading-relaxed text-dim">{heroSub}</p>
          <a
            href="#runbook"
            className="inline-flex items-center gap-2 self-start rounded-full border border-signal/40 bg-signal/10 px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] text-signal uppercase transition-all hover:bg-signal/20"
          >
            Deployment runbook <ArrowUpRight size={14} />
          </a>
        </div>

        {/* honest status banner */}
        <div className="fade-up mt-12 flex items-start gap-4 rounded-2xl border border-amber/25 bg-amber/[0.06] p-5" style={{ animationDelay: "240ms" }}>
          <CircleAlert className="mt-0.5 shrink-0 text-amber" size={20} />
          <div>
            <p className="font-mono text-[12px] font-semibold tracking-[0.14em] text-amber uppercase">
              Telegram connection: standby — not yet connected
            </p>
            <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-dim">
              The full Bot API client, webhook receiver and all bot flows are implemented and running in
              <span className="text-ink"> mock mode</span>. The live connection activates the moment the secure{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-amber">TELEGRAM_BOT_TOKEN</code>{" "}
              environment variable is set during deployment. The token is read server-side only and is never exposed to this dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------- status cards --------------------------- */}
      <section className="relative mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            icon={<KeyRound size={16} />}
            label="BOT TOKEN"
            value={tg.configured ? "CONFIGURED" : "AWAITING ENV"}
            detail="TELEGRAM_BOT_TOKEN — server-side secret"
            tone={tg.configured ? "mint" : "amber"}
          />
          <StatusCard
            icon={<Webhook size={16} />}
            label="WEBHOOK"
            value={tg.webhookSecretConfigured ? "SECRET READY" : "AWAITING SECRET"}
            detail="POST /api/telegram/webhook"
            tone={tg.webhookSecretConfigured ? "mint" : "amber"}
          />
          <StatusCard
            icon={<Server size={16} />}
            label="S2S API"
            value={s2s ? "KEY ACTIVE (MOCK)" : "NOT SET"}
            detail="/api/v1 · Bearer SERVER_API_KEY"
            tone={s2s ? "signal" : "amber"}
          />
          <StatusCard
            icon={<Database size={16} />}
            label="DATABASE"
            value={`${data.stats.participants} PARTICIPANTS`}
            detail="PostgreSQL · Drizzle ORM · 7 tables"
            tone="mint"
          />
        </div>

        {/* counters */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Counter icon={<Users size={15} />} label="Participants" value={data.stats.participants} />
          <Counter icon={<Activity size={15} />} label="Analytics events" value={data.stats.events} />
          <Counter icon={<TicketCheck size={15} />} label="Support tickets" value={data.stats.tickets} />
          <Counter icon={<BadgeCheck size={15} />} label="Verifications" value={data.stats.verifications} />
        </div>
      </section>

      {/* --------------------------- marquee strip -------------------------- */}
      <div className="relative border-y border-line/70 bg-panel/60 py-3.5 overflow-hidden">
        <div className="marquee flex w-max gap-10 font-mono text-[11px] tracking-[0.3em] text-dim/70 uppercase whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-10">
              {["/start", "/course", "/register", "/verify", "/support", "/help", "inline-buttons", "handoff-tokens", "human-handoff", "analytics", "s2s-api"].map((c) => (
                <span key={c} className="flex items-center gap-2.5">
                  <span className="h-1 w-1 rounded-full bg-signal/60" /> {c}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------ data ------------------------------- */}
      <section id="data" className="relative mx-auto max-w-7xl px-6 py-16">
        <SectionHeader
          index="01"
          title="Live data plane"
          sub="Persisted by the bot runtime. Currently showing seeded mock rows until real Telegram traffic begins."
          badge="SEEDED MOCK DATA"
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          {/* participants */}
          <div className="lg:col-span-3">
            <Panel title="Participants" icon={<Users size={15} />}>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line font-mono text-[10px] tracking-[0.18em] text-dim uppercase">
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-3 py-3 font-medium">State</th>
                      <th className="px-3 py-3 font-medium">Completion</th>
                      <th className="px-5 py-3 text-right font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.participants.map((p) => (
                      <tr key={p.id} className="border-b border-line/50 transition-colors hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] font-medium text-ink">
                            {p.firstName ?? "Unknown"} {p.lastName ?? ""}
                          </p>
                          <p className="font-mono text-[11px] text-dim">
                            {p.username ? `@${p.username}` : p.telegramUserId}
                          </p>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-[11px] text-dim">{p.state}</td>
                        <td className="px-3 py-3.5">
                          <CompletionBadge status={p.completionStatus} />
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-[11px] text-dim">
                          {timeAgo(p.registeredAt)}
                        </td>
                      </tr>
                    ))}
                    {data.participants.length === 0 && <EmptyRow cols={4} label="No participants yet — they appear here after /start" />}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          {/* analytics feed */}
          <div className="lg:col-span-2">
            <Panel title="Analytics event stream" icon={<Activity size={15} />}>
              <div className="scrollbar-thin max-h-[420px] overflow-y-auto px-5 py-4">
                {data.events.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 border-b border-line/40 py-2.5 last:border-0">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal/70" />
                    <div className="min-w-0">
                      <p className="font-mono text-[12px] text-ink">{e.event}</p>
                      <p className="font-mono text-[10px] text-dim">
                        {timeAgo(e.createdAt)}
                        {e.telegramUserId ? ` · tg:${e.telegramUserId}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
                {data.events.length === 0 && <EmptyText label="No events yet" />}
              </div>
            </Panel>
          </div>
        </div>

        {/* tickets + notifications */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Support tickets" icon={<LifeBuoy size={15} />}>
            <div className="px-5 py-4">
              {data.tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 border-b border-line/40 py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-ink">{t.subject ?? "Support ticket"}</p>
                    <p className="font-mono text-[10px] text-dim">#{t.id.slice(0, 8)} · {t.channel} · {timeAgo(t.updatedAt)}</p>
                  </div>
                  <TicketBadge status={t.status} />
                </div>
              ))}
              {data.tickets.length === 0 && <EmptyText label="Queue is empty" />}
            </div>
          </Panel>

          <Panel title="Admin notifications" icon={<Send size={15} />}>
            <div className="px-5 py-4">
              {data.notifications.map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-4 border-b border-line/40 py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-ink">{n.title}</p>
                    <p className="font-mono text-[10px] text-dim">{n.type} · {timeAgo(n.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] tracking-[0.14em] uppercase ${
                    n.delivery === "telegram"
                      ? "border-mint/40 bg-mint/10 text-mint"
                      : "border-line bg-white/[0.03] text-dim"
                  }`}>
                    {n.delivery === "telegram" ? "DELIVERED" : n.delivery}
                  </span>
                </div>
              ))}
              {data.notifications.length === 0 && <EmptyText label="No notifications queued" />}
            </div>
          </Panel>
        </div>
      </section>

      {/* ---------------------------- commands ------------------------------ */}
      <section id="commands" className="relative border-t border-line/60 bg-panel/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeader
            index="02"
            title="Bot command map"
            sub="Every surface replies through keyboards, inline buttons and stateful flows — never dead ends."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMANDS.map((c) => (
              <div key={c.cmd} className="group rounded-2xl border border-line bg-black/40 p-5 transition-all hover:border-signal/40 hover:bg-black/60">
                <div className="flex items-center justify-between">
                  <code className="font-mono text-[15px] font-semibold text-signal">{c.cmd}</code>
                  <span className="text-dim transition-colors group-hover:text-signal"><c.icon size={17} /></span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-dim">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* capability checklist */}
          <div className="mt-12 rounded-2xl border border-line bg-black/40 p-7">
            <div className="flex items-center gap-3">
              <ShieldCheck size={17} className="text-mint" />
              <p className="font-mono text-[12px] tracking-[0.2em] text-ink uppercase">
                Implementation checklist — 17/17 built
              </p>
            </div>
            <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((cap) => (
                <p key={cap} className="flex items-center gap-2.5 text-[12.5px] text-dim">
                  <BadgeCheck size={13} className="shrink-0 text-mint/80" /> {cap}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- runbook ------------------------------ */}
      <section id="runbook" className="relative mx-auto max-w-7xl px-6 py-16">
        <SectionHeader
          index="03"
          title="Deployment runbook"
          sub="Everything needed to connect the deployed backend to Telegram — no secrets in code, ever."
        />

        {/* steps */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { n: "01", icon: <Bot size={16} />, t: "Create the bot", d: "Message @BotFather → /newbot → name + username. Store the issued token as TELEGRAM_BOT_TOKEN in your host's secret manager." },
            { n: "02", icon: <KeyRound size={16} />, t: "Set secrets", d: "Generate TELEGRAM_WEBHOOK_SECRET (openssl rand -hex 32), set SERVER_API_KEY, WEBHOOK_BASE_URL and ADMIN_TELEGRAM_CHAT_ID. Redeploy." },
            { n: "03", icon: <Webhook size={16} />, t: "Register webhook", d: "POST the setup endpoint below (or call setWebhook directly). Telegram requires your public HTTPS domain." },
            { n: "04", icon: <Radio size={16} />, t: "Go live", d: "Open @OnlineSurveyMasterclassBot, send /start, watch participants and events stream into this console. Status flips from STANDBY to LIVE." },
          ].map((s) => (
            <div key={s.n} className="relative overflow-hidden rounded-2xl border border-line bg-panel/70 p-6">
              <span className="font-mono text-[38px] font-bold text-white/[0.05] absolute right-4 top-3">{s.n}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-black/50 text-signal">{s.icon}</span>
              <p className="mt-4 text-[14.5px] font-semibold text-ink">{s.t}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-dim">{s.d}</p>
            </div>
          ))}
        </div>

        {/* env table + curl */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Environment variables" icon={<ClipboardList size={15} />}>
            <div className="px-5 py-3">
              {ENV_ROWS.map(([name, req, purpose]) => (
                <div key={name} className="border-b border-line/40 py-3 last:border-0">
                  <div className="flex items-center justify-between gap-3">
                    <code className="font-mono text-[12px] text-signal">{name}</code>
                    <span className={`rounded-md border px-2 py-0.5 font-mono text-[9.5px] tracking-[0.14em] uppercase ${
                      req.includes("required")
                        ? "border-amber/40 bg-amber/10 text-amber"
                        : "border-line text-dim"
                    }`}>{req}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-dim">{purpose}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-6">
            <CopyBlock
              label="register webhook (operator)"
              code={`curl -X POST https://YOUR_DOMAIN/api/telegram/setup \\
  -H "Authorization: Bearer $SERVER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"set"}'`}
            />
            <CopyBlock
              label="s2s — redeem handoff token"
              code={`curl -X POST https://YOUR_DOMAIN/api/v1/handoff/redeem \\
  -H "Authorization: Bearer $SERVER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"token":"HANDOFF_TOKEN","purpose":"certificate_claim"}'`}
            />
            <CopyBlock
              label="s2s — report masterclass completion"
              code={`curl -X POST https://YOUR_DOMAIN/api/v1/completion \\
  -H "Authorization: Bearer $SERVER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"telegramUserId":"123456789"}'`}
            />
          </div>
        </div>

        {/* architecture strip */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ArchCard
            icon={<Send size={15} />}
            title="Telegram → Bot"
            body="Webhook updates verified via X-Telegram-Bot-Api-Secret-Token, dispatched to command/callback/flow handlers, replied through the Bot API client."
          />
          <ArchCard
            icon={<Link2 size={15} />}
            title="Bot → Webinar site"
            body="Graduates receive one-time, expiring, SHA-256-hashed handoff tokens as deep links; the webinar site redeems them server-to-server."
          />
          <ArchCard
            icon={<Handshake size={15} />}
            title="Webinar site → Bot"
            body="The site reports completions, links accounts and answers support tickets through /api/v1 with a Bearer key compared in constant time."
          />
        </div>
      </section>

      {/* ------------------------------ footer ------------------------------ */}
      <footer className="border-t border-line/70 bg-panel/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw size={14} className="text-dim" />
            <p className="font-mono text-[10.5px] tracking-[0.18em] text-dim uppercase">
              Mock mode active · no live Telegram traffic · token required at deployment
            </p>
          </div>
          <div className="flex items-center gap-5 font-mono text-[10.5px] tracking-[0.18em] text-dim uppercase">
            <span className="flex items-center gap-2"><ShieldCheck size={13} className="text-mint/70" /> Secrets server-side only</span>
            <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-signal hover:opacity-80">
              @{BOT_USERNAME} <ArrowUpRight size={11} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ------------------------------ building blocks ------------------------------ */

function SectionHeader({ index, title, sub, badge }: { index: string; title: string; sub: string; badge?: string }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[12px] tracking-[0.3em] text-signal">{index}</span>
        <span className="h-px w-16 bg-signal/40" />
        {badge && (
          <span className="rounded-md border border-amber/40 bg-amber/10 px-2.5 py-1 font-mono text-[9.5px] tracking-[0.2em] text-amber uppercase">
            {badge}
          </span>
        )}
      </div>
      <h2 className="mt-4 text-4xl font-bold tracking-tight text-ink md:text-5xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-dim">{sub}</p>
    </div>
  );
}

function StatusCard({ icon, label, value, detail, tone }: {
  icon: React.ReactNode; label: string; value: string; detail: string;
  tone: "mint" | "amber" | "signal";
}) {
  const tones = {
    mint: "border-mint/30 bg-mint/[0.06] text-mint",
    amber: "border-amber/30 bg-amber/[0.06] text-amber",
    signal: "border-signal/30 bg-signal/[0.06] text-signal",
  } as const;
  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.22em] text-dim uppercase">{label}</span>
        <span className="text-dim">{icon}</span>
      </div>
      <p className={`mt-4 inline-flex rounded-lg border px-2.5 py-1.5 font-mono text-[11.5px] font-semibold tracking-[0.14em] ${tones[tone]}`}>
        {value}
      </p>
      <p className="mt-3 font-mono text-[10.5px] text-dim">{detail}</p>
    </div>
  );
}

function Counter({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-black/40 px-5 py-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-signal">{icon}</span>
      <div>
        <p className="text-[22px] font-bold leading-none text-ink">{value}</p>
        <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-dim uppercase">{label}</p>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel/70">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        <span className="text-signal">{icon}</span>
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink uppercase">{title}</p>
      </div>
      {children}
    </div>
  );
}

function ArchCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-black/40 p-6">
      <div className="flex items-center gap-2.5">
        <span className="text-signal">{icon}</span>
        <p className="text-[14px] font-semibold text-ink">{title}</p>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-dim">{body}</p>
    </div>
  );
}

function CompletionBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: "border-mint/40 bg-mint/10 text-mint",
    pending: "border-amber/40 bg-amber/10 text-amber",
    rejected: "border-danger/40 bg-danger/10 text-danger",
    unverified: "border-line bg-white/[0.03] text-dim",
  };
  return (
    <span className={`rounded-md border px-2 py-1 font-mono text-[10px] tracking-[0.12em] uppercase ${styles[status] ?? styles.unverified}`}>
      {status}
    </span>
  );
}

function TicketBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "border-signal/40 bg-signal/10 text-signal",
    pending_human: "border-amber/40 bg-amber/10 text-amber",
    resolved: "border-mint/40 bg-mint/10 text-mint",
  };
  return (
    <span className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] tracking-[0.12em] uppercase ${styles[status] ?? styles.open}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-8 text-center font-mono text-[11px] text-dim">{label}</td>
    </tr>
  );
}

function EmptyText({ label }: { label: string }) {
  return <p className="py-6 text-center font-mono text-[11px] text-dim">{label}</p>;
}
