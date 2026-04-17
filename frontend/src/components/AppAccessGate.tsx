import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMembershipAccess } from '@/hooks/useMembershipAccess';

function GateShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#12081f] via-[#24123f] to-[#12081f] text-white">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        {children}
      </main>
    </div>
  );
}

export function AppAccessGate({ children }: { children: ReactNode }) {
  const {
    isLoading,
    isRefreshingAccess,
    isAuthenticated,
    userEmail,
    hasAccess,
    hasOwnerAccess,
    lastKnownHasAccess,
    lastKnownOwnerAccess,
    refreshAccess,
  } = useMembershipAccess();
  const [showSlowLoadingHelp, setShowSlowLoadingHelp] = useState(false);
  const hasTrustedAccess = hasAccess || hasOwnerAccess || (isAuthenticated && (lastKnownHasAccess || lastKnownOwnerAccess));

  const shouldHoldNeutralGate = isLoading && !hasTrustedAccess;

  useEffect(() => {
    if (!shouldHoldNeutralGate && !isRefreshingAccess) {
      setShowSlowLoadingHelp(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowLoadingHelp(true);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [isRefreshingAccess, shouldHoldNeutralGate]);

  if (shouldHoldNeutralGate) {
    return (
      <GateShell>
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Checking access...</p>
          {showSlowLoadingHelp ? (
            <>
              <p className="text-sm leading-relaxed text-purple-100/85">
                This is taking longer than it should. You can retry the access check or jump back to the public home
                page instead of waiting here.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSlowLoadingHelp(false);
                    void refreshAccess();
                  }}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800"
                >
                  Retry access check
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg border border-purple-500/40 px-6 py-3 font-medium text-purple-100 transition hover:bg-purple-900/40"
                >
                  Go to public home
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </GateShell>
    );
  }

  if (hasTrustedAccess) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <GateShell>
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Sign in to enter the Spiral
          </h1>
          <p className="text-sm text-purple-100/85 leading-relaxed">
            Use the same email you used at checkout so your membership links to this account.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800"
            >
              Sign in or create account
            </Link>
            <Link
              to="/subscribe"
              className="text-sm font-medium text-[#d4af37] underline-offset-4 hover:underline"
            >
              Start or manage membership
            </Link>
          </div>
        </div>
      </GateShell>
    );
  }

  if (isRefreshingAccess) {
    return (
      <GateShell>
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Checking access...</p>
          {showSlowLoadingHelp ? (
            <>
              <p className="text-sm leading-relaxed text-purple-100/85">
                This is taking longer than it should. You can retry the access check or jump back to the public home
                page instead of waiting here.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSlowLoadingHelp(false);
                    void refreshAccess();
                  }}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800"
                >
                  Retry access check
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg border border-purple-500/40 px-6 py-3 font-medium text-purple-100 transition hover:bg-purple-900/40"
                >
                  Go to public home
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </GateShell>
    );
  }

  if (!(hasAccess || hasOwnerAccess)) {
    return (
      <GateShell>
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Membership required</h1>
          <p className="text-sm text-purple-100/85 leading-relaxed">
            An active or trialing subscription is required to open this area. If you just finished checkout, it may
            take a moment to sync—refresh after a short wait.
          </p>
          {userEmail ? (
            <p className="text-xs text-purple-200/90">
              Signed in as <span className="font-semibold text-white">{userEmail}</span>
            </p>
          ) : null}
          <Link
            to="/subscribe"
            className="inline-flex items-center justify-center rounded-lg border-2 border-[#d4af37] px-6 py-3 font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/10"
          >
            View membership options
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-purple-500/40 px-6 py-3 font-medium text-purple-100 transition hover:bg-purple-900/40"
          >
            Back to public home
          </Link>
        </div>
      </GateShell>
    );
  }

  return <>{children}</>;
}
