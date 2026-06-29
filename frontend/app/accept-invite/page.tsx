/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Page
Purpose     : Renders and coordinates Page UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client";


/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import { CheckCircle2, Loader2, LockKeyhole, XCircle } from "lucide-react";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { API_URL, parseRequestError } from "../shared/api";

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type InvitePreview = {
  email: string;
  full_name: string;
  role: string;
  invite_expires_at?: string | null;
};

type SubmitState = "checking" | "ready" | "submitting" | "success" | "error";

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function validatePassword(password: string, confirmPassword: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a special character.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return "";
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<SubmitState>(token ? "checking" : "error");
  const [message, setMessage] = useState(token ? "Checking your invitation..." : "Invite token is missing.");
  const submittingRef = useRef(false);
  const successRef = useRef(false);

  const passwordIssue = useMemo(() => {
    if (!password && !confirmPassword) return "";
    return validatePassword(password, confirmPassword);
  }, [password, confirmPassword]);

  useEffect(() => {
    if (!token) return;

    let alive = true;
    /* =====================================================
       SECTION: API CALLS
       PURPOSE:
       This section talks to backend or server endpoints.
       It sends requests, receives responses, and prepares data for the UI.
    ===================================================== */

    fetch(`${API_URL}/auth/accept-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        /* =====================================================
           SECTION: ERROR HANDLING
           PURPOSE:
           This section handles expected failures and converts them into useful responses.
           Good error handling keeps the app stable when something goes wrong.
        ===================================================== */

        if (!response.ok) throw new Error(await parseRequestError(response));
        return response.json() as Promise<InvitePreview>;
      })
      .then((data) => {
        if (!alive || successRef.current) return;
        setInvite(data);
        setState("ready");
        setMessage("Create a secure password to activate your account.");
      })
      .catch((error) => {
        if (!alive || successRef.current) return;
        setInvite(null);
        setState("error");
        setMessage(error instanceof Error ? error.message : "Invitation is invalid or expired.");
      });

    /* =====================================================
       SECTION: UI RENDERING
       PURPOSE:
       This section returns the visual layout shown to the user.
       It combines data, state, and components into the final screen.
    ===================================================== */

    return () => {
      alive = false;
    };
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || successRef.current) return;

    const validationMessage = validatePassword(password, confirmPassword);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    submittingRef.current = true;
    setState("submitting");
    setMessage("Activating your account...");

    try {
      const response = await fetch(`${API_URL}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password, confirm_password: confirmPassword }),
      });

      if (!response.ok) throw new Error(await parseRequestError(response));
      const data = (await response.json()) as { message?: string };
      successRef.current = true;
      setInvite(null);
      setPassword("");
      setConfirmPassword("");
      setState("success");
      setMessage(data.message ?? "Invite accepted. You can now log in.");
    } catch (error) {
      if (successRef.current) return;
      setState("ready");
      setMessage(error instanceof Error ? error.message : "Password could not be set.");
    } finally {
      submittingRef.current = false;
    }
  }

  const isBusy = state === "checking" || state === "submitting";
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <main className="min-h-screen bg-[var(--pinesphere-neutral-bg)] px-4 py-10 text-[var(--pinesphere-navy)]">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="w-full rounded-2xl border border-[var(--pinesphere-green-border)] bg-white p-8 shadow-[0_24px_70px_rgba(11,122,90,0.14)]">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--pinesphere-green-light)] text-[var(--pinesphere-green)]">
            {isBusy ? <Loader2 className="animate-spin" size={26} /> : isSuccess ? <CheckCircle2 size={28} /> : isError ? <XCircle size={28} /> : <LockKeyhole size={26} />}
          </div>

          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--pinesphere-green)]">Pinesphere ERP</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#102316]">Accept Invitation</h1>
            {invite ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-[#4b6351]">
                Welcome, {invite.full_name}. This invite is for <span className="font-black text-[#102316]">{invite.email}</span>.
              </p>
            ) : null}
          </div>

          <div className={`mt-6 rounded-xl border px-4 py-3 text-sm font-bold ${isError ? "border-red-200 bg-red-50 text-red-700" : isSuccess ? "border-[var(--pinesphere-green-border)] bg-[var(--pinesphere-green-light)] text-[var(--pinesphere-green)]" : "border-[var(--pinesphere-green-border)] bg-[var(--pinesphere-green-light)] text-[var(--pinesphere-navy)]"}`}>
            {message}
          </div>

          {state === "ready" ? (
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-black text-[#102316]">
                New password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-xl border border-[var(--pinesphere-green-border)] bg-white px-4 text-sm font-bold outline-none transition focus:border-[var(--pinesphere-green)] focus:ring-4 focus:ring-[rgba(11,122,90,0.14)]"
                />
              </label>

              <label className="grid gap-2 text-sm font-black text-[#102316]">
                Confirm password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-12 rounded-xl border border-[var(--pinesphere-green-border)] bg-white px-4 text-sm font-bold outline-none transition focus:border-[var(--pinesphere-green)] focus:ring-4 focus:ring-[rgba(11,122,90,0.14)]"
                />
              </label>

              {passwordIssue ? <p className="text-xs font-bold text-amber-700">{passwordIssue}</p> : null}

              <button
                type="submit"
                disabled={isBusy}
                className="mt-2 h-12 rounded-xl bg-[var(--pinesphere-green)] text-sm font-black text-white shadow-[0_6px_0_var(--pinesphere-green-hover)] transition hover:bg-[var(--pinesphere-green-hover)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isBusy ? "Activating..." : "Activate account"}
              </button>
            </form>
          ) : null}

          {isSuccess ? (
            <Link
              href="/login"
              className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[var(--pinesphere-green)] text-sm font-black text-white shadow-[0_6px_0_var(--pinesphere-green-hover)] transition hover:bg-[var(--pinesphere-green-hover)]"
            >
              Go to login
            </Link>
          ) : null}

          {isError ? (
            <Link href="/login" className="mt-5 block text-center text-sm font-black text-[var(--pinesphere-green)]">
              Back to login
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--pinesphere-neutral-bg)]" />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
