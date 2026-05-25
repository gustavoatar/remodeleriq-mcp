import { X, User, LogOut, Settings, Crown, ChevronDown, BarChart3, Newspaper, BookOpen, Target, Radar, FileText, Palette } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useCombinedAuth } from '@/react-app/hooks/useCombinedAuth';
import { PREMIUM_MODE_ENABLED } from '@/shared/featureFlags';

interface HeaderProps {
  onHomeClick?: () => void;
  onAnalyzeClick?: () => void;
  onNavigateAway?: () => void;
}

export default function Header({ onHomeClick, onAnalyzeClick, onNavigateAway }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isPending, logout } = useCombinedAuth();

  // Get profile data
  const profile = user?.profile;
  const isPremium = profile?.isPremium;
  
  // Check if current page is one of the tools pages
  const isToolsActive = location.pathname === '/labor-rates' || location.pathname === '/trusted-radar' || location.pathname === '/studio';
  const isLaborRatesActive = location.pathname === '/labor-rates';
  const isTrustedRadarActive = location.pathname === '/trusted-radar';
  const isStudioActive = location.pathname === '/studio';
  
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      return;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (onHomeClick) {
      onHomeClick();
    }
  };

  const handleLogin = () => {
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a 
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img 
              src="/mocha-assets/remodeler-iq-2x-logo-reverse.svg" 
              alt="RemodelerIQ" 
              className="h-14"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {/* Remodeler Tools Dropdown - outline style */}
            <div 
              className="relative" 
              ref={toolsMenuRef}
            >
              <button
                onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                onMouseEnter={() => setToolsMenuOpen(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
                  isToolsActive 
                    ? 'text-white' 
                    : 'border-gray-600 hover:border-gray-400 text-gray-200'
                }`}
                style={isToolsActive ? { borderColor: '#1F9C4C', color: '#4ade80' } : undefined}
              >
                Remodeler Tools
                <ChevronDown className={`w-4 h-4 transition-transform ${toolsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Dropdown Menu */}
              {toolsMenuOpen && (
                <div 
                  className="absolute left-0 top-full pt-2 w-64 z-[9999]"
                  onMouseEnter={() => setToolsMenuOpen(true)}
                  onMouseLeave={() => setToolsMenuOpen(false)}
                >
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                    {/* Labor Rate Intelligence */}
                    <button
                      onClick={() => {
                        setToolsMenuOpen(false);
                        onNavigateAway?.();
                        navigate('/labor-rates');
                      }}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors w-full text-left ${
                        isLaborRatesActive 
                          ? 'bg-brand-50 text-brand-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isLaborRatesActive ? 'bg-brand-100' : 'bg-gray-100'
                      }`}>
                        <BarChart3 className={`w-5 h-5 ${isLaborRatesActive ? 'text-brand-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Labor Rate Intelligence</p>
                        <p className="text-xs text-gray-500">Market rates & analysis</p>
                      </div>
                      {isLaborRatesActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-brand-500" />
                      )}
                    </button>
                    
                    {/* Trust Radar */}
                    <button
                      onClick={() => {
                        setToolsMenuOpen(false);
                        onNavigateAway?.();
                        navigate('/trusted-radar');
                      }}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors w-full text-left ${
                        isTrustedRadarActive 
                          ? 'bg-brand-50 text-brand-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isTrustedRadarActive ? 'bg-brand-100' : 'bg-gray-100'
                      }`}>
                        <Radar className={`w-5 h-5 ${isTrustedRadarActive ? 'text-brand-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Trust Radar</p>
                        <p className="text-xs text-gray-500">Search trusted PROs</p>
                      </div>
                      {isTrustedRadarActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-brand-500" />
                      )}
                    </button>
                    
                    {/* Remodeler Studio */}
                    <button
                      onClick={() => {
                        setToolsMenuOpen(false);
                        onNavigateAway?.();
                        navigate('/studio');
                      }}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors w-full text-left ${
                        isStudioActive 
                          ? 'bg-brand-50 text-brand-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isStudioActive ? 'bg-brand-100' : 'bg-gray-100'
                      }`}>
                        <Palette className={`w-5 h-5 ${isStudioActive ? 'text-brand-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Remodeler Studio</p>
                        <p className="text-xs text-gray-500">Project planning & estimates</p>
                      </div>
                      {isStudioActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-brand-500" />
                      )}
                    </button>
                    {/* Intelligence Blog */}
                    <a
                      href="https://intelligence.remodeleriq.com/blog/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setToolsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors text-gray-700 hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                        <Newspaper className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Insights & Perspective</p>
                        <p className="text-xs text-gray-500">Industry intelligence blog</p>
                      </div>
                    </a>
                    
                    {/* Remodeling Cost Guides */}
                    <a
                      href="https://intelligence.remodeleriq.com/remodeling-cost-guides/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setToolsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors text-gray-700 hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Remodeling Guides</p>
                        <p className="text-xs text-gray-500">Cost guides by city</p>
                      </div>
                    </a>
                    
                    <div className="border-t border-gray-100 my-2" />
                    
                    {/* How We Score */}
                    <button
                      onClick={() => {
                        setToolsMenuOpen(false);
                        onNavigateAway?.();
                        navigate('/how-we-score');
                      }}
                      className="flex items-center gap-3 px-4 py-3 transition-colors text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                        <Target className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">How We Score</p>
                        <p className="text-xs text-gray-500">Our methodology & FAQ</p>
                      </div>
                    </button>
                    
                    {/* Glossary */}
                    <button
                      onClick={() => {
                        setToolsMenuOpen(false);
                        onNavigateAway?.();
                        navigate('/glossary');
                      }}
                      className="flex items-center gap-3 px-4 py-3 transition-colors text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                        <BookOpen className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Glossary</p>
                        <p className="text-xs text-gray-500">Construction terms defined</p>
                      </div>
                    </button>
                    
                    {/* Premium Membership - only show when premium mode enabled */}
                    {PREMIUM_MODE_ENABLED && (
                      <>
                        <div className="border-t border-gray-100 my-2" />
                        <button
                          onClick={() => {
                            setToolsMenuOpen(false);
                            // Logged-in users go to premium checkout, guests go to join/signup
                            navigate(user ? '/premium' : '/join');
                          }}
                          className="flex items-center gap-3 px-4 py-3 transition-colors text-gray-700 hover:bg-gray-50 w-full text-left"
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100">
                            <Crown className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Premium Membership</p>
                            <p className="text-xs text-gray-500">Unlock all features</p>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Analyze Bid - green button */}
            <button 
              onClick={() => {
                if (onAnalyzeClick) {
                  onAnalyzeClick();
                } else {
                  navigate('/');
                }
              }}
              className="text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg"
              style={{ backgroundColor: '#1F9C4C' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
            >
              Analyze Bid
            </button>

            {/* Auth Section */}
            {isPending ? (
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  {user.picture ? (
                    <img 
                      src={user.picture} 
                      alt="Your profile" 
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1F9C4C' }}>
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {PREMIUM_MODE_ENABLED && isPremium && (
                    <Crown className="w-4 h-4 text-brand-400" />
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[9999]">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {PREMIUM_MODE_ENABLED && isPremium && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-100 text-brand-600 rounded-full text-xs font-medium mt-1">
                          <Crown className="w-3 h-3" />
                          Premium
                        </span>
                      )}
                    </div>
                    
                    {/* Upgrade to Premium - only show when premium mode enabled */}
                    {PREMIUM_MODE_ENABLED && !isPremium && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/premium');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:bg-brand-50 transition-colors w-full text-left"
                      >
                        <Crown className="w-4 h-4" />
                        <span className="text-sm font-medium">Upgrade to Premium</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 border border-gray-600 hover:border-gray-400 hover:bg-gray-800 text-gray-200 rounded-lg font-medium text-sm transition-all"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="8" x2="21" y2="8" />
                <line x1="3" y1="16" x2="21" y2="16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col gap-2">
              {/* User info on mobile */}
              {user && (
                <div className="flex items-center gap-3 px-2 py-3 mb-2 bg-gray-800 rounded-xl">
                  {user.picture ? (
                    <img 
                      src={user.picture} 
                      alt="Your profile" 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1F9C4C' }}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  {PREMIUM_MODE_ENABLED && isPremium && (
                    <span className="px-2 py-0.5 bg-brand-900/50 text-brand-400 rounded-full text-xs font-medium">
                      <Crown className="w-3 h-3 inline mr-1" />
                      Premium
                    </span>
                  )}
                </div>
              )}
              
              {/* Mobile Remodeler Tools Section */}
              <div className="py-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Remodeler Tools
                </p>
                <div className="space-y-1 pl-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateAway?.();
                      navigate('/labor-rates');
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${
                      isLaborRatesActive 
                        ? 'bg-brand-900/50 text-brand-400' 
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-medium">Labor Rate Intelligence</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateAway?.();
                      navigate('/trusted-radar');
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${
                      isTrustedRadarActive 
                        ? 'bg-brand-900/50 text-brand-400' 
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Radar className="w-5 h-5" />
                    <span className="font-medium">Trust Radar</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateAway?.();
                      navigate('/studio');
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${
                      isStudioActive 
                        ? 'bg-brand-900/50 text-brand-400' 
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Palette className="w-5 h-5" />
                    <span className="font-medium">Remodeler Studio</span>
                  </button>
                  <a
                    href="https://intelligence.remodeleriq.com/blog/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-300 hover:bg-gray-800"
                  >
                    <Newspaper className="w-5 h-5" />
                    <span className="font-medium">Insights & Perspective</span>
                  </a>
                  <a
                    href="https://intelligence.remodeleriq.com/remodeling-cost-guides/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-300 hover:bg-gray-800"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Remodeling Guides</span>
                  </a>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateAway?.();
                      navigate('/how-we-score');
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 w-full text-left"
                  >
                    <Target className="w-5 h-5" />
                    <span className="font-medium">How We Score</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateAway?.();
                      navigate('/glossary');
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 w-full text-left"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Glossary</span>
                  </button>
                </div>
              </div>
              
              {user && (
                <>
                  {/* Upgrade to Premium - only show when premium mode enabled */}
                  {PREMIUM_MODE_ENABLED && !isPremium && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/premium');
                      }}
                      className="flex items-center gap-2 text-brand-400 font-medium py-2 w-full text-left"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to Premium
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center gap-2 text-gray-300 font-medium py-2 w-full text-left"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </>
              )}

              <button 
                onClick={() => {
                  if (onAnalyzeClick) {
                    onAnalyzeClick();
                  } else {
                    navigate('/');
                  }
                  setMobileMenuOpen(false);
                }}
                className="text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all w-full mt-2"
                style={{ backgroundColor: '#1F9C4C' }}
              >
                Analyze Bid
              </button>

              {/* Auth button */}
              {!isPending && (
                user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg font-medium text-sm transition-all mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-600 text-gray-200 rounded-lg font-medium text-sm transition-all mt-2"
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </button>
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
