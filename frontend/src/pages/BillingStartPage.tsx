import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { createCheckoutSession } from '@/lib/billingApi';

export default function BillingStartPage() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      setIsSubmitting(true);
      const { url } = await createCheckoutSession({
        email,
        successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
      });
      window.location.href = url;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-3xl border border-purple-700/40 bg-purple-950/45 p-8 shadow-2xl backdrop-blur space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-purple-300">Membership Checkout</p>
            <h1 className="text-4xl font-bold text-white">Start your first week.</h1>
            <p className="text-lg text-purple-100/85">
              Card on file now. Your first 7 days are free. After that, billing continues at $3.33/month unless you cancel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2 text-sm text-purple-200">
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-purple-700/50 bg-purple-900/50 px-4 py-3 text-white outline-none transition focus:border-purple-500"
                placeholder="you@example.com"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60"
            >
              {isSubmitting ? 'Opening Stripe...' : 'Continue to Checkout'}
              {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          <div className="text-center">
            <Link to="/" className="text-sm text-purple-200 transition hover:text-white">
              Return to the site
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
