/**
 * PINESPHERE ERP | Calendar Module
 * File: calendarApi.ts — all API calls
 */

import { CalendarEvent, CalendarKPI, CreateEventPayload } from "./calendarTypes";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("pinesphere_access_token")
        || sessionStorage.getItem("pinesphere_access_token")
        || localStorage.getItem("access_token")
        || sessionStorage.getItem("access_token")
      : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCalendarKPIs(): Promise<CalendarKPI> {
  const res = await fetch(`${BASE}/calendar/kpis`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch KPIs");
  return res.json();
}

export async function fetchEvents(params?: {
  event_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}): Promise<CalendarEvent[]> {
  const q = new URLSearchParams();
  if (params?.event_type) q.set("event_type", params.event_type);
  if (params?.status)     q.set("status", params.status);
  if (params?.start_date) q.set("start_date", params.start_date);
  if (params?.end_date)   q.set("end_date", params.end_date);
  const res = await fetch(`${BASE}/calendar?${q.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchEvent(id: string): Promise<CalendarEvent> {
  const res = await fetch(`${BASE}/calendar/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch event");
  return res.json();
}

export async function createEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
  const res = await fetch(`${BASE}/calendar`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res, "Failed to create event"));
  return res.json();
}

export async function updateEvent(id: string, payload: Partial<CreateEventPayload>): Promise<CalendarEvent> {
  const res = await fetch(`${BASE}/calendar/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res, "Failed to update event"));
  return res.json();
}

async function readError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) return data.detail.map((item: { msg?: string }) => item.msg || fallback).join("; ");
  } catch {
    // Fall through to fallback.
  }
  return fallback;
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${BASE}/calendar/${id}`, { method: "DELETE", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to delete event");
}

export async function completeEvent(id: string): Promise<CalendarEvent> {
  const res = await fetch(`${BASE}/calendar/${id}/complete`, { method: "PATCH", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to complete event");
  return res.json();
}

export async function cancelEvent(id: string): Promise<CalendarEvent> {
  const res = await fetch(`${BASE}/calendar/${id}/cancel`, { method: "PATCH", headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to cancel event");
  return res.json();
}
