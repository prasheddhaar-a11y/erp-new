/**
 * PINESPHERE ERP | Calendar Module
 * File: calendarTypes.ts — shared types, constants, helpers
 */

export type EventType =
  | "follow_up"
  | "demo_class"
  | "meeting"
  | "counselling_session"
  | "task"
  | "other";

export type EventStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type CalendarView = "month" | "week" | "day";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  event_type: EventType;
  status: EventStatus;
  location?: string;
  linked_type: string;
  linked_id?: string;
  linked_name?: string;
  reminder_at?: string;
  reminder_sent: boolean;
  notes?: string;
  created_by?: string;
  assigned_to?: string;
  assignee_name?: string;
  branch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarKPI {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  today_events: number;
  upcoming_this_week: number;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  event_type?: EventType;
  status?: EventStatus;
  location?: string;
  linked_type?: string;
  linked_id?: string;
  linked_name?: string;
  reminder_at?: string;
  notes?: string;
  assigned_to?: string;
  branch_id?: string;
}

// ── Color map ──────────────────────────────────────────────────────────────
export const EVENT_TYPE_COLORS: Record<EventType, { bg: string; border: string; text: string; dot: string }> = {
  follow_up:           { bg: "#EFF6FF", border: "#3B82F6", text: "#1D4ED8", dot: "#3B82F6" },
  demo_class:          { bg: "#F5F3FF", border: "#8B5CF6", text: "#6D28D9", dot: "#8B5CF6" },
  meeting:             { bg: "#FFF7ED", border: "#F97316", text: "#C2410C", dot: "#F97316" },
  counselling_session: { bg: "#F0FDF4", border: "#0B7A5A", text: "#065F46", dot: "#0B7A5A" },
  task:                { bg: "#F9FAFB", border: "#6B7280", text: "#374151", dot: "#6B7280" },
  other:               { bg: "#FFF1F2", border: "#F43F5E", text: "#BE123C", dot: "#F43F5E" },
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  follow_up:           "Follow Up",
  demo_class:          "Demo Class",
  meeting:             "Meeting",
  counselling_session: "Counselling Session",
  task:                "Task",
  other:               "Other",
};

// ── Helpers ────────────────────────────────────────────────────────────────
export const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(d: Date) {
  const date = new Date(d);
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(d: Date, n: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

export function formatHour(h: number) {
  const ampm = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${ampm}`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}