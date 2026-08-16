import PageSEO from '@/react-app/components/PageSEO';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import FAQSchema, { FAQItem } from '@/react-app/components/FAQSchema';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import { Link } from 'react-router';
import { ArrowRight, ShieldCheck, Sparkles, Terminal, Zap } from 'lucide-react';
import {
  CLAUDE_STEPS,
  CHATGPT_STEPS,
  EndpointBox,
  StepList,
  ToolTable,
  PromptIdeas,
  NoSetupCTA,
} from '@/react-app/components/AiConnect';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

const AI_FAQS: FAQItem[] = [
  {
    question: 'What is the RemodelerIQ connector?',
    answer:
      'A free Model Context Protocol (MCP) server at https://remodeleriq.com/mcp. Adding it to an AI assistant gives that assistant five read-only tools: score a contractor bid, compare several bids, look up 2026 project costs by city, look up trade labor rates by state, and check how often each red flag appears across the bids we have analyzed.',
  },
  {
    question: 'Which AI assistants can use it?',
    answer:
      'Claude and ChatGPT both support it directly with a URL paste — those are the two paths on this page. Cursor, VS Code, Claude Code, and any other MCP-capable client work too, using the same endpoint with a small JSON config. Perplexity does not currently support end-user MCP connectors.',
  },
  {
    question: 'Does it cost anything?',
    answer: `The connector is free and there is no signup. Three bid analyses per 48 hours are included with no credit card. Beyond that your assistant receives a message pointing to the paid plans, which remove the cap and let you re-score every revised bid as you negotiate.`,
  },
  {
    question: 'Can the connector change anything or see my other conversations?',
    answer:
      'No. All five tools are read-only, so nothing can be created, changed, or deleted. The connection runs one direction: your assistant sends a bid when you ask for an analysis and gets a result back. RemodelerIQ has no access to your assistant account, your chat history, or anything else.',
  },
  {
    question: 'What happens to a bid I analyze this way?',
    answer:
      'The raw text is not retained. The structured result — project type, region, dollar totals, and which risk flags fired — is kept to sharpen the benchmarks, after names, addresses, phone numbers, and email addresses are stripped out.',
  },
  {
    question: 'Why connect an assistant instead of using the website?',
    answer:
      'Convenience, mostly. If you are already discussing your renovation with an AI assistant, the connector means you never leave that conversation to get a grounded answer. The website runs the identical analysis and produces a shareable PDF report, so use whichever fits how you work.',
  },
];

interface Path {
  name: string;
  blurb: string;
  time: string;
  href: string;
}

const PATHS: Path[] = [
  {
    name: 'Claude',
    blurb:
      'Custom connectors work on every plan, including Free. Add the URL once and it follows you to the desktop and mobile apps.',
    time: '~30 seconds',
    href: '/use-with-claude',
  },
  {
    name: 'ChatGPT',
    blurb:
      'Flip on developer mode, add the URL, and the score card renders as an interactive widget right inside the chat.',
    time: '~1 minute',
    href: '/use-with-chatgpt',
  },
];

