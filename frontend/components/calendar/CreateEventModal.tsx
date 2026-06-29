"use client";

/**
 * PINESPHERE ERP | Calendar Module
 * File: CreateEventModal.tsx — create & edit event modal
 */

import { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, Link, Bell } from "lucide-react";
import { CalendarEvent, CreateEventPayload, EVENT_TYPE_LABELS, EventType } from "./calendarTypes";
import { createEvent, updateEvent } from "./calendarApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editEvent?: CalendarEvent | null;
  defaultDate?: string; // pre-filled YYYY-MM-DD
}

const EVENT_TYPES: EventType[] = [
  "follow_up", "demo_class", "meeting", "counselling_session", "task", "other",
];

const TYPE_PILL: Record<EventType, string> = {
  follow_up:           "bg-blue-50 text-blue-700 border border-blue-300",
  demo_class:          "bg-purple-50 text-purple-700 border border-purple-300",
  meeting:             "bg-orange-50 text-orange-700 border border-orange-300",
  counselling_session: "bg-green-50 text-green-700 border border-green-300",
  task:                "bg-gray-100 text-gray-700 border border-gray-300",
  other:               "bg-rose-50 text-rose-700 border border-rose-300",
};

const EMPTY = {
  title: "", description: "",
  date: new Date().toISOString().slice(0, 10),
  start_hour: "09", start_min: "00",
  end_hour: "10",   end_min: "00",
  all_day: false,
  event_type: "meeting" as EventType,
  status: "scheduled",
  location: "", linked_type: "none", linked_name: "",
  reminder_at: "", notes: "",
};

