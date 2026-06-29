"use client";

/**
 * PINESPHERE ERP | Calendar Module
 * File: CalendarMonthView.tsx — full month grid view
 */

import { CalendarEvent, WEEK_DAYS, isSameDay } from "./calendarTypes";
import EventCard from "./EventCard";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function CalendarMonthView({ currentDate, events, onDayClick, onEventClick }: Props) {
  const today = new Date();
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth  = new Date(year, month, 1).getDay();
  const daysInMonth      = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth  = new Date(year, month, 0).getDate();

  // Build 42-cell grid (6 rows × 7 cols)
  const cells: { date: Date; currentMonth: boolean }[] = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), currentMonth: false });
  }

  function eventsForDay(date: Date) {
    return events.filter(e => isSameDay(new Date(e.start_time), date));
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#DCE7E2] overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[#DCE7E2] bg-[#F8FAF9]">
        {WEEK_DAYS.map(day => (
          <div key={day} className="py-3 text-center text-[12px] font-semibold text-[#60708C] uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, currentMonth }, idx) => {
          const dayEvents  = eventsForDay(date);
          const isToday    = isSameDay(date, today);
          const isLastRow  = idx >= 35;
          const isLastCol  = (idx + 1) % 7 === 0;

          return (
            <div
              key={idx}
              onClick={() => onDayClick(date)}
              className={`min-h-[110px] p-2 cursor-pointer transition-colors hover:bg-[#F4FAF7]
                ${!isLastRow  ? "border-b border-[#DCE7E2]" : ""}
                ${!isLastCol  ? "border-r border-[#DCE7E2]" : ""}
              `}
            >
              {/* Date number */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold mb-1.5 transition-colors
                  ${isToday
                    ? "bg-[#0B7A5A] text-white"
                    : currentMonth
                    ? "text-[#071B4A] hover:bg-[#F0F4F2]"
                    : "text-[#C0CCD4]"
                  }`}
              >
                {date.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    variant="chip"
                    onClick={onEventClick}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-[#60708C] font-medium pl-1">
                    +{dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}