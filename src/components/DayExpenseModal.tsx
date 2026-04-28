import { cn } from "@/lib/utils";
import { formatPeso, GASTOS_CATEGORIES, type Transaction, type Reminder, KEYS } from "@/lib/storage";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { X, ShoppingBag, Bell, Check } from "lucide-react";

type Props = {
  date: string;           // YYYY-MM-DD
  expenses: Transaction[];
  reminders?: Reminder[];
  onClose: () => void;
};

export function DayExpenseModal({ date, expenses, reminders = [], onClose }: Props) {
  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [allReminders, setAllReminders] = useLocalStorage<Reminder[]>(KEYS.reminders, []);

  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const reminderTotal = reminders.reduce((s, r) => s + r.amount, 0);

  const catInfo = (catId: string) =>
    GASTOS_CATEGORIES.find(c => c.id === catId) ?? { emoji: "✨", label: catId };

  function markAsPaid(id: string) {
    setAllReminders(prev =>
      prev.map(r => r.id === id ? { ...r, completed: true } : r)
    );
  }

  const hasContent = expenses.length > 0 || reminders.length > 0;

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-300 rounded-3xl bg-card p-4 shadow-card ring-1 ring-border/50">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">{formattedDate}</p>
          {hasContent && (
            <p className="text-xs font-semibold text-muted-foreground">
              {expenses.length > 0 && (
                <>Total gastos: <span className="text-primary">{formatPeso(total)}</span></>
              )}
              {expenses.length > 0 && reminders.length > 0 && " · "}
              {reminders.length > 0 && (
                <>🔔 {reminders.length} reminder{reminders.length > 1 ? "s" : ""}</>
              )}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-highlight">
            🔔 Payment Reminders
          </p>
          <ul className="space-y-2">
            {reminders.map(r => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-2xl bg-highlight/5 p-3 ring-1 ring-highlight/20 transition"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-highlight/15 text-lg">
                  <Bell className="size-4 text-highlight" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{r.title}</span>
                    <span className="text-sm font-extrabold text-highlight tabular">
                      {formatPeso(r.amount)}
                    </span>
                  </div>
                  {r.note && (
                    <p className="text-[10px] text-muted-foreground truncate">{r.note}</p>
                  )}
                </div>
                <button
                  onClick={() => markAsPaid(r.id)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent transition hover:bg-accent/25"
                  title="Mark as paid"
                >
                  <Check className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expense List */}
      {expenses.length === 0 && reminders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ShoppingBag className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">
            Walang gastos sa araw na 'to 🎉
          </p>
          <p className="text-xs text-muted-foreground/70">
            Magandang araw para sa savings!
          </p>
        </div>
      ) : expenses.length > 0 ? (
        <div>
          {reminders.length > 0 && (
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              💸 Mga Gastos
            </p>
          )}
          <ul className="space-y-2">
            {expenses.map(tx => {
              const cat = catInfo(tx.category);
              const time = new Date(tx.date).toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3 transition hover:bg-secondary"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                    {cat.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{cat.label}</span>
                      <span className="text-sm font-extrabold text-primary tabular">
                        {formatPeso(tx.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{time}</span>
                      {tx.note && (
                        <>
                          <span>·</span>
                          <span className="truncate">{tx.note}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="capitalize">{tx.source}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
