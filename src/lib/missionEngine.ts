import type {
  Mission,
  CompletionRule,
  Transaction,
  Budget,
  Profile,
  ChatMessage,
  SavingsGoal,
  GastosCategory,
} from "./storage";

// ── Completion-checking context ───────────────────────────────────
export type MissionCheckContext = {
  transactions: Transaction[];
  budget: Budget;
  profile: Profile;
  chatMessages: ChatMessage[];
  goals: SavingsGoal[];
  todaySpent: number;
  dailyBudget: number;
  categorySpent: Record<string, number>;
  /** How many times the user used the spend-simulator this session */
  budgetChecks: number;
};

// ── Helpers ───────────────────────────────────────────────────────

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function countTodayExpenses(tx: Transaction[]): number {
  const today = todayStr();
  return tx.filter(t => t.type === "gastos" && t.date.slice(0, 10) === today).length;
}

function weekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function countWeekExpenses(tx: Transaction[]): number {
  const start = weekStart();
  return tx.filter(t => t.type === "gastos" && new Date(t.date) >= start).length;
}

function todayCategorySpent(tx: Transaction[], cat: GastosCategory): number {
  const today = todayStr();
  return tx
    .filter(t => t.type === "gastos" && t.date.slice(0, 10) === today && t.category === cat)
    .reduce((s, t) => s + t.amount, 0);
}

function countWeekChats(msgs: ChatMessage[]): number {
  const start = weekStart();
  return msgs.filter(m => m.role === "user" && new Date(m.timestamp) >= start).length;
}

function countTodayChats(msgs: ChatMessage[]): number {
  const today = todayStr();
  return msgs.filter(m => m.role === "user" && m.timestamp.slice(0, 10) === today).length;
}

function hasDepositThisWeek(goals: SavingsGoal[]): boolean {
  const start = weekStart();
  return goals.some(g =>
    g.deposits.some(d => new Date(d.date) >= start),
  );
}

// ── Main completion checker ───────────────────────────────────────

/**
 * Check whether a mission's completion criteria are met.
 * Returns { achieved, progress } where progress is 0..target (or 0/1 for boolean rules).
 */
export function checkMissionCompletion(
  mission: Mission,
  ctx: MissionCheckContext,
): { achieved: boolean; progress: number } {
  const rule = mission.completionRule;

  // Guard: old-format missions from localStorage won't have completionRule
  if (!rule || !rule.type) {
    return { achieved: false, progress: 0 };
  }

  const threshold = rule.threshold ?? 1;

  switch (rule.type) {
    case "log-count": {
      const count = mission.type === "daily"
        ? countTodayExpenses(ctx.transactions)
        : countWeekExpenses(ctx.transactions);
      return { achieved: count >= threshold, progress: Math.min(count, threshold) };
    }

    case "expense-under": {
      // Achieved if the user has logged at least 1 expense in the category
      // AND stays under threshold. If they haven't spent yet, not achieved yet.
      const cat = rule.category!;
      const spent = mission.type === "daily"
        ? todayCategorySpent(ctx.transactions, cat)
        : (ctx.categorySpent[cat] ?? 0);
      const hasAny = mission.type === "daily"
        ? ctx.transactions.some(t => t.type === "gastos" && t.date.slice(0, 10) === todayStr() && t.category === cat)
        : ctx.transactions.some(t => t.type === "gastos" && new Date(t.date) >= weekStart() && t.category === cat);
      // Only achievable at end of day / when they've logged something
      // For now: achieved if they logged expenses but stayed under
      return { achieved: hasAny && spent <= threshold, progress: hasAny ? 1 : 0 };
    }

    case "no-expense-category": {
      // Achieved if NO expense in that category today
      // Only check if the user has been active today (logged at least 1 expense in any category)
      const cat = rule.category!;
      const spent = todayCategorySpent(ctx.transactions, cat);
      const activeToday = countTodayExpenses(ctx.transactions) > 0;
      return { achieved: activeToday && spent === 0, progress: activeToday && spent === 0 ? 1 : 0 };
    }

    case "budget-check": {
      const done = ctx.budgetChecks > 0;
      return { achieved: done, progress: done ? 1 : 0 };
    }

    case "chat-used": {
      if (threshold > 1) {
        // Weekly "chat N times"
        const count = countWeekChats(ctx.chatMessages);
        return { achieved: count >= threshold, progress: Math.min(count, threshold) };
      }
      const used = mission.type === "daily"
        ? countTodayChats(ctx.chatMessages) > 0
        : countWeekChats(ctx.chatMessages) > 0;
      return { achieved: used, progress: used ? 1 : 0 };
    }

    case "savings-deposit": {
      const has = hasDepositThisWeek(ctx.goals);
      return { achieved: has, progress: has ? 1 : 0 };
    }

    case "stay-under-daily": {
      // Achieved if user has logged at least 1 expense AND todaySpent ≤ dailyBudget
      const active = countTodayExpenses(ctx.transactions) > 0;
      const under = ctx.todaySpent <= ctx.dailyBudget && ctx.dailyBudget > 0;
      return { achieved: active && under, progress: active && under ? 1 : 0 };
    }

    case "streak": {
      const streak = ctx.profile.streak;
      return { achieved: streak >= threshold, progress: Math.min(streak, threshold) };
    }

    default:
      return { achieved: false, progress: 0 };
  }
}
