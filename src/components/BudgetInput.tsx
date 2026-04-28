import { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, blankBudget, todayISO, type Budget } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Pencil, Check, Wallet } from "lucide-react";

export function BudgetInput() {
  const [budget, setBudget] = useLocalStorage<Budget>(KEYS.budget, blankBudget);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const cycle = budget.budgetCycle ?? "weekly";

  useEffect(() => {
    if (editing) {
      setDraft(budget.weeklyBudget > 0 ? String(budget.weeklyBudget) : "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing, budget.weeklyBudget]);

  function save() {
    const amt = Number(draft);
    if (amt > 0) {
      setBudget(prev => ({ ...prev, weeklyBudget: amt, updatedAt: todayISO() }));
    }
    setEditing(false);
  }

  function toggleCycle(newCycle: "weekly" | "monthly") {
    setBudget(prev => ({ ...prev, budgetCycle: newCycle, updatedAt: todayISO() }));
  }

  return (
    <div className="rounded-3xl bg-gradient-warm p-[2px] shadow-card">
      <div className="rounded-[calc(1.5rem-2px)] bg-card p-4">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Wallet className="size-4" />
          <span>I-set ang Budget</span>
        </div>

        {/* Cycle Toggle */}
        <div className="mb-3 flex gap-1 rounded-xl bg-secondary p-1">
          <button
            onClick={() => toggleCycle("weekly")}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-bold transition-all duration-200",
              cycle === "weekly"
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => toggleCycle("monthly")}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-bold transition-all duration-200",
              cycle === "monthly"
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
        </div>

        {/* Budget Amount */}
        {editing ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₱</span>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-background px-3 py-3 pl-8 text-2xl font-extrabold outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={save}
              className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card transition hover:opacity-90"
            >
              <Check className="size-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group flex w-full items-center gap-3 rounded-xl bg-secondary p-3 text-left transition hover:bg-secondary/70"
          >
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground">
                {cycle === "weekly" ? "Weekly" : "Monthly"} Budget
              </p>
              <p className="text-2xl font-extrabold tracking-tight">
                {budget.weeklyBudget > 0
                  ? `₱${budget.weeklyBudget.toLocaleString()}`
                  : <span className="text-muted-foreground">Tap to set</span>
                }
              </p>
            </div>
            <Pencil className="size-4 text-muted-foreground transition group-hover:text-primary" />
          </button>
        )}

        {/* Helper text */}
        {budget.weeklyBudget > 0 && cycle === "monthly" && (
          <p className="mt-2 text-center text-[10px] font-semibold text-muted-foreground">
            ≈ ₱{Math.round(budget.weeklyBudget / 4).toLocaleString()}/week · ₱{Math.round(budget.weeklyBudget / 30).toLocaleString()}/day
          </p>
        )}
        {budget.weeklyBudget > 0 && cycle === "weekly" && (
          <p className="mt-2 text-center text-[10px] font-semibold text-muted-foreground">
            ≈ ₱{Math.round(budget.weeklyBudget / 7).toLocaleString()}/day
          </p>
        )}
      </div>
    </div>
  );
}
