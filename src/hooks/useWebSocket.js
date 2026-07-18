// ──────────────────────────────────────────────────────────────
// WebSocket Hook — Bulk Email Dispatch Platform
// Authenticates with Clerk via a first-message token handshake.
// ──────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { resolveEndpoints } from "../lib/endpoints";

/**
 * Custom hook for managing a WebSocket connection to dispatch job updates.
 *
 * @param {string|null} jobId - UUID of the dispatch job to subscribe to
 * @param {function} onMessage - Callback invoked with parsed JSON data on each message
 * @returns {{ connectionStatus: 'connecting'|'connected'|'disconnected', hasConnectedOnce: boolean }}
 */
export const useDispatchWebSocket = (jobId, onMessage) => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const getTokenRef = useRef(null);
  const closedByUsRef = useRef(false);
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Keep latest getToken without re-creating the socket when Clerk identity churns
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!jobId || !isLoaded || !isSignedIn) {
      setConnectionStatus("disconnected");
      return;
    }

    let wsUrl;
    try {
      const { wsBaseUrl } = resolveEndpoints();
      wsUrl = `${wsBaseUrl}/ws/dispatch/${jobId}/`;
    } catch (err) {
      console.error("[WebSocket] Invalid endpoint configuration:", err);
      setConnectionStatus("disconnected");
      return;
    }

    closedByUsRef.current = false;
    setConnectionStatus("connecting");

    const ws = new ReconnectingWebSocket(wsUrl);
    wsRef.current = ws;
    let authenticated = false;

    const authenticate = async () => {
      try {
        const token = await getTokenRef.current?.();
        if (!token || ws.readyState !== WebSocket.OPEN) {
          ws.close(4001, "missing_token");
          return;
        }
        ws.send(JSON.stringify({ type: "auth", token }));
      } catch (err) {
        console.error("[WebSocket] Failed to authenticate:", err);
        ws.close(4001, "auth_failed");
      }
    };

    ws.onopen = () => {
      authenticated = false;
      if (!closedByUsRef.current) {
        setConnectionStatus("connecting");
      }
      authenticate();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data?.type === "auth.ok") {
          authenticated = true;
          setHasConnectedOnce(true);
          setConnectionStatus("connected");
          return;
        }

        if (data?.type === "auth.error") {
          console.error("[WebSocket] Auth rejected:", data.message);
          ws.close(4003, "forbidden");
          return;
        }

        // Ignore app updates until the socket is authorized.
        if (!authenticated) return;

        onMessageRef.current?.(data);
      } catch (err) {
        console.error("[WebSocket] Failed to parse message:", err);
      }
    };

    ws.onclose = () => {
      authenticated = false;
      // Skip status flash when we intentionally tear down (Strict Mode / deps change)
      if (!closedByUsRef.current) {
        setConnectionStatus("disconnected");
      }
    };

    ws.onerror = (err) => {
      console.error("[WebSocket] Connection error:", err);
    };

    return () => {
      closedByUsRef.current = true;
      ws.close();
      wsRef.current = null;
    };
  }, [jobId, isLoaded, isSignedIn]);

  return { connectionStatus, hasConnectedOnce };
};
