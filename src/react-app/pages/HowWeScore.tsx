import { Link } from 'react-router';
import { 
  Shield, FileText, DollarSign, MapPin, Database, 
  CheckCircle, Briefcase, ArrowRight, Target, HelpCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import RelatedLinks from '@/react-app/components/RelatedLinks';
import TrustedContractorSearch from '@/react-app/components/TrustedContractorSearch';
import PageSEO from '@/react-app/components/PageSEO';

// FAQ data for both display and schema
const FAQ_DATA = [
  {
    question: "What does RemodelerIQ analyze?",
    answer: "RemodelerIQ analyzes contractor bids and estimates for home remodeling projects. We examine pricing against market rates, identify missing scope items, flag risky contract terms, verify contractor credentials, and provide region-specific insights. Our analysis covers kitchen remodels, bathroom renovations, roofing, HVAC, electrical work, plumbing, decks, basements, and most other residential construction projects."
  },
  {
    question: "How is my bid score calculated?",
    answer: "Your bid receives a Unified Confidence Score from 0-100 based on three weighted factors: Contract Risk (40%) examines payment terms, deposits, and legal protections; Scope Completeness (30%) identifies missing items and vague language; Price Reasonableness (30%) compares your bid against regional market data. Higher scores indicate lower risk. We also factor in trust bonuses for verified contractor credentials like licenses, insurance, and positive reviews."
  },
  {
    question: "What's a lowball bid and why is it risky?",
    answer: "A lowball bid is significantly below market rates—typically 25-40% under what comparable projects cost in your area. While tempting, lowball bids often signal problems: the contractor may cut corners on materials, use unqualified labor, abandon the project mid-way, or hit you with change orders that inflate the final price beyond market rate. Our analysis flags lowball bids and explains the specific risks for your project type."
  },
  {
    question: "What permits do I need for my remodel?",
    answer: "Permit requirements vary by project type and location. Generally, structural changes, electrical work, plumbing modifications, HVAC installations, roofing, and additions require permits. Cosmetic work like painting, flooring, and cabinet refacing typically doesn't. RemodelerIQ flags when your project likely requires permits and warns you if the bid doesn't address permitting—a red flag that the contractor may be cutting corners or leaving you liable."
  },
  {
    question: "How do I know if a contractor is licensed?",
    answer: "Our Contractor Pulse feature automatically extracts contractor information from your bid and provides direct links to your state's license verification database. We support all 50 states and know each state's licensing requirements—some states require general contractor licenses, others license by trade. We'll tell you exactly what to look for and flag bids that don't include license numbers when they should."
  }
];

// FAQ Schema component for SEO
function FAQSchema() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_DATA.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

// FAQ Accordion Item
function FAQItem({ question, answer, isOpen, onToggle }: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onToggle: () => void; 
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {answer}
        </div>
      )}
    </div>
  );
}

