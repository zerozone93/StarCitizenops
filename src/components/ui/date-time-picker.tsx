"use client";

import { useState, useRef, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateTimePickerProps {
  value: string; // ISO datetime string
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function DateTimePicker({ value, onChange, placeholder = "Select date & time", label }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    value ? new Date(value) : new Date()
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [timeInput, setTimeInput] = useState<string>(
    value ? format(new Date(value), "HH:mm") : "12:00"
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const [hours, minutes] = timeInput.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeInput(newTime);

    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const updatedDate = new Date(selectedDate);
      updatedDate.setHours(hours, minutes, 0, 0);
      onChange(updatedDate.toISOString());
    }
  };

  const calendarStart = startOfMonth(currentMonth);
  const calendarEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Pad beginning of month
  const firstDayOfWeek = calendarStart.getDay();
  const paddingDays = Array(firstDayOfWeek).fill(null);

  const displayValue = selectedDate
    ? format(selectedDate, "MMM dd, yyyy")
    : placeholder;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-xs text-slate-300 mb-1 block">{label}</label>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100 hover:bg-slate-900 transition text-left flex items-center justify-between"
        >
          <span>{displayValue}</span>
          <span className="text-xs text-slate-400">📅</span>
        </button>

        <input
          type="time"
          value={timeInput}
          onChange={handleTimeChange}
          className="rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm text-cyan-100 w-24"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 left-0 rounded-lg border border-cyan-500/30 bg-slate-950 p-4 shadow-xl w-80">
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-slate-900 rounded"
              >
                <ChevronLeft size={18} className="text-cyan-400" />
              </button>
              <h3 className="text-sm font-semibold text-cyan-100">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-slate-900 rounded"
              >
                <ChevronRight size={18} className="text-cyan-400" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {paddingDays.map((_, idx) => (
                <div key={`pad-${idx}`} />
              ))}
              {days.map((day) => {
                const isSelected =
                  selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`p-2 text-xs rounded transition ${
                      isSelected
                        ? "bg-cyan-500 text-slate-950 font-semibold"
                        : isCurrentMonth
                          ? "text-cyan-100 hover:bg-cyan-500/20"
                          : "text-slate-500"
                    }`}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-3 py-2 text-xs font-semibold text-cyan-200 transition"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
