import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { KEYS, blankBudget, type Budget, type Transaction } from "@/lib/storage";

/** Returns computed budget state from budget config + transactions. */
export function useBudget() {
  const [budget] = useLocalStorage<Budget>(KEYS.budget, blankBudget);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);

  return useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const cycle = budget.budgetCycle ?? "weekly";

    const gastos = transactions.filter(t => t.type === "gastos");

    // ── Period boundaries ────────────────────────────────────
    let periodStart: Date;
    let daysLeftInPeriod: number;
    let totalBudget: number;

    if (cycle === "monthly") {
      // Month start = 1st of current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodStart.setHours(0, 0, 0, 0);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      daysLeftInPeriod = Math.max(1, daysInMonth - now.getDate() + 1);
      totalBudget = budget.weeklyBudget; // stored as the total budget regardless of label
    } else {
      // Week start = most recent Monday
      const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ...
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - mondayOffset);
      periodStart.setHours(0, 0, 0, 0);
      daysLeftInPeriod = Math.max(1, 7 - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      totalBudget = budget.weeklyBudget;
    }

    // Period expenses
    const periodGastos = gastos.filter(t => new Date(t.date) >= periodStart);
    const periodSpent = periodGastos.reduce((s, t) => s + t.amount, 0);
    const periodRemaining = totalBudget - periodSpent;

    // Today's expenses
    const todayGastos = gastos.filter(t => t.date.slice(0, 10) === today);
    const todaySpent = todayGastos.reduce((s, t) => s + t.amount, 0);

    // Yesterday's expenses
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const yesterdayGastos = gastos.filter(t => t.date.slice(0, 10) === yesterdayStr);
    const yesterdaySpent = yesterdayGastos.reduce((s, t) => s + t.amount, 0);

    // Daily budget = remaining / days left (incl today)
    const dailyBudget = Math.max(0, periodRemaining / daysLeftInPeriod);
    const dailyRemaining = Math.max(0, dailyBudget - todaySpent);

    // Per-category spending this period
    const categorySpent: Record<string, number> = {};
    periodGastos.forEach(t => {
      categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
    });

    // Budget health: 0-100 (100 = full budget remaining)
    const healthPct = totalBudget > 0
      ? Math.max(0, Math.min(100, (periodRemaining / totalBudget) * 100))
      : 100;

    // Status color
    const status: "green" | "yellow" | "red" =
      healthPct > 50 ? "green" : healthPct > 20 ? "yellow" : "red";

    return {
      budget,
      budgetCycle: cycle,
      weeklySpent: periodSpent,
      weeklyRemaining: periodRemaining,
      todaySpent,
      yesterdaySpent,
      dailyBudget: Math.round(dailyBudget),
      dailyRemaining: Math.round(dailyRemaining),
      categorySpent,
      healthPct,
      status,
      daysLeftInWeek: daysLeftInPeriod,
    };
  }, [budget, transactions]);
}
