// Phase 7B — Inbound message classifier + auto-reply drafter
// Classifies any new inbox row (email, Reddit comment, etc.) into one of:
//   lead      — qualified homeowner with intent to use RemodelerIQ
//   question  — homeowner asking a remodeling/contractor question (we can help)
//   spam      — irrelevant, marketing, automated
//   internal  — transactional or internal (bounces, notifications, etc.)
//
// When classified as `lead` or `question`, also drafts a voice-matched reply
// using Gustavo's tone (since these are personal/conversational, not blog-style).

import { GoogleGenAI } from "@google/genai";

export type InboxTag = "lead" | "question" | "spam" | "internal" | "approval" | "engagement";

const VOICE_BRIEF_INBOX_REPLY = `You are Gustavo from RemodelerIQ replying to an inbound message from a homeowner or Reddit commenter. The reply will be sent on Gustavo's behalf, so write in his voice — knowledgeable contractor friend, ruthlessly protective of the homeowner's wallet, witty, direct, empathetic.

VOICE:
- First-person ("I" / "Gustavo"). NEVER "Gustavo Atar" or "founder".
- 7th-grade reading level. Punchy sentences. Zero jargon.
- Open warmly with the person's first name if available ("Hey Sarah — ...").
- 3-6 sentences total. Email replies can be slightly longer (5-8 sentences).
- Use signature phrases when natural: "Here's what I'd do if this were my house...", "Red flag alert:", "The honest truth is...", "Most homeowners don't know this, but..."
- One specific data point (BLS / FRED / Zonda) when relevant, with source.
- For Reddit replies: NEVER include a link. Don't mention RemodelerIQ.com directly. Sign off naturally ("Hope this helps").
- For emails: soft mention of RemodelerIQ is OK ("If you want me to run the actual numbers through our analyzer, send the PDF and I'll DM you back").
- Close with "— Gustavo" on emails only, NOT on Reddit replies.

ENGAGEMENT REPLIES (tag = engagement — someone replied to a comment of ours on Reddit/Facebook/Nextdoor):
- The conversation has ALREADY started. Your ONLY job is to be additionally helpful — answer their follow-up, add a useful detail, or ask a clarifying question.
- NEVER lead with a CTA, and never pivot the reply toward RemodelerIQ. No "check out our tool", no link, no soft pitch — not even at the end. Pitching mid-conversation reads as a bot and kills the thread.
- If the thread shows high engagement (upvotes noted in context), it's converting on its own — stay purely helpful and let the value speak. A genuinely useful reply earns the click later.

NEVER:
- Generic "thanks for reaching out" or marketing fluff
- Promises about specific results
- Specific legal advice
- Naming individual contractors as recs
- Guaranteeing exact pricing (use ranges)

Return ONLY valid JSON.`;

const CLASSIFIER_SYSTEM_PROMPT = `You are an inbox triage classifier for RemodelerIQ. Given an inbound message (email or social comment), classify it into one of these tags AND draft a reply if appropriate.

TAGS:
- lead     — homeowner with clear intent to use RemodelerIQ or hire someone (mentions wanting analysis, asking about plans, has a specific project)
- question — homeowner asking a remodeling/contractor question we can answer with our data and voice
- spam     — irrelevant, marketing pitch, automated, off-topic
- internal — transactional (email bounce, automated notification, billing receipt, no human action needed)
- engagement — a Reddit/social reply ON one of our posted comments (someone responding to us)

PRIORITY:
- High: lead, question, engagement (need timely response)
- Medium: internal (informational, archive)
- Low: spam (auto-archive)

For lead/question/engagement: draft a Gustavo-voice reply ready to send.
For spam/internal: no reply needed.

Return ONLY this JSON shape:
{
  "tag": "lead" | "question" | "spam" | "internal" | "engagement",
  "priority": "high" | "medium" | "low",
  "summary": "1 sentence describing what they want",
  "proposed_reply": "string OR null — Gustavo-voice reply if tag is lead/question/engagement",
  "reasoning": "1 sentence explaining the classification"
}`;

export interface ClassifierResult {
  tag: InboxTag;
  priority: "high" | "medium" | "low";
  summary: string;
  proposed_reply: string | null;
  reasoning: string;
}

interface ClassifyEnv {
  GEMINI_API_KEY?: string;
}

export async function classifyInboxItem(
  env: ClassifyEnv,
  message: {
    source: string;          // 'email_gustavo' | 'email_help' | 'reddit_reply' | 'nextdoor_comment' | 'facebook_*'
    from_handle?: string;    // sender email or @username
    subject?: string;        // email subject if applicable
    body: string;
    context?: string;        // optional — what we said / what they're replying to
  }
): Promise<ClassifierResult> {
  if (!env.GEMINI_API_KEY) {
    return {
      tag: "internal",
      priority: "low",
      summary: "Classifier offline (no API key)",
      proposed_reply: null,
      reasoning: "GEMINI_API_KEY missing — auto-classification disabled",
    };
  }

  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const userPrompt = `INBOX MESSAGE:
Source: ${message.source}
${message.from_handle ? `From: ${message.from_handle}` : ""}
${message.subject ? `Subject: ${message.subject}` : ""}
${message.context ? `\nWhat we previously said (if this is a reply to us):\n${message.context}\n` : ""}

Their message:
${message.body.slice(0, 4000)}

If you draft a proposed_reply, also follow this voice brief:
${VOICE_BRIEF_INBOX_REPLY}

Classify and (if applicable) draft a reply.`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: CLASSIFIER_SYSTEM_PROMPT,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const raw = response.text || "{}";
    let cleaned = raw.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

    const parsed = JSON.parse(cleaned.trim()) as ClassifierResult;

    // Validate tag
    const validTags: InboxTag[] = ["lead", "question", "spam", "internal", "engagement", "approval"];
    if (!validTags.includes(parsed.tag)) {
      parsed.tag = "question";
    }
    if (!["high", "medium", "low"].includes(parsed.priority)) {
      parsed.priority = "medium";
    }

    return parsed;
  } catch (err) {
    console.error("Inbox classifier failed:", err);
    return {
      tag: "question",
      priority: "medium",
      summary: "Classifier error — manual triage needed",
      proposed_reply: null,
      reasoning: err instanceof Error ? err.message : "unknown error",
    };
  }
}
