"use client";

import { useEffect, useState } from "react";

type Status = {
  telegram?: { configured: boolean; mode: "live" | "mock" };
  serverApi?: { configured: boolean };
};

export default function StatusPill() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/telegram/status", { cache: "no-store" });
        if (res.ok && mounted) setStatus(await res.json());
      } catch {
        /* keep previous */
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const live = status?.telegram?.configured === true;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[11px] tracking-[0.18em] uppercase ${
        live
          ? "border-mint/40 bg-mint/10 text-mint"
          : "border-amber/40 bg-amber/10 text-amber"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full pulse-dot ${
          live ? "bg-mint" : "bg-amber"
        }`}
      />
      {status === null ? "CHECKING" : live ? "TELEGRAM LIVE" : "TG STANDBY"}
    </span>
  );
}
