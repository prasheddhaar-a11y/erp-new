/* =========================================================
   SECTION: Imports
   Purpose: External libraries, types, and shared utilities
========================================================= */

import { API_URL, clearStoredSession, parseRequestError } from "./api";
import { AUTH_STORAGE_KEYS, ROLE_ALIASES, ROLE_DASHBOARD_PATHS } from "./constants";

/* =========================================================
   SECTION: Constants
   Purpose: Static values, API URLs, role mappings
========================================================= */

const ACCESS_TOKEN_KEY = AUTH_STORAGE_KEYS.accessToken;
const REFRESH_TOKEN_KEY = AUTH_STORAGE_KEYS.refreshToken;
const USER_KEY = AUTH_STORAGE_KEYS.user;
const REMEMBER_ME_KEY = AUTH_STORAGE_KEYS.rememberMe;

const ROLE_PATHS: Record<UserRole, string> = ROLE_DASHBOARD_PATHS;

/* =========================================================
   SECTION: Types
   Purpose: Shared TypeScript types and interfaces
========================================================= */

export type UserRole =
  | "super_admin"
  | "branch_admin"
  | "counsellor"
  | "trainer"
  | "student"
  | "parent"
  | "hr"
  | "finance"
  | "franchise_owner"
  | "company_hr"
  | "public";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  role_abbreviation: string;
  branch_id?: string;
  branch_name?: string;
  branch_code?: string;
  city?: string;
  is_active: boolean;
  display_code?: string;
  phone?: string | null;
  profile_photo?: string | null;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserProfile;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  rememberMe: boolean;
};

/* =========================================================
   SECTION: Helper Functions
   Purpose: Reusable frontend logic
========================================================= */

function getStorage(rememberMe: boolean) {
  if (typeof window === "undefined") return null;
  return rememberMe ? window.localStorage : window.sessionStorage;
}

export function normalizeUserRole(role?: string | null): UserRole | null {
  if (!role) return null;
  const trimmed = role.trim();
  const alias = ROLE_ALIASES[trimmed.toUpperCase() as keyof typeof ROLE_ALIASES];
  if (alias) return alias;

  const normalized = trimmed.toLowerCase().replace(/-/g, "_");
  return normalized in ROLE_PATHS ? normalized as UserRole : null;
}

function normalizeProfile(user: UserProfile): UserProfile {
  const role = normalizeUserRole(user.role) ?? normalizeUserRole(user.role_abbreviation) ?? user.role;
  return { ...user, role };
}

export function storeSession(session: AuthSession): void {
  if (typeof window === "undefined") return;

  const storage = getStorage(session.rememberMe);
  if (!storage) return;

  const user = normalizeProfile(session.user);
  storage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(REMEMBER_ME_KEY, String(session.rememberMe));

  if (session.rememberMe) {
    window.localStorage.setItem(REMEMBER_ME_KEY, "true");
  }
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  let storage = window.localStorage;
  const rememberMe = window.localStorage.getItem(REMEMBER_ME_KEY) === "true";

  let accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  let refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  let userStr = storage.getItem(USER_KEY);

  if (!accessToken) {
    storage = window.sessionStorage;
    accessToken = storage.getItem(ACCESS_TOKEN_KEY);
    refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
    userStr = storage.getItem(USER_KEY);
  }

  if (!accessToken || !refreshToken || !userStr) return null;

  try {
    const user = normalizeProfile(JSON.parse(userStr) as UserProfile);
    return { accessToken, refreshToken, user, rememberMe };
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(REMEMBER_ME_KEY);

  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(REMEMBER_ME_KEY);

  clearStoredSession();
}

export async function loginUser(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const message = await parseRequestError(response);
    throw new Error(message);
  }

  const data = (await response.json()) as LoginResponse;
  const session: AuthSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: normalizeProfile(data.user),
    rememberMe,
  };

  storeSession(session);
  return session;
}

export async function logoutUser(): Promise<void> {
  const session = getStoredSession();
  if (!session) {
    clearAuthSession();
    return;
  }

  clearAuthSession();
  try {
    const controller = new AbortController();
    window.setTimeout(() => controller.abort(), 1500);
    void fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
      signal: controller.signal,
    }).catch(() => undefined);
  } catch {
    // Logout should clear local state even when the backend call fails.
  }
}

export async function refreshAccessToken(): Promise<string> {
  const session = getStoredSession();
  if (!session) return "";

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });

    if (!response.ok) {
      clearAuthSession();
      throw new Error("Token refresh failed");
    }

    const data = (await response.json()) as { access_token: string; token_type: string };
    const newAccessToken = data.access_token;

    const storage = getStorage(session.rememberMe);
    if (storage) {
      storage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    }

    return newAccessToken;
  } catch {
    clearAuthSession();
    return "";
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const session = getStoredSession();
  if (!session) return null;

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return getCurrentUser();
        }
        clearAuthSession();
      }
      return null;
    }

    return (await response.json()) as UserProfile;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const session = getStoredSession();
  return !!session && !!session.accessToken;
}

export function getUserRoleAbbr(): string {
  const session = getStoredSession();
  return session?.user.role_abbreviation || "";
}

export function getRoleDashboardPath(role?: UserRole | string | null): string {
  const normalizedRole = normalizeUserRole(role);
  return normalizedRole ? ROLE_PATHS[normalizedRole] : "/login";
}

/* =========================================================
   SECTION: Exports
   Purpose: Public exports used across the app
========================================================= */
