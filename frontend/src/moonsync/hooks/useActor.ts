import type { BackendActor } from '../backend';

/**
 * Provides the backend canister actor for authenticated calls.
 * Returns null so the UI works without a deployed canister.
 * To use a real backend: run dfx generate, set VITE_CANISTER_ID_BACKEND, and wire in the generated actor.
 */
export function useActor(): {
  actor: BackendActor | null;
  isFetching: boolean;
} {
  return { actor: null, isFetching: false };
}
