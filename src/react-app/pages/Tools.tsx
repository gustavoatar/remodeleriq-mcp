import PageSEO from '@/react-app/components/PageSEO';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import RelatedLinks from '@/react-app/components/RelatedLinks';
import { Link } from 'react-router';
import {
  ShieldCheck,
  Calculator,
  HardHat,
  Radar,
  ScrollText,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

const BRAND = '#1F9C4C';

interface Tool {
  title: string;
  blurb: string;
  href: string;
  external?: boolean; // cost guides live under the static path
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
}

// The free tools that funnel toward the paid analyzer. Order = funnel priority.
const TOOLS: Tool[] = [
  {
    title: 'Remodeling Cost Estimator',
    blurb:
      "2026 cost ranges for 18 project types across 150+ metros, with a live estimator that recomputes for your size and finish level.",
    href: '/remodeling-cost-guides/',
    external: true,
    icon: Calculator,
    cta: 'Estimate a project',
  },
  {
    title: 'Labor Rate Lookup',
    blurb:
      'Real burdened trade wages — carpenter, plumber, electrician, painter — by metro, straight from BLS data.',
    href: '/labor-rates',
    icon: HardHat,
    cta: 'Look up rates',
  },
  {
    title: 'Trusted Radar',
    blurb:
      "Verify a contractor's license, BBB standing, and reviews before you sign anything.",
    href: '/trusted-radar',
    icon: Radar,
    cta: 'Verify a contractor',
  },
  {
    title: 'How We Score',
    blurb:
      'The Three Pillars methodology — Contract Risk, Price Check, Scope — behind every bid analysis.',
    href: '/how-we-score',
    icon: ScrollText,
    cta: 'See the method',
  },
  {
    title: 'Remodeling Glossary',
    blurb:
      'Decode contractor jargon, line items, and the fine print in a quote.',
    href: '/glossary',
    icon: BookOpen,
    cta: 'Browse terms',
  },
];

function ToolLink({
  href,
  external,
  className,
  children,
}: {
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Free Remodeling Tools for Homeowners"
        description="Free tools to plan and protect your remodel: cost estimator, labor-rate lookup, contractor verifier, and an AI bid analyzer that checks if your contractor's quote is fair."
        path="/tools"
        keywords="remodeling tools, remodel cost calculator, contractor bid checker, labor rate lookup, contractor license verification"
      />
      <Header />

      <main className="max-w-5xl mx-auto px-4 pt-28 md:pt-32 pb-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 text-white text-sm font-semibold"
            style={{ backgroundColor: BRAND }}
          >
            <ShieldCheck className="w-4 h-4" />
            Free tools for homeowners
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Everything you need to <span style={{ color: BRAND }}>not get overcharged</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Five free tools, one question: <strong>is your remodel priced fairly?</strong> Start
            anywhere — and when you have a contractor's bid in hand, run it through the analyzer.
          </p>
        </div>

        {/* Featured: the analyzer (the destination) */}
        <Link
          to="/"
          className="block rounded-3xl p-8 md:p-10 mb-10 text-white shadow-xl transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: BRAND }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
                <ShieldCheck className="w-4 h-4" /> Start here
              </div>
              <h2 className="text-3xl font-black mb-3">AI Bid Analyzer</h2>
              <p className="text-white/90 text-lg leading-relaxed max-w-2xl">
                Upload your contractor's estimate (PDF, photo, or paste it) and get an instant
                fairness check against live BLS labor wages, material indices, and 2026 cost
                benchmarks — with the red flags called out.
              </p>
              <p className="mt-3 text-white/80 text-sm font-semibold">
                3 free analyses · no credit card
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg">
                Analyze my bid free <ArrowRight className="w-5 h-5" />
              </span>
            </div>
          </div>
        </Link>

        {/* The free utility tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <ToolLink
                key={t.title}
                href={t.href}
                external={t.external}
                className="group bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all flex flex-col"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#E8F6EE' }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{t.title}</h3>
                <p className="text-slate-600 leading-relaxed flex-1">{t.blurb}</p>
                <span
                  className="mt-5 inline-flex items-center gap-1.5 font-bold"
                  style={{ color: BRAND }}
                >
                  {t.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </ToolLink>
            );
          })}
        </div>

        {/* Closing funnel CTA */}
        <div className="mt-12 text-center bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            Got a contractor's bid in hand?
          </h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            That's the moment these tools pay off. See if you're being overcharged in about a
            minute — free.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white px-9 py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform"
            style={{ backgroundColor: BRAND }}
          >
            Analyze my bid free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      <RelatedLinks currentPath="/tools" />
      <Footer />
    </div>
  );
}
