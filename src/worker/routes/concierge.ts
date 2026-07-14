// Concierge assistant — a homeowner-facing chat that walks someone through
// checking a contractor bid. Gemini 2.5 Flash with FUNCTION-CALLING over the
// same three analyzer tools the MCP server exposes (src/shared/toolResults.ts),
// so every number it states is tool-grounded, never invented. Anonymous-friendly
// but gated: after FREE_LIMIT assistant replies the homeowner drops an email to
// keep going (lead capture + Gemini cost control).
//
// Mounted at /api/concierge in src/worker/index.ts.
import { Hono } from "hono";
import { GoogleGenAI } from "@google/genai";
import { type AppEnv } from "../types";
import { analyzeBidResult, costEstimateResult, laborRatesResult, isToolError } from "@/shared/toolResults";

const app = new Hono<AppEnv>();

const MODEL = "gemini-2.5-flash";
const FREE_LIMIT = 4; // assistant replies before the email gate
const MAX_TOOL_HOPS = 4; // safety cap on the function-calling loop
const HISTORY_CAP = 20; // turns of client history we trust per request

const SYSTEM_PROMPT = `You are the RemodelerIQ Concierge — a warm, plain-spoken advocate who helps homeowners tell if a contractor's remodeling bid is fair. You are on the homeowner's side, never the contractor's.

HOW YOU WORK:
- You have three tools: analyze_bid, get_cost_estimate, get_labor_rates. ALWAYS call the right tool to get real numbers. NEVER state a dollar figure, score, or rate you did not get from a tool call. If you're unsure, ask a short clarifying question or call a tool.
- Keep replies short and skimmable (2-5 sentences or a tight list). No walls of text.
- When you have a bid, guide the homeowner: get the total, the state, and the project type, then run analyze_bid and explain the score + top red flags in everyday language.
- End most replies with a helpful next step (e.g. offer to run the full analysis, or ask for the missing detail you need).

GUARDRAILS:
- Only discuss home remodeling, contractor bids, costs, and trade labor. Politely redirect anything else.
- You are not a lawyer or financial advisor. Do not give personalized legal or financial/investment advice; suggest consulting a professional for those.
- Never invent data. Tool results are your only source of numbers.
- Encourage using the full RemodelerIQ analyzer at remodeleriq.com for a complete, saved report.`;

// Gemini function declarations mirroring the MCP tool schemas.
const FUNCTION_DECLARATIONS = [
  {
    name: "analyze_bid",
    description:
      "Score a contractor's remodeling bid 0-100 for fairness/risk. Returns red flags, a summary, and negotiation talk-tracks.",
    parameters: {
      type: "object",
      properties: {
        bid_text: { type: "string", description: "The contractor's bid/estimate text (line items, terms, scope)." },
        bid_total: { type: "number", description: "Total dollar amount of the bid, if known." },
        state_code: { type: "string", description: "Two-letter US state code. Defaults to GA." },
      },
      required: ["bid_text"],
    },
  },
  {
    name: "get_cost_estimate",
    description: "2026 market cost range for a remodeling project in a US state/city.",
    parameters: {
      type: "object",
      properties: {
        project_type: { type: "string", description: "e.g. kitchen-remodel, bathroom-remodel, roofing, deck, addition." },
        state_code: { type: "string", description: "Two-letter US state code." },
        city_key: { type: "string", description: "Optional city slug, e.g. atlanta-ga." },
      },
      required: ["project_type", "state_code"],
    },
  },
  {
    name: "get_labor_rates",
    description: "2026 burdened trade labor rates ($/hr) for a US state, from BLS data.",
    parameters: {
      type: "object",
      properties: {
        state_code: { type: "string", description: "Two-letter US state code." },
        trade: { type: "string", description: "Optional trade filter, e.g. plumber, electrician." },
      },
      required: ["state_code"],
    },
  },
];

type ToolCallLog = { tool: string; data: Record<string, unknown> };

function execTool(name: string, args: Record<string, unknown>): Record<string, unknown> {
  const a = args || {};
  let r;
  if (name === "analyze_bid")
    r = analyzeBidResult(String(a.bid_text || ""), typeof a.bid_total === "number" ? a.bid_total : undefined, a.state_code as string | undefined);
  else if (name === "get_cost_estimate")
    r = costEstimateResult(String(a.project_type || ""), String(a.state_code || ""), a.city_key ? String(a.city_key) : undefined);
  else if (name === "get_labor_rates")
    r = laborRatesResult(String(a.state_code || ""), a.trade ? String(a.trade) : undefined);
  else return { error: `unknown tool ${name}` };
  return isToolError(r) ? { error: r.error } : r.data;
}

interface ClientMsg {
  role: "user" | "assistant";
  content: string;
}

