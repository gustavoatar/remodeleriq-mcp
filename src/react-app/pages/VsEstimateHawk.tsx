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
  Users,
  BarChart3,
  FileWarning,
} from 'lucide-react';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

const BRAND = '#1F9C4C';

function trackVsAnalyze(location: string) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.('event', 'vs_estimatehawk_analyze_click', { location });
}

type Cell = { mark: 'yes' | 'no' | 'partial'; note: string };

interface CompareRow {
  dimension: string;
  competitor: Cell;
  remodeleriq: Cell;
}

const COMPARE_ROWS: CompareRow[] = [
  {
    dimension: 'Built for',
    competitor: { mark: 'partial', note: '"Built for GCs & Property Managers," with a homeowner bid check' },
    remodeleriq: { mark: 'yes', note: 'Homeowners only — every feature serves the person paying for the remodel' },
  },
  {
    dimension: 'Core job',
    competitor: { mark: 'yes', note: 'Bid leveling: normalize 2–5 bids, flag scope gaps and price outliers' },
    remodeleriq: { mark: 'yes', note: 'Bid audit: score any bid (one is enough) against local data and contract-risk rules' },
  },
  {
    dimension: 'Free tier',
    competitor: { mark: 'partial', note: 'Homeowner bid check; paid reports from $9' },
    remodeleriq: { mark: 'yes', note: `First ${FREE_TOTAL_ANALYSES} full analyses free — no signup, no credit card` },
  },
  {
    dimension: 'Pricing',
    competitor: { mark: 'yes', note: '$9 single report · $39 Project Pass · $99/mo Professional (white-label) · $149 Done-for-You' },
    remodeleriq: { mark: 'yes', note: '$19.99/mo · $39.99/3 months · $99.99 lifetime — all unlimited' },
  },
  {
    dimension: 'Named data sources',
    competitor: { mark: 'no', note: '"Zip-adjusted market data" — sources not published' },
    remodeleriq: { mark: 'yes', note: 'BLS OEWS wages, Zonda Cost vs. Value 2026, Houzz, FRED — methodology public on How We Score' },
  },
  {
    dimension: 'Contract-risk depth',
    competitor: { mark: 'partial', note: 'Flags scope gaps and pricing outliers' },
    remodeleriq: { mark: 'yes', note: 'Contract terms are 40% of the score: deposit >50% flag, allowance traps, vague scope, payment schedule' },
  },
  {
    dimension: 'Contractor reputation check',
    competitor: { mark: 'yes', note: 'Aggregates Google, Yelp, and BBB' },
    remodeleriq: { mark: 'yes', note: 'License verification plus review and BBB cross-check (Trusted Radar)' },
  },
  {
    dimension: 'White-label for pros',
    competitor: { mark: 'yes', note: 'Yes — $99/mo Professional tier' },
    remodeleriq: { mark: 'no', note: 'No white-label; a free embeddable bid-checker widget exists for partners' },
  },
  {
    dimension: 'No-contractor-money pledge',
    competitor: { mark: 'yes', note: 'States it takes no commissions, referrals, or paid placements' },
    remodeleriq: { mark: 'yes', note: 'Same pledge — no contractor revenue of any kind' },
  },
];

