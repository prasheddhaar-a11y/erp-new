"use client";

/**
 * PINESPHERE ERP | Calendar Module
 * File: CalendarDayView.tsx — hour-by-hour single day view
 */

import { CalendarEvent, HOURS, isSameDay, formatHour } from "./calendarTypes";
import EventCard from "./EventCard";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}

export default function CalendarDayView({ currentDate, events, onEventClick, onSlotClick }: Props) {
  const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), currentDate));

  function eventsForHour(hour: number) {
    return dayEvents.filter(e => new Date(e.start_time).getHours() === hour);
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#DCE7E2] overflow-auto max-h-[620px]">
      {/* Day header */}
      <div className="px-6 py-4 border-b border-[#DCE7E2] sticky top-0 bg-white z-10">
        <p className="text-[16px] font-bold text-[#071B4A]">
          {currentDate.toLocaleDateString("en-IN", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </p>
        <p className="text-[13px] text-[#60708C] mt-0.5">
          {dayEvents.length === 0 ? "No events today" : `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Hour rows */}
      {HOURS.map(hour => {
        const slotEvents = eventsForHour(hour);
        const isCurrentHour = new Date().getHours() === hour && isSameDay(currentDate, new Date());

        return (
          <div
            key={hour}
            onClick={() => {
              const d = new Date(currentDate);
              d.setHours(hour, 0, 0, 0);
              onSlotClick(d);
            }}
            className={`flex border-b border-[#F0F4F2] last:border-b-0 cursor-pointer hover:bg-[#F8FAF9] transition-colors min-h-[64px]
              ${isCurrentHour ? "bg-[#F0FDF4]" : ""}`}
          >
            {/* Time */}
            <div className="w-20 flex-shrink-0 py-3 pr-4 text-right">
              <span
                className={`text-[12px] font-medium ${isCurrentHour ? "text-[#0B7A5A] font-bold" : "text-[#60708C]"}`}
              >
                {formatHour(hour)}
              </span>
            </div>

            {/* Events */}
            <div className="flex-1 p-2 border-l border-[#F0F4F2] space-y-1.5">
              {slotEvents.map(ev => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  variant="block"
                  onClick={e => { onEventClick(e); }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}