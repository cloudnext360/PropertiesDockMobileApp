import axios, { type InternalAxiosRequestConfig } from "axios";
import { config } from "@/lib/config";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/storage";

// Mobile port of PropertyDockFrontend/src/lib/api.ts.
// Differences from web (MOBILE_PLAN.md §1):
//   - tokens live in expo-secure-store, so the interceptors are ASYNC
//   - no `window`/`localStorage`
const BASE = config.apiUrl;

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every request.
api.interceptors.request.use(async (cfg) => {
  const token = await getAccessToken();
  if (token) {
    cfg.headers.set("Authorization", `Bearer ${token}`);
  }
  return cfg;
});

// On 401 — try a refresh, then retry the original request once.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refresh = await getRefreshToken();
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/api/auth/refresh`, {
            refreshToken: refresh,
          });
          const tokens = data.data ?? data;
          await setTokens(tokens.accessToken, tokens.refreshToken);
          original.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
          return api(original);
        } catch {
          await clearTokens();
        }
      }
    }

    const msg =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      "Request failed";
    return Promise.reject(new Error(msg));
  },
);

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const { data } = await api.get<T>(path);
  return data;
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.post<T>(path, body);
  return data;
}

export async function apiPostFormData<T = unknown>(path: string, formData: FormData): Promise<T> {
  const { data } = await api.post<T>(path, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
  const { data } = await api.put<T>(path, body);
  return data;
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const { data } = await api.patch<T>(path, body);
  return data;
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const { data } = await api.delete<T>(path);
  return data;
}

export default api;
