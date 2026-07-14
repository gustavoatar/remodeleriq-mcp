import PageSEO from '@/react-app/components/PageSEO';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import FAQSchema, { FAQItem } from '@/react-app/components/FAQSchema';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import { Link } from 'react-router';
import {
  DollarSign,
  Wallet,
  FileWarning,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Bot,
} from 'lucide-react';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

const BRAND = '#1F9C4C';

function trackQuoteFairAnalyze(location: string) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.('event', 'quote_fair_analyze_click', { location });
}

// Visible FAQ text and JSON-LD schema render from this one array so they never drift.
const QUOTE_FAIR_FAQS: FAQItem[] = [
  {
    question: 'How do I know if a contractor is overcharging?',
    answer:
      'Compare the quote against local data, not national averages: Bureau of Labor Statistics wages for each trade in your metro, and regional project benchmarks like Zonda Cost vs. Value and Houzz cost guides. A quote well above the local range is not automatically a rip-off — but the contractor should be able to explain exactly what justifies the premium (scope, materials, timeline). If they can’t, negotiate or walk.',
  },
  {
    question: 'What is a fair deposit for a remodeling project?',
    answer:
      'Industry standard is typically 10–33% for residential projects. A deposit over 50% is a documented scam pattern and RemodelerIQ flags it automatically. Some states cap deposits by law — California, for example, limits home-improvement deposits to 10% or $1,000, whichever is less. Safer structure: a modest deposit, then progress payments tied to completed milestones, with 10%+ held until final walkthrough.',
  },
  {
    question: 'How many contractor quotes should I get?',
    answer:
      'At least three for any significant project. But compare scope line-by-line, not just the bottom line — the cheapest bid is often the least complete. A bid that excludes permits, disposal, or surface prep will make up the difference in change orders.',
  },
  {
    question: 'What red flags matter most in a contractor bid?',
    answer:
      'The big five: a deposit over 50%, vague scope language ("as needed", "TBD", unpriced allowances), missing line items (permits, demo, disposal, cleanup), no license or insurance details, and pressure to sign immediately. Any one of them is worth a conversation; several together is a walk-away signal.',
  },
  {
    question: 'Should I negotiate a contractor quote?',
    answer:
      'Yes — professionally and with data. Contractors negotiate with informed customers all the time; what they respect is specifics. "Your labor line is 28% above the BLS-based rate for electricians in this metro" gets a real conversation. "Can you do better?" gets a shrug. Negotiate scope clarity and payment terms, not just price.',
  },
  {
    question: 'Is it free to check my contractor quote?',
    answer: `Yes. RemodelerIQ analyzes your first ${FREE_TOTAL_ANALYSES} bids free — no credit card and no signup required. Upload a photo or PDF of the quote and you get a 0–100 score, red flags, local price comparison, and negotiation talking points in about a minute.`,
  },
];

interface Check {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  what: string;
  fair: string;
  flag: string;
}

const CHECKS: Check[] = [
  {
    icon: DollarSign,
    title: '1. Check the price against local data — not national averages',
    what:
      'Labor makes up most of a remodeling bid, and labor costs swing hard by metro. A national average can be off by thousands in either direction for your ZIP code. Benchmark the quote against Bureau of Labor Statistics wages for the trades involved and regional project data (Zonda Cost vs. Value 2026, Houzz cost guides).',
    fair: 'Total lands inside the local range for your project type and finish level, and labor rates track your metro’s trade wages.',
    flag: 'Priced off a "national average," or the contractor can’t explain what puts it above the local range.',
  },
  {
    icon: Wallet,
    title: '2. Check the deposit and payment schedule',
    what:
      'Payment terms are where bad deals hide. Industry standard deposit is typically 10–33% for residential work; some states cap it by law (California: 10% or $1,000, whichever is less). The rest should be tied to completed milestones — never the calendar.',
    fair: 'Deposit of 10–33%, progress payments tied to milestones, and a final payment (10% or more) due only at completed walkthrough.',
    flag: 'Deposit over 50% — a documented scam pattern that RemodelerIQ flags automatically — or large payments due on dates rather than delivered work.',
  },
  {
    icon: FileWarning,
    title: '3. Check allowances and vague language',
    what:
      'An "allowance" is a placeholder, not a price — if the tile allowance is $1,200 and real tile costs $2,600, you pay the difference. Vague phrases ("as needed", "TBD", "standard fixtures") are change-order fuel: they let the price grow after you’ve signed.',
    fair: 'Specific products and quantities, realistic allowances you’ve sanity-checked against actual prices, and a written change-order process.',
    flag: 'Multiple unpriced allowances, "to be determined" line items, or scope described in a sentence when it needs a page.',
  },
  {
    icon: ClipboardList,
    title: '4. Check what’s missing from the scope',
    what:
      'Cheap bids are usually incomplete bids. The most commonly omitted items: permits and inspections, demolition and disposal, surface prep and protection, cleanup, and warranty terms. Each one comes back later as a change order — priced without competition.',
    fair: 'Permits, demo, disposal, prep, cleanup, and warranty all appear in writing, even if some are marked "included."',
    flag: 'None of those words appear anywhere in the bid — or "permits by owner" on work that clearly needs them.',
  },
  {
    icon: ShieldCheck,
    title: '5. Check the contractor, not just the quote',
    what:
      'A fair price from an unlicensed or uninsured contractor is not a fair deal. Verify the license is active in your state, ask for a certificate of insurance, and read reviews across more than one platform — patterns matter more than any single rating.',
    fair: 'Active state license, current liability insurance (and workers’ comp where required), and a consistent review history under the same business name.',
    flag: 'License "pending," insurance "available on request," a business name that keeps changing — or only-ever-perfect reviews on a single site.',
  },
];

