import { useState } from "react";
import { uid, todayISO, formatPeso, type Reminder } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Plus, X, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  onAdd: (reminder: Reminder) => void;
};

export function ReminderForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  function reset() {
    setTitle("");
    setAmount("");
    setDueDate("");
    setNote("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0 || !dueDate) {
      toast.error("Kumpletuhin ang title, amount, at date.");
      return;
    }

    const reminder: Reminder = {
      id: uid(),
      title: title.trim(),
      amount: amt,
      dueDate,
      note: note.trim() || undefined,
      completed: false,
      createdAt: todayISO(),
      source: "manual",
    };

    onAdd(reminder);
    toast.success(`🔔 Reminder added: ${reminder.title} — ${formatPeso(reminder.amount)} on ${reminder.dueDate}`);
    reset();
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-soft transition-all hover:shadow-card hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-highlight/15 text-highlight">
          <Plus className="size-5" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold">Add Payment Reminder</p>
          <p className="text-[10px] text-muted-foreground">I-set ang babayaran mo para hindi makalimutan</p>
        </div>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-in slide-in-from-top-2 fade-in duration-300 rounded-3xl bg-card p-4 shadow-card ring-1 ring-border/50"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-highlight" />
          <h4 className="text-sm font-bold">New Payment Reminder</h4>
        </div>
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          className="flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Ano ang babayaran?
          </label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Tuition Fee, Electric Bill, Internet"
            className="text-sm"
            autoFocus
          />
        </div>

        {/* Amount + Date row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Magkano? (₱)
            </label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              step="any"
              className="text-sm tabular"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Kailan due?
            </label>
            <div className="relative">
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Note (optional)
          </label>
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Bayaran sa cashier, GCash payment"
            className="text-sm"
          />
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full gap-2 font-bold">
          <CalendarDays className="size-4" />
          Add Reminder
        </Button>
      </div>
    </form>
  );
}
