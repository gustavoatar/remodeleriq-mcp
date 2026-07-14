import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router";
import { AuthProvider } from "@/react-app/lib/auth";
import { CombinedAuthProvider } from "@/react-app/hooks/useCombinedAuth";
import { MessageSquareHeart } from "lucide-react";
import HomePage from "@/react-app/pages/Home";
import LaborRatesPage from "@/react-app/pages/LaborRates";
import StudioPage from "@/react-app/pages/Studio";
import JoinPage from "@/react-app/pages/Join";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import SettingsPage from "@/react-app/pages/Settings";
import PremiumPage from "@/react-app/pages/Premium";
import TermsPage from "@/react-app/pages/Terms";
import PrivacyPage from "@/react-app/pages/Privacy";
import GraveyardPage from "@/react-app/pages/Graveyard";
import HowWeScorePage from "@/react-app/pages/HowWeScore";
import GlossaryPage from "@/react-app/pages/Glossary";
import TrustedRadarPage from "@/react-app/pages/TrustedRadar";
import ToolsPage from "@/react-app/pages/Tools";
import TestPaymentPage from "@/react-app/pages/TestPayment";
import MagicLinkLoginPage from "@/react-app/pages/MagicLinkLogin";
import MagicLinkVerifyPage from "@/react-app/pages/MagicLinkVerify";
import LoginPage from "@/react-app/pages/Login";
import WebhookStatusPage from "@/react-app/pages/WebhookStatus";
import AdminPage from "@/react-app/pages/Admin";
import ContentDashboardPage from "@/react-app/pages/ContentDashboard";
import InboxPage from "@/react-app/pages/Inbox";
import RedditKitPage from "@/react-app/pages/RedditKit";
import NextdoorKitPage from "@/react-app/pages/NextdoorKit";
import FeedbackModal from "@/react-app/components/FeedbackModal";
import ScrollToTop from "@/react-app/components/ScrollToTop";
import ConciergeWidget from "@/react-app/components/ConciergeWidget";
import { ErrorBoundary } from "@/react-app/components/ErrorBoundary";
import { NetworkStatusBanner } from "@/react-app/components/AlertBanner";
import { logErrorToServer } from "@/react-app/hooks/useErrorLogger";
import { initWebMcp } from "@/react-app/lib/webmcp";

// Floating feedback button - hidden on home page (upload/results screens)
function FeedbackButton({ onClick }: { onClick: () => void }) {
  const location = useLocation();
  
  // Hide on home page where upload validation and bid results are shown
  if (location.pathname === '/') {
    return null;
  }
  
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 bg-navy-800 hover:bg-navy-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all group"
      aria-label="Share feedback"
    >
      <MessageSquareHeart className="w-5 h-5" />
      <span className="text-sm font-medium">Feedback</span>
    </button>
  );
}

export default function App() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Global error handlers for uncaught errors and unhandled promise rejections
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logErrorToServer({
        errorType: 'uncaught_error',
        errorMessage: event.message,
        errorStack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logErrorToServer({
        errorType: 'unhandled_rejection',
        errorMessage: reason?.message || String(reason),
        errorStack: reason?.stack,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Expose the analyzer tools to AI browsers via WebMCP (no-op where unsupported).
    initWebMcp();

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CombinedAuthProvider>
        <NetworkStatusBanner />
        <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/labor-rates" element={<LaborRatesPage />} />
          <Route path="/trusted-radar" element={<TrustedRadarPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          {/* /pricing has no page of its own — the server 301s it to /premium
              (public/_redirects); this covers client-side navigations. */}
          <Route path="/pricing" element={<Navigate to="/premium" replace />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/graveyard" element={<GraveyardPage />} />
          <Route path="/how-we-score" element={<HowWeScorePage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/test-payment" element={<TestPaymentPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/magic-link" element={<MagicLinkLoginPage />} />
          <Route path="/auth/verify" element={<MagicLinkVerifyPage />} />
          <Route path="/webhook-status" element={<WebhookStatusPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/content" element={<ContentDashboardPage />} />
          <Route path="/admin/inbox" element={<InboxPage />} />
          <Route path="/admin/reddit" element={<RedditKitPage />} />
          <Route path="/admin/nextdoor" element={<NextdoorKitPage />} />
        </Routes>
        <FeedbackButton onClick={() => setFeedbackOpen(true)} />
        <ConciergeWidget />
      </Router>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      </CombinedAuthProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
