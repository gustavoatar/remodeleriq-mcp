import { Lock, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { PREMIUM_MODE_ENABLED, FREE_DAILY_LIMIT } from '@/shared/featureFlags';

interface BlurredSectionProps {
  children: React.ReactNode;
  sectionName: string;
  isBlurred: boolean;
}

export default function BlurredSection({ children, sectionName, isBlurred }: BlurredSectionProps) {
  const { redirectToLogin } = useAuth();

  if (!isBlurred) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content underneath */}
      <div className="blur-sm opacity-50 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      
      {/* Overlay with CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/60 via-white/80 to-white/60 backdrop-blur-[2px] rounded-xl">
        <div className="text-center p-6 max-w-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-100 to-teal-100 flex items-center justify-center shadow-lg">
            <Lock className="w-7 h-7 text-brand-500" />
          </div>
          
          <h3 className="text-lg font-bold mb-2" style={{ color: '#333' }}>
            Unlock {sectionName}
          </h3>
          
          <p className="text-sm mb-5" style={{ color: '#555' }}>
            Create a free account to access {sectionName.toLowerCase()} and get {FREE_DAILY_LIMIT} {FREE_DAILY_LIMIT === 1 ? 'analysis' : 'analyses'} per day.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={redirectToLogin}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              style={{ backgroundColor: '#1F9C4C' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
            >
              <UserPlus className="w-5 h-5" />
              Create Free Account
            </button>
            
            {PREMIUM_MODE_ENABLED && (
              <a
                href="/premium"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                style={{ backgroundColor: '#1F9C7A' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a6b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C7A'}
              >
                <Sparkles className="w-5 h-5" />
                Get Unlimited for $19.99/mo
              </a>
            )}
          </div>
          
          {PREMIUM_MODE_ENABLED && (
            <p className="text-xs mt-4" style={{ color: '#777' }}>
              <span className="line-through">$99.99</span> Beta pricing
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
