import { Link } from 'react-router';
import { BookOpen, ArrowRight, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import TrustedContractorSearch from '@/react-app/components/TrustedContractorSearch';
import PageSEO from '@/react-app/components/PageSEO';
import RelatedLinks from '@/react-app/components/RelatedLinks';

// Glossary terms with quotable definitions for AI systems
const GLOSSARY_TERMS = [
  {
    term: "Scope of Work",
    definition: "A detailed written description of all tasks, materials, and deliverables included in a construction project. The scope of work defines exactly what the contractor will do and what they won't do.",
    category: "Contract Terms"
  },
  {
    term: "Change Order",
    definition: "A formal document that modifies the original contract after work has begun. Change orders typically add cost and time to a project when unforeseen conditions arise or the homeowner requests additional work.",
    category: "Contract Terms"
  },
  {
    term: "Allowances",
    definition: "A predetermined budget amount included in a contract for items not yet selected, such as fixtures, appliances, or finishes. If the actual cost exceeds the allowance, the homeowner pays the difference.",
    category: "Pricing"
  },
  {
    term: "Retainage",
    definition: "A percentage of the contract amount (typically 5-10%) withheld until project completion. Retainage protects homeowners by ensuring contractors complete all work including punch list items.",
    category: "Payment Terms"
  },
  {
    term: "Lien Waiver",
    definition: "A legal document signed by contractors and subcontractors confirming they have been paid and waiving their right to place a mechanic's lien on the property. Always collect lien waivers with each payment.",
    category: "Legal Protection"
  },
  {
    term: "COI (Certificate of Insurance)",
    definition: "A document proving a contractor carries liability insurance and workers' compensation coverage. Request a COI listing you as the certificate holder before work begins.",
    category: "Legal Protection"
  },
  {
    term: "Punch List",
    definition: "A list of minor items that need to be completed or corrected before a project is considered finished. The punch list is created during the final walkthrough and must be resolved before final payment.",
    category: "Project Completion"
  },
  {
    term: "Mechanic's Lien",
    definition: "A legal claim a contractor or supplier can place on your property if they aren't paid for work or materials. Mechanic's liens can affect your ability to sell or refinance your home.",
    category: "Legal Protection"
  },
  {
    term: "General Contractor (GC)",
    definition: "The primary contractor responsible for overseeing a construction project. The GC hires and coordinates subcontractors, obtains permits, and is accountable for project completion.",
    category: "Contractors"
  },
  {
    term: "Subcontractor",
    definition: "A specialist contractor hired by the general contractor to perform specific work like plumbing, electrical, or HVAC. Subcontractors are paid by the GC, not directly by the homeowner.",
    category: "Contractors"
  },
  {
    term: "Bid",
    definition: "A formal price proposal from a contractor to complete a specified scope of work. Bids should detail labor costs, material costs, timeline, and payment terms.",
    category: "Pricing"
  },
  {
    term: "Estimate",
    definition: "An approximation of project costs, typically less binding than a bid. Estimates often include ranges and may change once the contractor assesses the actual job conditions.",
    category: "Pricing"
  },
  {
    term: "Cost-Plus Contract",
    definition: "A contract where the homeowner pays actual costs for materials and labor, plus a markup percentage (typically 10-20%) for the contractor's overhead and profit.",
    category: "Contract Terms"
  },
  {
    term: "Fixed-Price Contract",
    definition: "A contract with a set total price that won't change unless the scope of work changes. Fixed-price contracts provide cost certainty but may include a buffer for contractor risk.",
    category: "Contract Terms"
  },
  {
    term: "Time and Materials (T&M)",
    definition: "A billing method where the homeowner pays for actual hours worked plus materials used. T&M contracts are common for repairs where scope is uncertain upfront.",
    category: "Pricing"
  },
  {
    term: "Permit",
    definition: "Official approval from local government required before starting certain construction work. Permits ensure work meets building codes and trigger inspections at key milestones.",
    category: "Legal Protection"
  },
  {
    term: "Building Code",
    definition: "Regulations established by local or state government that set minimum standards for construction safety, structural integrity, and habitability.",
    category: "Legal Protection"
  },
  {
    term: "Rough-In",
    definition: "The phase of construction when mechanical systems (plumbing, electrical, HVAC) are installed inside walls before drywall is hung. Rough-in work must pass inspection before covering.",
    category: "Construction Phases"
  },
  {
    term: "Finish Work",
    definition: "The final construction phase including trim, painting, flooring installation, fixture installation, and other visible details that complete a project.",
    category: "Construction Phases"
  },
  {
    term: "Deposit",
    definition: "An upfront payment required before work begins. Reasonable deposits are typically 10-25% of the project total. Be wary of contractors requesting 50% or more upfront.",
    category: "Payment Terms"
  },
  {
    term: "Progress Payments",
    definition: "Payments made at predetermined project milestones rather than all at once. Progress payments protect both parties by tying payments to completed work.",
    category: "Payment Terms"
  },
  {
    term: "Warranty",
    definition: "A contractor's guarantee to repair defects in workmanship or materials for a specified period after project completion. Typical workmanship warranties are 1-2 years.",
    category: "Legal Protection"
  },
  {
    term: "Load-Bearing Wall",
    definition: "A wall that supports weight from above, such as upper floors or the roof. Removing or modifying load-bearing walls requires structural engineering and permits.",
    category: "Structural"
  },
  {
    term: "Square Footage (SF)",
    definition: "The area of a space measured in square feet. Many contractors price work on a per-square-foot basis, making SF a critical metric for comparing bids.",
    category: "Pricing"
  },
  {
    term: "Unit Price",
    definition: "A fixed price per unit of work, such as price per window installed or per square foot of flooring. Unit pricing makes it easy to compare bids for similar work.",
    category: "Pricing"
  }
];

// Group terms by category
const CATEGORIES = [...new Set(GLOSSARY_TERMS.map(t => t.category))].sort();

// Schema.org structured data for glossary
function GlossarySchema() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "name": "RemodelerIQ Construction Glossary",
    "description": "Definitions of common construction and home remodeling terms for homeowners",
    "hasDefinedTerm": GLOSSARY_TERMS.map(term => ({
      "@type": "DefinedTerm",
      "name": term.term,
      "description": term.definition
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(term => {
      const matchesSearch = searchQuery === '' || 
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === null || term.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const groupedTerms = useMemo(() => {
    const groups: Record<string, typeof GLOSSARY_TERMS> = {};
    filteredTerms.forEach(term => {
      if (!groups[term.category]) {
        groups[term.category] = [];
      }
      groups[term.category].push(term);
    });
    return groups;
  }, [filteredTerms]);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageSEO
        title="Remodeling Glossary - Construction Terms Explained"
        description="Understand contractor bids with our comprehensive glossary of home remodeling and construction terms. Learn about scope of work, change orders, allowances, retainage, and more."
        path="/glossary"
        keywords="construction glossary, remodeling terms, contractor terminology, home improvement definitions, building vocabulary"
      />
      <GlossarySchema />
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(to bottom, #e8f5e9 0%, #f0fdf4 50%, #ffffff 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 rounded-full mb-6">
            <BookOpen className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Construction Terms</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
            Remodeling <span className="text-emerald-600">Glossary</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Understand contractor language and protect yourself with these essential construction terms.
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {/* Search Input - Full Width */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
              />
            </div>
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Terms List */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {Object.keys(groupedTerms).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No terms found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedTerms).sort().map(([category, terms]) => (
                <div key={category}>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {category}
                  </h2>
                  <div className="space-y-4">
                    {terms.sort((a, b) => a.term.localeCompare(b.term)).map((item) => (
                      <div 
                        key={item.term}
                        className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-lg font-bold text-emerald-700 mb-2">
                          {item.term}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {item.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-emerald-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Analyze Your Bid?
          </h2>
          <p className="text-lg text-emerald-100 mb-8">
            Now that you know the terminology, upload your contractor's estimate for instant analysis.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            Try RemodelerIQ
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Trusted Contractor Search */}
      <TrustedContractorSearch />

      {/* Related Pages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RelatedLinks currentPath="/glossary" />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
