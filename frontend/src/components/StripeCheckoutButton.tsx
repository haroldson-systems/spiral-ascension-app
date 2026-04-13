import React, { useState } from 'react';
import { createCheckoutSession } from '@/lib/stripeApi';

type StripeCheckoutButtonProps = {
  email?: string;
  className?: string;
  label?: string;
};

export function StripeCheckoutButton({
  email,
  className,
  label = 'Start Free Week',
}: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const session = await createCheckoutSession({ email });
      window.location.assign(session.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          'rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/40 transition-all hover:from-purple-700 hover:to-purple-900 disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        {loading ? 'Loading…' : label}
      </button>
      {error ? (
        <p className="max-w-sm text-center text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
