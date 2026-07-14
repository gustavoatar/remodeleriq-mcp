// Floating "RemodelerIQ Concierge" — a homeowner-facing chat that guides a bid
// check. Talks to /api/concierge/chat (Gemini + tool-calling), renders analyze_bid
// results as a score card, funnels into the full analyzer, and shows an email gate
// after the free message allotment. Mounted once, site-wide, from App.tsx.
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, ShieldCheck, ArrowUpRight } from "lucide-react";

interface RedFlag { level: string; issue: string; detail?: string; fix?: string }
interface BidCard {
  confidence_score: number;
  verdict: string;
  summary?: string;
  red_flags?: RedFlag[];
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  bidCard?: BidCard | null;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! I'm the RemodelerIQ Concierge. Got a contractor quote you're unsure about? Tell me the project, the total, and your state — I'll check if it's fair and flag anything sketchy. 🛠️",
};

function sessionId(): string {
  const KEY = "riq_concierge_sid";
  let sid = "";
  try {
    sid = localStorage.getItem(KEY) || "";
    if (!sid) {
      sid = (crypto?.randomUUID?.() || `s_${Date.now()}_${Math.round(Math.random() * 1e9)}`);
      localStorage.setItem(KEY, sid);
    }
  } catch {
    sid = `s_${Date.now()}`;
  }
  return sid;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#1F9C4C";
  if (score >= 50) return "#f59e0b";
  return "#dc2626";
}

function ScoreCard({ card }: { card: BidCard }) {
  const color = scoreColor(card.confidence_score);
  const flags = (card.red_flags || []).slice(0, 4);
  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-white text-lg font-bold"
          style={{ backgroundColor: color }}
        >
          {Math.round(card.confidence_score)}
        </div>
        <div>
          <div className="text-sm font-bold text-navy-900">{card.verdict}</div>
          <div className="text-xs text-slate-500">Confidence score / 100</div>
        </div>
      </div>
      {flags.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {flags.map((f, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-700">
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span>
                <strong>{f.issue}</strong>
                {f.fix ? <span className="text-slate-500"> — {f.fix}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
      <a
        href="/?view=upload"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
      >
        Run the full analysis <ArrowUpRight className="h-3 w-3" />
      </a>
    </div>
  );
}

export default function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const pendingRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sid = useRef<string>("");
  if (!sid.current) sid.current = sessionId();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, needsEmail]);

  const send = useCallback(
    async (text: string) => {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setBusy(true);
      try {
        const res = await fetch("/api/concierge/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId: sid.current, message: text, history }),
        });
        const data = await res.json();
        if (data.needsEmail) {
          pendingRef.current = text;
          setNeedsEmail(true);
          return;
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply || "…", bidCard: data.bidCard || null },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry — I hit a snag reaching the server. Mind trying again?" },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [messages]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void send(text);
  };

  const onUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return;
    setBusy(true);
    try {
      await fetch("/api/concierge/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId: sid.current, email: val }),
      });
      setNeedsEmail(false);
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) await send(pending);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Launcher bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-all hover:bg-brand-600 hover:shadow-xl"
          aria-label="Open the RemodelerIQ concierge"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] max-h-[calc(100vh-3rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <div className="text-sm font-bold leading-tight">
                RemodelerIQ Concierge
                <div className="text-[11px] font-normal opacity-90">Free bid check · on your side</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={m.role === "user" ? "max-w-[85%]" : "max-w-[90%]"}>
                  <div
                    className={
                      m.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-brand-500 px-3 py-2 text-sm text-white"
                        : "rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-navy-900 shadow-sm ring-1 ring-slate-100"
                    }
                  >
                    {m.content}
                  </div>
                  {m.bidCard ? <ScoreCard card={m.bidCard} /> : null}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {needsEmail ? (
            <form onSubmit={onUnlock} className="border-t border-slate-200 bg-white p-3">
              <p className="mb-2 text-xs text-slate-600">
                Enter your email to keep chatting and save your analysis.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your bid or ask a question…"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
