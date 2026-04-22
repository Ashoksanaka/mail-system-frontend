// ──────────────────────────────────────────────────────────────
// WebSocket Hook — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";

/**
 * Custom hook for managing a WebSocket connection to dispatch job updates.
 * Uses reconnecting-websocket for automatic reconnection.
 *
 * @param {string|null} jobId - UUID of the dispatch job to subscribe to
 * @param {function} onMessage - Callback invoked with parsed JSON data on each message
 * @returns {{ connectionStatus: 'connecting'|'connected'|'disconnected' }}
 */
export const useDispatchWebSocket = (jobId, onMessage) => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep the onMessage ref up to date without re-triggering the effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    // Don't connect if there's no job to subscribe to
    if (!jobId) {
      setConnectionStatus("disconnected");
      return;
    }

    const wsBaseUrl =
      import.meta.env.VITE_WS_BASE_URL || `ws://${window.location.host}`;
    const wsUrl = `${wsBaseUrl}/ws/dispatch/${jobId}/`;

    setConnectionStatus("connecting");

    const ws = new ReconnectingWebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch (err) {
        console.error("[WebSocket] Failed to parse message:", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };

    ws.onerror = (err) => {
      console.error("[WebSocket] Connection error:", err);
    };

    // Cleanup: close the socket on unmount or when jobId changes
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [jobId]);

  return { connectionStatus };
};
