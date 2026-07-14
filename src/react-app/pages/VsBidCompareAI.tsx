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
  Scale,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

const BRAND = '#1F9C4C';

function trackVsAnalyze(location: string) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.('event', 'vs_bidcompareai_analyze_click', { location });
}

type Cell = { mark: 'yes' | 'no' | 'partial'; note: string };

interface CompareRow {
  dimension: string;
  competitor: Cell;
  remodeleriq: Cell;
}

const COMPARE_ROWS: CompareRow[] = [
  {
    dimension: 'Price',
    competitor: { mark: 'yes', note: 'Free, no signup' },
    remodeleriq: { mark: 'yes', note: `First ${FREE_TOTAL_ANALYSES} analyses free; passes from $19.99/mo, $39.99/3mo, $99.99 lifetime` },
  },
  {
    dimension: 'Analyzes a single bid',
    competitor: { mark: 'no', note: 'Comparison tool — built around uploading up to 4 bids' },
    remodeleriq: { mark: 'yes', note: '0–100 audit of the one bid in your hand (multi-bid comparison too)' },
  },
  {
    dimension: 'How results arrive',
    competitor: { mark: 'partial', note: 'Emailed spreadsheet, summary slides, and report' },
    remodeleriq: { mark: 'yes', note: 'Interactive results on screen in ~1 minute, plus a PDF report' },
  },
  {
    dimension: 'Published data methodology',
    competitor: { mark: 'no', note: 'Cost-data sources not published' },
    remodeleriq: { mark: 'yes', note: 'Named sources: BLS OEWS wages, Zonda Cost vs. Value 2026, Houzz, FRED — methodology public' },
  },
  {
    dimension: 'Contract-risk scoring',
    competitor: { mark: 'partial', note: 'Flags scope inconsistencies, missing items, unrealistic pricing' },
    remodeleriq: { mark: 'yes', note: 'Contract terms are 40% of the score: deposit traps (>50% flagged), allowances, vague scope, payment schedule' },
  },
  {
    dimension: 'Contractor verification',
    competitor: { mark: 'no', note: 'Not offered' },
    remodeleriq: { mark: 'yes', note: 'License lookup plus review and BBB cross-check (Trusted Radar)' },
  },
  {
    dimension: 'Business model',
    competitor: { mark: 'partial', note: 'Operated by GreatBuildz, a contractor-matching service; the free tool feeds its matching funnel' },
    remodeleriq: { mark: 'yes', note: 'Homeowner subscriptions only — no contractor referral or lead-gen revenue' },
  },
  {
    dimension: 'Press coverage',
    competitor: { mark: 'yes', note: 'Real earned media: WTOP, syndicated "Housing Scene" column, Homes & Gardens AI roundup' },
    remodeleriq: { mark: 'no', note: 'Honestly? Not yet. We compete on methodology, not press clippings' },
  },
];

const VS_FAQS: FAQItem[] = [
  {
    question: 'Is BidCompareAI really free?',
    answer:
      'Yes — genuinely free with no signup, and that makes it a reasonable way to get a quick comparison of multiple bids. It is operated by GreatBuildz, a contractor-matching service, so the free tool sits at the top of a funnel whose business is connecting homeowners with contractors.',
  },
  {
    question: 'Can BidCompareAI analyze just one bid?',
    answer:
      'It is built as a comparison tool — you upload up to four bids and receive an emailed comparison. Most homeowners at decision time are holding exactly one bid they need to evaluate, and that is the job RemodelerIQ is built around: a 0–100 audit of a single bid against local market data, contract-risk rules, and scope completeness.',
  },
  {
    question: 'What is the difference between BidCompareAI and RemodelerIQ?',
    answer:
      'Three structural differences. First, the job: BidCompareAI compares multiple bids against each other; RemodelerIQ audits any bid — including a single one — against outside data. Second, the data: RemodelerIQ publishes its methodology and sources (BLS wages, Zonda Cost vs. Value 2026, Houzz, FRED); BidCompareAI does not publish where its cost judgments come from. Third, the business model: BidCompareAI is operated by a contractor-matching service; RemodelerIQ takes no money from contractors.',
  },
  {
    question: 'Does it matter who owns a bid-analysis tool?',
    answer:
      'It matters for incentives. A tool operated by a contractor-matching business earns when you connect with a contractor. A tool paid for by homeowners earns when the analysis is worth paying for. Neither model is dishonest — but only one of them profits specifically when the audit serves you, including when the right answer is "walk away."',
  },
  {
    question: 'Which is better for negotiating with my contractor?',
    answer:
      'Negotiation needs specifics you can cite. RemodelerIQ returns per-issue talking points tied to named data — "this labor line is above the BLS-based rate for your metro" — plus a scored PDF you can put in front of the contractor. A bid-to-bid comparison tells you which bid is cheapest; it can\'t tell you whether all of them are above your local market.',
  },
];

