// Explicit imports (Jest's recommended style) instead of injected globals —
// keeps the file independent of @types/jest ambient declarations.
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

// Mock the token store so the interceptors are exercised without expo-secure-store.
jest.mock("@/lib/storage", () => ({
  getAccessToken: jest.fn(async () => "old-access"),
  getRefreshToken: jest.fn(async () => "refresh-token"),
  setTokens: jest.fn(async () => undefined),
  clearTokens: jest.fn(async () => undefined),
}));

// Deliberately imported after jest.mock() above (which jest hoists anyway) to
// document that these modules resolve against the mocked storage.
// eslint-disable-next-line import/first
import api, { apiGet } from "@/lib/api";
// eslint-disable-next-line import/first
import { clearTokens, setTokens } from "@/lib/storage";

const mockedSetTokens = jest.mocked(setTokens);
const mockedClearTokens = jest.mocked(clearTokens);

// Anchored regex matchers → work for both the instance (relative "/x") and the
// refresh call (absolute "http://localhost:5000/api/auth/refresh").
const PING = /\/api\/ping$/;
const SECURE = /\/api\/secure$/;
const REFRESH = /\/api\/auth\/refresh$/;

describe("axios refresh interceptor", () => {
  let mock: MockAdapter;
  let staticMock: MockAdapter;

  beforeEach(() => {
    // Two adapters: `api` was created via axios.create() BEFORE any patching, so
    // mocking the axios default does not reach it — patch the instance directly.
    // The interceptor's refresh call uses the static axios.post → patch that too.
    mock = new MockAdapter(api);
    staticMock = new MockAdapter(axios);
    mockedSetTokens.mockClear();
    mockedClearTokens.mockClear();
  });
  afterEach(() => {
    mock.restore();
    staticMock.restore();
  });

  it("attaches the Bearer token to requests", async () => {
    mock.onGet(PING).reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer old-access");
      return [200, { ok: true }];
    });
    await apiGet("/api/ping");
  });

  it("on 401 → refreshes, stores new tokens, retries once, and succeeds", async () => {
    let calls = 0;
    mock.onGet(SECURE).reply(() => {
      calls += 1;
      return calls === 1 ? [401, { message: "expired" }] : [200, { data: "ok" }];
    });
    staticMock.onPost(REFRESH).reply(200, {
      data: { accessToken: "new-access", refreshToken: "new-refresh" },
    });

    const res = await apiGet<{ data: string }>("/api/secure");

    expect(calls).toBe(2); // original + one retry
    expect(mockedSetTokens).toHaveBeenCalledWith("new-access", "new-refresh");
    expect(res).toEqual({ data: "ok" });
  });

  it("on refresh failure → clears tokens and rejects", async () => {
    mock.onGet(SECURE).reply(401, { message: "expired" });
    staticMock.onPost(REFRESH).reply(401, { message: "invalid refresh" });

    await expect(apiGet("/api/secure")).rejects.toBeTruthy();
    expect(mockedClearTokens).toHaveBeenCalledTimes(1);
    expect(mockedSetTokens).not.toHaveBeenCalled();
  });

  it("retries at most once (no infinite loop if the retry also 401s)", async () => {
    let calls = 0;
    mock.onGet(SECURE).reply(() => {
      calls += 1;
      return [401, { message: "still expired" }];
    });
    staticMock.onPost(REFRESH).reply(200, {
      data: { accessToken: "new-access", refreshToken: "new-refresh" },
    });

    await expect(apiGet("/api/secure")).rejects.toBeTruthy();
    expect(calls).toBe(2); // original + single retry, then gives up
  });
});
