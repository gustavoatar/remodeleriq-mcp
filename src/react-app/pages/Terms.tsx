import { Link } from 'react-router';
import { ArrowLeft, Database, Shield, Scale, ExternalLink } from 'lucide-react';
import PageSEO from '@/react-app/components/PageSEO';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';

export default function TermsPage() {
  const lastUpdated = 'July 2026';
  
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Terms of Service - RemodelerIQ User Agreement"
        description="Understand how RemodelerIQ's AI bid analysis works, our confidence scoring methodology, and your rights as a user. Clear, fair terms for homeowners."
        path="/terms"
        keywords="RemodelerIQ terms, bid analysis terms of service, contractor tool agreement"
      />
      <BreadcrumbSchema items={BREADCRUMBS.terms} />
      {/* Header */}
      <header className="bg-white border-b border-navy-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to RemodelerIQ</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="card-glass p-8 md:p-12">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Terms of Service</h1>
          <p className="text-navy-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-navy max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-navy-700 leading-relaxed">
                By accessing or using RemodelerIQ ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">2. Description of Service</h2>
              <p className="text-navy-700 leading-relaxed">
                RemodelerIQ is a tool that helps homeowners analyze contractor bids for home renovation projects. 
                The Service uses artificial intelligence to identify potential issues, compare pricing against market rates, 
                and generate negotiation talking points.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                3. Data Sources & Methodology
              </h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <p className="text-emerald-800 font-medium">
                  📊 Our analysis combines authoritative public data with proprietary algorithms
                </p>
              </div>
              <p className="text-navy-700 leading-relaxed mb-4">
                RemodelerIQ provides cost estimates and market analysis by combining publicly available data from 
                multiple authoritative sources into our proprietary algorithm. Our data sources include:
              </p>
              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-navy-900">U.S. Bureau of Labor Statistics (BLS)</strong>
                    <p className="text-navy-600 text-sm">
                      Occupational Employment and Wage Statistics (OEWS) for labor wage benchmarks by trade and metropolitan area.
                      <a href="https://www.bls.gov/oews/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center gap-1">
                        bls.gov/oews <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-navy-900">Zonda Media / JLC Cost vs. Value Report</strong>
                    <p className="text-navy-600 text-sm">
                      Annual construction cost benchmarks by project type and region, covering 30+ remodeling project categories.
                      <a href="https://www.jlconline.com/how-to/zonda-cost-vs-value" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center gap-1">
                        jlconline.com <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-navy-900">Houzz</strong>
                    <p className="text-navy-600 text-sm">
                      Project cost surveys, labor percentage benchmarks, and price-per-square-foot data for specific trades.
                      <a href="https://www.houzz.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center gap-1">
                        houzz.com <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-navy-900">Angi / HomeAdvisor</strong>
                    <p className="text-navy-600 text-sm">
                      Contractor reputation and review data accessed via public search for contractor research features.
                      <a href="https://www.angi.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center gap-1">
                        angi.com <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-navy-700 leading-relaxed mt-4">
                All data is sourced from public government databases, licensed APIs, publicly available industry reports, 
                and free-tier API services. RemodelerIQ's proprietary algorithm combines these sources to calculate 
                estimates optimized for maximum value to homeowners.
              </p>

              <div className="mt-6 pt-6 border-t border-emerald-100">
                <h3 className="text-lg font-medium text-navy-800 mb-3">3.1 Real-Time Analysis & Agentic Grounded Search</h3>
                <p className="text-navy-700 leading-relaxed mb-4">
                  To ensure the highest level of accuracy for the RemodelerIQ Confidence Score, our Service utilizes 
                  agentic grounded search technology. When a bid is uploaded, our proprietary logic triggers automated 
                  data calls to:
                </p>
                <div className="space-y-3 ml-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-navy-900">Publicly Available Sources</strong>
                      <p className="text-navy-600 text-sm">
                        We perform real-time searches of state licensing boards, business registries, and verified 
                        consumer review platforms (including Google, BBB, and Angi) to factor contractor reputation 
                        and legal compliance into your score.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-navy-900">Market Benchmarks</strong>
                      <p className="text-navy-600 text-sm">
                        Our agentic search logic crawls and verifies the most current labor and material cost data 
                        from authoritative sources to account for regional price fluctuations and trade-specific 
                        "lowball" detection.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-navy-900">Proprietary Logic</strong>
                      <p className="text-navy-600 text-sm">
                        These data calls inform our Unified Confidence Score, which weighs Contract Risk (40%), 
                        Scope Completeness (30%), and Price Check (30%) to identify if a bid is a "Great Deal" 
                        or a potential financial risk.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                4. Disclaimer of Warranties & Not Professional Advice
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-amber-800 font-medium">
                  ⚠️ Important: RemodelerIQ provides informational estimates, not professional advice
                </p>
              </div>
              <p className="text-navy-700 leading-relaxed">
                <strong>The information provided by RemodelerIQ is for informational purposes only and does not 
                constitute legal, financial, or professional advice.</strong> The Service is not a substitute for 
                consultation with qualified professionals such as licensed contractors, attorneys, or financial advisors.
              </p>
              <p className="text-navy-700 leading-relaxed mt-3">
                All estimates are algorithmically generated based on publicly available data, industry surveys, and 
                statistical models. Actual project costs may vary based on factors including but not limited to:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-1 ml-4 mt-2">
                <li>Local market conditions and labor availability</li>
                <li>Contractor qualifications and overhead</li>
                <li>Material selections and quality levels</li>
                <li>Project complexity and site conditions</li>
                <li>Permits, inspections, and regulatory requirements</li>
                <li>Unforeseen conditions discovered during work</li>
              </ul>
              <p className="text-navy-700 leading-relaxed mt-3">
                <strong>The Service is provided "as is" and "as available"</strong> without warranties of any kind, 
                either express or implied, including but not limited to implied warranties of merchantability, fitness 
                for a particular purpose, and non-infringement. RemodelerIQ makes no representations or warranties 
                regarding the accuracy, completeness, or reliability of any cost estimate, contractor assessment, 
                or recommendation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                5. Release of Claims & Limitation of Liability
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-blue-800 font-medium">
                  🛡️ Our Promise: We are your shield, but you are responsible for your decisions
                </p>
              </div>
              <p className="text-navy-700 leading-relaxed mb-3">
                <strong>By using RemodelerIQ, you acknowledge and agree that:</strong>
              </p>
              <ol className="list-decimal list-inside text-navy-700 space-y-2 ml-4">
                <li>All data is derived from publicly available sources, licensed APIs, and industry publications in the public domain</li>
                <li>RemodelerIQ's proprietary algorithm combines these sources to maximize value for homeowners</li>
                <li>You will not hold RemodelerIQ, its owners, officers, employees, or affiliates liable for any decisions made based on the information provided</li>
                <li>You understand that estimates are statistical benchmarks, not guaranteed pricing</li>
                <li>You are responsible for obtaining professional advice and multiple contractor bids before making financial decisions</li>
                <li>Construction pricing is inherently variable and actual costs may differ significantly from estimates</li>
              </ol>
              <p className="text-navy-700 leading-relaxed mt-4">
                <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, RemodelerIQ shall not 
                be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of 
                profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or 
                other intangible losses resulting from your use of the Service.
              </p>
              <p className="text-navy-700 leading-relaxed mt-3">
                <strong>Release:</strong> You hereby release and forever discharge RemodelerIQ and its affiliates from 
                any and all claims, demands, damages, costs, expenses, and causes of action arising out of or relating 
                to your use of the Service or reliance on any information provided therein.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">6. Our Promise to Homeowners</h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-4">
                <p className="text-emerald-900 font-semibold text-lg mb-2">
                  🏠 RemodelerIQ serves as your shield in the remodeling process
                </p>
                <p className="text-emerald-800">
                  Our mission is to arm homeowners with data-driven insights that level the playing field with contractors. 
                  We combine authoritative data sources with intelligent analysis to help you make informed decisions and 
                  achieve the best outcomes for your projects. While we cannot guarantee results, we are committed to 
                  providing you with the best available information to protect your interests.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">7. User Accounts</h2>
              <p className="text-navy-700 leading-relaxed">
                You may use the Service with or without creating an account. If you create an account using Google OAuth, 
                you are responsible for maintaining the security of your account and for all activities that occur under it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">8. Acceptable Use</h2>
              <p className="text-navy-700 leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 ml-4">
                <li>Use the Service for any unlawful purpose</li>
                <li>Upload content that infringes on intellectual property rights</li>
                <li>Attempt to gain unauthorized access to the Service or its systems</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
            </section>

            <section id="data-contribution">
              <h2 className="text-xl font-semibold text-navy-900 mb-3">9. Data Contribution for Service Improvement</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-blue-800 font-medium">
                  📊 Help us provide better analysis for everyone
                </p>
              </div>
              <p className="text-navy-700 leading-relaxed">
                When you upload a bid for analysis, you may optionally consent to contribute anonymized data to help 
                improve the Service. If you provide consent:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 ml-4 mt-3">
                <li><strong>What we store:</strong> Anonymized pricing data, project type, state/region, trade breakdowns, 
                  and detected issues. We do NOT store contractor names, addresses, phone numbers, or any personally 
                  identifiable information.</li>
                <li><strong>Retention period:</strong> 24 hours. After 24 hours, your contributed data is automatically 
                  and permanently deleted from our systems.</li>
                <li><strong>How it's used:</strong> Your anonymized data helps us calculate regional pricing benchmarks,
                  identify common issues by project type, and improve our AI analysis for all users.</li>
                <li><strong>Aggregated statistics:</strong> Before your contributed data is deleted, we combine it into
                  cumulative, fully anonymized statistics — running counts and averages such as "average kitchen remodel
                  cost in Georgia" or "number of bids analyzed to date." These aggregates are computed incrementally and
                  contain no per-bid records. They cannot be traced back to any individual bid, contractor, or user, and
                  we may retain them indefinitely.</li>
                <li><strong>Publication of aggregates:</strong> We may publish, share, and use these anonymized aggregate
                  statistics publicly — for example in research reports, articles, cost guides, and marketing about
                  remodeling-cost and contractor-bid trends. We never publish or share any individual bid, document, or
                  personally identifiable information.</li>
              </ul>
              <p className="text-navy-700 leading-relaxed mt-3">
                <strong>Consent is optional.</strong> You can use the Service without contributing data. If you choose 
                not to consent, your bid is processed in real-time and immediately discarded—nothing is stored.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">10. Premium Subscriptions</h2>
              <p className="text-navy-700 leading-relaxed">
                Premium features are available for a one-time purchase. All sales are final. If you believe you were 
                charged in error, please contact us and we will review your case.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">11. Intellectual Property</h2>
              <p className="text-navy-700 leading-relaxed">
                The Service, including its design, features, and content (excluding user-uploaded documents), 
                is owned by RemodelerIQ and protected by intellectual property laws. You retain ownership of 
                any documents you upload to the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">12. Changes to Terms</h2>
              <p className="text-navy-700 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of significant changes 
                by updating the "Last updated" date. Continued use of the Service after changes constitutes 
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">13. Contact</h2>
              <p className="text-navy-700 leading-relaxed">
                If you have questions about these Terms of Service, please contact us through the feedback button 
                in the application.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-navy-200 flex flex-wrap gap-6">
            <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Privacy Policy →
            </Link>
            <Link to="/how-we-score" className="text-emerald-600 hover:text-emerald-700 font-medium">
              How We Score →
            </Link>
            <Link to="/glossary" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Glossary →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
