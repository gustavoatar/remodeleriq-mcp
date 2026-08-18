import PageSEO from '@/react-app/components/PageSEO';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import NewsletterSignup from '@/react-app/components/NewsletterSignup';
import { BarChart3, ShieldCheck, MailCheck } from 'lucide-react';

export default function NewsletterLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageSEO path="/newsletter" ogType="website" />
      <Header />
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-5">
            Free · Monthly · No spam
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-navy-900 mb-4 leading-tight">
            Know what your remodel should cost
          </h1>
          <p className="text-lg text-navy-600 leading-relaxed mb-8 max-w-xl mx-auto">
            Join the monthly RemodelerIQ brief — real 2026 cost data by city and the
            red flags that mean you're overpaying. One email a month, unsubscribe
            anytime.
          </p>

          <NewsletterSignup source="newsletter_page" heading="Subscribe free" blurb="Enter your email and we'll send a one-click confirmation." className="text-left" />

          <div className="grid sm:grid-cols-3 gap-4 mt-12 text-left">
            <Perk icon={<BarChart3 className="w-5 h-5" />} title="Real cost data" body="What trades actually charge in your metro, from live BLS labor data." />
            <Perk icon={<ShieldCheck className="w-5 h-5" />} title="Avoid overpaying" body="The bid red flags and negotiation angles most homeowners miss." />
            <Perk icon={<MailCheck className="w-5 h-5" />} title="Never spammy" body="One useful email a month. We promise. Unsubscribe in one click." />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Perk({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-bold text-navy-900 mb-1">{title}</h3>
      <p className="text-sm text-navy-600 leading-relaxed">{body}</p>
    </div>
  );
}
