"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyBlock({
  code,
  label,
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-black/60">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase">
          {label ?? "terminal"}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10px] text-dim transition-colors hover:border-signal/50 hover:text-signal"
          aria-label="Copy to clipboard"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      <pre className="scrollbar-thin overflow-x-auto px-4 py-3.5 font-mono text-[12px] leading-relaxed text-ink/85">
        {code}
      </pre>
    </div>
  );
}
