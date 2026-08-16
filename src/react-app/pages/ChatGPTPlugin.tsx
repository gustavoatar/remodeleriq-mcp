import PageSEO from '@/react-app/components/PageSEO';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import FAQSchema, { FAQItem } from '@/react-app/components/FAQSchema';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import { Link } from 'react-router';
import { ArrowRight, BarChart3, LayoutGrid, ShieldCheck, Sparkles } from 'lucide-react';
import {
  EndpointBox,
  ToolTable,
  PromptIdeas,
  NoSetupCTA,
} from '@/react-app/components/AiConnect';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

const PLUGIN_FAQS: FAQItem[] = [
  {
    question: 'Is there a RemodelerIQ plugin for ChatGPT?',
    answer:
      'Yes. RemodelerIQ runs a free Model Context Protocol (MCP) server that ChatGPT connects to as a custom connector. Once added, ChatGPT can score a contractor bid, compare several bids, look up 2026 project costs by city, and pull trade labor rates by state — without leaving the conversation.',
  },
  {
    question: 'What does the plugin actually do?',
    answer:
      'It replaces guesswork with a checked answer. On its own, ChatGPT answers renovation pricing questions from training data and national averages. The plugin runs the bid through the real RemodelerIQ analyzer: a 0–100 score weighted across contract risk, price realism, and scope completeness, with red flags fired by a documented rule set rather than whatever the model recalls that session.',
  },
  {
    question: 'How much does the plugin cost?',
    answer: `Nothing to connect, and no signup. Three bid analyses per 48 hours are free with no credit card. Past that ChatGPT receives a message pointing to the paid plans, which lift the cap and let you re-score each revised bid as you negotiate.`,
  },
  {
    question: 'Is it in the ChatGPT plugin directory?',
    answer:
      'Not yet — the directory is curated by OpenAI. You add RemodelerIQ yourself through developer mode, which takes about a minute and works identically once connected. The setup walkthrough covers each step.',
  },
  {
    question: 'Does the plugin show results as a card or as text?',
    answer:
      'As a card. RemodelerIQ ships an interactive widget with its results, so ChatGPT renders the score, the flagged terms, and the per-trade breakdown inline. Hand it two competing estimates and the side-by-side comparison appears in the same place. Every response also links back to the full interactive report.',
  },
  {
    question: 'Can the plugin change anything in my ChatGPT account?',
    answer:
      'No. All five tools are read-only — nothing can be created, changed, or deleted. There is no login and no authentication step. RemodelerIQ has no access to your account or to conversations where you have not asked for an analysis.',
  },
  {
    question: 'What happens to a bid I run through it?',
    answer:
      'The raw text is not retained. The structured result — project type, region, dollar totals, and which risk flags fired — is kept to sharpen the benchmarks, after names, addresses, phone numbers, and email addresses are stripped out.',
  },
];