export default function UseWithAIPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Use RemodelerIQ With Your AI — Claude, ChatGPT & More"
        description={`Add the free RemodelerIQ connector to Claude or ChatGPT so your AI can score a contractor's bid against real 2026 cost data instead of guessing. Read-only, no signup. First ${FREE_TOTAL_ANALYSES} analyses free.`}
        path="/use-with-ai"
        keywords="RemodelerIQ MCP connector, AI contractor bid check, Claude ChatGPT contractor quote, MCP server remodeling costs, connect AI bid analyzer"
      />
      <FAQSchema faqs={AI_FAQS} />
      <BreadcrumbSchema items={BREADCRUMBS.useWithAI} />
      <Header />

      <main className="px-4 pb-16 pt-24">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700">
              Free connector · no signup
            </span>
            <h1 className="mb-4 mt-5 text-3xl font-bold text-navy-900 md:text-5xl">
              Use RemodelerIQ inside your AI
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-navy-600">
              Ask Claude or ChatGPT whether a contractor's bid is fair and you'll get a
              confident answer built on national averages. Add the RemodelerIQ connector
              and you get a checked one instead — the same bid scored 0–100 against wage
              data for your metro, with every risky term flagged by rule.
            </p>
          </div>

          <div className="mb-12">
            <EndpointBox location="use_with_ai_hero" />
            <p className="mt-3 text-center text-sm text-navy-500">
              One URL. Paste it into whichever assistant you use.
            </p>
          </div>

          {/* Pick your assistant */}
          <section className="mb-12">
            <h2 className="mb-6 text-center text-2xl font-bold text-navy-900">
              Pick your assistant
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {PATHS.map((p) => (
                <Link
                  key={p.name}
                  to={p.href}
                  className="card-glass group flex flex-col p-6 transition-all hover:border-emerald-400 hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-navy-900">{p.name}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-navy-600">
                      {p.time}
                    </span>
                  </div>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-navy-600">{p.blurb}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                    Full walkthrough
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Both sets of steps, side by side on desktop */}
          <section className="mb-12">
            <h2 className="mb-2 text-center text-2xl font-bold text-navy-900">
              Or set it up right here
            </h2>
            <p className="mx-auto mb-7 max-w-xl text-center text-navy-600">
              Both paths end in the same place: your assistant calling the real analyzer
              instead of guessing.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card-glass p-6">
                <h3 className="mb-5 text-lg font-bold text-navy-900">In Claude</h3>
                <StepList steps={CLAUDE_STEPS} />
              </div>
              <div className="card-glass p-6">
                <h3 className="mb-5 text-lg font-bold text-navy-900">In ChatGPT</h3>
                <StepList steps={CHATGPT_STEPS} />
              </div>
            </div>
          </section>

          {/* Tools */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Zap className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-navy-900">
                  What your assistant gains
                </h2>
                <p className="text-navy-600">
                  Five read-only tools, backed by Bureau of Labor Statistics wages, Zonda
                  Cost vs. Value 2026 benchmarks, and Houzz cost guides.
                </p>
              </div>
            </div>
            <ToolTable />
          </section>

          {/* Prompts */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Sparkles className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-navy-900">Things to ask</h2>
                <p className="text-navy-600">
                  Talk to your assistant normally — it decides when to call RemodelerIQ.
                </p>
              </div>
            </div>
            <PromptIdeas />
          </section>

          {/* Other clients */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-navy-100">
                <Terminal className="h-6 w-6 text-navy-700" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-bold text-navy-900">
                  Cursor, VS Code, and everything else
                </h2>
                <p className="mb-3 text-navy-600">
                  Any MCP-capable client can use the same endpoint. Our{' '}
                  <a href="/connect/" className="text-emerald-700 underline hover:text-emerald-800">
                    developer setup page
                  </a>{' '}
                  has one-click install links for Cursor and VS Code, the JSON config for
                  Claude Desktop and Claude Code, and notes on the WebMCP tools this site
                  publishes to AI browsers.
                </p>
                <p className="text-navy-600">
                  RemodelerIQ is listed in the{' '}
                  <a
                    href="https://registry.modelcontextprotocol.io/"
                    rel="nofollow noopener noreferrer"
                    target="_blank"
                    className="text-emerald-700 underline hover:text-emerald-800"
                  >
                    official MCP Registry
                  </a>{' '}
                  and on{' '}
                  <a
                    href="https://smithery.ai/server/gustavo-atar/remodeleriq"
                    rel="nofollow noopener noreferrer"
                    target="_blank"
                    className="text-emerald-700 underline hover:text-emerald-800"
                  >
                    Smithery
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section className="card-glass mb-12 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-navy-100">
                <ShieldCheck className="h-6 w-6 text-navy-700" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-bold text-navy-900">
                  Read-only, and no account required
                </h2>
                <p className="mb-3 text-navy-600">
                  All five tools are read-only. Nothing can be created, changed, or
                  deleted, there is no login step, and RemodelerIQ has no access to your
                  assistant account or your conversation history. Your assistant sends a
                  bid when you ask for an analysis, and gets a result back.
                </p>
                <p className="text-navy-600">
                  The raw text of your bid is not retained. We keep the structured result —
                  project type, region, totals, which flags fired — to sharpen the
                  benchmarks, after stripping names, addresses, phone numbers, and email
                  addresses. Details are in our{' '}
                  <Link to="/privacy" className="text-emerald-700 underline hover:text-emerald-800">
                    privacy policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

          <NoSetupCTA location="use_with_ai" />

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="mb-6 text-center text-2xl font-bold text-navy-900">
              Connector questions, answered
            </h2>
            <div className="space-y-4">
              {AI_FAQS.map((faq) => (
                <div key={faq.question} className="card-glass p-6">
                  <h3 className="mb-2 font-semibold text-navy-900">{faq.question}</h3>
                  <p className="text-sm leading-relaxed text-navy-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related */}
          <section className="text-center text-sm text-navy-500">
            <p>
              Weighing it up first?{' '}
              <Link to="/vs/chatgpt" className="font-medium text-emerald-700 hover:underline">
                RemodelerIQ vs ChatGPT, compared
              </Link>{' '}
              ·{' '}
              <Link to="/how-we-score" className="font-medium text-emerald-700 hover:underline">
                how the 0–100 score works
              </Link>{' '}
              ·{' '}
              <Link to="/labor-rates" className="font-medium text-emerald-700 hover:underline">
                labor rates in your metro
              </Link>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
