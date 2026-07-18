import { describe, expect, it, beforeEach } from "vitest";
import { getAuthToken, setAuthTokenGetter } from "./authToken";

describe("authToken bridge", () => {
  beforeEach(() => {
    setAuthTokenGetter(null);
  });

  it("returns null when no getter is registered", async () => {
    await expect(getAuthToken()).resolves.toBeNull();
  });

  it("returns the token from the registered getter", async () => {
    setAuthTokenGetter(async () => "session-token");
    await expect(getAuthToken()).resolves.toBe("session-token");
  });

  it("returns null when the getter throws", async () => {
    setAuthTokenGetter(async () => {
      throw new Error("boom");
    });
    await expect(getAuthToken()).resolves.toBeNull();
  });
});
