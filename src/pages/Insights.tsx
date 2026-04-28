import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBudget } from "@/hooks/useBudget";
import { KEYS, blankProfile, type Profile, type Transaction } from "@/lib/storage";
import { generateSpendingInsight } from "@/lib/ai";
import { PageHeader } from "@/components/PageHeader";
import { InsightCard } from "@/components/InsightCard";
import { GASTOS_CATEGORIES } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function Insights() {
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);
  const budgetData = useBudget();
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    generateSpendingInsight(transactions, profile.language)
      .then(setInsights)
      .catch(() => setInsights(["Hindi ma-generate ang insights ngayon."]))
      .finally(() => setLoading(false));
  }, [transactions, profile.language]);

  // Weekly spending by category
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weeklyGastos = transactions
    .filter(t => t.type === "gastos" && new Date(t.date) >= weekStart);
  const totalWeekly = weeklyGastos.reduce((s, t) => s + t.amount, 0);

  // Last week comparison
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);
  const lastWeekGastos = transactions
    .filter(t => t.type === "gastos" && new Date(t.date) >= lastWeekStart && new Date(t.date) < lastWeekEnd);
  const totalLastWeek = lastWeekGastos.reduce((s, t) => s + t.amount, 0);

  const trendPct = totalLastWeek > 0
    ? Math.round(((totalWeekly - totalLastWeek) / totalLastWeek) * 100)
    : 0;
  const trendUp = trendPct > 0;

  return (
    <div className="space-y-5 px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="Insights" subtitle="Saan napupunta ang pera mo." />

      {/* Trend summary */}
      <div className={cn(
        "flex items-center gap-3 rounded-2xl p-4 shadow-soft",
        trendUp ? "bg-destructive/10" : "bg-accent/10",
      )}>
        {trendUp ? (
          <TrendingUp className="size-6 text-destructive" />
        ) : (
          <TrendingDown className="size-6 text-accent" />
        )}
        <div>
          <p className="font-bold">
            {trendUp ? `↑ ${trendPct}% tumaas` : trendPct < 0 ? `↓ ${Math.abs(trendPct)}% bumaba` : "Pare-pareho"} vs last week
          </p>
          <p className="text-xs text-muted-foreground">
            ₱{totalWeekly.toLocaleString()} ngayong linggo · ₱{totalLastWeek.toLocaleString()} last week
          </p>
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          AI Insights
        </h3>
        {loading ? (
          <div className="rounded-2xl bg-card p-4 text-center shadow-soft">
            <p className="text-sm text-muted-foreground animate-pulse">Iniisip ni Gabay...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <InsightCard
                key={i}
                insight={insight}
                trend={i === 0 ? (trendUp ? "up" : "down") : "neutral"}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Weekly Breakdown */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Breakdown ngayong linggo
        </h3>
        <div className="space-y-2">
          {GASTOS_CATEGORIES.map(cat => {
            const spent = budgetData.categorySpent[cat.id] ?? 0;
            const limit = budgetData.budget.categories[cat.id];
            const barPct = limit ? Math.min(100, (spent / limit) * 100) : (totalWeekly > 0 ? (spent / totalWeekly) * 100 : 0);
            const overBudget = limit ? spent > limit : false;

            return (
              <div key={cat.id} className="rounded-2xl bg-card p-3 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {cat.emoji} {cat.label}
                  </span>
                  <span className={cn("text-sm font-bold tabular", overBudget ? "text-destructive" : "text-foreground")}>
                    ₱{spent.toLocaleString()}
                    {limit ? <span className="text-xs text-muted-foreground"> / ₱{limit.toLocaleString()}</span> : null}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      overBudget ? "bg-destructive" : "bg-primary",
                    )}
                    style={{ width: `${Math.min(100, barPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
