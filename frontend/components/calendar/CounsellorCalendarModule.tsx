"use client";

/**
 * PINESPHERE ERP
 * Module      : Calendar Management
 * File        : CounsellorCalendarModule.tsx
 * Purpose     : Full calendar UI — Month/Week/Day views, KPI cards, event management
 * Author      : Pinesphere Development Team
 * Last Updated: Auto Generated
 */

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Calendar,
  CheckCircle, Clock, XCircle, CalendarDays,
} from "lucide-react";
import {
  CalendarEvent, CalendarKPI, CalendarView,
  EVENT_TYPE_COLORS, EVENT_TYPE_LABELS,
} from "./calendarTypes";
import { fetchEvents, fetchCalendarKPIs } from "./calendarApi";
import CreateEventModal from "./CreateEventModal";
import EventDetailPanel from "./EventDetailPanel";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

function formatHour(h: number) {
  const ampm = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${ampm}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────

function KPICard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-[20px] border border-[#DCE7E2] px-5 py-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-[14px] flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-[22px] font-bold text-[#071B4A] leading-none">{value}</p>
        <p className="text-[12px] text-[#60708C] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT CHIP (used in month view cells)
// ─────────────────────────────────────────────────────────────────────────────

function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const colors = EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS] || EVENT_TYPE_COLORS.other;
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="w-full text-left px-2 py-0.5 rounded-[6px] text-[11px] font-medium truncate hover:opacity-80 transition-opacity"
      style={{ backgroundColor: colors.bg, color: colors.text, borderLeft: `3px solid ${colors.border}` }}
    >
      {event.title}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTH VIEW
// ─────────────────────────────────────────────────────────────────────────────

function MonthView({
  currentDate, events, onDayClick, onEventClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; current: boolean }[] = [];

  // Prev month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), current: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  // Next month head
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), current: false });
  }

  function eventsForDay(date: Date) {
    return events.filter(e => isSameDay(new Date(e.start_time), date));
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#DCE7E2] overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#DCE7E2]">
        {WEEK_DAYS.map(d => (
          <div key={d} className="py-3 text-center text-[12px] font-semibold text-[#60708C] uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, current }, idx) => {
          const dayEvents = eventsForDay(date);
          const isToday = isSameDay(date, today);
          const isLastRow = idx >= 35;

          return (
            <div
              key={idx}
              onClick={() => onDayClick(date)}
              className={`min-h-[100px] p-2 border-b border-r border-[#DCE7E2] cursor-pointer hover:bg-[#F8FAF9] transition-colors
                ${isLastRow ? "border-b-0" : ""}
                ${(idx + 1) % 7 === 0 ? "border-r-0" : ""}
              `}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold mb-1.5 transition-colors
                ${isToday ? "bg-[#0B7A5A] text-white" : current ? "text-[#071B4A]" : "text-[#C0CCD4]"}
              `}>
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => (
                  <EventChip key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-[#60708C] pl-1">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEK VIEW
// ─────────────────────────────────────────────────────────────────────────────

function WeekView({
  currentDate, events, onEventClick, onSlotClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}) {
  const today = new Date();
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function eventsForSlot(date: Date, hour: number) {
    return events.filter(e => {
      const start = new Date(e.start_time);
      return isSameDay(start, date) && start.getHours() === hour;
    });
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#DCE7E2] overflow-auto max-h-[600px]">
      {/* Header row */}
      <div className="grid grid-cols-8 border-b border-[#DCE7E2] sticky top-0 bg-white z-10">
        <div className="py-3" />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="py-3 text-center">
              <p className="text-[11px] font-semibold text-[#60708C] uppercase">{WEEK_DAYS[day.getDay()]}</p>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 text-[14px] font-bold transition-colors
                ${isToday ? "bg-[#0B7A5A] text-white" : "text-[#071B4A]"}`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time slots */}
      {HOURS.map(hour => (
        <div key={hour} className="grid grid-cols-8 border-b border-[#F0F4F2]">
          <div className="py-3 pr-3 text-right text-[11px] text-[#60708C] font-medium">
            {formatHour(hour)}
          </div>
          {weekDays.map((day, i) => {
            const slotEvents = eventsForSlot(day, hour);
            return (
              <div
                key={i}
                onClick={() => { const d = new Date(day); d.setHours(hour); onSlotClick(d); }}
                className="min-h-[56px] border-l border-[#F0F4F2] p-1 cursor-pointer hover:bg-[#F8FAF9] transition-colors"
              >
                {slotEvents.map(ev => {
                  const colors = EVENT_TYPE_COLORS[ev.event_type as keyof typeof EVENT_TYPE_COLORS] || EVENT_TYPE_COLORS.other;
                  return (
                    <button
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      className="w-full text-left px-2 py-1 rounded-[6px] text-[11px] font-medium truncate hover:opacity-80 mb-0.5"
                      style={{ backgroundColor: colors.bg, color: colors.text, borderLeft: `3px solid ${colors.border}` }}
                    >
                      {ev.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAY VIEW
// ─────────────────────────────────────────────────────────────────────────────

function DayView({
  currentDate, events, onEventClick, onSlotClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}) {
  const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), currentDate));

  function eventsForHour(hour: number) {
    return dayEvents.filter(e => new Date(e.start_time).getHours() === hour);
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#DCE7E2] overflow-auto max-h-[600px]">
      {/* Day header */}
      <div className="px-6 py-4 border-b border-[#DCE7E2] sticky top-0 bg-white z-10">
        <p className="text-[16px] font-bold text-[#071B4A]">
          {currentDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <p className="text-[13px] text-[#60708C] mt-0.5">{dayEvents.length} events</p>
      </div>

      {/* Time slots */}
      {HOURS.map(hour => {
        const slotEvents = eventsForHour(hour);
        return (
          <div
            key={hour}
            onClick={() => { const d = new Date(currentDate); d.setHours(hour); onSlotClick(d); }}
            className="flex border-b border-[#F0F4F2] hover:bg-[#F8FAF9] transition-colors cursor-pointer min-h-[64px]"
          >
            <div className="w-20 flex-shrink-0 py-3 pr-4 text-right text-[12px] text-[#60708C] font-medium">
              {formatHour(hour)}
            </div>
            <div className="flex-1 p-2 border-l border-[#F0F4F2] space-y-1">
              {slotEvents.map(ev => {
                const colors = EVENT_TYPE_COLORS[ev.event_type as keyof typeof EVENT_TYPE_COLORS] || EVENT_TYPE_COLORS.other;
                const start = new Date(ev.start_time);
                const end   = new Date(ev.end_time);
                const timeStr = `${start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
                return (
                  <button
                    key={ev.id}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    className="w-full text-left px-3 py-2 rounded-[10px] hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: colors.bg, borderLeft: `4px solid ${colors.border}` }}
                  >
                    <p className="text-[13px] font-semibold" style={{ color: colors.text }}>{ev.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: colors.text + "AA" }}>{timeStr}</p>
                    {ev.location && <p className="text-[11px] mt-0.5 text-[#60708C]">📍 {ev.location}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────

export default function CounsellorCalendarModule() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [kpis, setKpis] = useState<CalendarKPI | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  // Detail panel
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [evData, kpiData] = await Promise.all([fetchEvents(), fetchCalendarKPIs()]);
      setEvents(evData);
      setKpis(kpiData);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Navigation
  function navigate(direction: 1 | -1) {
    const d = new Date(currentDate);
    if (view === "month") {
      d.setMonth(d.getMonth() + direction);
    } else if (view === "week") {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setDate(d.getDate() + direction);
    }
    setCurrentDate(d);
  }

  function goToday() { setCurrentDate(new Date()); }

  function getTitle() {
    if (view === "month") return formatMonthYear(currentDate);
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      return `${ws.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${we.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function handleDayClick(date: Date) {
    setCurrentDate(date);
    setView("day");
  }

  function handleSlotClick(date: Date) {
    setDefaultDate(date.toISOString().slice(0, 10));
    setEditEvent(null);
    setShowCreate(true);
  }

  function handleEditEvent(event: CalendarEvent) {
    setEditEvent(event);
    setSelectedEvent(null);
    setShowCreate(true);
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-[#0B7A5A]/10 flex items-center justify-center">
              <Calendar size={13} className="text-[#0B7A5A]" />
            </div>
            <span className="text-[13px] font-medium text-[#0B7A5A]">Counsellor Calendar</span>
          </div>
          <h1 className="text-[28px] font-bold text-[#071B4A]">Calendar</h1>
          <p className="text-[14px] text-[#60708C] mt-1">
            Manage your follow-ups, demo classes, meetings, and counselling sessions.
          </p>
        </div>
        <button
          onClick={() => { setEditEvent(null); setDefaultDate(undefined); setShowCreate(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-[#0B7A5A] text-white text-[14px] font-semibold hover:bg-[#096649] transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Event
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard label="Total Events"       value={kpis.total}               icon={CalendarDays}  color="#0B7A5A" />
          <KPICard label="Scheduled"          value={kpis.scheduled}           icon={Clock}         color="#3B82F6" />
          <KPICard label="Completed"          value={kpis.completed}           icon={CheckCircle}   color="#10B981" />
          <KPICard label="Today"              value={kpis.today_events}        icon={Calendar}      color="#8B5CF6" />
          <KPICard label="This Week"          value={kpis.upcoming_this_week}  icon={CalendarDays}  color="#F97316" />
        </div>
      )}

      {/* ── Calendar Controls ───────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#DCE7E2] px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToday}
              className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-[#0B7A5A] border border-[#0B7A5A]/30 hover:bg-[#0B7A5A]/5 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate(-1)} className="p-2 rounded-[10px] hover:bg-[#F4F7F5] transition-colors">
                <ChevronLeft size={16} className="text-[#071B4A]" />
              </button>
              <span className="text-[15px] font-bold text-[#071B4A] min-w-[200px] text-center">{getTitle()}</span>
              <button onClick={() => navigate(1)} className="p-2 rounded-[10px] hover:bg-[#F4F7F5] transition-colors">
                <ChevronRight size={16} className="text-[#071B4A]" />
              </button>
            </div>
          </div>

          {/* View switcher */}
          <div className="flex items-center bg-[#F4F7F5] rounded-[12px] p-1 gap-1">
            {(["month", "week", "day"] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold capitalize transition-all ${
                  view === v
                    ? "bg-white text-[#071B4A] shadow-sm"
                    : "text-[#60708C] hover:text-[#071B4A]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#F0F4F2]">
          {(Object.entries(EVENT_TYPE_COLORS) as [any, any][]).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.dot }} />
              <span className="text-[12px] text-[#60708C]">{EVENT_TYPE_LABELS[type as keyof typeof EVENT_TYPE_LABELS]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Calendar View ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-[20px] border border-[#DCE7E2] p-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#0B7A5A] border-t-transparent rounded-full animate-spin" />
            <p className="text-[14px] text-[#60708C]">Loading events...</p>
          </div>
        </div>
      ) : (
        <>
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onDayClick={handleDayClick}
              onEventClick={setSelectedEvent}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventClick={setSelectedEvent}
              onSlotClick={handleSlotClick}
            />
          )}
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={setSelectedEvent}
              onSlotClick={handleSlotClick}
            />
          )}
        </>
      )}

      {/* ── Modals & Panels ─────────────────────────────────────────────── */}
      <CreateEventModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setEditEvent(null); }}
        onSaved={loadData}
        editEvent={editEvent}
        defaultDate={defaultDate}
      />

      <EventDetailPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEditEvent}
        onRefresh={loadData}
      />
    </div>
  );
}