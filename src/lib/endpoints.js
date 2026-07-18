// ──────────────────────────────────────────────────────────────
// API / WebSocket endpoint resolution
// HTTPS Vercel pages must talk to HTTPS/WSS backends (no mixed content).
// ──────────────────────────────────────────────────────────────

/**
 * True when the SPA itself is served over HTTPS (e.g. Vercel production).
 * @param {string} [pageProtocol]
 */
export function isSecurePage(pageProtocol = typeof window !== "undefined" ? window.location.protocol : "http:") {
  return pageProtocol === "https:";
}

/**
 * Derive a WebSocket base URL from an HTTP(S) API base URL.
 * https://api.example.com → wss://api.example.com
 * http://localhost:8000 → ws://localhost:8000
 *
 * @param {string} apiBaseUrl
 * @returns {string}
 */
export function deriveWsBaseUrl(apiBaseUrl) {
  if (!apiBaseUrl) return "";
  try {
    const url = new URL(apiBaseUrl);
    if (url.protocol === "https:") {
      url.protocol = "wss:";
    } else if (url.protocol === "http:") {
      url.protocol = "ws:";
    } else {
      throw new Error(`Unsupported API protocol: ${url.protocol}`);
    }
    // Drop pathname/query; callers append /ws/...
    return url.origin.replace(/\/$/, "");
  } catch (err) {
    throw new Error(`Invalid VITE_API_BASE_URL "${apiBaseUrl}": ${err.message}`);
  }
}

/**
 * Reject insecure API/WS URLs when the page is HTTPS (mixed content).
 *
 * @param {{ apiBaseUrl: string, wsBaseUrl: string, pageProtocol?: string }} opts
 */
export function assertSecureCrossOriginEndpoints({
  apiBaseUrl,
  wsBaseUrl,
  pageProtocol = typeof window !== "undefined" ? window.location.protocol : "http:",
}) {
  if (!isSecurePage(pageProtocol)) {
    return;
  }

  if (!apiBaseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is required on HTTPS (e.g. Vercel). " +
        "Set it to https://<ip-dashes>.nip.io (Caddy on the AWS VM) so the SPA does not use mixed-content HTTP."
    );
  }

  let apiUrl;
  try {
    apiUrl = new URL(apiBaseUrl);
  } catch {
    throw new Error(
      `VITE_API_BASE_URL must be an absolute URL when deployed on HTTPS (got "${apiBaseUrl}").`
    );
  }
  if (apiUrl.protocol !== "https:") {
    throw new Error(
      `Mixed content blocked: HTTPS frontend cannot call HTTP API "${apiBaseUrl}". ` +
        "Set VITE_API_BASE_URL to https://<ip-dashes>.nip.io (Caddy TLS on the AWS VM)."
    );
  }

  if (!wsBaseUrl) {
    throw new Error(
      "WebSocket base URL is missing on HTTPS. Set VITE_WS_BASE_URL to " +
        "wss://<ip-dashes>.nip.io or derive it from VITE_API_BASE_URL."
    );
  }

  let wsUrl;
  try {
    wsUrl = new URL(wsBaseUrl);
  } catch {
    throw new Error(
      `VITE_WS_BASE_URL must be an absolute URL when deployed on HTTPS (got "${wsBaseUrl}").`
    );
  }
  if (wsUrl.protocol !== "wss:") {
    throw new Error(
      `Mixed content blocked: HTTPS frontend cannot open insecure WebSocket "${wsBaseUrl}". ` +
        "Set VITE_WS_BASE_URL to wss://<ip-dashes>.nip.io (or leave it blank to derive from VITE_API_BASE_URL)."
    );
  }
}

/**
 * Resolve API and WebSocket base URLs from Vite env (+ optional page context).
 *
 * @param {{
 *   apiBaseUrl?: string,
 *   wsBaseUrl?: string,
 *   pageProtocol?: string,
 *   pageHost?: string,
 * }} [env]
 * @returns {{ apiBaseUrl: string, wsBaseUrl: string }}
 */
export function resolveEndpoints(env = {}) {
  const pageProtocol =
    env.pageProtocol ??
    (typeof window !== "undefined" ? window.location.protocol : "http:");
  const pageHost =
    env.pageHost ??
    (typeof window !== "undefined" ? window.location.host : "localhost");

  const apiBaseUrl = (env.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL ?? "").replace(
    /\/$/,
    ""
  );

  let wsBaseUrl = (env.wsBaseUrl ?? import.meta.env.VITE_WS_BASE_URL ?? "").replace(
    /\/$/,
    ""
  );

  if (!wsBaseUrl && apiBaseUrl) {
    wsBaseUrl = deriveWsBaseUrl(apiBaseUrl);
  }

  if (!wsBaseUrl) {
    // Local Vite/nginx same-origin proxy fallback.
    const scheme = pageProtocol === "https:" ? "wss" : "ws";
    wsBaseUrl = `${scheme}://${pageHost}`;
  }

  assertSecureCrossOriginEndpoints({ apiBaseUrl, wsBaseUrl, pageProtocol });

  return { apiBaseUrl, wsBaseUrl };
}
