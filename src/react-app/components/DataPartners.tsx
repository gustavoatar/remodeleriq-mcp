/**
 * Data Partners module showing trusted data sources
 */

import { Link } from 'react-router';

const partners = [
  {
    name: 'Houzz',
    logo: 'https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/Houzz-Emblem1.png',
    description: 'Project cost ranges and labor percentages from real homeowner projects.',
    height: 'h-12 md:h-14',
  },
  {
    name: 'Bureau of Labor Statistics',
    logo: 'https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/bls-logo.png',
    description: 'Real hourly wage data for construction trades by metro area.',
    height: 'h-12 md:h-14',
  },
  {
    name: 'FRED',
    logo: 'https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/FRED_Logo_Header.svg',
    description: 'Federal Reserve construction cost index for real-time inflation adjustments.',
    height: 'h-10 md:h-12',
  },
  {
    name: 'Zonda',
    logo: 'https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/Primary_Logo_TM_Large4zonda.png',
    description: 'National remodeling cost benchmarks for 30+ project types.',
    height: 'h-8 md:h-10',
  },
  {
    name: 'Google',
    logo: 'https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/google.svg',
    description: 'Real-time business reviews and ratings from Google Maps.',
    height: 'h-10 md:h-12',
  },
  {
    name: 'Better Business Bureau',
    logo: 'https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/Better_Business_Bureau.svg',
    description: 'BBB ratings and complaint history for contractor trust verification.',
    height: 'h-12 md:h-14',
  },
  {
    name: 'Angi',
    logo: 'https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/AngiRectangle3.webp',
    description: 'Contractor reviews, ratings, and business verification data.',
    height: 'h-12 md:h-14',
  },
  {
    name: 'Yelp',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Yelp_Logo.svg',
    description: 'Local business reviews and contractor reputation insights.',
    height: 'h-10 md:h-12',
  },
  {
    name: 'Reddit',
    logo: 'https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/Reddit-Logo.wine.svg',
    description: 'Real homeowner experiences and regional contractor warnings from community discussions.',
    height: 'h-10 md:h-12',
  },
];

export default function DataPartners() {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-black mb-12">
          RemodelerIQ Data Partners
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-6 max-w-7xl mx-auto">
          {partners.map((partner) => (
            <div key={partner.name} className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-20 mb-3">
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  className={`${partner.height} w-auto object-contain`}
                />
              </div>
              <p className="text-xs text-gray-600 leading-tight">
                {partner.description}
              </p>
            </div>
          ))}
        </div>

        {/* How We Score Button */}
        <div className="flex justify-center mt-10">
          <Link 
            to="/how-we-score"
            className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: '#1F9C4C' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
          >
            How We Score
          </Link>
        </div>
      </div>
    </div>
  );
}
