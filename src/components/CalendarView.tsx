import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Session } from "../types";

interface Props {
  sessions: Session[];
  onSelectDate?: (date: string) => void;
}

// Vue calendrier mensuelle : un point sur chaque jour ayant une séance.
export function CalendarView({ sessions, onSelectDate }: Props) {
  const [cursor, setCursor] = useState(new Date());

  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const sessionDates = new Set(sessions.map((s) => s.date));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">
          {format(cursor, "MMMM yyyy", { locale: fr })}
        </h3>
        <div className="flex gap-1">
          <button
            className="btn-ghost !px-2 !py-1"
            onClick={() => setCursor(subMonths(cursor, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="btn-ghost !px-2 !py-1"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-text-dim mb-2">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const has = sessionDates.has(iso);
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={iso}
              onClick={() => onSelectDate?.(iso)}
              className={[
                "aspect-square rounded-lg text-xs flex flex-col items-center justify-center transition-colors",
                inMonth ? "text-text" : "text-text-dim/50",
                isToday
                  ? "ring-1 ring-accent"
                  : "hover:bg-bg-elev",
                has ? "bg-accent-muted/30" : "",
              ].join(" ")}
            >
              <span>{format(day, "d")}</span>
              {has && <span className="w-1.5 h-1.5 rounded-full bg-accent mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
