import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';

function GateShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#12081f] via-[#24123f] to-[#12081f] text-white">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        {children}
      </main>
    </div>
  );
}

export function AdminAccessGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthorized, access, error, saveToken, clearToken, storedToken } = useAdminAccess();
  const [tokenInput, setTokenInput] = useState(storedToken ?? '');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <GateShell>
        <div className="space-y-4">
          <Shield className="mx-auto h-10 w-10 text-amber-300" />
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Checking control room access...</p>
        </div>
      </GateShell>
    );
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  const handleSaveToken = async () => {
    setIsSavingToken(true);
    setTokenMessage(null);
    try {
      await saveToken(tokenInput);
      setTokenMessage('Token saved. Rechecking access...');
    } catch {
      setTokenMessage('Unable to save token.');
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleClearToken = async () => {
    setIsSavingToken(true);
    setTokenMessage(null);
    try {
      await clearToken();
      setTokenInput('');
      setTokenMessage('Saved token cleared.');
    } finally {
      setIsSavingToken(false);
    }
  };

  return (
    <GateShell>
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
        <Shield className="mx-auto h-10 w-10 text-amber-300" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Control Room Locked</h1>
          <p className="text-sm leading-relaxed text-purple-100/85">
            Sign in with your approved admin account, or use your saved admin token to open the Control Room.
          </p>
        </div>

        <div className="space-y-3 text-left">
          <label htmlFor="admin-token-gate" className="block text-sm font-medium text-purple-200">
            Admin token
          </label>
          <input
            id="admin-token-gate"
            type="password"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="Paste admin token if needed"
            className="w-full rounded-lg border border-purple-600/50 bg-[#12081f]/80 px-4 py-3 text-white placeholder:text-purple-400/60 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveToken}
              disabled={isSavingToken || !tokenInput.trim()}
              className="inline-flex flex-1 items-center justify-center rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingToken ? 'Checking...' : 'Save token and retry'}
            </button>
            {storedToken ? (
              <button
                type="button"
                onClick={handleClearToken}
                disabled={isSavingToken}
                className="inline-flex items-center justify-center rounded-lg border border-purple-500/40 px-5 py-3 font-semibold text-purple-100 transition hover:bg-purple-900/50 disabled:opacity-60"
              >
                Clear token
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/auth"
            className="inline-flex w-full items-center justify-center rounded-lg border border-purple-500/40 px-5 py-3 font-semibold text-purple-100 transition hover:bg-purple-900/50"
          >
            Sign in with admin account
          </Link>
          {error ? <p className="text-sm text-amber-200">{error}</p> : null}
          {tokenMessage ? <p className="text-sm text-purple-200">{tokenMessage}</p> : null}
          {access?.email ? (
            <p className="text-xs text-purple-300">Verified admin: {access.email}</p>
          ) : null}
        </div>
      </div>
    </GateShell>
  );
}
