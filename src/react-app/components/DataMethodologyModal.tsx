import { useState } from "react";
import { HelpCircle, X, Database, TrendingUp, MapPin, Users, CheckCircle2 } from "lucide-react";

interface DataMethodologyModalProps {
  className?: string;
}

export default function DataMethodologyModal({ className = "" }: DataMethodologyModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dataSources = [
    {
      name: "Zonda Cost vs. Value 2025",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "National remodeling cost benchmarks from 30 project categories across 5 regions and 150+ cities.",
      dataDate: "2025",
      url: "https://www.remodeling.hw.net/cost-vs-value/2025/",
    },
    {
      name: "Bureau of Labor Statistics OEWS",
      icon: Database,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Occupational wage data for 16 construction trades from the Occupational Employment and Wage Statistics program.",
      dataDate: "May 2024",
      url: "https://www.bls.gov/oes/",
    },
    {
      name: "Houzz & Home Industry Surveys",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Labor-to-material ratios and project cost distributions from homeowner and contractor surveys.",
      dataDate: "2024-2025",
      url: "https://www.houzz.com/",
    },
    {
      name: "Regional Cost Adjustments",
      icon: MapPin,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "ZIP code and metropolitan area cost multipliers derived from Zonda regional data and BLS area wages.",
      dataDate: "2024-2025",
    },
  ];

  const methodologySteps = [
    {
      step: 1,
      title: "Project Identification",
      description: "We analyze your bid to identify the project type (kitchen, bathroom, roofing, etc.) and detect trade categories.",
    },
    {
      step: 2,
      title: "Location Adjustment",
      description: "We apply regional cost multipliers based on your ZIP code, city, or state to reflect local market rates.",
    },
    {
      step: 3,
      title: "Benchmark Comparison",
      description: "Your bid is compared against our multi-source database of project costs, labor rates, and industry standards.",
    },
    {
      step: 4,
      title: "Confidence Scoring",
      description: "We assess data confidence based on match quality, data freshness, and regional specificity.",
    },
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
        <span>How we calculate</span>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Our Data Methodology</h2>
                <p className="text-emerald-100 text-sm mt-0.5">How RemodelerIQ calculates your bid analysis</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Data Sources */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Data Sources
                </h3>
                <div className="grid gap-3">
                  {dataSources.map((source) => (
                    <div 
                      key={source.name}
                      className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className={`p-2 rounded-lg ${source.bgColor}`}>
                        <source.icon className={`w-5 h-5 ${source.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-900">{source.name}</h4>
                          <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                            {source.dataDate}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{source.description}</p>
                        {source.url && (
                          <a 
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 inline-block"
                          >
                            View source →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology Steps */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  How We Analyze Your Bid
                </h3>
                <div className="space-y-3">
                  {methodologySteps.map((step) => (
                    <div 
                      key={step.step}
                      className="flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {step.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{step.title}</h4>
                        <p className="text-sm text-slate-600 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Note */}
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-sm text-emerald-800">
                  <strong>Our commitment:</strong> RemodelerIQ uses only publicly available, authoritative data sources. 
                  We regularly update our benchmarks to reflect current market conditions. 
                  All analyses are estimates and should be used alongside professional advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
