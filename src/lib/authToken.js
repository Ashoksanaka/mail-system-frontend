// ──────────────────────────────────────────────────────────────
// Auth token bridge — lets non-React modules call Clerk getToken()
// ──────────────────────────────────────────────────────────────

let tokenGetter = null;

/**
 * Register the async function that returns a Clerk session JWT.
 * Called from AuthSync inside ClerkProvider.
 */
export function setAuthTokenGetter(getter) {
  tokenGetter = typeof getter === "function" ? getter : null;
}

/** Resolve the current Clerk session token, or null if unavailable. */
export async function getAuthToken() {
  if (!tokenGetter) return null;
  try {
    return (await tokenGetter()) || null;
  } catch {
    return null;
  }
}
