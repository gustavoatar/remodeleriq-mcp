import { useState } from 'react';

interface NewsletterSignupProps {
  /** where this form lives, for attribution (e.g. 'labor_cost_index') */
  source: string;
  /** optional heading override */
  heading?: string;
  blurb?: string;
  className?: string;
  /** dark variant for use on black backgrounds (footer) */
  dark?: boolean;
}

/** Double-opt-in email capture. Posts to the same-origin /api/newsletter/subscribe
 *  worker route; the confirm email closes the loop. Honeypot 'company' field. */
export default function NewsletterSignup({
  source,
  heading = 'Know what your remodel should cost',
  blurb = 'Join homeowners getting the monthly RemodelerIQ brief: real 2026 cost data by city, and the red flags that mean you\'re overpaying. One email a month, free, unsubscribe anytime.',
  className = '',
  dark = false,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('sending');
    setMsg('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source, company }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setMsg(data.error || 'Something went wrong. Try again.');
        return;
      }
      setState('done');
      setMsg("Check your inbox to confirm — we just sent a one-click confirmation.");
    } catch {
      setState('error');
      setMsg('Network error. Try again.');
    }
  };

  if (state === 'done') {
    return (
      <div className={`rounded-2xl border p-6 ${dark ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'} ${className}`}>
        <p className={`font-semibold ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>Almost there.</p>
        <p className={`text-sm mt-1 ${dark ? 'text-emerald-200/90' : 'text-emerald-700'}`}>{msg}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-6 ${dark ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-white'} ${className}`}>
      <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-navy-900'}`}>{heading}</h3>
      <p className={`text-sm mt-1 mb-4 ${dark ? 'text-gray-300' : 'text-navy-600'}`}>{blurb}</p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        {/* honeypot — hidden from humans */}
        <input
          type="text"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400/40 ${dark ? 'border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:border-emerald-400' : 'border border-slate-200 focus:border-emerald-400 focus:ring-emerald-100'}`}
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="rounded-xl bg-emerald-600 text-white px-6 py-2.5 font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          {state === 'sending' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {state === 'error' && <p className="text-rose-600 text-sm mt-2">{msg}</p>}
    </div>
  );
}
