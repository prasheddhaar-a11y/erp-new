"use client";

/**
 * PINESPHERE ERP | Calendar Module
 * File: CalendarWeekView.tsx — 7-column hour grid
 */

import { CalendarEvent, WEEK_DAYS, HOURS, isSameDay, startOfWeek, addDays, formatHour } from "./calendarTypes";
import EventCard from "./EventCard";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}

export default function CalendarWeekView({ currentDate, events, onEventClick, onSlotClick }: Props) {
  const today     = new Date();
  const weekStart = startOfWeek(currentDate);
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function eventsForSlot(date: Date, hour: number) {
    return events.filter(e => {
      const start = new Date(e.start_time);
      return isSameDay(start, date) && start.getHours() === hour;
    });
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#DCE7E2] overflow-auto max-h-[620px]">
      {/* Day headers — sticky */}
      <div className="grid grid-cols-8 border-b border-[#DCE7E2] sticky top-0 bg-white z-10">
        {/* Time column header */}
        <div className="py-3 border-r border-[#DCE7E2]" />

        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="py-3 text-center border-r border-[#DCE7E2] last:border-r-0">
              <p className="text-[11px] font-semibold text-[#60708C] uppercase tracking-wider">
                {WEEK_DAYS[day.getDay()]}
              </p>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 text-[14px] font-bold
                  ${isToday ? "bg-[#0B7A5A] text-white" : "text-[#071B4A]"}`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hour rows */}
      {HOURS.map(hour => (
        <div key={hour} className="grid grid-cols-8 border-b border-[#F0F4F2] last:border-b-0">
          {/* Time label */}
          <div className="py-3 pr-3 text-right text-[11px] text-[#60708C] font-medium border-r border-[#F0F4F2]">
            {formatHour(hour)}
          </div>

          {/* Day slot cells */}
          {weekDays.map((day, i) => {
            const slotEvents = eventsForSlot(day, hour);
            return (
              <div
                key={i}
                onClick={() => {
                  const d = new Date(day);
                  d.setHours(hour, 0, 0, 0);
                  onSlotClick(d);
                }}
                className="min-h-[56px] border-r border-[#F0F4F2] last:border-r-0 p-1 cursor-pointer hover:bg-[#F8FAF9] transition-colors"
              >
                {slotEvents.map(ev => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    variant="chip"
                    onClick={e => { onEventClick(e); }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}