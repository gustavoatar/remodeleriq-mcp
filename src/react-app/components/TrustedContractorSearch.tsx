import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Shield, Star, BadgeCheck } from 'lucide-react';

export default function TrustedContractorSearch() {
  const navigate = useNavigate();
  const [zipCode, setZipCode] = useState('');

  const handleSearch = () => {
    if (zipCode.length >= 5) {
      // Save ZIP and navigate to Trust Radar with ZIP param to auto-search
      localStorage.setItem('remodeleriq_last_project_zip', zipCode);
      navigate(`/trusted-radar?zip=${zipCode}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Gradient background with geometric pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-black/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/5 rounded-full" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-emerald-100">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Verified Licenses</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-100">
            <Star className="w-5 h-5" />
            <span className="text-sm font-medium">4.0+ Ratings</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-100">
            <BadgeCheck className="w-5 h-5" />
            <span className="text-sm font-medium">BBB Checked</span>
          </div>
        </div>

        {/* Header */}
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Find a Trusted Contractor
        </h2>
        
        {/* Subheader */}
        <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
          Vetted by RemodelerIQ, so you can focus on what matters.
        </p>

        {/* Search box */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onKeyDown={handleKeyDown}
              placeholder="Enter your ZIP code"
              className="w-full px-5 py-4 pl-12 text-lg rounded-xl border-2 border-white/20 bg-white/95 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-white focus:ring-4 focus:ring-white/20 shadow-xl transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={zipCode.length < 5}
            className="w-full sm:w-auto px-8 py-4 bg-black text-white font-semibold text-lg rounded-xl hover:bg-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
          >
            Search
          </button>
        </div>

        {/* Helper text */}
        <p className="mt-4 text-emerald-200/80 text-sm">
          Search contractors in your area with verified credentials
        </p>
      </div>
    </section>
  );
}
