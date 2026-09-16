import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { deleteAccount, downloadAccountExport } from '@/lib/accountApi';

const CONFIRM_WORD = 'DELETE';

const inputClass =
  'w-full rounded-lg border border-purple-600/50 bg-[#12081f]/80 px-4 py-3 text-white placeholder:text-purple-400/60 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30';
const primaryButtonClass =
  'w-full rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800 disabled:cursor-not-allowed disabled:opacity-60';
const linkClass = 'font-semibold text-[#d4af37] underline-offset-4 hover:underline';

export default function AccountPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession();
      if (!active) return;
      setSession(nextSession);
      setIsLoadingSession(false);
    };

    void loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsLoadingSession(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleExport = async () => {
    setExportMessage(null);
    setExportError(null);
    setIsExporting(true);
    try {
      await downloadAccountExport();
      setExportMessage('Your export has been downloaded as a JSON file.');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const canDelete = acknowledged && confirmText.trim() === CONFIRM_WORD && !isDeleting;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteAccount(confirmText.trim());
      try {
        localStorage.removeItem('trustedMembershipAccess');
      } catch {
        /* ignore */
      }
      await supabase.auth.signOut();
      navigate('/?deleted=1', { replace: true });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Deletion failed. Nothing was removed.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#12081f] via-[#24123f] to-[#12081f] text-white">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white">Your account</h1>

          {isLoadingSession ? (
            <p className="mt-4 text-center text-sm text-purple-200/90">Checking your session…</p>
          ) : !session?.user ? (
            <>
              <p className="mt-4 text-center text-sm leading-relaxed text-purple-200/90">
                Sign in first to export or delete your account.
              </p>
              <p className="mt-6 text-center text-sm text-purple-200/85">
                <Link to="/auth" className={linkClass}>
                  Go to sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="mb-8 text-center text-sm leading-relaxed text-purple-200/90">
                Signed in as{' '}
                <span className="font-semibold text-white">{session.user.email ?? 'anonymous session'}</span>
              </p>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Manage</h2>
                <ul className="space-y-2 text-sm text-purple-200/85">
                  <li>
                    <Link to="/account/password" className={linkClass}>
                      Change password
                    </Link>
                  </li>
                  <li>
                    <Link to="/app" className={linkClass}>
                      Back to app
                    </Link>
                  </li>
                </ul>
              </section>

              <section className="mt-8 space-y-3 border-t border-purple-700/40 pt-6">
                <h2 className="text-lg font-semibold text-white">Export your data</h2>
                <p className="text-sm leading-relaxed text-purple-200/85">
                  Download everything stored for this account — Vault writings, Spiral notes, MoonSync settings
                  and events, and your subscription status — as a single JSON file.
                </p>
                <button type="button" onClick={handleExport} disabled={isExporting} className={primaryButtonClass}>
                  {isExporting ? 'Preparing export…' : 'Download my data (JSON)'}
                </button>
                {exportMessage ? (
                  <p className="text-sm text-purple-100/90" role="status">
                    {exportMessage}
                  </p>
                ) : null}
                {exportError ? (
                  <p className="text-sm text-red-300" role="alert">
                    {exportError}
                  </p>
                ) : null}
              </section>

              <section className="mt-8 space-y-3 border-t border-purple-700/40 pt-6">
                <h2 className="text-lg font-semibold text-white">Delete your account</h2>
                <p className="text-sm leading-relaxed text-purple-200/85">
                  This permanently deletes your Vault writings, Spiral notes, MoonSync data and your sign-in.
                  Any active subscription is cancelled immediately. This cannot be undone — export your data
                  first if you want to keep it.
                </p>

                {!showDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowDelete(true)}
                    className="w-full rounded-lg border border-red-400/60 px-6 py-3 font-semibold text-red-200 transition hover:bg-red-950/40"
                  >
                    Delete account…
                  </button>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-red-400/40 bg-red-950/20 p-4">
                    <label className="flex items-start gap-3 text-sm text-purple-100/90">
                      <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#d4af37]"
                      />
                      <span>
                        I understand my data will be permanently deleted and any subscription cancelled.
                      </span>
                    </label>

                    <div>
                      <label htmlFor="delete-confirm" className="mb-1 block text-sm font-medium text-purple-200">
                        Type <span className="font-mono font-bold text-white">{CONFIRM_WORD}</span> to confirm
                      </label>
                      <input
                        id="delete-confirm"
                        type="text"
                        autoComplete="off"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className={inputClass}
                        placeholder={CONFIRM_WORD}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDelete(false);
                          setConfirmText('');
                          setAcknowledged(false);
                          setDeleteError(null);
                        }}
                        disabled={isDeleting}
                        className="flex-1 rounded-lg border border-purple-500/50 px-4 py-3 text-sm font-semibold text-purple-100 hover:bg-purple-900/40 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={!canDelete}
                        className="flex-1 rounded-lg bg-red-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/40 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting…' : 'Permanently delete'}
                      </button>
                    </div>

                    {deleteError ? (
                      <p className="text-sm text-red-300" role="alert">
                        {deleteError}
                      </p>
                    ) : null}
                  </div>
                )}
              </section>

              <div className="mt-8 flex items-center justify-between gap-4 text-sm text-purple-200/85">
                <Link to="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
                <button type="button" onClick={() => void supabase.auth.signOut()} className={linkClass}>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