export default function ChatGPTPluginPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="RemodelerIQ ChatGPT Plugin — Score a Contractor Bid Inside ChatGPT"
        description={`The free RemodelerIQ plugin gives ChatGPT a real bid analyzer: 0–100 score, red flags by rule, and 2026 costs for your metro instead of national averages. Read-only, no signup. First ${FREE_TOTAL_ANALYSES} analyses free.`}
        path="/chat-gpt-plugin"
        keywords="ChatGPT plugin contractor bid, RemodelerIQ ChatGPT plugin, ChatGPT remodeling plugin, ChatGPT construction estimate plugin, best ChatGPT plugin home renovation, ChatGPT MCP plugin"
      />
      <FAQSchema faqs={PLUGIN_FAQS} />
      <BreadcrumbSchema items={BREADCRUMBS.chatGptPlugin} />
      <Header />

      <main className="px-4 pb-16 pt-24">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700">
              Free plugin · read-only · no signup
            </span>
            <h1 className="mb-4 mt-5 text-3xl font-bold text-navy-900 md:text-5xl">
              The RemodelerIQ plugin for ChatGPT
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-navy-600">
              Ask ChatGPT whether a $48,000 kitchen bid is fair and it will answer
              confidently — from national averages, with no wage table for your metro and
              no fixed rules about what counts as a red flag. The RemodelerIQ plugin gives
              it the missing half: your bid, scored against real data, the same way every
              time.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/use-with-chatgpt"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1F9C4C] px-7 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-[#18813e]"
              >
                Setup walkthrough
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/?view=upload"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-7 py-3.5 text-base font-bold text-navy-700 transition-colors hover:border-[#1F9C4C] hover:text-[#1F9C4C]"
              >
                Try it on the web instead
              </Link>
            </div>
          </div>

          <div className="mb-12">
            <EndpointBox location="chatgpt_plugin_hero" />
            <p className="mt-3 text-center text-sm text-navy-500">
              Add this in ChatGPT under Settings → Apps &amp; Connectors.{' '}
              <Link to="/use-with-chatgpt" className="font-medium text-emerald-700 hover:underline">
                Full walkthrough →
              </Link>
            </p>
          </div>

          {/* Guessing vs checking */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <BarChart3 className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-bold text-navy-900">
                  What the plugin changes
                </h2>
                <p className="mb-3 text-navy-600">
                  Remodeling costs are intensely local. Labor is the biggest line on most
                  bids, and trade wages swing hard between metros — so a national-average
                  answer can bless an inflated bid or condemn a fair one. Ask the same
                  question twice without the plugin and you can get two different verdicts,
                  because nothing fixed decides what gets flagged.
                </p>
                <p className="text-navy-600">
                  With the plugin, ChatGPT checks your bid against{' '}
                  <strong>Bureau of Labor Statistics OEWS wages</strong> for each trade in
                  your metro, <strong>Zonda Cost vs. Value 2026</strong> benchmarks, and{' '}
                  <strong>Houzz cost guides</strong>. When it says your labor line runs 25%
                  above market, that claim has a source you can cite to your contractor —
                  which is what makes it leverage instead of a hunch.
                </p>
              </div>
            </div>
          </section>

          {/* Widget */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <LayoutGrid className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-bold text-navy-900">
                  Results render as a card, not a wall of text
                </h2>
                <p className="mb-3 text-navy-600">
                  The plugin ships an interactive score card, so ChatGPT draws the
                  confidence score, the top red flags, and the per-trade breakdown directly
                  in the conversation. Give it two competing estimates and you get the
                  side-by-side comparison — including which bid wins once scope gaps are
                  normalized out.
                </p>
                <p className="text-navy-600">
                  Every response carries a link back to the full interactive report on
                  remodeleriq.com, where you can export a shareable PDF to put in front of
                  your contractor.
                </p>
              </div>
            </div>
          </section>

          {/* Tools */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Sparkles className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-navy-900">
                  Everything the plugin adds
                </h2>
                <p className="text-navy-600">
                  Five read-only tools ChatGPT calls on its own, whenever your question
                  needs one.
                </p>
              </div>
            </div>
            <ToolTable />
          </section>

          {/* Prompts */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <h2 className="mb-2 text-2xl font-bold text-navy-900">Things to ask once it's on</h2>
            <p className="mb-5 text-navy-600">
              No special syntax — talk normally and ChatGPT decides when to call the plugin.
            </p>
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
                  Read-only, and there's nothing to log into
                </h2>
                <p className="mb-3 text-navy-600">
                  All five tools are read-only, so the plugin cannot create, change, or
                  delete anything. There is no account and no authentication step. It has
                  no access to your ChatGPT account or to conversations where you have not
                  asked for an analysis.
                </p>
                <p className="text-navy-600">
                  The raw text of your bid is not retained. The structured result is kept
                  to sharpen the benchmarks, after names, addresses, phone numbers, and
                  email addresses are stripped. Details are in our{' '}
                  <Link to="/privacy" className="text-emerald-700 underline hover:text-emerald-800">
                    privacy policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

          <NoSetupCTA location="chatgpt_plugin" />

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="mb-6 text-center text-2xl font-bold text-navy-900">
              ChatGPT plugin questions
            </h2>
            <div className="space-y-4">
              {PLUGIN_FAQS.map((faq) => (
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
              Next:{' '}
              <Link to="/use-with-chatgpt" className="font-medium text-emerald-700 hover:underline">
                install it in ChatGPT
              </Link>{' '}
              ·{' '}
              <Link to="/use-with-claude" className="font-medium text-emerald-700 hover:underline">
                the Claude version
              </Link>{' '}
              ·{' '}
              <Link to="/use-with-ai" className="font-medium text-emerald-700 hover:underline">
                every assistant
              </Link>
            </p>
            <p className="mt-2">
              Weighing it up:{' '}
              <Link to="/vs/chatgpt" className="font-medium text-emerald-700 hover:underline">
                RemodelerIQ vs ChatGPT, compared
              </Link>{' '}
              ·{' '}
              <Link to="/how-we-score" className="font-medium text-emerald-700 hover:underline">
                how the 0–100 score works
              </Link>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
