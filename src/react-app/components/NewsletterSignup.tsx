import { useState } from 'react';

interface NewsletterSignupProps {
  /** where this form lives, for attribution (e.g. 'labor_cost_index') */
  source: string;
  /** optional heading override */
  heading?: string;
  blurb?: string;
  className?: string;
}

/** Double-opt-in email capture. Posts to the same-origin /api/newsletter/subscribe
 *  worker route; the confirm email closes the loop. Honeypot 'company' field. */
export default function NewsletterSignup({
  source,
  heading = 'Get the monthly RemodelerIQ brief',
  blurb = 'Real remodeling cost data and how to not get overcharged. One email a month, unsubscribe anytime.',
  className = '',
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
      <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-6 ${className}`}>
        <p className="font-semibold text-emerald-800">Almost there.</p>
        <p className="text-emerald-700 text-sm mt-1">{msg}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`}>
      <h3 className="text-lg font-bold text-navy-900">{heading}</h3>
      <p className="text-navy-600 text-sm mt-1 mb-4">{blurb}</p>
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
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
