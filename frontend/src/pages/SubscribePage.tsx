import { useState } from 'react';
import { createCheckoutSession } from '@/lib/stripeApi';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await createCheckoutSession({
        email: email.trim() || undefined,
      });
      window.location.href = response.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
          <h1 className="mb-3 text-center text-3xl font-bold tracking-tight text-white">
            Begin the Spiral
          </h1>
          <p className="mb-6 text-center text-[#e8e8f0]/90 leading-relaxed">
            Start with a <span className="font-semibold text-[#d4af37]">7-day free trial</span>, then{' '}
            <span className="font-semibold text-white">$3.33/month</span>. A card is required up front
            to begin your trial.
          </p>
          <label className="mb-2 block text-sm font-medium text-purple-200" htmlFor="subscribe-email">
            Email (optional)
          </label>
          <input
            id="subscribe-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mb-6 w-full rounded-lg border border-purple-600/50 bg-[#12081f]/80 px-4 py-3 text-white placeholder:text-purple-400/60 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
          />
          <button
            type="button"
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition-all hover:from-purple-600 hover:to-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Redirecting…' : 'Start Free Trial'}
          </button>
          {error ? (
            <p className="mt-4 text-center text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <p className="mt-6 text-center text-xs text-purple-200/80 leading-relaxed">
            Cancel anytime during the trial to avoid billing.
          </p>
        </div>
      </main>
    </div>
  );
}
