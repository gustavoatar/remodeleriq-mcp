// Shared building blocks for the "use RemodelerIQ inside your AI assistant" pages
// (/use-with-claude, /use-with-chatgpt, and the combined /use-with-ai hub).
// Keeping the endpoint, steps, and tool list in one place means the three pages
// can never drift apart.
import { useState } from 'react';
import { Check, Copy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export const MCP_ENDPOINT = 'https://remodeleriq.com/mcp';
export const BRAND = '#1F9C4C';

function track(event: string, location: string) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.('event', event, { location });
}

export interface Step {
  title: string;
  body: React.ReactNode;
}

// Claude.ai ships custom connectors on every plan — Free users get one, paid
// plans are unlimited. No approval, no waitlist.
export const CLAUDE_STEPS: Step[] = [
  {
    title: 'Open your connector settings',
    body: (
      <>
        In Claude, click your name in the bottom-left corner, then{' '}
        <strong>Settings → Connectors</strong>. On Team and Enterprise plans an Owner
        adds it once for the whole organization under{' '}
        <strong>Organization settings → Connectors</strong>.
      </>
    ),
  },
  {
    title: 'Add a custom connector',
    body: (
      <>
        Click <strong>+ Add custom connector</strong> and paste the RemodelerIQ endpoint
        below. Leave the advanced OAuth fields empty — RemodelerIQ is read-only and needs
        no login. Click <strong>Add</strong>.
      </>
    ),
  },
  {
    title: 'Turn it on and ask',
    body: (
      <>
        In any chat, click the <strong>+</strong> button → <strong>Connectors</strong> and
        switch RemodelerIQ on. Now paste a contractor's bid and ask Claude whether the
        price is fair — it will call the analyzer and hand back a real score.
      </>
    ),
  },
];

// ChatGPT reaches custom MCP servers through developer mode. The plugin directory
// is the curated alternative; developer mode is what works today without review.
export const CHATGPT_STEPS: Step[] = [
  {
    title: 'Enable developer mode',
    body: (
      <>
        In ChatGPT, go to <strong>Settings → Apps &amp; Connectors → Advanced</strong> and
        switch on <strong>Developer mode</strong>. This is what lets you add a connector
        that isn't in the plugin directory yet.
      </>
    ),
  },
  {
    title: 'Create the connector',
    body: (
      <>
        Back in <strong>Apps &amp; Connectors</strong>, click <strong>Create</strong>. Name it{' '}
        <em>RemodelerIQ</em>, paste the endpoint below as the MCP server URL, and set
        authentication to <strong>No authentication</strong>. Click <strong>Create</strong>.
      </>
    ),
  },
  {
    title: 'Use it in a chat',
    body: (
      <>
        Open a new chat, click the <strong>+</strong> → <strong>More</strong> →{' '}
        <strong>RemodelerIQ</strong>, then paste your bid. ChatGPT renders the score card
        inline — including the side-by-side view when you give it two competing bids.
      </>
    ),
  },
];

export const EXAMPLE_PROMPTS = [
  'Here\'s my kitchen bid — is $48,000 with a 50% deposit fair in Roswell, GA?',
  'Compare these two fence estimates and tell me which one is the better deal.',
  'What should a bathroom remodel cost in Atlanta in 2026?',
  'What hourly rate should I expect from an electrician in Texas?',
];

export const MCP_TOOLS = [
  {
    name: 'analyze_bid',
    what: 'Scores one bid 0–100, flags the risky terms, and returns negotiation talking points.',
  },
  {
    name: 'compare_bids',
    what: 'Puts 2–5 bids side by side — per-trade costs, scope gaps, and an apples-to-apples adjusted total.',
  },
  {
    name: 'get_cost_estimate',
    what: '2026 cost range for your project type in your city, from Zonda and Houzz benchmarks.',
  },
  {
    name: 'get_labor_rates',
    what: 'Burdened trade labor rates by state, from Bureau of Labor Statistics wage data.',
  },
  {
    name: 'get_risk_stats',
    what: 'How often each red flag shows up across the bids we\'ve analyzed, by region and project type.',
  },
];

/** Copyable MCP endpoint box — the one thing every visitor needs off these pages. */
export function EndpointBox({ location }: { location: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(MCP_ENDPOINT).then(() => {
      setCopied(true);
      track('mcp_copy_url', location);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
        Connector URL
      </span>
      <code className="flex-1 min-w-[240px] break-all font-mono text-sm font-semibold text-navy-900 sm:text-base">
        {MCP_ENDPOINT}
      </code>
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors"
        style={{ backgroundColor: copied ? '#0f7a37' : BRAND }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

/** Numbered how-to steps. */
export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: BRAND }}
          >
            {i + 1}
          </span>
          <div className="pt-1">
            <h3 className="mb-1 font-bold text-navy-900">{step.title}</h3>
            <p className="text-sm leading-relaxed text-navy-600">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The five tools an assistant gains once connected. */
export function ToolTable() {
  return (
    <div className="space-y-3">
      {MCP_TOOLS.map((tool) => (
        <div key={tool.name} className="rounded-xl border border-navy-100 bg-white p-4">
          <code className="font-mono text-sm font-bold text-emerald-700">{tool.name}</code>
          <p className="mt-1 text-sm text-navy-600">{tool.what}</p>
        </div>
      ))}
    </div>
  );
}

/** Example things to say once the connector is live. */
export function PromptIdeas({ prompts = EXAMPLE_PROMPTS }: { prompts?: string[] }) {
  return (
    <ul className="space-y-3">
      {prompts.map((p) => (
        <li
          key={p}
          className="rounded-lg border border-navy-100 border-l-4 border-l-emerald-500 bg-slate-50 px-4 py-3 text-sm italic text-navy-700"
        >
          "{p}"
        </li>
      ))}
    </ul>
  );
}

/** Shared closing CTA — sends people to the web analyzer if they'd rather not set anything up. */
export function NoSetupCTA({ location }: { location: string }) {
  return (
    <section
      className="mb-14 rounded-2xl p-8 text-center text-white md:p-10"
      style={{ backgroundColor: BRAND }}
    >
      <h2 className="mb-3 text-2xl font-bold md:text-3xl">Don't want to set anything up?</h2>
      <p className="mx-auto mb-6 max-w-xl text-emerald-50">
        The same analysis runs right here on the site. Upload your estimate and get the
        score, the red flags, and the local price comparison — no connector, no signup.
      </p>
      <Link
        to="/?view=upload"
        onClick={() => track('ai_page_analyze_click', location)}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold shadow-lg transition-transform hover:scale-105"
        style={{ color: BRAND }}
      >
        Analyze My Bid Free
        <ArrowRight className="h-5 w-5" />
      </Link>
    </section>
  );
}
