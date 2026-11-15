import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FocusSession, Task } from '../types';

interface MonthCalendarProps {
  sessions?: FocusSession[];
  tasks?: Task[];
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({ sessions = [], tasks = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Set of dates (YYYY-MM-DD) that have activity
  const activeDates = new Set<string>();
  sessions.forEach((s) => {
    if (s.timestamp) activeDates.add(s.timestamp.split('T')[0]);
  });
  tasks.forEach((t) => {
    if (t.completed && t.completedAt) activeDates.add(t.completedAt.split('T')[0]);
  });

  const weekDayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="ios-matte-panel rounded-3xl p-4 sm:p-5">
      {/* Month & Nav Controls */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white tracking-tight">
            {monthNames[month]} <span className="font-mono text-zinc-500 font-normal">{year}</span>
          </h2>
          {!isCurrentMonth && (
            <button
              onClick={handleGoToday}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {weekDayLabels.map((day) => (
          <span key={day} className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            {day}
          </span>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Leading empty cells */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-8" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNumber = idx + 1;
          const isToday = isCurrentMonth && dayNumber === todayDate;

          const monthPadded = String(month + 1).padStart(2, '0');
          const dayPadded = String(dayNumber).padStart(2, '0');
          const dateKey = `${year}-${monthPadded}-${dayPadded}`;
          const hasActivity = activeDates.has(dateKey);

          return (
            <div
              key={dayNumber}
              className="h-8 flex flex-col items-center justify-center relative group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  isToday
                    ? 'bg-white text-black font-extrabold shadow-[0_0_14px_rgba(255,255,255,0.45)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10 font-mono-numbers'
                }`}
              >
                {dayNumber}
              </div>

              {/* Activity indicator dot */}
              {hasActivity && !isToday && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-zinc-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};