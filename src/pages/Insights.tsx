import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBudget } from "@/hooks/useBudget";
import { KEYS, blankProfile, type Profile, type Transaction } from "@/lib/storage";
import { generateSpendingInsight } from "@/lib/ai";
import { PageHeader } from "@/components/PageHeader";
import { InsightCard } from "@/components/InsightCard";
import { GASTOS_CATEGORIES } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

  // Chart Data
  const CHART_COLORS = [
    "hsl(17 88% 40%)",     // primary (terracotta)
    "hsl(82 78% 36%)",     // accent (bamboo green)
    "hsl(38 92% 50%)",     // highlight (gold)
    "hsl(24 10% 40%)",     // dark muted brown
    "hsl(0 72% 51%)"       // destructive
  ];

  const pieData = GASTOS_CATEGORIES.map((cat) => ({
    name: cat.label,
    emoji: cat.emoji,
    value: budgetData.categorySpent[cat.id] ?? 0,
  })).filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border bg-card p-3 shadow-card outline-none">
          <p className="flex items-center gap-2 text-sm font-bold">
            <span>{data.emoji}</span>
            <span>{data.name}</span>
          </p>
          <p className="mt-1 text-base font-bold tabular text-primary">
            ₱{data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 px-4 pb-8 lg:px-8 lg:pb-12 lg:pt-2">
      <PageHeader title="Insights" subtitle="Saan napupunta ang pera mo." />

      {/* Trend summary */}
      <div className={cn(
        "flex items-center gap-4 rounded-3xl p-5 shadow-soft transition-all",
        trendUp ? "bg-destructive/10" : "bg-accent/10",
      )}>
        <div className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          trendUp ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"
        )}>
          {trendUp ? <TrendingUp className="size-6" /> : <TrendingDown className="size-6" />}
        </div>
        <div>
          <p className="text-lg font-black tracking-tight">
            {trendUp ? `↑ ${trendPct}% tumaas` : trendPct < 0 ? `↓ ${Math.abs(trendPct)}% bumaba` : "Pare-pareho"}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            vs last week (₱{totalLastWeek.toLocaleString()})
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">This Week</p>
          <p className="text-xl font-black tabular">₱{totalWeekly.toLocaleString()}</p>
        </div>
      </div>

      {/* Spending Chart */}
      {pieData.length > 0 && (
        <div className="rounded-3xl border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="size-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Spending Distribution
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-48 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex w-full sm:w-1/2 flex-col justify-center gap-3">
              {pieData.map((data, index) => {
                const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                const percent = Math.round((data.value / total) * 100);
                return (
                  <div key={data.name} className="flex items-center justify-between rounded-xl bg-secondary/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="size-3 rounded-full" 
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} 
                      />
                      <span className="text-sm font-bold text-foreground">
                        {data.emoji} {data.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground tabular">
                      {percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div>
        <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          AI Insights
        </h3>
        {loading ? (
          <div className="rounded-3xl border bg-card p-6 text-center shadow-soft">
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Iniisip ni Gabay ang iyong spending habits...</p>
          </div>
        ) : (
          <div className="space-y-3">
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

      {/* Weekly Breakdown Progress Bars */}
      <div>
        <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Budget Tracker (Ngayong Linggo)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {GASTOS_CATEGORIES.map(cat => {
            const spent = budgetData.categorySpent[cat.id] ?? 0;
            const limit = budgetData.budget.categories[cat.id];
            const barPct = limit ? Math.min(100, (spent / limit) * 100) : (totalWeekly > 0 ? (spent / totalWeekly) * 100 : 0);
            const overBudget = limit ? spent > limit : false;

            return (
              <div key={cat.id} className="rounded-3xl border bg-card p-4 shadow-soft transition-all hover:shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm">
                      {cat.emoji}
                    </span>
                    <span className="text-sm font-bold">{cat.label}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-base font-black tabular", overBudget ? "text-destructive" : "text-foreground")}>
                      ₱{spent.toLocaleString()}
                    </span>
                    {limit ? <p className="text-xs font-medium text-muted-foreground">/ ₱{limit.toLocaleString()}</p> : null}
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary/50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out",
                      overBudget ? "bg-destructive" : "bg-primary",
                    )}
                    style={{ width: `${Math.min(100, barPct)}%` }}
                  />
                </div>
                {overBudget && limit && (
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-destructive">
                    Over Budget
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

