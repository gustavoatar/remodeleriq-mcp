import { useEffect, useState } from 'react';
import { X, Heart, Crown, Sparkles, Wrench } from 'lucide-react';

interface BetaWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BetaWelcomeModal({ isOpen, onClose }: BetaWelcomeModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-gradient-to-b from-[#1e2a4a] to-[#0f172a] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="relative px-8 py-10 text-center">
          {/* Logo icon with sparkles */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(to bottom right, #1F9C4C, #166534)' }}>
                <Wrench className="w-12 h-12 text-white/80 rotate-[-30deg]" />
              </div>
              {/* Sparkles */}
              <Sparkles className="absolute -top-3 right-0 w-6 h-6 text-emerald-400" />
              <Sparkles className="absolute top-1 -left-4 w-5 h-5 text-emerald-500" />
            </div>
          </div>

          {/* Welcome text */}
          <h2 className="text-3xl font-semibold text-white mb-6">
            Welcome
          </h2>

          {/* Lifetime Member badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6" style={{ background: 'linear-gradient(to right, rgba(31, 156, 76, 0.3), rgba(31, 156, 122, 0.3))', border: '1px solid rgba(31, 156, 76, 0.5)' }}>
            <Crown className="w-5 h-5" style={{ color: '#4ade80' }} />
            <span className="font-semibold tracking-wide" style={{ color: '#86efac' }}>LIFETIME Member</span>
          </div>

          {/* Thank you message */}
          <p className="text-white/70 text-lg mb-5">
            Thank you for your feedback!
          </p>

          {/* Signature with heart */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
            <span className="font-medium text-lg" style={{ color: '#4ade80' }}>
              Friends @RemodelerIQ
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full py-4 text-white font-semibold text-lg rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] bg-emerald-600 hover:bg-emerald-500"
          >
            Let's Get Started!
          </button>
        </div>
      </div>
    </div>
  );
}