// POST /chat — one concierge turn.
app.post("/chat", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  if (!apiKey) return c.json({ error: "Concierge not configured." }, 500);

  let body: { sessionId?: string; message?: string; history?: ClientMsg[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "bad json" }, 400);
  }
  const sessionId = String(body.sessionId || "").slice(0, 80);
  const message = String(body.message || "").trim();
  if (!sessionId || !message) return c.json({ error: "sessionId and message required" }, 400);
  if (message.length > 6000) return c.json({ error: "message too long" }, 400);

  const db = c.env.DB;
  const ip = c.req.header("cf-connecting-ip") || null;

  // Load / create conversation state for the gate.
  const convo = await db
    .prepare("SELECT unlocked, msg_count FROM concierge_conversations WHERE session_id = ?")
    .bind(sessionId)
    .first<{ unlocked: number; msg_count: number }>();
  if (!convo) {
    await db
      .prepare("INSERT INTO concierge_conversations (session_id, ip) VALUES (?, ?)")
      .bind(sessionId, ip)
      .run();
  }
  const msgCount = convo?.msg_count ?? 0;
  const unlocked = (convo?.unlocked ?? 0) === 1;

  // Email gate: once past the free allotment, ask for an email before answering.
  if (!unlocked && msgCount >= FREE_LIMIT) {
    return c.json({
      needsEmail: true,
      reply:
        "I'd love to keep going! Drop your email and I'll keep helping — plus you can save your bid analysis and pick up where you left off.",
    });
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build the conversation: trusted client history + this user message.
  const history = Array.isArray(body.history) ? body.history.slice(-HISTORY_CAP) : [];
  const contents: Array<{ role: "user" | "model"; parts: unknown[] }> = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content || "").slice(0, 6000) }],
  }));
  contents.push({ role: "user", parts: [{ text: message }] });

  const config = {
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
    temperature: 0.5,
  };

  const toolLog: ToolCallLog[] = [];
  let replyText = "";

  try {
    for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
      const resp = await ai.models.generateContent({
        model: MODEL,
        contents: contents as never,
        config: config as never,
      });
      const calls = resp.functionCalls;
      if (calls && calls.length > 0) {
        contents.push({ role: "model", parts: calls.map((fc) => ({ functionCall: fc })) });
        const responseParts = calls.map((fc) => {
          const data = execTool(fc.name || "", (fc.args as Record<string, unknown>) || {});
          toolLog.push({ tool: fc.name || "unknown", data });
          return { functionResponse: { name: fc.name, response: data } };
        });
        contents.push({ role: "user", parts: responseParts });
        continue; // let the model narrate the tool results
      }
      replyText = (resp.text || "").trim();
      break;
    }
  } catch (err) {
    console.error("Concierge Gemini error:", err);
    return c.json({ error: "The concierge hit a snag. Try again in a moment." }, 502);
  }

  if (!replyText) {
    replyText = "Sorry — I couldn't put that together. Could you rephrase, or paste the bid details you'd like me to check?";
  }

  // Persist turn + bump the served-reply counter (drives the gate). Background.
  c.executionCtx.waitUntil(
    (async () => {
      try {
        await db
          .prepare("INSERT INTO concierge_messages (session_id, role, content) VALUES (?, 'user', ?)")
          .bind(sessionId, message)
          .run();
        await db
          .prepare("INSERT INTO concierge_messages (session_id, role, content, tool_calls) VALUES (?, 'assistant', ?, ?)")
          .bind(sessionId, replyText, toolLog.length ? JSON.stringify(toolLog.map((t) => t.tool)) : null)
          .run();
        await db
          .prepare(
            "UPDATE concierge_conversations SET msg_count = msg_count + 1, updated_at = datetime('now') WHERE session_id = ?"
          )
          .bind(sessionId)
          .run();
      } catch (e) {
        console.error("Concierge persist error:", e);
      }
    })()
  );

  // Surface analyze_bid results to the client so it can render a score card.
  const bidCard = toolLog.find((t) => t.tool === "analyze_bid" && !("error" in t.data))?.data ?? null;

  return c.json({
    reply: replyText,
    toolResults: toolLog,
    bidCard,
    repliesUsed: msgCount + 1,
    freeLimit: FREE_LIMIT,
    unlocked,
  });
});

// POST /unlock — capture email to lift the gate for this session.
app.post("/unlock", async (c) => {
  let body: { sessionId?: string; email?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "bad json" }, 400);
  }
  const sessionId = String(body.sessionId || "").slice(0, 80);
  const email = String(body.email || "").trim().toLowerCase();
  if (!sessionId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return c.json({ error: "valid email and sessionId required" }, 400);
  }
  const db = c.env.DB;
  // Ensure the conversation row exists, then unlock it.
  await db
    .prepare("INSERT INTO concierge_conversations (session_id) VALUES (?) ON CONFLICT(session_id) DO NOTHING")
    .bind(sessionId)
    .run();
  await db
    .prepare("UPDATE concierge_conversations SET email = ?, unlocked = 1, updated_at = datetime('now') WHERE session_id = ?")
    .bind(email, sessionId)
    .run();
  await db.prepare("INSERT INTO concierge_leads (email, session_id) VALUES (?, ?)").bind(email, sessionId).run();
  return c.json({ ok: true });
});

export default app;
