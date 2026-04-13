import React from 'react';
import { Link } from 'react-router-dom';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] text-[#e8e8f0]">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white">Checkout complete</h1>
        <p className="mb-8 text-[#e8e8f0]/85 leading-relaxed">
          Checkout is complete. Use the same email you used at checkout to sign in or create your account—then you can
          open the full app.
        </p>
        <Link
          to="/auth"
          className="rounded-lg border-2 border-[#d4af37] px-6 py-3 font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37]/10"
        >
          Continue to sign in
        </Link>
      </main>
    </div>
  );
}
