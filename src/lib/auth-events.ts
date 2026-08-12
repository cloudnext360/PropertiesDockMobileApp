/**
 * Tiny session-expiry bus.
 *
 * The axios layer discovers that a session is dead (refresh failed, or there is
 * no refresh token left) but it cannot touch React state, and AuthContext must
 * not import the axios module. This decouples them: api.ts emits, AuthContext
 * subscribes and tears the session down.
 *
 * Without this, clearTokens() in the 401 handler left the app in a zombie state —
 * no tokens on disk but `user` still set, so the UI looked signed in, persisted
 * query data still rendered, and every request went out with no Authorization
 * header ("Missing or invalid authorization header").
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe. Returns an unsubscribe function. */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionExpired(): void {
  // Copy first: a listener may unsubscribe while we iterate.
  [...listeners].forEach((listener) => listener());
}
