import PageSEO from '@/react-app/components/PageSEO';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import FAQSchema, { FAQItem } from '@/react-app/components/FAQSchema';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import { Link } from 'react-router';
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  MinusCircle,
  Bot,
  ShieldCheck,
  BarChart3,
  FileText,
} from 'lucide-react';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

const BRAND = '#1F9C4C';

function trackVsAnalyze(location: string) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.('event', 'vs_chatgpt_analyze_click', { location });
}

// 'yes' → green check, 'no' → red x, 'partial' → neutral dash
type Cell = { mark: 'yes' | 'no' | 'partial'; note: string };

interface CompareRow {
  dimension: string;
  chatgpt: Cell;
  remodeleriq: Cell;
}

const COMPARE_ROWS: CompareRow[] = [
  {
    dimension: 'Local cost data for your metro',
    chatgpt: { mark: 'no', note: 'Answers from training data and national averages' },
    remodeleriq: { mark: 'yes', note: 'BLS wage data by trade and metro, Zonda Cost vs. Value 2026, Houzz cost guides' },
  },
  {
    dimension: 'Structured score',
    chatgpt: { mark: 'no', note: 'An open-ended chat answer' },
    remodeleriq: { mark: 'yes', note: '0–100 score weighted across contract risk (40%), price (30%), scope (30%)' },
  },
  {
    dimension: 'Documented red-flag rules',
    chatgpt: { mark: 'partial', note: 'Mentions whatever comes to mind that session' },
    remodeleriq: { mark: 'yes', note: 'Fixed taxonomy: deposit >50% flag, unpriced allowances, vague scope, missing line items' },
  },
  {
    dimension: 'Same bid → same verdict',
    chatgpt: { mark: 'no', note: 'Can give a different answer each time you ask' },
    remodeleriq: { mark: 'yes', note: 'Deterministic scoring rules, published methodology' },
  },
  {
    dimension: 'Contractor verification',
    chatgpt: { mark: 'no', note: 'Cannot check licenses or cross-reference reviews' },
    remodeleriq: { mark: 'yes', note: 'License lookup, BBB and review cross-check (Trusted Radar)' },
  },
  {
    dimension: 'A report you can act on',
    chatgpt: { mark: 'no', note: 'A chat transcript' },
    remodeleriq: { mark: 'yes', note: 'Shareable PDF report plus negotiation talking points' },
  },
  {
    dimension: 'Brainstorming & general advice',
    chatgpt: { mark: 'yes', note: 'Excellent — ideas, terminology, what to ask' },
    remodeleriq: { mark: 'partial', note: 'Focused on one job: auditing the bid in front of you' },
  },
  {
    dimension: 'Price',
    chatgpt: { mark: 'yes', note: 'Free (Plus ~$20/mo)' },
    remodeleriq: { mark: 'yes', note: `First ${FREE_TOTAL_ANALYSES} analyses free; passes from $19.99/mo, $39.99/3mo, $99.99 lifetime` },
  },
];

const VS_FAQS: FAQItem[] = [
  {
    question: 'Can ChatGPT analyze a contractor bid?',
    answer:
      'It can read one and give useful general feedback — and half of US homeowners already do this. What it cannot do is check the numbers: it has no wage table for your metro, no 2026 regional project benchmarks, and no fixed red-flag rules, so its price verdict is an educated guess based on national averages. Use it for questions and ideas; use a grounded tool to verify the dollars.',
  },
  {
    question: 'Is ChatGPT accurate about renovation costs?',
    answer:
      'Sometimes, by coincidence. Remodeling costs are intensely local — the same bathroom remodel can differ by thousands between metros, and labor rates swing hard by trade and region. A general chatbot answers from training data and national averages, and it can give a different answer to the same question asked twice. Grounded tools check against current local data instead: BLS wages by metro, Zonda Cost vs. Value 2026, and Houzz cost guides.',
  },
  {
    question: 'Should I use ChatGPT or RemodelerIQ to check a quote?',
    answer:
      'Both, for different jobs. ChatGPT is great for understanding terms, brainstorming questions, and drafting messages to your contractor. RemodelerIQ does one job ChatGPT structurally can’t: audit the bid against local market data and documented red-flag rules, and return a consistent 0–100 score with negotiation talking points.',
  },
  {
    question: 'Does RemodelerIQ use AI too?',
    answer:
      'Yes — the difference is grounding, not AI vs. no AI. RemodelerIQ uses AI to read your bid, then checks it against named data sources (BLS OEWS wages, Zonda Cost vs. Value 2026, Houzz, FRED material indices) and fixed scoring rules published on our How We Score page. Same technology, plus the data and rules that make the answer checkable.',
  },
  {
    question: 'Is RemodelerIQ free like ChatGPT?',
    answer: `Your first ${FREE_TOTAL_ANALYSES} bid analyses are free with no signup and no credit card. Unlimited passes cost $19.99/month, $39.99 per 3 months, or $99.99 once for lifetime access.`,
  },
  {
    question: 'Is RemodelerIQ independent from contractors?',
    answer:
      'Yes. RemodelerIQ takes no referral or lead-generation fees from contractors, so the analysis answers to the homeowner only. That matters: most home-improvement platforms make their money from contractors, which is exactly why none of them will audit a contractor’s bid.',
  },
];