export default function QuoteFairnessPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Is My Contractor Quote Fair? Run These 5 Checks"
        description={`Find out in minutes if a contractor quote is fair: check the price against BLS wages and Zonda 2026 benchmarks for your metro, spot deposit traps and vague allowances, and verify the contractor. First ${FREE_TOTAL_ANALYSES} AI bid checks are free.`}
        path="/is-my-contractor-quote-fair"
        keywords="is my contractor quote fair, contractor estimate too high, is my contractor overcharging, fair price for remodel, contractor bid red flags, check contractor quote"
      />
      <FAQSchema faqs={QUOTE_FAIR_FAQS} />
      <BreadcrumbSchema items={BREADCRUMBS.quoteFair} />
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-navy-900 mb-4">
              Is My Contractor Quote Fair?
            </h1>
            <p className="text-lg text-navy-600 max-w-2xl mx-auto leading-relaxed">
              A fair quote is three things at once: a <strong>market-rate price</strong> for your metro,
              a <strong>complete scope</strong> in writing, and <strong>payment terms that protect you</strong>.
              Most homeowners only check the first one. Here are all five checks — and how to run them in minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/?view=upload"
                onClick={() => trackQuoteFairAnalyze('hero')}
                className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: BRAND }}
              >
                Check My Quote Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <span className="text-sm text-navy-500">
                {FREE_TOTAL_ANALYSES} free analyses · no signup · no credit card
              </span>
            </div>
          </div>

          {/* The 5 checks */}
          <div className="space-y-6 mb-14">
            {CHECKS.map((check) => (
              <section key={check.title} className="card-glass p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <check.icon className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-navy-900 mb-2">{check.title}</h2>
                    <p className="text-navy-600 mb-4">{check.what}</p>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-navy-700"><strong>Fair:</strong> {check.fair}</p>
                      </div>
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-navy-700"><strong>Red flag:</strong> {check.flag}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Worked example */}
          <section className="card-glass p-6 md:p-8 mb-14 border-2 border-navy-200">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">What this looks like on a real bid</h2>
            <p className="text-navy-600 mb-4">
              Example: a mid-range bathroom remodel quote that "looks normal" at the bottom line.
              The five checks tell a different story:
            </p>
            <ul className="space-y-3 text-navy-700">
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Labor priced ~25% above the BLS-based rate for plumbers and tile setters in the metro — with no premium scope to justify it.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>50% due at signing — double the top of the standard 10–33% deposit range.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>$3,500 of "allowances" for tile and fixtures priced below what those items actually cost locally.</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>No mention of permits or disposal anywhere in the document.</span>
              </li>
            </ul>
            <p className="text-navy-600 mt-4">
              None of that is visible from the total. All of it is negotiable once you can point at it —
              which is exactly what the analyzer gives you: each issue, scored, with a talking point.
            </p>
          </section>

          {/* Why not just ChatGPT */}
          <section className="card-glass p-6 md:p-8 mb-14">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-navy-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-3">Why not just ask ChatGPT?</h2>
                <p className="text-navy-600 mb-3">
                  Half of US homeowners already paste contractor estimates into AI chatbots — it's a good instinct.
                  The problem is grounding: a general chatbot has no wage table for your metro, no 2026 project
                  benchmarks, and no scoring rules for deposit traps or allowance games. It answers from vibes
                  and national averages — the exact things that make quotes look fair when they aren't.
                </p>
                <p className="text-navy-700 font-semibold mb-3">
                  ChatGPT guesses. RemodelerIQ checks — against BLS wage data, Zonda Cost vs. Value 2026,
                  and Houzz cost guides, with every red-flag rule documented on our{' '}
                  <Link to="/how-we-score" className="text-emerald-700 underline hover:text-emerald-800">
                    How We Score
                  </Link>{' '}
                  page.
                </p>
                <p className="text-navy-600">
                  And we answer to you: RemodelerIQ takes no referral fees from contractors, so the analysis
                  has nothing to sell but the truth about your bid.
                </p>
              </div>
            </div>
          </section>

          {/* CTA band */}
          <section className="rounded-2xl p-8 md:p-10 text-center text-white mb-14" style={{ backgroundColor: BRAND }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Run all 5 checks in about a minute</h2>
            <p className="text-emerald-50 mb-6 max-w-xl mx-auto">
              Upload a photo or PDF of your quote. You'll get a 0–100 score, every red flag,
              a local price comparison, and negotiation talking points.
            </p>
            <Link
              to="/?view=upload"
              onClick={() => trackQuoteFairAnalyze('cta_band')}
              className="inline-flex items-center gap-2 bg-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105"
              style={{ color: BRAND }}
            >
              Analyze My Bid Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-emerald-100 text-sm mt-4">
              First {FREE_TOTAL_ANALYSES} analyses free · no signup required
            </p>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-navy-900 mb-6 text-center">Fair-quote questions, answered</h2>
            <div className="space-y-4">
              {QUOTE_FAIR_FAQS.map((faq) => (
                <div key={faq.question} className="card-glass p-6">
                  <h3 className="font-semibold text-navy-900 mb-2">{faq.question}</h3>
                  <p className="text-navy-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related tools */}
          <section className="text-center text-sm text-navy-500">
            <p>
              Dig deeper:{' '}
              <Link to="/labor-rates" className="text-emerald-700 font-medium hover:underline">check local labor rates</Link>,{' '}
              <Link to="/studio" className="text-emerald-700 font-medium hover:underline">estimate what your project should cost</Link>,{' '}
              <Link to="/trusted-radar" className="text-emerald-700 font-medium hover:underline">verify your contractor</Link>, or{' '}
              <Link to="/how-we-score" className="text-emerald-700 font-medium hover:underline">read our scoring methodology</Link>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
