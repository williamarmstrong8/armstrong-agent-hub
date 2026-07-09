"use client";

import { useRef, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/ui/icon";
import { Markdown } from "@/components/assistant/markdown";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What's my apartment search looking like today?",
  "How's my recovery, and should I train hard?",
  "Summarize my week shipping at Vercel.",
  "Given my sleep, what should today look like?",
];

const toolLabels: Record<string, string> = {
  searchApartments: "Searched StreetEasy",
  getHealthSummary: "Read Garmin health",
  getWorkSummary: "Checked Vercel deploys",
  listAutomations: "Listed automations",
};

export function Assistant() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-lg)] nu-flat p-4">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.length === 0 ? (
          <Empty onPick={submit} />
        ) : (
          messages.map((m) => <Message key={m.id} message={m} />)
        )}
        {busy && messages[messages.length - 1]?.role === "user" && <Thinking />}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-[var(--radius)] nu-inset px-4 py-2.5 text-sm leading-relaxed text-muted"
          >
            <Icon name="Zap" size={15} className="mt-0.5 shrink-0 text-[var(--warning)]" />
            <span>
              {error.message || "The assistant isn't connected yet. Add an AI_GATEWAY_API_KEY to .env.local (or deploy on Vercel) to enable the agent."}
            </span>
          </motion.div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="mt-3 flex items-center gap-2 rounded-[var(--radius)] nu-inset p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask across your whole life…"
          className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-2"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-accent-fg nu-pressable disabled:opacity-40 [background:linear-gradient(145deg,#20242c,#0c0e12)]"
        >
          <Icon name={busy ? "RefreshCw" : "Send"} size={15} className={busy ? "animate-spin" : ""} />
        </button>
      </form>
    </div>
  );
}

type UIPart = { type: string; text?: string; [k: string]: unknown };
type UIMsg = { id: string; role: string; parts: UIPart[] };

function Message({ message }: { message: UIMsg }) {
  const isUser = message.role === "user";
  const textParts = message.parts.filter((p) => p.type === "text");
  const toolParts = message.parts.filter((p) => p.type.startsWith("tool-"));

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-[var(--radius)] nu-raised px-4 py-2.5 text-sm leading-relaxed">
          {textParts.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {p.text}
            </p>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {toolParts.map((p, i) => {
        const name = p.type.replace("tool-", "");
        return (
          <span
            key={i}
            className="inline-flex w-fit items-center gap-1.5 rounded-full nu-inset-sm px-2.5 py-1 text-[11px] text-muted"
          >
            <Icon name="Zap" size={11} className="text-[#7c3aed]" />
            {toolLabels[name] ?? name}
          </span>
        );
      })}
      {textParts.map((p, i) => (
        <div key={i} className="text-sm leading-relaxed">
          <Markdown>{p.text ?? ""}</Markdown>
        </div>
      ))}
    </motion.div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-2"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function Empty({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-[var(--radius-lg)] nu-raised text-[#7c3aed]">
        <Icon name="Sparkles" size={26} />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">Ask across your whole life</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        The assistant can pull live data from your apartments, health, and work — and connect the dots.
      </p>
      <AnimatePresence>
        <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onPick(s)}
              className="rounded-[var(--radius)] nu-raised-sm nu-pressable px-4 py-3 text-left text-xs text-muted transition-colors hover:text-foreground"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
