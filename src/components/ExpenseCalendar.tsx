import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPeso, type Transaction, type Reminder } from "@/lib/storage";
import { AvatarArt } from "./AvatarArt";
import { DayExpenseModal } from "./DayExpenseModal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AvatarLevel } from "@/lib/storage";

type Props = {
  transactions: Transaction[];
  avatarLevel: AvatarLevel;
  reminders?: Reminder[];
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // getDay: 0=Sun, we want 0=Mon
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: { day: number; inMonth: boolean; dateStr: string }[] = [];

  // Leading empty cells from previous month
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLast - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({
      day: d,
      inMonth: false,
      dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      inMonth: true,
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }

  // Trailing cells to fill last row
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        inMonth: false,
        dateStr: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }
  }

  return cells;
}

export function ExpenseCalendar({ transactions, avatarLevel, reminders = [] }: Props) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const cells = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // Pre-compute expenses per date
  const expensesByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    const gastos = transactions.filter(t => t.type === "gastos");
    gastos.forEach(t => {
      const dateKey = t.date.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(t);
    });
    return map;
  }, [transactions]);

  // Pre-compute reminders per date
  const remindersByDate = useMemo(() => {
    const map: Record<string, Reminder[]> = {};
    reminders.filter(r => !r.completed).forEach(r => {
      if (!map[r.dueDate]) map[r.dueDate] = [];
      map[r.dueDate].push(r);
    });
    return map;
  }, [reminders]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
    setSelectedDate(null);
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(null);
  }

  const isCurrentMonthView = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const selectedExpenses = selectedDate ? (expensesByDate[selectedDate] ?? []) : [];

  return (
    <div className="space-y-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-soft">
        <button
          onClick={prevMonth}
          className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition hover:bg-secondary/70"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={goToday}
          className="text-sm font-bold tracking-tight transition hover:text-primary"
        >
          {monthLabel}
        </button>
        <button
          onClick={nextMonth}
          className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition hover:bg-secondary/70"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl bg-card p-3 shadow-card">
        {/* Day-of-week headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            const isToday = cell.dateStr === todayStr && cell.inMonth;
            const isSelected = cell.dateStr === selectedDate;
            const dayExpenses = expensesByDate[cell.dateStr] ?? [];
            const dayReminders = remindersByDate[cell.dateStr] ?? [];
            const hasExpenses = dayExpenses.length > 0;
            const hasReminders = dayReminders.length > 0;
            const dayTotal = dayExpenses.reduce((s, t) => s + t.amount, 0);

            return (
              <button
                key={i}
                onClick={() => {
                  if (cell.inMonth) {
                    setSelectedDate(prev => prev === cell.dateStr ? null : cell.dateStr);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl p-1 transition-all duration-200",
                  "min-h-[3.2rem]",
                  !cell.inMonth && "opacity-30 cursor-default",
                  cell.inMonth && "hover:bg-secondary/50 cursor-pointer",
                  isSelected && "bg-primary/10 ring-2 ring-primary/40",
                  isToday && !isSelected && "bg-highlight/10 ring-2 ring-highlight/40",
                )}
              >
                {/* Mascot avatar on today */}
                {isToday && isCurrentMonthView && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 animate-bounce" style={{ animationDuration: "2s" }}>
                    <AvatarArt level={avatarLevel} size={28} className="shadow-lg ring-2 ring-highlight ring-offset-1 ring-offset-card" />
                  </div>
                )}

                {/* Day number */}
                <span
                  className={cn(
                    "text-xs font-bold",
                    isToday ? "mt-3 text-highlight" : "text-foreground",
                    !cell.inMonth && "text-muted-foreground",
                  )}
                >
                  {cell.day}
                </span>

                {/* Expense indicator */}
                {hasExpenses && cell.inMonth && (
                  <div className="mt-0.5 flex items-center gap-0.5">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="text-[8px] font-bold text-primary tabular">
                      {dayTotal >= 1000 ? `${(dayTotal / 1000).toFixed(1)}k` : dayTotal}
                    </span>
                  </div>
                )}

                {/* Reminder indicator */}
                {hasReminders && cell.inMonth && !hasExpenses && (
                  <div className="mt-0.5 flex items-center gap-0.5">
                    <span className="text-[8px]">🔔</span>
                    <span className="text-[8px] font-bold text-highlight tabular">
                      {dayReminders.length}
                    </span>
                  </div>
                )}
                {hasReminders && cell.inMonth && hasExpenses && (
                  <span className="absolute top-0.5 right-0.5 text-[7px]">🔔</span>
                )}

                {/* Empty spacing when no expenses and no reminders */}
                {!hasExpenses && !hasReminders && cell.inMonth && (
                  <div className="mt-0.5 h-[14px]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] font-semibold text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-highlight" />
            <span>Ngayon</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" />
            <span>May gastos</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">🔔</span>
            <span>May babayaran</span>
          </div>
        </div>
      </div>

      {/* Selected Day Expense Detail */}
      {selectedDate && (
        <DayExpenseModal
          date={selectedDate}
          expenses={selectedExpenses}
          reminders={remindersByDate[selectedDate] ?? []}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