function MarkIcon({ mark }: { mark: Cell['mark'] }) {
  if (mark === 'yes') return <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
  if (mark === 'no') return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
  return <MinusCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
}

export default function VsBidCompareAIPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="RemodelerIQ vs BidCompareAI: An Honest Comparison"
        description={`BidCompareAI is free and compares up to 4 bids by email. RemodelerIQ audits any bid — including a single one — against BLS wages and Zonda 2026 data, with no contractor-referral revenue. Verified July 2026. First ${FREE_TOTAL_ANALYSES} analyses free.`}
        path="/vs/bidcompare-ai"
        keywords="RemodelerIQ vs BidCompareAI, BidCompareAI review, BidCompareAI alternative, compare contractor bids AI, GreatBuildz BidCompare"
      />
      <FAQSchema faqs={VS_FAQS} />
      <BreadcrumbSchema items={BREADCRUMBS.vsBidCompareAI} />
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero + TL;DR */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-navy-900 mb-4">
              RemodelerIQ vs BidCompareAI
            </h1>
            <p className="text-lg text-navy-600 max-w-2xl mx-auto leading-relaxed">
              <strong>TL;DR:</strong> BidCompareAI is a genuinely free tool that compares up to four bids and
              emails you the results — useful if you're holding several quotes. RemodelerIQ does a different job:
              it audits <em>any</em> bid, including a single one, against named local data (BLS wages,
              Zonda Cost vs. Value 2026) with contract terms weighted at 40% of the score — and it takes
              no money from contractors, because it doesn't feed a contractor-matching funnel.
            </p>
          </div>

          {/* At-a-glance table */}
          <section className="card-glass p-4 md:p-6 mb-4">
            <h2 className="text-2xl font-bold text-navy-900 mb-4 text-center">At a glance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b-2 border-navy-200 text-left">
                    <th className="py-3 pr-3 text-navy-900 font-semibold w-1/4">What matters</th>
                    <th className="py-3 pr-3 text-navy-900 font-semibold">BidCompareAI</th>
                    <th className="py-3 text-navy-900 font-semibold">RemodelerIQ</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.dimension} className="border-b border-navy-100 align-top">
                      <td className="py-3 pr-3 font-medium text-navy-800">{row.dimension}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-start gap-2">
                          <MarkIcon mark={row.competitor.mark} />
                          <span className="text-navy-600">{row.competitor.note}</span>
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
          <p className="text-xs text-navy-400 text-center mb-12">
            Comparison based on both products' public materials as of July 2026. Spot something outdated?{' '}
            <a href="mailto:help@remodeleriq.com" className="underline hover:text-navy-600">Tell us</a> and we'll fix it.
          </p>

          {/* Where they shine */}
          <section className="card-glass p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
                <Scale className="w-6 h-6 text-navy-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">Where BidCompareAI genuinely shines</h2>
                <p className="text-navy-600 mb-3">
                  Credit where due: it's completely free, requires no signup, and if you're holding two to four
                  bids it will produce a side-by-side comparison without asking anything of you. The press coverage
                  is real too — WTOP, the syndicated "Housing Scene" column, and Homes & Gardens have all covered it,
                  which is more earned media than most tools in this category (including us, so far) can claim.
                </p>
                <p className="text-navy-600">
                  If your only question is <em>"which of these four bids looks best relative to the others?"</em> —
                  it's a reasonable free answer.
                </p>
              </div>
            </div>
          </section>

          {/* Deep dive 1: single bid */}
          <section className="card-glass p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">The single-bid problem</h2>
                <p className="text-navy-600 mb-3">
                  Comparison tools share a quiet assumption: that you have several bids to compare. Real life is
                  messier — the contractor you actually want is often the one whose bid you're holding, and the
                  question isn't "which bid wins?" but <em>"is this bid fair?"</em> A bid-to-bid comparison also
                  can't catch the scenario where <strong>every</strong> bid is above your local market, or where the
                  cheapest bid is cheap because it's missing permits and disposal.
                </p>
                <p className="text-navy-600">
                  RemodelerIQ audits each bid against <strong>outside</strong> reference points — BLS wages for the
                  trades in your metro, Zonda Cost vs. Value 2026 benchmarks, Houzz cost guides — so one bid is
                  enough, and five bids get five independent audits plus a comparison.
                </p>
              </div>
            </div>
          </section>

          {/* Deep dive 2: who does it answer to */}
          <section className="card-glass p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">Who does the tool answer to?</h2>
                <p className="text-navy-600 mb-3">
                  BidCompareAI is operated by GreatBuildz, a contractor-matching concierge. That's a legitimate
                  business — but it means the free analysis sits at the top of a funnel that earns when homeowners
                  connect with contractors. RemodelerIQ's revenue is homeowner subscriptions, full stop: no referral
                  fees, no lead sales, no contractor-side product.
                </p>
                <p className="text-navy-600">
                  Why it matters: an audit is only as trustworthy as its incentives. When the right answer is
                  "this bid is fine, sign it," both tools can say so. When the right answer is "walk away and
                  hire nobody," only one business model is indifferent to that outcome.
                </p>
              </div>
            </div>
          </section>

          {/* Who each is for */}
          <section className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="card-glass p-6 border-2 border-navy-200">
              <h2 className="text-xl font-bold text-navy-900 mb-3">Use BidCompareAI when…</h2>
              <ul className="space-y-2 text-sm text-navy-600">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You have 2–4 bids and want a free side-by-side comparison</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You're fine receiving results by email</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You may also want help finding contractors (that's the parent company's specialty, in California)</li>
              </ul>
            </div>
            <div className="card-glass p-6 border-2 border-emerald-400 bg-emerald-50/40">
              <h2 className="text-xl font-bold text-navy-900 mb-3">Use RemodelerIQ when…</h2>
              <ul className="space-y-2 text-sm text-navy-700">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You're holding one bid and need to know if it's fair</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You want the price checked against named local data, not just other bids</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You want contract terms scored — deposits, allowances, vague scope</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You want the contractor verified and an audit that answers only to you</li>
              </ul>
            </div>
          </section>

          {/* CTA band */}
          <section className="rounded-2xl p-8 md:p-10 text-center text-white mb-14" style={{ backgroundColor: BRAND }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Audit the bid you're actually holding</h2>
            <p className="text-emerald-50 mb-6 max-w-xl mx-auto">
              One bid is enough. Get a 0–100 score, every red flag, a local price comparison,
              and negotiation talking points — on screen in about a minute.
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
            <h2 className="text-2xl font-bold text-navy-900 mb-6 text-center">Common questions</h2>
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
              More comparisons:{' '}
              <Link to="/vs/chatgpt" className="text-emerald-700 font-medium hover:underline">RemodelerIQ vs ChatGPT</Link>,{' '}
              <Link to="/vs/estimatehawk" className="text-emerald-700 font-medium hover:underline">RemodelerIQ vs EstimateHawk</Link> — or start with{' '}
              <Link to="/is-my-contractor-quote-fair" className="text-emerald-700 font-medium hover:underline">the 5 checks for a fair quote</Link>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
