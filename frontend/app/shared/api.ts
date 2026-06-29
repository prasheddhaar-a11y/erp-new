/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Api
Purpose     : Provides Api frontend logic and shared types
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

// =====================================================
// IMPORTS
// =====================================================

/* =====================================================
   SECTION: CONSTANTS
   PURPOSE:
   This section stores fixed values used by the file.
   Centralizing these values helps avoid repeated magic strings or numbers.
===================================================== */

/* =====================================================
   SECTION: API CALLS
   PURPOSE:
   This section talks to backend or server endpoints.
   It sends requests, receives responses, and prepares data for the UI.
===================================================== */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_TIMEOUT_MS = 20000;

const SESSION_KEYS = ["pinesphere_access_token", "pinesphere_refresh_token", "pinesphere_profile"] as const;

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function getStoredSessionValue(key: typeof SESSION_KEYS[number]) {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key) ?? "";
}

export function storeSessionValue(key: typeof SESSION_KEYS[number], value: string, remember: boolean) {
  if (typeof window === "undefined") return;
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(key, value);
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of SESSION_KEYS) storage.removeItem(key);
  }
}

export async function refreshStoredAccessToken() {
  if (typeof window === "undefined") return "";

  const refreshToken = getStoredSessionValue("pinesphere_refresh_token");
  if (!refreshToken) return "";

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    clearStoredSession();
    return "";
  }

  const data = (await response.json()) as { access_token?: string };
  const accessToken = data.access_token ?? "";
  if (accessToken) {
    const remember = window.localStorage.getItem("pinesphere_refresh_token") === refreshToken;
    storeSessionValue("pinesphere_access_token", accessToken, remember);
  }
  return accessToken;
}

export async function parseRequestError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((issue: { loc?: Array<string | number>; msg?: string }) => {
        const field = issue.loc?.slice(1).join(".") || "request";
        return `${field}: ${issue.msg ?? "Invalid value"}`;
      }).join("; ");
    }
    return JSON.stringify(data.detail ?? data);
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

export function timeoutSignal(timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

export async function apiRequest<T>(endpoint: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const token = accessToken || getStoredSessionValue("pinesphere_access_token");
  if (!token) {
    clearStoredSession();
    /* =====================================================
       SECTION: ERROR HANDLING
       PURPOSE:
       This section handles expected failures and converts them into useful responses.
       Good error handling keeps the app stable when something goes wrong.
    ===================================================== */

    throw new Error("Please log in again.");
  }

  const request = (bearerToken: string) => fetch(`${API_URL}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  let response = await request(token);
  if (response.status === 401) {
    const refreshedToken = await refreshStoredAccessToken();
    if (refreshedToken) {
      response = await request(refreshedToken);
    }
  }

  if (!response.ok) {
    const message = await parseRequestError(response);
    if (response.status === 401) {
      clearStoredSession();
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
