"use client";

/**
 * PINESPHERE ERP
 * Module      : Calendar Management
 * File        : EventDetailPanel.tsx
 * Purpose     : Slide-in panel showing full event details with actions
 */

import { X, Clock, MapPin, Link2, Bell, CheckCircle, XCircle, Pencil, Trash2, Calendar } from "lucide-react";
import { CalendarEvent, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "./calendarTypes";
import { completeEvent, cancelEvent, deleteEvent } from "./calendarApi";
import { useState } from "react";

interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onRefresh: () => void;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<string, string> = {
  scheduled:   "bg-blue-50 text-blue-700 border border-blue-200",
  completed:   "bg-green-50 text-[#0B7A5A] border border-green-200",
  cancelled:   "bg-red-50 text-red-700 border border-red-200",
  rescheduled: "bg-orange-50 text-orange-700 border border-orange-200",
};

export default function EventDetailPanel({ event, onClose, onEdit, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!event) return null;

  const colors = EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS]
    || EVENT_TYPE_COLORS.other;

  async function handleComplete() {
    setLoading("complete");
    try { await completeEvent(event!.id); onRefresh(); onClose(); }
    finally { setLoading(null); }
  }

  async function handleCancel() {
    setLoading("cancel");
    try { await cancelEvent(event!.id); onRefresh(); onClose(); }
    finally { setLoading(null); }
  }

  async function handleDelete() {
    if (!confirm("Delete this event?")) return;
    setLoading("delete");
    try { await deleteEvent(event!.id); onRefresh(); onClose(); }
    finally { setLoading(null); }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[400px] z-50 bg-white shadow-2xl flex flex-col">
        {/* Color bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.border }} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#DCE7E2]">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
              >
                {EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS] || event.event_type}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLES[event.status] || ""}`}>
                {event.status}
              </span>
            </div>
            <h2 className="text-[17px] font-bold text-[#071B4A] leading-tight">{event.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F4F7F5] transition-colors">
            <X size={16} className="text-[#60708C]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-[#F4F7F5] flex items-center justify-center flex-shrink-0">
              <Calendar size={14} className="text-[#0B7A5A]" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#60708C] uppercase tracking-wider">Date & Time</p>
              {event.all_day ? (
                <p className="text-[14px] text-[#071B4A] font-medium mt-0.5">
                  {new Date(event.start_time).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  <span className="ml-2 text-[#60708C] text-[12px]">(All day)</span>
                </p>
              ) : (
                <p className="text-[14px] text-[#071B4A] font-medium mt-0.5">
                  {new Date(event.start_time).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                  <br />
                  <span className="text-[13px] text-[#60708C]">
                    {formatTime(event.start_time)} – {formatTime(event.end_time)}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-[#F4F7F5] flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-[#0B7A5A]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#60708C] uppercase tracking-wider">Location</p>
                <p className="text-[14px] text-[#071B4A] font-medium mt-0.5">{event.location}</p>
              </div>
            </div>
          )}

          {/* Linked */}
          {event.linked_type !== "none" && event.linked_name && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-[#F4F7F5] flex items-center justify-center flex-shrink-0">
                <Link2 size={14} className="text-[#0B7A5A]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#60708C] uppercase tracking-wider">
                  Linked {event.linked_type}
                </p>
                <p className="text-[14px] text-[#071B4A] font-medium mt-0.5">{event.linked_name}</p>
              </div>
            </div>
          )}

          {/* Reminder */}
          {event.reminder_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-[#F4F7F5] flex items-center justify-center flex-shrink-0">
                <Bell size={14} className="text-[#0B7A5A]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#60708C] uppercase tracking-wider">Reminder</p>
                <p className="text-[14px] text-[#071B4A] font-medium mt-0.5">{formatDateTime(event.reminder_at)}</p>
                {event.reminder_sent && (
                  <span className="text-[11px] text-[#0B7A5A]">✓ Sent</span>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="bg-[#F8FAF9] rounded-[14px] p-4 border border-[#DCE7E2]">
              <p className="text-[12px] font-semibold text-[#60708C] uppercase tracking-wider mb-2">Description</p>
              <p className="text-[14px] text-[#071B4A] leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="bg-amber-50 rounded-[14px] p-4 border border-amber-200">
              <p className="text-[12px] font-semibold text-amber-700 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-[14px] text-[#071B4A] leading-relaxed">{event.notes}</p>
            </div>
          )}

          {/* Assigned to */}
          {event.assignee_name && (
            <div className="flex items-center gap-3 bg-[#F4F7F5] rounded-[14px] p-3">
              <div className="w-8 h-8 rounded-full bg-[#0B7A5A] flex items-center justify-center text-white text-[12px] font-bold">
                {event.assignee_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] text-[#60708C]">Assigned to</p>
                <p className="text-[13px] font-semibold text-[#071B4A]">{event.assignee_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {event.status === "scheduled" && (
          <div className="px-6 py-4 border-t border-[#DCE7E2] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleComplete}
                disabled={!!loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#0B7A5A] text-white text-[13px] font-semibold hover:bg-[#096649] transition-colors disabled:opacity-60"
              >
                <CheckCircle size={15} />
                {loading === "complete" ? "..." : "Complete"}
              </button>
              <button
                onClick={handleCancel}
                disabled={!!loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-orange-50 text-orange-700 border border-orange-200 text-[13px] font-semibold hover:bg-orange-100 transition-colors disabled:opacity-60"
              >
                <XCircle size={15} />
                {loading === "cancel" ? "..." : "Cancel"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onEdit(event)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[#071B4A] text-[13px] font-semibold hover:bg-[#F4F7F5] transition-colors"
              >
                <Pencil size={15} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={!!loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-red-50 text-red-600 border border-red-200 text-[13px] font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                <Trash2 size={15} />
                {loading === "delete" ? "..." : "Delete"}
              </button>
            </div>
          </div>
        )}
        {event.status !== "scheduled" && (
          <div className="px-6 py-4 border-t border-[#DCE7E2] grid grid-cols-2 gap-3">
            <button
              onClick={() => onEdit(event)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[#071B4A] text-[13px] font-semibold hover:bg-[#F4F7F5] transition-colors"
            >
              <Pencil size={15} />Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-red-50 text-red-600 border border-red-200 text-[13px] font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
            >
              <Trash2 size={15} />{loading === "delete" ? "..." : "Delete"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}