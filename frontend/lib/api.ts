/* =========================================================
   SECTION: Imports
   Purpose: External libraries, types, and shared utilities
========================================================= */

import { ALL_SESSION_KEYS, API_URL, SESSION_KEYS } from "./constants";
const API_TIMEOUT_MS = 20000;

/* =========================================================
   SECTION: Constants
   Purpose: Static values, API URLs, role mappings
========================================================= */

/* =========================================================
   SECTION: Types
   Purpose: Shared TypeScript types and interfaces
========================================================= */

export type SessionStorageKey = typeof SESSION_KEYS[number];

/* =========================================================
   SECTION: Helper Functions
   Purpose: Reusable frontend logic
========================================================= */

export function getStoredSessionValue(key: SessionStorageKey) {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key) ?? "";
}

export function storeSessionValue(key: SessionStorageKey, value: string, remember: boolean) {
  if (typeof window === "undefined") return;
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(key, value);
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of ALL_SESSION_KEYS) storage.removeItem(key);
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

export async function openAuthenticatedFile(fileUrl: string, filename?: string) {
  const token = getStoredSessionValue("pinesphere_access_token");
  if (!token) {
    clearStoredSession();
    throw new Error("Please log in again.");
  }

  const absoluteUrl = /^https?:\/\//i.test(fileUrl)
    ? fileUrl
    : `${API_URL.replace(/\/$/, "")}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;

  let response = await fetch(absoluteUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    const refreshedToken = await refreshStoredAccessToken();
    if (refreshedToken) {
      response = await fetch(absoluteUrl, {
        headers: { Authorization: `Bearer ${refreshedToken}` },
      });
    }
  }

  if (!response.ok) {
    throw new Error(await parseRequestError(response));
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.target = "_blank";
  if (filename) link.download = filename;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
}

/* =========================================================
   SECTION: Exports
   Purpose: Public exports used across the app
========================================================= */

export { API_URL };
