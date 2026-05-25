import { Link } from 'react-router';
import { ArrowLeft, Database, ExternalLink } from 'lucide-react';
import PageSEO from '@/react-app/components/PageSEO';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';

export default function PrivacyPage() {
  const lastUpdated = 'June 2025';
  
  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Privacy Policy - How RemodelerIQ Protects Your Data"
        description="Your contractor bids and personal data are never sold. Learn how RemodelerIQ uses bank-level encryption and strict data policies to keep your renovation plans private."
        path="/privacy"
        keywords="RemodelerIQ privacy, data protection, contractor bid confidentiality"
      />
      <BreadcrumbSchema items={BREADCRUMBS.privacy} />
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
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Privacy Policy</h1>
          <p className="text-navy-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8">
            <p className="text-emerald-800 font-medium">
              🔒 We do not sell your personal information. Ever.
            </p>
          </div>

          <div className="prose prose-navy max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">1. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-navy-800 mt-4 mb-2">Account Information</h3>
              <p className="text-navy-700 leading-relaxed">
                If you sign in with Google, we receive your email address, name, and profile picture from Google. 
                We use this to create and manage your account.
              </p>

              <h3 className="text-lg font-medium text-navy-800 mt-4 mb-2">Uploaded Documents</h3>
              <p className="text-navy-700 leading-relaxed">
                When you upload a contractor bid for analysis, the document content is processed to provide you 
                with insights. By default, we do not permanently store your uploaded documents—they are processed 
                in real-time and not retained after your session.
              </p>

              <h3 className="text-lg font-medium text-navy-800 mt-4 mb-2">Usage Information</h3>
              <p className="text-navy-700 leading-relaxed">
                We collect basic analytics about how you use the Service, such as pages visited and features used, 
                to improve the product.
              </p>

              <h3 className="text-lg font-medium text-navy-800 mt-4 mb-2">Payment Information</h3>
              <p className="text-navy-700 leading-relaxed">
                Premium purchases are processed by Stripe. We do not store your credit card details—all payment 
                information is handled securely by Stripe.
              </p>
            </section>

            <section id="data-contribution">
              <h2 className="text-xl font-semibold text-navy-900 mb-3">2. Optional Data Contribution (24-Hour Consent)</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-blue-800">
                  <strong>Your choice:</strong> You control whether your bid data helps improve the service.
                </p>
              </div>
              
              <h3 className="text-lg font-medium text-navy-800 mt-4 mb-2">If You Consent to Data Contribution</h3>
              <p className="text-navy-700 leading-relaxed">
                When you check the "Help improve RemodelerIQ" option during upload, you consent to temporary 
                storage of anonymized data from your bid:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 ml-4 mt-2">
                <li><strong>What we store:</strong> Project type, state/region, total amount, square footage, 
                  price per square foot, trade breakdown percentages, and detected issue codes.</li>
                <li><strong>What we DO NOT store:</strong> Contractor names, business names, addresses, phone numbers, 
                  email addresses, license numbers, or any text that could identify the contractor or you.</li>
                <li><strong>Retention:</strong> Your anonymized data is automatically deleted after <strong>24 hours</strong>.</li>
                <li><strong>Purpose:</strong> This data helps us calculate accurate regional benchmarks and improve 
                  analysis quality for all users.</li>
              </ul>

              <h3 className="text-lg font-medium text-navy-800 mt-4 mb-2">Aggregated Statistics</h3>
              <p className="text-navy-700 leading-relaxed">
                Before your data is deleted, we may incorporate it into aggregated statistics (e.g., "average 
                bathroom remodel cost in Texas is $X based on Y samples"). These statistics:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 ml-4 mt-2">
                <li>Cannot be traced back to any individual bid</li>
                <li>Contain no personally identifiable information</li>
                <li>May be retained indefinitely to improve the service</li>
              </ul>

              <h3 className="text-lg font-medium text-navy-800 mt-4 mb-2">If You Do Not Consent</h3>
              <p className="text-navy-700 leading-relaxed">
                If you do not check the consent option, your bid is processed in real-time and immediately 
                discarded. Nothing is stored, and you still receive the full analysis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-navy-700 space-y-2 ml-4">
                <li>To provide and improve the Service</li>
                <li>To manage your account and premium status</li>
                <li>To calculate regional pricing benchmarks (with consent)</li>
                <li>To respond to your feedback and support requests</li>
                <li>To send important service updates (we will not send marketing emails)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">4. Information Sharing</h2>
              <p className="text-navy-700 leading-relaxed mb-3">
                <strong>We do not sell, rent, or trade your personal information.</strong>
              </p>
              <p className="text-navy-700 leading-relaxed">
                We may share information with:
              </p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 ml-4 mt-2">
                <li><strong>Service providers:</strong> Third parties that help us operate the Service (e.g., Stripe for payments, Google for authentication, AI providers for analysis)</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                5. Third-Party Data Sources
              </h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <p className="text-emerald-800 font-medium">
                  📊 We aggregate public data to provide analysis — we do not share your data with these providers
                </p>
              </div>
              <p className="text-navy-700 leading-relaxed mb-4">
                RemodelerIQ aggregates data from the following public and licensed sources to provide our analysis. 
                <strong> We do not share your uploaded documents or personal information with these data providers.</strong>
              </p>
              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-navy-900">Bureau of Labor Statistics (BLS)</strong>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">Public Government Data</span>
                    <p className="text-navy-600 text-sm">
                      Labor wage statistics by occupation and metropolitan area from the Occupational Employment and Wage Statistics program.
                      <a href="https://www.bls.gov/oews/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center gap-1">
                        bls.gov <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-navy-900">Zonda / JLC Cost vs. Value Report</strong>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-2">Public Industry Report</span>
                    <p className="text-navy-600 text-sm">
                      Annual construction cost and resale value data for 30+ remodeling project types across U.S. regions.
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
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-2">Public Survey Data</span>
                    <p className="text-navy-600 text-sm">
                      Project cost surveys and labor percentage benchmarks from homeowner-reported data.
                      <a href="https://www.houzz.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center gap-1">
                        houzz.com <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-navy-900">Public Contractor Records</strong>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full ml-2">Public Records</span>
                    <p className="text-navy-600 text-sm">
                      Business registration, licensing databases, and public review platforms (Google, BBB, Yelp, Angi) for contractor research.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-navy-700 leading-relaxed mt-4">
                <strong>Data Flow:</strong> When you upload a bid, we query these public sources to provide context 
                for your analysis. Your bid content is never sent to these data providers—we only use their published 
                benchmark data to compare against the figures in your bid.
              </p>

              <div className="mt-6 pt-6 border-t border-emerald-100">
                <h3 className="text-lg font-medium text-navy-800 mb-3">5.1 Agentic Search & Data Grounding</h3>
                <p className="text-navy-700 leading-relaxed mb-3">
                  When you upload a bid for analysis, RemodelerIQ uses Gemini with Google Search Grounding to 
                  perform reputation and licensing research.
                </p>
                <p className="text-navy-700 leading-relaxed mb-2">
                  <strong>How it works:</strong> Our AI agents search the public web for data points related to 
                  the contractor information extracted from your bid (such as name or license number).
                </p>
                <p className="text-navy-700 leading-relaxed">
                  <strong>Your Privacy:</strong> This process is a "one-way" search. We pull data from the public 
                  domain into our analysis engine to verify the contractor; we do not share your uploaded PDF or 
                  personal account details with these public search engines or third-party databases during this process.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">6. AI Processing</h2>
              <p className="text-navy-700 leading-relaxed">
                Your uploaded bid documents are sent to AI services (Google Gemini) for analysis. These services 
                process your content to generate insights but do not retain your documents for training or other purposes 
                beyond providing the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">7. Data Retention Summary</h2>
              <div className="bg-slate-50 rounded-xl p-4 mt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 text-navy-900 font-semibold">Data Type</th>
                      <th className="text-left py-2 text-navy-900 font-semibold">Retention</th>
                    </tr>
                  </thead>
                  <tbody className="text-navy-700">
                    <tr className="border-b border-slate-100">
                      <td className="py-2">Uploaded documents (no consent)</td>
                      <td className="py-2">Not stored - processed and discarded</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2">Anonymized bid data (with consent)</td>
                      <td className="py-2">24 hours, then auto-deleted</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2">Aggregated statistics</td>
                      <td className="py-2">Indefinite (fully anonymized)</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2">Account data</td>
                      <td className="py-2">Until account deletion</td>
                    </tr>
                    <tr>
                      <td className="py-2">Payment records</td>
                      <td className="py-2">As required by law (via Stripe)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">8. Your Rights</h2>
              <p className="text-navy-700 leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-navy-700 space-y-2 ml-4">
                <li><strong>Access your data:</strong> Request a copy of the personal information we have about you</li>
                <li><strong>Delete your data:</strong> Request deletion of your account and associated data—we will honor all deletion requests</li>
                <li><strong>Correct your data:</strong> Update your account information at any time</li>
                <li><strong>Withdraw consent:</strong> Choose not to contribute data on future uploads at any time</li>
              </ul>
              <p className="text-navy-700 leading-relaxed mt-3">
                To exercise these rights, use the Settings page in the app or contact us through the feedback button.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">9. Data Security</h2>
              <p className="text-navy-700 leading-relaxed">
                We implement appropriate security measures to protect your information, including encryption in transit (HTTPS), 
                secure authentication through Google OAuth, and secure payment processing through Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">10. Cookies and Local Storage</h2>
              <p className="text-navy-700 leading-relaxed">
                We use essential cookies for authentication and session management. We also use browser local storage 
                to remember your preferences (including your data contribution preference). We do not use advertising 
                or tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">11. Children's Privacy</h2>
              <p className="text-navy-700 leading-relaxed">
                The Service is not intended for users under 18 years of age. We do not knowingly collect information 
                from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">12. Changes to This Policy</h2>
              <p className="text-navy-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by 
                updating the "Last updated" date. Continued use of the Service constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-navy-900 mb-3">13. Contact Us</h2>
              <p className="text-navy-700 leading-relaxed">
                If you have questions about this Privacy Policy or want to exercise your data rights, please contact us 
                through the feedback button in the application.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-navy-200 flex flex-wrap gap-6">
            <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Terms of Service →
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