function MarkIcon({ mark }: { mark: Cell['mark'] }) {
  if (mark === 'yes') return <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
  if (mark === 'no') return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
  return <MinusCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
}

export default function VsChatGPTPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="RemodelerIQ vs ChatGPT: Which Should Check Your Contractor Bid?"
        description={`52% of homeowners already paste contractor bids into ChatGPT. Honest comparison: where ChatGPT genuinely helps, where it guesses, and how a grounded audit against BLS wages and Zonda 2026 benchmarks differs. First ${FREE_TOTAL_ANALYSES} analyses free.`}
        path="/vs/chatgpt"
        keywords="RemodelerIQ vs ChatGPT, ChatGPT contractor bid, ChatGPT contractor estimate, AI check contractor quote, ChatGPT renovation costs accurate"
      />
      <FAQSchema faqs={VS_FAQS} />
      <BreadcrumbSchema items={BREADCRUMBS.vsChatgpt} />
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero + TL;DR */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-navy-900 mb-4">
              RemodelerIQ vs ChatGPT<span className="block text-2xl md:text-3xl mt-2 text-navy-600 font-semibold">for checking a contractor bid</span>
            </h1>
            <p className="text-lg text-navy-600 max-w-2xl mx-auto leading-relaxed">
              <strong>TL;DR:</strong> ChatGPT is genuinely useful for renovation questions — and 52% of US homeowners
              already use AI to double-check contractor estimates (Acorn Finance, Jan 2026). But on the question that costs you money,
              a general chatbot <em>guesses</em>: it has no local wage data, no 2026 project benchmarks, and no fixed
              red-flag rules. RemodelerIQ <em>checks</em> — same bid, audited against BLS wages and Zonda benchmarks
              for your metro, scored 0–100, every time.
            </p>
          </div>

          {/* At-a-glance table */}
          <section className="card-glass p-4 md:p-6 mb-12">
            <h2 className="text-2xl font-bold text-navy-900 mb-4 text-center">At a glance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b-2 border-navy-200 text-left">
                    <th className="py-3 pr-3 text-navy-900 font-semibold w-1/4">What matters</th>
                    <th className="py-3 pr-3 text-navy-900 font-semibold">ChatGPT</th>
                    <th className="py-3 text-navy-900 font-semibold">RemodelerIQ</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.dimension} className="border-b border-navy-100 align-top">
                      <td className="py-3 pr-3 font-medium text-navy-800">{row.dimension}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-start gap-2">
                          <MarkIcon mark={row.chatgpt.mark} />
                          <span className="text-navy-600">{row.chatgpt.note}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-start gap-2">
                          <MarkIcon mark={row.remodeleriq.mark} />
                          <span className="text-navy-600">{row.remodeleriq.note}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Where ChatGPT shines — honesty section */}
          <section className="card-glass p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-navy-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">Where ChatGPT genuinely shines</h2>
                <p className="text-navy-600 mb-3">
                  Let's be fair: pasting your estimate into ChatGPT is a good instinct, and the numbers say
                  homeowners love it — 78% say AI reduces project stress. It's excellent at explaining unfamiliar
                  terms ("what's a scope allowance?"), brainstorming what to ask before you sign, drafting a
                  polite pushback email, and giving you the general shape of a renovation project.
                </p>
                <p className="text-navy-600">
                  If your question is <em>"help me understand this,"</em> ChatGPT is a great answer.
                  The problem starts when the question is <em>"is this number fair for my ZIP code?"</em>
                </p>
              </div>
            </div>
          </section>

          {/* Deep dives */}
          <section className="card-glass p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">The pricing question: guessing vs. checking</h2>
                <p className="text-navy-600 mb-3">
                  Remodeling costs are intensely local. Labor is the biggest line on most bids, and trade wages
                  swing hard between metros — which is why a "national average" answer can bless an inflated bid
                  or condemn a fair one. ChatGPT has no wage table. It answers from training data, which means
                  plausible-sounding numbers with nothing underneath them.
                </p>
                <p className="text-navy-600">
                  RemodelerIQ checks the same bid against <strong>Bureau of Labor Statistics OEWS wages</strong> for
                  each trade in your metro, <strong>Zonda Cost vs. Value 2026</strong> project benchmarks,{' '}
                  <strong>Houzz cost guides</strong>, and FRED material price indices. When the analysis says your
                  labor line is 25% above market, that claim has a source you can cite to your contractor — which is
                  what makes it negotiating leverage instead of a vibe.
                </p>
              </div>
            </div>
          </section>

          <section className="card-glass p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">Consistency, rules, and something to show for it</h2>
                <p className="text-navy-600 mb-3">
                  Ask ChatGPT about the same bid twice and you can get two different answers — there are no fixed
                  rules deciding what gets flagged. RemodelerIQ scores every bid with the same documented rulebook:
                  deposits over 50% are flagged (industry standard is 10–33%), unpriced allowances are flagged,
                  vague scope language is penalized, missing line items (permits, disposal, prep) are called out.
                  The weights are public: contract risk 40%, price 30%, scope completeness 30% — all on our{' '}
                  <Link to="/how-we-score" className="text-emerald-700 underline hover:text-emerald-800">How We Score</Link> page.
                </p>
                <p className="text-navy-600">
                  You also end with an artifact: a scored PDF report and negotiation talking points you can send to
                  your spouse or put in front of the contractor — not a chat transcript.
                </p>
              </div>
            </div>
          </section>

          <section className="card-glass p-6 md:p-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">The contractor behind the bid</h2>
                <p className="text-navy-600">
                  A fair price from the wrong contractor is still a bad deal — and a chatbot can't verify anyone.
                  RemodelerIQ's <Link to="/trusted-radar" className="text-emerald-700 underline hover:text-emerald-800">Trusted Radar</Link>{' '}
                  checks license status and cross-references reviews and BBB records. And because RemodelerIQ takes
                  no referral fees from contractors, the analysis answers to exactly one person: you.
                </p>
              </div>
            </div>
          </section>

          {/* Who each is best for */}
          <section className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="card-glass p-6 border-2 border-navy-200">
              <h2 className="text-xl font-bold text-navy-900 mb-3">Use ChatGPT when…</h2>
              <ul className="space-y-2 text-sm text-navy-600">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You want to understand renovation terms and processes</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You're brainstorming questions to ask before signing</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You need help drafting a message to your contractor</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You want general project guidance and ideas</li>
              </ul>
            </div>
            <div className="card-glass p-6 border-2 border-emerald-400 bg-emerald-50/40">
              <h2 className="text-xl font-bold text-navy-900 mb-3">Use RemodelerIQ when…</h2>
              <ul className="space-y-2 text-sm text-navy-700">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />There's a real bid in front of you and real money at stake</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You want the price checked against your metro's actual data</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You want deposit terms, allowances, and scope gaps flagged by rule</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You want a scored report and talking points to negotiate with</li>
              </ul>
            </div>
          </section>

          {/* Don't switch — stack */}
          <section className="card-glass p-6 md:p-8 mb-12 border-2 border-navy-200">
            <h2 className="text-2xl font-bold text-navy-900 mb-3">You don't have to pick a side</h2>
            <p className="text-navy-600 mb-3">
              This isn't a "cancel ChatGPT" pitch. Keep using it — it's where half of homeowners already start.
              The workflow that works: explore and learn in ChatGPT, then run the actual bid through RemodelerIQ
              before you sign anything.
            </p>
            <p className="text-navy-600">
              We're also building for a future where you don't leave the chat at all: RemodelerIQ runs a live{' '}
              <a href="https://remodeleriq.com/llms.txt" className="text-emerald-700 underline hover:text-emerald-800">agent-accessible</a>{' '}
              MCP server, so AI assistants can call our bid analysis directly. Ask your AI to check a bid,
              and the grounded answer can come from us.
            </p>
          </section>

          {/* CTA band */}
          <section className="rounded-2xl p-8 md:p-10 text-center text-white mb-14" style={{ backgroundColor: BRAND }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Put your bid through the grounded version</h2>
            <p className="text-emerald-50 mb-6 max-w-xl mx-auto">
              Upload the same estimate you'd paste into ChatGPT. Get a 0–100 score, every red flag,
              and a local price comparison — checked, not guessed.
            </p>
            <Link
              to="/?view=upload"
              onClick={() => trackVsAnalyze('cta_band')}
              className="inline-flex items-center gap-2 bg-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105"
              style={{ color: BRAND }}
            >
              Analyze My Bid Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-emerald-100 text-sm mt-4">
              First {FREE_TOTAL_ANALYSES} analyses free · no signup · no credit card
            </p>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-navy-900 mb-6 text-center">ChatGPT vs RemodelerIQ, asked and answered</h2>
            <div className="space-y-4">
              {VS_FAQS.map((faq) => (
                <div key={faq.question} className="card-glass p-6">
                  <h3 className="font-semibold text-navy-900 mb-2">{faq.question}</h3>
                  <p className="text-navy-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related */}
          <section className="text-center text-sm text-navy-500">
            <p>
              Keep going:{' '}
              <Link to="/is-my-contractor-quote-fair" className="text-emerald-700 font-medium hover:underline">the 5 checks for a fair quote</Link>,{' '}
              <Link to="/how-we-score" className="text-emerald-700 font-medium hover:underline">our full scoring methodology</Link>, or{' '}
              <Link to="/labor-rates" className="text-emerald-700 font-medium hover:underline">look up labor rates in your metro</Link>.
            </p>
            <p className="mt-2">
              More comparisons:{' '}
              <Link to="/vs/bidcompare-ai" className="text-emerald-700 font-medium hover:underline">vs BidCompareAI</Link>{' '}·{' '}
              <Link to="/vs/estimatehawk" className="text-emerald-700 font-medium hover:underline">vs EstimateHawk</Link>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
