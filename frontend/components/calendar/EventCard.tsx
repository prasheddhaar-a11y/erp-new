"use client";

/**
 * PINESPHERE ERP | Calendar Module
 * File: EventCard.tsx — reusable event chip/card used in Month, Week, Day views
 */

import { CalendarEvent, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, formatTime } from "./calendarTypes";

interface EventCardProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  variant?: "chip" | "block"; // chip = compact (month/week), block = full (day view)
}

export default function EventCard({ event, onClick, variant = "chip" }: EventCardProps) {
  const colors = EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.other;

  if (variant === "block") {
    return (
      <button
        onClick={() => onClick(event)}
        className="w-full text-left px-3 py-2.5 rounded-[12px] hover:opacity-80 transition-opacity"
        style={{ backgroundColor: colors.bg, borderLeft: `4px solid ${colors.border}` }}
      >
        <p className="text-[13px] font-semibold truncate" style={{ color: colors.text }}>
          {event.title}
        </p>
        {!event.all_day && (
          <p className="text-[11px] mt-0.5" style={{ color: colors.text + "99" }}>
            {formatTime(event.start_time)} – {formatTime(event.end_time)}
          </p>
        )}
        {event.location && (
          <p className="text-[11px] mt-0.5 text-[#60708C] truncate">📍 {event.location}</p>
        )}
        <span
          className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ backgroundColor: colors.border + "22", color: colors.text }}
        >
          {EVENT_TYPE_LABELS[event.event_type]}
        </span>
      </button>
    );
  }

  // chip variant — compact for month/week cells
  return (
    <button
      onClick={() => onClick(event)}
      className="w-full text-left px-2 py-0.5 rounded-[6px] text-[11px] font-medium truncate hover:opacity-75 transition-opacity"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderLeft: `3px solid ${colors.border}`,
      }}
    >
      {!event.all_day && (
        <span className="opacity-70 mr-1">{formatTime(event.start_time)}</span>
      )}
      {event.title}
    </button>
  );
}