const VS_FAQS: FAQItem[] = [
  {
    question: 'What is EstimateHawk?',
    answer:
      'EstimateHawk is an AI bid-leveling tool that extracts line items from PDF, Excel, or CSV bids, normalizes scope across 2–5 bids, and flags gaps and pricing outliers. Its own positioning is "Built for GCs & Property Managers," with a bid check offered to homeowners, and paid reports starting at $9.',
  },
  {
    question: 'What is the difference between bid leveling and a bid audit?',
    answer:
      'Bid leveling lines up several bids so you can compare them apples-to-apples — a genuinely useful exercise borrowed from commercial construction. A bid audit judges a bid against outside reference points: local wage data, regional project benchmarks, and contract-risk rules. Leveling tells you which bid is the outlier; an audit can tell you whether every bid on the table is above your market, or whether the "winner" has a 60% deposit clause.',
  },
  {
    question: 'Is EstimateHawk or RemodelerIQ cheaper?',
    answer:
      `EstimateHawk's $9 single report is the cheapest paid entry in the category. RemodelerIQ starts free — your first ${FREE_TOTAL_ANALYSES} full analyses cost nothing, no signup — and unlimited passes run $19.99/month, $39.99 per 3 months, or $99.99 once for lifetime access. For a single quick look, both are inexpensive; for a remodel with revisions and re-bids, unlimited analysis matters more than the entry price.`,
  },
  {
    question: 'Are EstimateHawk and RemodelerIQ independent from contractors?',
    answer:
      'Both make the same pledge: no commissions, no referrals, no paid placements from contractors. The difference is focus rather than the pledge itself — EstimateHawk builds for general contractors and property managers as its primary audience alongside homeowners, while RemodelerIQ builds for homeowners only, which shapes everything from the plain-English report to the negotiation talking points.',
  },
  {
    question: 'Which should a homeowner use?',
    answer:
      'If you are a GC or property manager leveling subcontractor bids across projects, EstimateHawk is built for your workflow, including white-label reports. If you are a homeowner with a bid in hand, RemodelerIQ is built for exactly you: a free first analysis, a 0–100 score weighted toward contract risk, price checks against named local data sources, contractor verification, and talking points for the negotiation.',
  },
];

function MarkIcon({ mark }: { mark: Cell['mark'] }) {
  if (mark === 'yes') return <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
  if (mark === 'no') return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
  return <MinusCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
}

