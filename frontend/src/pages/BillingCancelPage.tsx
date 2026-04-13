import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-3xl border border-purple-700/40 bg-purple-950/45 p-8 shadow-2xl backdrop-blur text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-purple-300">Checkout Paused</p>
          <h1 className="text-4xl font-bold text-white">You have not been charged.</h1>
          <p className="text-lg text-purple-100/85">
            Your subscription was not started. When you are ready, you can return and begin again.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Entry
          </Link>
        </div>
      </main>
    </div>
  );
}