// FAQ Section
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <FAQSchema />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 mx-auto">
            <HelpCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Common questions about how RemodelerIQ analyzes your contractor bids.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_DATA.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            For a deeper dive on reading contractor estimates, check out our{' '}
            <a 
              href="https://intelligence.remodeleriq.com/how-to-read-a-contractors-estimate-a-homeowners-guide/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              complete homeowner's guide
            </a>.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function HowWeScorePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageSEO
        title="How We Score Contractor Bids"
        description="Learn how RemodelerIQ analyzes contractor bids using data from BLS, Houzz, and Zonda. Understand our scoring methodology for contract risk, scope completeness, and price reasonableness."
        path="/how-we-score"
        keywords="bid scoring methodology, contractor analysis, remodeling cost data, bid evaluation, construction estimate review"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(to bottom, #e8f5e9 0%, #f0fdf4 50%, #ffffff 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 rounded-full mb-6">
            <Target className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Our Methodology</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
            How We Score <span className="text-emerald-600">Your Bid</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transparent analysis backed by real data, so you can negotiate like a pro.
          </p>
        </div>
      </section>

      {/* Score Overview Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Your Project's Health Check
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our Unified Confidence Score isn't just a number—it's your project's health check. 
                We weigh the contract risk, the price, and the scope to tell you if you're looking 
                at a "Great Deal" or a future headache.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">0-100 Score</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <img 
                src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/image.png_4506.png" 
                alt="Score breakdown showing unified confidence score"
                className="w-full rounded-xl shadow-lg"
              />
              <p className="text-sm text-gray-500 text-center mt-4">
                Confidence score with detailed analysis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Three Pillars Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The Three Pillars of Your Score
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every bid is evaluated across three critical dimensions, each weighted by importance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Contract Risk */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-gray-900">Contract Risk</h3>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">40%</span>
              </div>
              <p className="text-gray-600">
                Red flags, missing protections, risky payment terms, and legal compliance issues 
                that could leave you exposed.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Payment schedule analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Deposit risk detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  State law compliance
                </li>
              </ul>
            </div>

            {/* Scope Completeness */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-gray-900">Scope Completeness</h3>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">30%</span>
              </div>
              <p className="text-gray-600">
                What's included versus what's missing—identifying gaps that could become 
                surprise costs later.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Missing items detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Vague language flags
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Permit requirements
                </li>
              </ul>
            </div>

            {/* Price Reasonableness */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-gray-900">Price Check</h3>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">30%</span>
              </div>
              <p className="text-gray-600">
                How your bid stacks up against market rates—detecting both overpricing 
                and suspiciously low bids.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Market rate comparison
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Lowball detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Labor rate validation
                </li>
              </ul>
            </div>
          </div>


        </div>
      </section>

      {/* Regional Intelligence Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 mx-auto">
            <MapPin className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Regional Intelligence
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Construction costs in NYC aren't the same as in Houston. We use real-time data 
            from 45+ major markets and all 50 states to make sure your local contractor's 
            bid is actually based on local reality.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <span className="px-3 py-1.5 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              45+ Metro Areas
            </span>
            <span className="px-3 py-1.5 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              All 50 States
            </span>
            <span className="px-3 py-1.5 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              ZIP Code Precision
            </span>
          </div>
        </div>
      </section>

      {/* Data Sources Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 mx-auto">
              <Database className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Our Data Sources
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We use both private and publicly available data from trusted industry sources—no 
              guesswork, no estimates pulled from thin air.
            </p>
          </div>

          {/* Data partner logos with descriptions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-6 max-w-7xl mx-auto">
            {/* Houzz */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/Houzz-Emblem1.png" 
                  alt="Houzz" 
                  className="h-12 md:h-14 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Houzz 2024 Guides</h3>
              <p className="text-xs text-gray-600 leading-tight">
                Project cost ranges and labor percentages from real homeowner projects.
              </p>
            </div>

            {/* BLS */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/bls-logo.png" 
                  alt="Bureau of Labor Statistics" 
                  className="h-12 md:h-14 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">BLS OEWS Data</h3>
              <p className="text-xs text-gray-600 leading-tight">
                Real hourly wage data for construction trades by metro area, updated annually.
              </p>
            </div>

            {/* FRED */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/FRED_Logo_Header.svg" 
                  alt="FRED - Federal Reserve Economic Data" 
                  className="h-10 md:h-12 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">FRED Cost Index</h3>
              <p className="text-xs text-gray-600 leading-tight">
                Federal Reserve construction cost index for real-time inflation adjustments.
              </p>
            </div>

            {/* Zonda */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/Primary_Logo_TM_Large4zonda.png" 
                  alt="Zonda" 
                  className="h-8 md:h-10 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Zonda Cost vs Value</h3>
              <p className="text-xs text-gray-600 leading-tight">
                National remodeling cost benchmarks for 30+ project types across all US regions.
              </p>
            </div>

            {/* Google */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/google.svg" 
                  alt="Google" 
                  className="h-10 md:h-12 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Google Reviews</h3>
              <p className="text-xs text-gray-600 leading-tight">
                Real-time business reviews and ratings from Google Maps.
              </p>
            </div>

            {/* BBB */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/Better_Business_Bureau.svg" 
                  alt="Better Business Bureau" 
                  className="h-12 md:h-14 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Better Business Bureau</h3>
              <p className="text-xs text-gray-600 leading-tight">
                BBB ratings and complaint history for contractor trust verification.
              </p>
            </div>

            {/* Angi */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/AngiRectangle3.webp" 
                  alt="Angi" 
                  className="h-12 md:h-14 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Angi Reviews</h3>
              <p className="text-xs text-gray-600 leading-tight">
                Contractor reviews, ratings, and business verification data.
              </p>
            </div>

            {/* Yelp */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Yelp_Logo.svg" 
                  alt="Yelp" 
                  className="h-10 md:h-12 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Yelp Reviews</h3>
              <p className="text-xs text-gray-600 leading-tight">
                Local business reviews and contractor reputation insights.
              </p>
            </div>

            {/* Reddit */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/Reddit-Logo.wine.svg" 
                  alt="Reddit" 
                  className="h-10 md:h-12 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Reddit Communities</h3>
              <p className="text-xs text-gray-600 leading-tight">
                Real homeowner experiences and regional contractor warnings from community discussions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Pulse Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6 mx-auto">
            <img 
              src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/Reddit-Logo.wine.svg" 
              alt="Reddit" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Community Pulse: Real Homeowner Insights
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            We analyze thousands of Reddit discussions from communities like r/HomeImprovement, 
            r/Construction, and regional subreddits to surface real homeowner experiences. 
            Our AI synthesizes community sentiment about your project type and identifies 
            region-specific warnings—like humidity concerns in Georgia or seismic requirements 
            in California—that contractors sometimes overlook.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <span className="px-3 py-1.5 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              r/HomeImprovement
            </span>
            <span className="px-3 py-1.5 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              Regional Subreddits
            </span>
            <span className="px-3 py-1.5 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              50 State Insights
            </span>
          </div>
        </div>
      </section>

      {/* Trust Verification Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Contractor Trust Verification
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Beyond pricing, we verify the contractor themselves. Our Contractor Pulse feature 
                checks licenses, reviews, and business history so you know who you're dealing with.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>State license verification for all 50 states</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Google Reviews and BBB complaint lookup</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Travel distance risk analysis</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Insurance and bonding indicators</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <img 
                src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/image.png_0844.png" 
                alt="Contractor Pulse verification card"
                className="w-full rounded-xl shadow-lg"
              />
              <p className="text-sm text-gray-500 text-center mt-4">
                Contractor Pulse trust verification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-emerald-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Score Your Bid?
          </h2>
          <p className="text-lg text-emerald-100 mb-8">
            Upload your contractor's estimate and get instant, data-backed analysis.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            Analyze Your Bid
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Trusted Contractor Search */}
      <TrustedContractorSearch />

      {/* Related Pages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RelatedLinks currentPath="/how-we-score" />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
