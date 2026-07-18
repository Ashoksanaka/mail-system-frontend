// ──────────────────────────────────────────────────────────────
// AuthSync — wires Clerk session into Axios + clears local state
// ──────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { setAuthTokenGetter } from "../lib/authToken";
import queryClient from "../lib/queryClient";
import useAppStore from "../store/useAppStore";

/**
 * Must render under ClerkProvider. Provides getToken to the Axios
 * client and clears TanStack Query + Zustand when the user changes
 * or signs out.
 */
export default function AuthSync() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const previousUserId = useRef(undefined);

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isLoaded || !isSignedIn) return null;
      return getToken();
    });
    return () => setAuthTokenGetter(null);
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    const previous = previousUserId.current;
    const current = isSignedIn ? userId : null;

    // Skip the very first load so we don't wipe a fresh session.
    if (previous !== undefined && previous !== current) {
      queryClient.clear();
      useAppStore.getState().clearAll();
      try {
        sessionStorage.removeItem("bulkmail-store");
      } catch {
        // ignore storage failures
      }
    }

    previousUserId.current = current;
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
