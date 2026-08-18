import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import PageSEO from '@/react-app/components/PageSEO';
import FAQSchema, { type FAQItem } from '@/react-app/components/FAQSchema';
import { Download, TrendingUp, ArrowRight } from 'lucide-react';
import {
  indexRegression,
  nationalTradeTable,
  metroTable,
  nationalBlendedRate,
  metroTradeCsv,
  fmtRate,
} from '@/shared/laborIndex';
import { REGRESSION_POINTS, BLS_RELEASE, INDEX_QUARTER } from '@/shared/laborIndexData';

const FAQS: FAQItem[] = [
  {
    question: 'What is the RemodelerIQ Construction Labor Cost Index?',
    answer:
      'It is a 2026 measure of what skilled construction labor costs across 152 US metros, built from Bureau of Labor Statistics (BLS) wage data and billed-rate multipliers. The national baseline is 1.00; a metro at 1.40 means labor there runs about 40% above the national norm.',
  },
  {
    question: 'How much does construction labor cost per hour in 2026?',
    answer:
      'Billed labor rates for the core remodeling trades average about $54/hour nationally in 2026, ranging from roughly $46/hour in the lowest-cost metros to $81/hour in the highest. Plumbers and electricians are the most expensive trades at $64–$65/hour; general laborers the least.',
  },
  {
    question: 'Why do two quotes for the same job differ so much?',
    answer:
      'Because within a single trade and metro, BLS wage data shows a 2.6x-to-2.8x gap between the 10th and 90th percentile of what tradespeople earn. A licensed master electrician and an entry-level one are billed at very different rates, so the same scope can price 2x apart before anyone has padded a bid.',
  },
  {
    question: 'Is the metro cost index based on real wage data?',
    answer:
      'Yes. Across the 9 metros that have both an independent BLS median-wage measurement and an index value, wages track the index with a correlation of R²=0.57 — a moderate-to-strong relationship confirming the index reflects real local labor economics, not a flat markup.',
  },
  {
    question: 'Can I download the underlying data?',
    answer:
      'Yes. The full 152-metro by 16-trade billed-rate table is available as a free CSV download on this page. Attribution to RemodelerIQ is appreciated if you cite or republish it.',
  },
];

// ---- Regression scatter chart (inline SVG, real points) --------------------
function RegressionChart() {
  const reg = useMemo(() => indexRegression(), []);
  const pts = REGRESSION_POINTS;
  const W = 640, H = 380, P = 52;
  const xs = pts.map((p) => p.index), ys = pts.map((p) => p.blsMedian);
  const xMin = Math.min(...xs) - 0.03, xMax = Math.max(...xs) + 0.03;
  const yMin = Math.min(...ys) - 3, yMax = Math.max(...ys) + 3;
  const sx = (x: number) => P + ((x - xMin) / (xMax - xMin)) * (W - 2 * P);
  const sy = (y: number) => H - P - ((y - yMin) / (yMax - yMin)) * (H - 2 * P);
  const lineX1 = xMin, lineX2 = xMax;

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img"
             aria-label="Scatter plot of BLS median construction wage against the RemodelerIQ cost index across 9 metros, with an ordinary-least-squares trend line.">
          {/* grid + axes */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = P + t * (H - 2 * P);
            const val = yMax - t * (yMax - yMin);
            return (
              <g key={t}>
                <line x1={P} y1={y} x2={W - P} y2={y} stroke="#e2e8f0" strokeWidth={1} />
                <text x={P - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">${val.toFixed(0)}</text>
              </g>
            );
          })}
          {[0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5].map((v) => (
            <text key={v} x={sx(v)} y={H - P + 18} textAnchor="middle" fontSize={11} fill="#64748b">{v.toFixed(2)}</text>
          ))}
          {/* OLS line */}
          <line x1={sx(lineX1)} y1={sy(reg.predict(lineX1))} x2={sx(lineX2)} y2={sy(reg.predict(lineX2))}
                stroke="#1F9C4C" strokeWidth={2.5} strokeDasharray="0" />
          {/* points */}
          {pts.map((p) => (
            <g key={p.city}>
              <circle cx={sx(p.index)} cy={sy(p.blsMedian)} r={5.5} fill="#0f766e" fillOpacity={0.85} />
              <text x={sx(p.index)} y={sy(p.blsMedian) - 10} textAnchor="middle" fontSize={10} fill="#334155" fontWeight={600}>{p.city}</text>
            </g>
          ))}
          {/* axis labels */}
          <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={12} fill="#475569" fontWeight={600}>RemodelerIQ cost index (national = 1.00)</text>
          <text x={16} y={H / 2} textAnchor="middle" fontSize={12} fill="#475569" fontWeight={600} transform={`rotate(-90 16 ${H / 2})`}>BLS median wage ($/hr)</text>
        </svg>
      </div>
      <figcaption className="text-sm text-navy-500 mt-2">
        Each dot is one metro with an independent BLS median-wage measurement (n={reg.n}).
        Trend line: wage = {reg.slope.toFixed(1)} × index − {Math.abs(reg.intercept).toFixed(1)},
        R² = {reg.r2.toFixed(2)}.
      </figcaption>
    </figure>
  );
}

