/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Auth
Purpose     : Provides Auth frontend logic and shared types
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import { API_URL, clearStoredSession, parseRequestError } from "./api";

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

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

// Storage keys
/* =====================================================
   SECTION: CONSTANTS
   PURPOSE:
   This section stores fixed values used by the file.
   Centralizing these values helps avoid repeated magic strings or numbers.
===================================================== */

const ACCESS_TOKEN_KEY = "pinesphere_access_token";
const REFRESH_TOKEN_KEY = "pinesphere_refresh_token";
const USER_KEY = "pinesphere_user";
const REMEMBER_ME_KEY = "pinesphere_remember_me";

/**
 * Get the storage type based on rememberMe setting
 */
/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function getStorage(rememberMe: boolean) {
  if (typeof window === "undefined") return null;
  return rememberMe ? window.localStorage : window.sessionStorage;
}

const ROLE_ALIASES: Record<string, UserRole> = {
  SUPER_ADMIN: "super_admin",
  SA: "super_admin",
  BRANCH_ADMIN: "branch_admin",
  BA: "branch_admin",
  TRAINER: "trainer",
  TR: "trainer",
};

/**
 * Store session tokens and user profile
 */
export function storeSession(session: AuthSession): void {
  if (typeof window === "undefined") return;

  const storage = getStorage(session.rememberMe);
  if (!storage) return;

  storage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  const user = { ...session.user, role: normalizeUserRole(session.user.role || session.user.role_abbreviation) };
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(REMEMBER_ME_KEY, String(session.rememberMe));

  // Also set in localStorage for cross-tab refresh token reference if rememberMe
  if (session.rememberMe) {
    window.localStorage.setItem(REMEMBER_ME_KEY, "true");
  }
}

/**
 * Retrieve current session from storage
 */
export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  // Check both localStorage and sessionStorage
  let storage = window.localStorage;
  const rememberMe = window.localStorage.getItem(REMEMBER_ME_KEY) === "true";

  let accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  let refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  let userStr = storage.getItem(USER_KEY);

  // If not in localStorage, check sessionStorage
  if (!accessToken) {
    storage = window.sessionStorage;
    accessToken = storage.getItem(ACCESS_TOKEN_KEY);
    refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
    userStr = storage.getItem(USER_KEY);
  }

  if (!accessToken || !refreshToken || !userStr) return null;

  try {
    const storedUser = JSON.parse(userStr) as UserProfile;
    const user = { ...storedUser, role: normalizeUserRole(storedUser.role || storedUser.role_abbreviation) };
    return { accessToken, refreshToken, user, rememberMe };
  } catch {
    return null;
  }
}

/**
 * Clear all session data from storage
 */
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

  clearStoredSession(); // Clear legacy keys
}

/**
 * Login with email and password
 */
export async function loginUser(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<AuthSession> {
  /* =====================================================
     SECTION: API CALLS
     PURPOSE:
     This section talks to backend or server endpoints.
     It sends requests, receives responses, and prepares data for the UI.
  ===================================================== */

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const message = await parseRequestError(response);
    /* =====================================================
       SECTION: ERROR HANDLING
       PURPOSE:
       This section handles expected failures and converts them into useful responses.
       Good error handling keeps the app stable when something goes wrong.
    ===================================================== */

    throw new Error(message);
  }

  const data = (await response.json()) as LoginResponse;
  const session: AuthSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: { ...data.user, role: normalizeUserRole(data.user.role || data.user.role_abbreviation) },
    rememberMe,
  };

  storeSession(session);
  return session;
}

/**
 * Logout and revoke session
 */
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
    // Ignore logout errors, clear session anyway
  }
}

/**
 * Refresh access token
 */
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

    // Update access token in storage
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

/**
 * Get current user profile
 */
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

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const session = getStoredSession();
  return !!session && !!session.accessToken;
}

/**
 * Get current user role abbreviation
 */
export function getUserRoleAbbr(): string {
  const session = getStoredSession();
  return session?.user.role_abbreviation || "";
}

/**
 * Normalize a raw role string to a valid UserRole
 */
export function normalizeUserRole(role: string): UserRole {
  const alias = ROLE_ALIASES[role.trim().toUpperCase()];
  if (alias) return alias;
  const validRoles: UserRole[] = [
    "super_admin", "branch_admin", "counsellor", "trainer",
    "student", "parent", "hr", "finance", "franchise_owner",
    "company_hr", "public"
  ];
  const normalized = role.trim().toLowerCase().replace(/-/g, "_");
  return validRoles.includes(normalized as UserRole) ? (normalized as UserRole) : "public";
}

/**
 * Get role-based dashboard path
 */
export function getRoleDashboardPath(role: UserRole): string {
  const rolePathMap: Record<UserRole, string> = {
    super_admin: "/super-admin/dashboard",
    branch_admin: "/branch-admin/dashboard",
    counsellor: "/counsellor/dashboard",
    trainer: "/trainer/dashboard",
    student: "/student/dashboard",
    parent: "/parent/dashboard",
    hr: "/hr/dashboard",
    finance: "/finance/dashboard",
    franchise_owner: "/franchise-owner/dashboard",
    company_hr: "/company-hr/dashboard",
    public: "/public",
  };

  return rolePathMap[role] || "/";
}
