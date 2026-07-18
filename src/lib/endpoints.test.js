import { describe, expect, it } from "vitest";
import {
  assertSecureCrossOriginEndpoints,
  deriveWsBaseUrl,
  resolveEndpoints,
} from "./endpoints";

const NIP_API = "https://13-60-91-88.nip.io";
const NIP_WS = "wss://13-60-91-88.nip.io";

describe("deriveWsBaseUrl", () => {
  it("derives wss from https API URL", () => {
    expect(deriveWsBaseUrl(NIP_API)).toBe(NIP_WS);
  });

  it("derives ws from http API URL", () => {
    expect(deriveWsBaseUrl("http://localhost:8000")).toBe("ws://localhost:8000");
  });

  it("strips trailing slash and path", () => {
    expect(deriveWsBaseUrl(`${NIP_API}/api/`)).toBe(NIP_WS);
  });
});

describe("assertSecureCrossOriginEndpoints", () => {
  it("allows http/ws on non-HTTPS pages", () => {
    expect(() =>
      assertSecureCrossOriginEndpoints({
        apiBaseUrl: "http://localhost:8000",
        wsBaseUrl: "ws://localhost:8000",
        pageProtocol: "http:",
      })
    ).not.toThrow();
  });

  it("requires https API URL on HTTPS pages", () => {
    expect(() =>
      assertSecureCrossOriginEndpoints({
        apiBaseUrl: "http://13-60-91-88.nip.io",
        wsBaseUrl: NIP_WS,
        pageProtocol: "https:",
      })
    ).toThrow(/Mixed content blocked/);
  });

  it("requires wss WebSocket URL on HTTPS pages", () => {
    expect(() =>
      assertSecureCrossOriginEndpoints({
        apiBaseUrl: NIP_API,
        wsBaseUrl: "ws://13-60-91-88.nip.io",
        pageProtocol: "https:",
      })
    ).toThrow(/insecure WebSocket/);
  });

  it("requires API base URL on HTTPS pages", () => {
    expect(() =>
      assertSecureCrossOriginEndpoints({
        apiBaseUrl: "",
        wsBaseUrl: NIP_WS,
        pageProtocol: "https:",
      })
    ).toThrow(/VITE_API_BASE_URL is required/);
  });
});

describe("resolveEndpoints", () => {
  it("derives wss when only HTTPS API URL is provided", () => {
    const result = resolveEndpoints({
      apiBaseUrl: NIP_API,
      wsBaseUrl: "",
      pageProtocol: "https:",
      pageHost: "mailblasto.vercel.app",
    });
    expect(result).toEqual({
      apiBaseUrl: NIP_API,
      wsBaseUrl: NIP_WS,
    });
  });

  it("falls back to same-origin ws on local HTTP when unset", () => {
    const result = resolveEndpoints({
      apiBaseUrl: "",
      wsBaseUrl: "",
      pageProtocol: "http:",
      pageHost: "localhost:5173",
    });
    expect(result).toEqual({
      apiBaseUrl: "",
      wsBaseUrl: "ws://localhost:5173",
    });
  });

  it("rejects insecure production API URLs", () => {
    expect(() =>
      resolveEndpoints({
        apiBaseUrl: "http://13.60.91.88:8000",
        wsBaseUrl: "",
        pageProtocol: "https:",
        pageHost: "mailblasto.vercel.app",
      })
    ).toThrow(/Mixed content blocked/);
  });
});
