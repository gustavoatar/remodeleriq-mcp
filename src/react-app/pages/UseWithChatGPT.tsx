import PageSEO from '@/react-app/components/PageSEO';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import FAQSchema, { FAQItem } from '@/react-app/components/FAQSchema';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import { Link } from 'react-router';
import { ShieldCheck, Sparkles, Zap, LayoutGrid } from 'lucide-react';
import {
  CHATGPT_STEPS,
  EndpointBox,
  StepList,
  ToolTable,
  PromptIdeas,
  NoSetupCTA,
} from '@/react-app/components/AiConnect';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

const CHATGPT_FAQS: FAQItem[] = [
  {
    question: 'Can ChatGPT check a contractor bid on its own?',
    answer:
      'It can read one and give useful general feedback, and about half of US homeowners already do exactly that. What it cannot do unaided is check the numbers — it has no wage table for your metro, no 2026 regional benchmarks, and no fixed red-flag rules, so its price verdict is a plausible-sounding guess. Connecting RemodelerIQ gives it the missing data and rules.',
  },
  {
    question: 'Why do I have to turn on developer mode?',
    answer:
      'Developer mode is how ChatGPT lets you add an MCP connector that is not yet in the plugin directory. The directory is curated by OpenAI, so listing there takes review; developer mode works today and takes about a minute. Once RemodelerIQ is listed, the extra step goes away.',
  },
  {
    question: 'Do I need ChatGPT Plus or a Business account?',
    answer:
      'Adding a custom connector through developer mode works on standard ChatGPT accounts. It is separate from building a GPT — as of early 2026 new GPT creation is limited to Business, Enterprise, and Edu workspaces, but that restriction does not apply to connectors.',
  },
  {
    question: 'Does the score card show up inside the chat?',
    answer:
      'Yes. RemodelerIQ ships an interactive widget with its results, so ChatGPT renders the score, the flagged terms, and the side-by-side comparison inline rather than as a wall of text. Every response also carries a link back to the full interactive report on remodeleriq.com.',
  },
  {
    question: 'What does RemodelerIQ do with a bid I paste into ChatGPT?',
    answer:
      'It analyzes it and returns the result. The raw bid text is not retained. The structured outcome — project type, region, dollar totals, and which risk flags fired — is kept to sharpen the benchmarks, after names, addresses, phone numbers, and email addresses are stripped out.',
  },
  {
    question: 'How many free analyses do I get?',
    answer: `Three per 48 hours, with no signup and no credit card. After that ChatGPT receives a message pointing to the paid plans, which remove the cap and let you re-score each revised bid as you negotiate.`,
  },
];

export default function UseWithChatGPTPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Use RemodelerIQ with ChatGPT — Add the Free Bid-Check Connector"
        description={`Connect RemodelerIQ to ChatGPT in three steps so it can score a contractor's bid against real 2026 cost data instead of guessing. Free, read-only, no signup. First ${FREE_TOTAL_ANALYSES} analyses free.`}
        path="/use-with-chatgpt"
        keywords="RemodelerIQ ChatGPT connector, ChatGPT MCP contractor bid, ChatGPT custom connector developer mode, ChatGPT check contractor quote, ChatGPT remodeling cost estimate"
      />
      <FAQSchema faqs={CHATGPT_FAQS} />
      <BreadcrumbSchema items={BREADCRUMBS.useWithChatgpt} />
      <Header />

      <main className="px-4 pb-16 pt-24">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700">
              Free connector · about a minute
            </span>
            <h1 className="mb-4 mt-5 text-3xl font-bold text-navy-900 md:text-5xl">
              Use RemodelerIQ with ChatGPT
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-navy-600">
              Half of US homeowners already paste contractor estimates into ChatGPT. The
              instinct is right; the data underneath it isn't there. Connect RemodelerIQ
              and the same conversation gets a real audit — scored 0–100 against wage data
              for your metro, with the risky terms flagged by rule and a score card drawn
              right inside the chat.
            </p>
          </div>

          {/* Endpoint front and center */}
          <div className="mb-10">
            <EndpointBox location="use_with_chatgpt_hero" />
          </div>

          {/* Three steps */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <h2 className="mb-6 text-2xl font-bold text-navy-900">Add it in three steps</h2>
            <StepList steps={CHATGPT_STEPS} />
            <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-navy-700">
              <strong>Why developer mode?</strong> It's how ChatGPT accepts a connector
              that isn't in the curated plugin directory yet. Nothing about the connector
              is experimental — the switch is just where OpenAI puts custom MCP servers
              until they're listed.
            </p>
          </section>

          {/* Widget callout — ChatGPT-specific differentiator */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <LayoutGrid className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-bold text-navy-900">
                  You get the score card, not a wall of text
                </h2>
                <p className="mb-3 text-navy-600">
                  RemodelerIQ ships an interactive widget alongside its results, so ChatGPT
                  draws the score, the flagged terms, and the per-trade breakdown as a real
                  card in the conversation. Hand it two competing estimates and you get the
                  side-by-side comparison in the same place.
                </p>
                <p className="text-navy-600">
                  Every response also carries a link back to the full interactive report on
                  remodeleriq.com, where you can export a shareable PDF to put in front of
                  your contractor.
                </p>
              </div>
            </div>
          </section>

          {/* What ChatGPT gains */}
          <section className="card-glass mb-10 p-6 md:p-8">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Zap className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-navy-900">
                  What ChatGPT can do once it's connected
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
                  Talk to ChatGPT normally — it decides when to call RemodelerIQ.
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
                  Every RemodelerIQ tool is <strong>read-only</strong>. It answers questions
                  about bids and costs; it cannot create, change, or delete anything, and it
                  has no access to your ChatGPT account or your other conversations. There
                  is no login and no authentication step, because there is nothing to log
                  into.
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

          <NoSetupCTA location="use_with_chatgpt" />

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="mb-6 text-center text-2xl font-bold text-navy-900">
              Questions about the ChatGPT connector
            </h2>
            <div className="space-y-4">
              {CHATGPT_FAQS.map((faq) => (
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
              <Link to="/use-with-claude" className="font-medium text-emerald-700 hover:underline">
                Set it up in Claude
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
              Weighing it up first?{' '}
              <Link to="/chat-gpt-plugin" className="font-medium text-emerald-700 hover:underline">
                what the plugin does
              </Link>{' '}
              ·{' '}
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
