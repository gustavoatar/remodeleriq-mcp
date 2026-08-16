import PageSEO from '@/react-app/components/PageSEO';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import FAQSchema, { FAQItem } from '@/react-app/components/FAQSchema';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import { Link } from 'react-router';
import { ShieldCheck, Sparkles, Zap } from 'lucide-react';
import {
  CLAUDE_STEPS,
  EndpointBox,
  StepList,
  ToolTable,
  PromptIdeas,
  NoSetupCTA,
} from '@/react-app/components/AiConnect';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

const CLAUDE_FAQS: FAQItem[] = [
  {
    question: 'Do I need a paid Claude plan to add RemodelerIQ?',
    answer:
      'No. Custom connectors work on Claude Free, Pro, Max, Team, and Enterprise. Free accounts are limited to one custom connector, so if RemodelerIQ is your only one you are fine. Team and Enterprise plans need an Owner to add it once for the organization, after which every member can switch it on.',
  },
  {
    question: 'Is RemodelerIQ in the official Claude connector directory?',
    answer:
      'Not yet — the directory is curated by Anthropic. RemodelerIQ is added as a custom connector, which takes about thirty seconds and works identically once connected. You paste the URL yourself instead of clicking an entry in a list.',
  },
  {
    question: 'Does connecting RemodelerIQ give it access to my Claude conversations?',
    answer:
      'No. A connector works the other way around: Claude calls out to RemodelerIQ only when it needs a bid analyzed, a cost estimate, or a labor rate, and only sends the text it needs for that call. RemodelerIQ has no access to your chat history, your account, or anything else in Claude. Every tool is read-only — nothing can be created, changed, or deleted.',
  },
  {
    question: 'What does RemodelerIQ keep from a bid I analyze in Claude?',
    answer:
      'The structured result — project type, region, dollar totals, and which risk flags fired — is kept to improve the benchmarks. The raw bid text is not retained, and identifying details like names, addresses, phone numbers, and email addresses are stripped before anything is stored.',
  },
  {
    question: 'How many bids can I analyze for free through Claude?',
    answer: `Three analyses per 48 hours, no signup and no credit card. Past that, Claude gets a message pointing to the paid plans, which remove the limit and let you re-score every revised bid as you negotiate.`,
  },
  {
    question: 'It says the connector cannot be reached. What now?',
    answer:
      'Check the URL is exactly https://remodeleriq.com/mcp with no trailing slash. Claude connects from Anthropic\'s cloud infrastructure rather than your own machine, so a corporate VPN or firewall on your end will not block it — but a typo in the URL will. Removing the connector and re-adding it clears most problems, since connectors cannot be edited in place.',
  },
];

export default function UseWithClaudePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Use RemodelerIQ with Claude — Add the Free Bid-Check Connector"
        description={`Add RemodelerIQ to Claude in three steps and ask it whether a contractor's bid is fair. Free custom MCP connector, works on every Claude plan, read-only, no signup. First ${FREE_TOTAL_ANALYSES} analyses free.`}
        path="/use-with-claude"
        keywords="RemodelerIQ Claude connector, Claude MCP contractor bid, add custom connector Claude, Claude check contractor quote, Claude remodeling cost"
      />
      <FAQSchema faqs={CLAUDE_FAQS} />
      <BreadcrumbSchema items={BREADCRUMBS.useWithClaude} />
      <Header />

      <main className="px-4 pb-16 pt-24">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700">
              Free connector · 30 seconds
            </span>
            <h1 className="mb-4 mt-5 text-3xl font-bold text-navy-900 md:text-5xl">
              Use RemodelerIQ with Claude
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-navy-600">
              Paste a contractor's bid into Claude and ask if the price is fair. With the
              RemodelerIQ connector switched on, Claude stops guessing from national
              averages and instead runs your bid through the real analyzer — scored 0–100
              against wage data for your metro, with every risky term flagged by rule.
            </p>
          </div>

          {/* Endpoint front and center */}
          <div className="mb-10">
            <EndpointBox location="use_with_claude_hero" />
          </div>

          {/* Three steps */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <h2 className="mb-6 text-2xl font-bold text-navy-900">Add it in three steps</h2>
            <StepList steps={CLAUDE_STEPS} />
            <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-navy-600">
              Claude connects to RemodelerIQ from Anthropic's servers, not from your
              computer — so this works the same on claude.ai, the desktop app, and mobile.
              Add it once and it follows you everywhere you use Claude.
            </p>
          </section>

          {/* What Claude gains */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Zap className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-navy-900">
                  What Claude can do once it's connected
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
                  Talk to Claude normally — it decides when to call RemodelerIQ.
                </p>
              </div>
            </div>
            <PromptIdeas />
          </section>

          {/* Privacy */}
          <section className="card-glass mb-12 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-navy-100">
                <ShieldCheck className="h-6 w-6 text-navy-700" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-bold text-navy-900">
                  What this connector can and can't do
                </h2>
                <p className="mb-3 text-navy-600">
                  Every RemodelerIQ tool is <strong>read-only</strong>. The connector can
                  answer questions about bids and costs; it cannot create, change, or
                  delete anything, and it has no access to your Claude account or your
                  conversation history. Claude sends it a bid when you ask for an
                  analysis, and nothing else.
                </p>
                <p className="text-navy-600">
                  On our side, the raw text of your bid is not retained. We keep the
                  structured result — project type, region, totals, which flags fired — to
                  sharpen the benchmarks, after stripping names, addresses, phone numbers,
                  and email addresses. Details are in our{' '}
                  <Link to="/privacy" className="text-emerald-700 underline hover:text-emerald-800">
                    privacy policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

          <NoSetupCTA location="use_with_claude" />

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="mb-6 text-center text-2xl font-bold text-navy-900">
              Questions about the Claude connector
            </h2>
            <div className="space-y-4">
              {CLAUDE_FAQS.map((faq) => (
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
              Using something else?{' '}
              <Link to="/use-with-chatgpt" className="font-medium text-emerald-700 hover:underline">
                Set it up in ChatGPT
              </Link>{' '}
              ·{' '}
              <Link to="/use-with-ai" className="font-medium text-emerald-700 hover:underline">
                see every assistant
              </Link>{' '}
              ·{' '}
              <a href="/connect/" className="font-medium text-emerald-700 hover:underline">
                Cursor, VS Code &amp; developer setup
              </a>
            </p>
            <p className="mt-2">
              Keep going:{' '}
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