export default function CreateEventModal({ open, onClose, onSaved, editEvent, defaultDate }: Props) {
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!open) return;
    if (editEvent) {
      const s = new Date(editEvent.start_time);
      const e = new Date(editEvent.end_time);
      setForm({
        title:       editEvent.title,
        description: editEvent.description || "",
        date:        s.toISOString().slice(0, 10),
        start_hour:  String(s.getHours()).padStart(2, "0"),
        start_min:   String(s.getMinutes()).padStart(2, "0"),
        end_hour:    String(e.getHours()).padStart(2, "0"),
        end_min:     String(e.getMinutes()).padStart(2, "0"),
        all_day:     editEvent.all_day,
        event_type:  editEvent.event_type as EventType,
        status:      editEvent.status,
        location:    editEvent.location || "",
        linked_type: editEvent.linked_type || "none",
        linked_name: editEvent.linked_name || "",
        reminder_at: editEvent.reminder_at ? editEvent.reminder_at.slice(0, 16) : "",
        notes:       editEvent.notes || "",
      });
    } else {
      setForm({ ...EMPTY, date: defaultDate || EMPTY.date });
    }
    setError("");
  }, [open, editEvent, defaultDate]);

  function set(key: string, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    const startTime = `${form.date}T${form.start_hour}:${form.start_min}:00`;
    const endTime = `${form.date}T${form.end_hour}:${form.end_min}:00`;
    if (!form.all_day && new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time.");
      return;
    }
    setError(""); setLoading(true);

    const payload: CreateEventPayload = {
      title:       form.title.trim(),
      description: form.description || undefined,
      start_time:  startTime,
      end_time:    endTime,
      all_day:     form.all_day,
      event_type:  form.event_type,
      status:      form.status as any,
      location:    form.location || undefined,
      linked_type: form.linked_type,
      linked_name: form.linked_name || undefined,
      reminder_at: form.reminder_at ? `${form.reminder_at}:00` : undefined,
      notes:       form.notes || undefined,
    };

    try {
      editEvent ? await updateEvent(editEvent.id, payload) : await createEvent(payload);
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DCE7E2]">
          <div>
            <h2 className="text-[18px] font-bold text-[#071B4A]">
              {editEvent ? "Edit Event" : "New Event"}
            </h2>
            <p className="text-[13px] text-[#60708C] mt-0.5">
              {editEvent ? "Update event details" : "Add to your calendar"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F4F7F5] transition-colors">
            <X size={18} className="text-[#60708C]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-[13px] font-semibold text-[#071B4A] mb-1.5">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="e.g. Follow-up call with Rahul"
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[14px] text-[#071B4A] placeholder:text-[#B0BEC5] focus:outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#0B7A5A]/10"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-[13px] font-semibold text-[#071B4A] mb-2">Event Type</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => set("event_type", type)}
                  className={`px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-all ${
                    form.event_type === type
                      ? TYPE_PILL[type]
                      : "bg-[#F4F7F5] text-[#60708C] border border-transparent hover:border-[#DCE7E2]"
                  }`}
                >
                  {EVENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[13px] font-semibold text-[#071B4A] mb-1.5">
              <Calendar size={13} className="inline mr-1" />Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={e => set("date", e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[14px] text-[#071B4A] focus:outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#0B7A5A]/10"
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => set("all_day", !form.all_day)}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.all_day ? "bg-[#0B7A5A]" : "bg-[#DCE7E2]"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.all_day ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-[13px] text-[#071B4A] font-medium">All day event</span>
          </div>

          {/* Time */}
          {!form.all_day && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Start Time", hour: "start_hour", min: "start_min" },
                { label: "End Time",   hour: "end_hour",   min: "end_min"   },
              ].map(({ label, hour, min }) => (
                <div key={label}>
                  <label className="block text-[13px] font-semibold text-[#071B4A] mb-1.5">
                    <Clock size={13} className="inline mr-1" />{label}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={(form as any)[hour]}
                      onChange={e => set(hour, e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[14px] text-[#071B4A] focus:outline-none focus:border-[#0B7A5A]"
                    >
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select
                      value={(form as any)[min]}
                      onChange={e => set(min, e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[14px] text-[#071B4A] focus:outline-none focus:border-[#0B7A5A]"
                    >
                      {["00","15","30","45"].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-[13px] font-semibold text-[#071B4A] mb-1.5">
              <MapPin size={13} className="inline mr-1" />Location
              <span className="text-[#60708C] font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={e => set("location", e.target.value)}
              placeholder="Office / Google Meet / Phone"
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[14px] text-[#071B4A] placeholder:text-[#B0BEC5] focus:outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#0B7A5A]/10"
            />
          </div>

          {/* Linked to */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#071B4A] mb-1.5">
                <Link size={13} className="inline mr-1" />Linked To
              </label>
              <select
                value={form.linked_type}
                onChange={e => set("linked_type", e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[14px] text-[#071B4A] focus:outline-none focus:border-[#0B7A5A]"
              >
                <option value="none">None</option>
                <option value="lead">Lead</option>
                <option value="student">Student</option>
              </select>
            </div>
            {form.linked_type !== "none" && (
              <div>
                <label className="block text-[13px] font-semibold text-[#071B4A] mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.linked_name}
                  onChange={e => set("linked_name", e.target.value)}
                  placeholder="Lead / Student name"
                  className="w-full px-4 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[14px] text-[#071B4A] placeholder:text-[#B0BEC5] focus:outline-none focus:border-[#0B7A5A]"
                />
              </div>
            )}
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-[13px] font-semibold text-[#071B4A] mb-1.5">
              <Bell size={13} className="inline mr-1" />Reminder
              <span className="text-[#60708C] font-normal ml-1">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={form.reminder_at}
              onChange={e => set("reminder_at", e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[14px] text-[#071B4A] focus:outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#0B7A5A]/10"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-semibold text-[#071B4A] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              placeholder="What is this event about?"
              className="w-full px-4 py-2.5 rounded-[12px] border border-[#DCE7E2] text-[14px] text-[#071B4A] placeholder:text-[#B0BEC5] focus:outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#0B7A5A]/10 resize-none"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-[10px]">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#DCE7E2] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-[12px] text-[14px] font-medium text-[#60708C] border border-[#DCE7E2] hover:bg-[#F4F7F5] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-[12px] text-[14px] font-semibold text-white bg-[#0B7A5A] hover:bg-[#096649] transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : editEvent ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
}