// ---- Trade spread chart (10th-90th percentile bands) -----------------------
function TradeSpreadChart() {
  const trades = useMemo(() => nationalTradeTable().slice(0, 10), []);
  const max = Math.max(...trades.map((t) => t.billedHigh));
  return (
    <div className="space-y-3">
      {trades.map((t) => (
        <div key={t.soc} className="grid grid-cols-[130px_1fr_auto] items-center gap-3">
          <span className="text-sm font-semibold text-navy-800 truncate">{t.trade}</span>
          <div className="relative h-6 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="absolute h-6 rounded-full bg-emerald-200"
              style={{ left: `${(t.billedLow / max) * 100}%`, width: `${((t.billedHigh - t.billedLow) / max) * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-700"
              style={{ left: `${(t.billedMedian / max) * 100}%` }}
              title={`median ${fmtRate(t.billedMedian)}`}
            />
          </div>
          <span className="text-xs text-navy-500 tabular-nums whitespace-nowrap">
            {fmtRate(t.billedLow)}–{fmtRate(t.billedHigh)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LaborCostIndexPage() {
  const reg = useMemo(() => indexRegression(), []);
  const metros = useMemo(() => metroTable(), []);
  const nationalRate = useMemo(() => nationalBlendedRate(), []);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return metros;
    return metros.filter((m) => `${m.city} ${m.st}`.toLowerCase().includes(s));
  }, [q, metros]);

  const downloadCsv = () => {
    const blob = new Blob([metroTradeCsv()], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remodeleriq-construction-labor-index-2026.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // schema.org/Dataset — the citable-asset markup GEO/AI engines reward.
  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'RemodelerIQ Construction Labor Cost Index 2026',
    description:
      'Billed construction labor rates for 16 trades across 152 US metropolitan areas in 2026, derived from BLS Occupational Employment and Wage Statistics with trade-specific billing multipliers.',
    url: 'https://remodeleriq.com/labor-cost-index',
    creator: { '@type': 'Organization', name: 'RemodelerIQ', url: 'https://remodeleriq.com' },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isBasedOn: 'https://www.bls.gov/oes/',
    temporalCoverage: '2026',
    variableMeasured: ['Billed hourly labor rate', 'BLS median wage', 'Regional cost index'],
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'text/csv',
      contentUrl: 'https://remodeleriq.com/labor-cost-index',
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <PageSEO path="/labor-cost-index" ogType="article" />
      <FAQSchema faqs={FAQS} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(datasetSchema)}</script>
      </Helmet>
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="mb-4">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              {INDEX_QUARTER} · Data Report
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-navy-900 mb-5 leading-tight">
            The Construction Labor Cost Index
          </h1>
          <p className="text-lg text-navy-600 leading-relaxed mb-8 max-w-3xl">
            What skilled construction labor actually costs across 152 US metros in 2026 — and proof
            the regional differences are real. Built from {BLS_RELEASE}. Core-trade labor runs about{' '}
            <strong className="text-navy-900">{fmtRate(nationalRate)}</strong> nationally, from{' '}
            {fmtRate(metros[metros.length - 1].blendedRate)} in the cheapest metro to{' '}
            {fmtRate(metros[0].blendedRate)} in the priciest.
          </p>

          {/* Headline finding — the regression */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mb-12">
            <div className="flex items-start gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-navy-900">The regional index tracks real wages</h2>
                <p className="text-navy-600 mt-1">
                  Across the {reg.n} metros with an independent BLS median-wage reading, actual construction
                  wages rise with our cost index at <strong>R² = {reg.r2.toFixed(2)}</strong> — a
                  moderate-to-strong correlation. Each 0.10 step up the index corresponds to about{' '}
                  <strong>${(reg.slope * 0.1).toFixed(0)}/hour</strong> more in real median wages. The index
                  measures labor economics, not a flat markup.
                </p>
              </div>
            </div>
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
              <RegressionChart />
            </div>
          </section>

          {/* Quote variance */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-navy-900 mb-2">Why two honest quotes differ 2x</h2>
            <p className="text-navy-600 mb-6 max-w-3xl">
              Within a single trade, BLS wage data shows a <strong>2.6–2.8x gap</strong> between the 10th and
              90th percentile of what workers earn. That spread — experience, licensing, demand — is baked into
              the labor line before anyone pads a bid. Bars show the 2026 billed-rate range per trade; the
              tick is the median.
            </p>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <TradeSpreadChart />
            </div>
            <p className="text-sm text-navy-500 mt-3">
              A bid isn't automatically "too high" because it lands above the median — but a labor line near the
              top of the band needs a top-of-band crew to justify it.{' '}
              <Link to="/?view=upload" className="text-emerald-700 font-medium hover:underline">
                Check where your quote's labor sits →
              </Link>
            </p>
          </section>

          {/* Metro table */}
          <section className="mb-12">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-navy-900">Labor cost by metro</h2>
                <p className="text-navy-600">Blended core-trade billed rate, all 152 metros.</p>
              </div>
              <button
                onClick={downloadCsv}
                className="inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-navy-800 transition-colors text-sm"
              >
                <Download className="w-4 h-4" /> Download full CSV (152 × 16 trades)
              </button>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by city or state…"
              className="w-full sm:w-80 mb-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-navy-500">
                    <th className="px-4 py-3 font-semibold">Metro</th>
                    <th className="px-4 py-3 font-semibold text-right">Cost index</th>
                    <th className="px-4 py-3 font-semibold text-right">Blended labor rate</th>
                    <th className="px-4 py-3 font-semibold text-right">vs national</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 60).map((m) => (
                    <tr key={m.slug} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-medium text-navy-800">{m.city}, {m.st}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{m.index.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{fmtRate(m.blendedRate)}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${m.premiumPct > 0 ? 'text-rose-600' : m.premiumPct < 0 ? 'text-emerald-700' : 'text-navy-400'}`}>
                        {m.premiumPct > 0 ? '+' : ''}{m.premiumPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 60 && (
              <p className="text-sm text-navy-500 mt-3">
                Showing 60 of {filtered.length} — download the CSV for every metro and trade.
              </p>
            )}
          </section>

          {/* Method + tool links */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mb-10">
            <h2 className="text-xl font-bold text-navy-900 mb-3">How this was built</h2>
            <p className="text-navy-600 mb-3">
              Base wages come from the {BLS_RELEASE} for 16 construction trades. Each is converted to a billed
              labor rate with a trade-specific burden multiplier (benefits, overhead, insurance, profit), then
              escalated to 2026 and scaled by each metro's regional cost index. The validation regression uses
              only the {reg.n} metros with a directly-measured BLS MSA wage — no synthetic points. Full method:{' '}
              <Link to="/how-we-score" className="text-emerald-700 font-medium hover:underline">how we score</Link>.
            </p>
            <p className="text-sm text-navy-500">
              Put the numbers to work:{' '}
              <Link to="/?view=upload" className="text-emerald-700 font-medium hover:underline">audit a contractor's bid</Link>,{' '}
              <Link to="/labor-rates" className="text-emerald-700 font-medium hover:underline">look up local trade rates</Link>,{' '}
              <Link to="/remodeling-cost-guides/" className="text-emerald-700 font-medium hover:underline">browse city cost guides</Link>, or{' '}
              <Link to="/remodeling-cost-guides/permits/" className="text-emerald-700 font-medium hover:underline">check permit fees by city</Link>.
            </p>
          </section>

          {/* CTA */}
          <div className="bg-emerald-600 rounded-2xl p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Is your quote's labor line fair?</h2>
            <p className="text-emerald-50 mb-6 max-w-xl mx-auto">
              Upload a contractor's estimate and RemodelerIQ checks its labor against this exact data for your
              metro — free, in about a minute.
            </p>
            <Link
              to="/?view=upload"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
            >
              Analyze my bid <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