export default function VsEstimateHawkPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="RemodelerIQ vs EstimateHawk: Bid Audit or Bid Leveling?"
        description={`EstimateHawk levels 2–5 bids for GCs and property managers from $9. RemodelerIQ audits any bid for homeowners against named BLS and Zonda 2026 data, contract risk weighted 40%. Verified July 2026. First ${FREE_TOTAL_ANALYSES} analyses free.`}
        path="/vs/estimatehawk"
        keywords="RemodelerIQ vs EstimateHawk, EstimateHawk review, EstimateHawk alternative, bid leveling tool, AI contractor bid analysis"
      />
      <FAQSchema faqs={VS_FAQS} />
      <BreadcrumbSchema items={BREADCRUMBS.vsEstimateHawk} />
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero + TL;DR */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-navy-900 mb-4">
              RemodelerIQ vs EstimateHawk
            </h1>
            <p className="text-lg text-navy-600 max-w-2xl mx-auto leading-relaxed">
              <strong>TL;DR:</strong> These tools answer different questions for different people.
              EstimateHawk is bid <em>leveling</em> — normalize 2–5 bids and spot the outlier — built,
              in its own words, for GCs and property managers, from $9 a report. RemodelerIQ is a bid{' '}
              <em>audit</em> for homeowners: score the bid in your hand (one is enough) against named
              local data, with contract terms — where the traps live — weighted at 40% of the score.
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
                    <th className="py-3 pr-3 text-navy-900 font-semibold">EstimateHawk</th>
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
                <BarChart3 className="w-6 h-6 text-navy-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">Where EstimateHawk genuinely shines</h2>
                <p className="text-navy-600 mb-3">
                  Bid leveling is a real discipline from commercial construction, and EstimateHawk brings it
                  downstream well: fast line-item extraction from PDF, Excel, or CSV, scope normalization across
                  2–5 bids, and a $9 entry price that's the cheapest paid report in the category. It also
                  aggregates contractor reputation across Google, Yelp, and BBB, and makes the same
                  no-contractor-money pledge we do — which we're glad to see becoming the category standard.
                </p>
                <p className="text-navy-600">
                  If you're a GC leveling subcontractor bids, or a property manager processing quotes across
                  units, its Professional tier — white-label reports included — is built for that workflow.
                </p>
              </div>
            </div>
          </section>

          {/* Deep dive 1: audience focus */}
          <section className="card-glass p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">Who a tool is built for shapes what it's good at</h2>
                <p className="text-navy-600 mb-3">
                  EstimateHawk's own homepage leads with "Built for GCs & Property Managers." That's a fine
                  market — but a GC leveling subs and a homeowner staring at a $40,000 kitchen bid need different
                  things. Pros need normalized spreadsheets; homeowners need plain English, a verdict they can
                  trust, and words to say when they call the contractor back.
                </p>
                <p className="text-navy-600">
                  RemodelerIQ picked one customer. Everything is shaped by that choice: the first{' '}
                  {FREE_TOTAL_ANALYSES} analyses are free because homeowners bid-check a few times per project,
                  not per week; the report explains <em>why</em> each flag matters; and every analysis ends with
                  negotiation talking points, because for a homeowner the analysis isn't the goal — the better
                  deal is.
                </p>
              </div>
            </div>
          </section>

          {/* Deep dive 2: contract risk */}
          <section className="card-glass p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FileWarning className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">Price outliers are visible. Contract traps aren't.</h2>
                <p className="text-navy-600 mb-3">
                  Leveling catches the bid that's 30% high. It doesn't catch the bid that's priced right and
                  still dangerous: a 60% deposit due at signing, $3,500 of unpriced allowances, "as needed"
                  scope language, or payments tied to dates instead of milestones. Those are contract problems,
                  not price problems — and they're where homeowners actually get hurt.
                </p>
                <p className="text-navy-600">
                  That's why contract risk is the largest slice of RemodelerIQ's score — 40%, ahead of price (30%)
                  and scope completeness (30%) — with fixed, documented rules: deposits over 50% are flagged
                  (industry standard is 10–33%), unpriced allowances are flagged, vague scope is penalized. The
                  full rulebook is public on{' '}
                  <Link to="/how-we-score" className="text-emerald-700 underline hover:text-emerald-800">How We Score</Link>,
                  and the data behind price checks is named: BLS OEWS wages, Zonda Cost vs. Value 2026, Houzz, FRED.
                </p>
              </div>
            </div>
          </section>

          {/* Who each is for */}
          <section className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="card-glass p-6 border-2 border-navy-200">
              <h2 className="text-xl font-bold text-navy-900 mb-3">Use EstimateHawk when…</h2>
              <ul className="space-y-2 text-sm text-navy-600">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You're a GC or property manager leveling subcontractor bids</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You need white-label reports for clients ($99/mo tier)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" />You have several bids and want them normalized into one spreadsheet view</li>
              </ul>
            </div>
            <div className="card-glass p-6 border-2 border-emerald-400 bg-emerald-50/40">
              <h2 className="text-xl font-bold text-navy-900 mb-3">Use RemodelerIQ when…</h2>
              <ul className="space-y-2 text-sm text-navy-700">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You're a homeowner with a bid — even just one — to evaluate</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You want contract terms scored, not just prices compared</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You want to see the data sources behind the verdict</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />You want to start free and get negotiation talking points</li>
              </ul>
            </div>
          </section>

          {/* CTA band */}
          <section className="rounded-2xl p-8 md:p-10 text-center text-white mb-14" style={{ backgroundColor: BRAND }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Built for the person writing the check</h2>
            <p className="text-emerald-50 mb-6 max-w-xl mx-auto">
              Upload your bid and get a 0–100 score, contract red flags, a local price comparison,
              and the words to negotiate with.
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
              <Link to="/vs/bidcompare-ai" className="text-emerald-700 font-medium hover:underline">RemodelerIQ vs BidCompareAI</Link> — or start with{' '}
              <Link to="/is-my-contractor-quote-fair" className="text-emerald-700 font-medium hover:underline">the 5 checks for a fair quote</Link>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
