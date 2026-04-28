import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, MessageCircle, Sparkles, Target, Bell, Check } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBudget } from "@/hooks/useBudget";
import { useStoryEngine } from "@/hooks/useStoryEngine";
import { useMissionEngine } from "@/hooks/useMissionEngine";
import { KEYS, blankProfile, type Profile, type StoryEvent, type DailyCheckin as DailyCheckinType, type WeeklyTip, type Reminder } from "@/lib/storage";
import { fetchWeeklyTip } from "@/lib/ai";
import { AvatarArt } from "@/components/AvatarArt";
import { XPBar } from "@/components/XPBar";
import { BudgetHero } from "@/components/BudgetHero";
import { BudgetInput } from "@/components/BudgetInput";
import { SpendSimulator } from "@/components/SpendSimulator";
import { QuickExpenseBar } from "@/components/QuickExpenseBar";
import { MissionCard } from "@/components/MissionCard";
import { DailyCheckin } from "@/components/DailyCheckin";
import { formatPeso } from "@/lib/storage";

export default function Home() {
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const { activeMissions, signalBudgetCheck } = useMissionEngine();
  const [storyEvents] = useLocalStorage<StoryEvent[]>(KEYS.storyEvents, []);
  const [checkins] = useLocalStorage<DailyCheckinType[]>(KEYS.dailyCheckins, []);
  const [tip, setTip] = useLocalStorage<WeeklyTip | null>(KEYS.weeklyTip, null);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(KEYS.reminders, []);
  const [loadingTip, setLoadingTip] = useState(false);

  const budgetData = useBudget();
  const { onExpenseLogged, onBudgetChecked } = useStoryEngine();

  const activeMission = useMemo(
    () => activeMissions[0],
    [activeMissions],
  );

  const todayCheckin = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return checkins.find(c => c.date === today);
  }, [checkins]);

  // Budget warnings
  const warnings = useMemo(() => {
    const w: string[] = [];
    if (budgetData.status === "red") {
      w.push("⚠️ Malapit nang maubos ang weekly budget mo!");
    }
    const { categorySpent } = budgetData;
    const catLimits = budgetData.budget.categories;
    for (const [cat, limit] of Object.entries(catLimits)) {
      if (limit && categorySpent[cat] && categorySpent[cat] > limit * 0.85) {
        w.push(`⚠️ Malapit ka nang lumampas sa ${cat} budget`);
      }
    }
    return w;
  }, [budgetData]);

  // Upcoming reminders (not completed, due >= today)
  const upcomingReminders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return reminders
      .filter(r => !r.completed && r.dueDate >= todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [reminders]);

  function getDaysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + "T00:00:00");
    return Math.ceil((due.getTime() - today.getTime()) / 86400000);
  }

  function getUrgencyLabel(days: number): { text: string; className: string } {
    if (days === 0) return { text: "TODAY", className: "text-destructive bg-destructive/10 ring-destructive/30" };
    if (days === 1) return { text: "BUKAS", className: "text-highlight bg-highlight/10 ring-highlight/30" };
    if (days <= 3) return { text: `${days} araw`, className: "text-highlight bg-highlight/10 ring-highlight/20" };
    if (days <= 7) return { text: `${days} araw`, className: "text-accent bg-accent/10 ring-accent/20" };
    return { text: `${days}d`, className: "text-muted-foreground bg-secondary ring-border" };
  }

  function markAsPaid(id: string) {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: true } : r));
  }

  // Weekly tip — fetch if missing or >7 days old
  useEffect(() => {
    const stale = !tip || Date.now() - new Date(tip.generatedAt).getTime() > 7 * 24 * 3600 * 1000;
    if (!stale) return;
    setLoadingTip(true);
    fetchWeeklyTip(profile.name, profile.language)
      .then(text => setTip({ text, generatedAt: new Date().toISOString() }))
      .catch(() =>
        setTip({
          text: "Pay yourself first — bago ka gumastos, magtabi muna ng kahit ₱20.",
          generatedAt: new Date().toISOString(),
        }),
      )
      .finally(() => setLoadingTip(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return "Magandang umaga";
    if (h < 18) return "Magandang hapon";
    return "Magandang gabi";
  }, []);

  return (
    <div className="space-y-5 px-4 pb-6 pt-8 lg:px-8 lg:pt-10">
      {/* Avatar + greeting header */}
      <div className="rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          <AvatarArt level={profile.avatarLevel} size={72} ring />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">{greeting},</p>
            <h2 className="truncate text-2xl font-extrabold tracking-tight">{profile.name}!</h2>
            <div className="mt-1 flex items-center gap-2 text-xs font-bold text-primary">
              <Flame className="size-4" />
              <span>{profile.streak} araw streak</span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <XPBar totalXP={profile.totalXP} />
        </div>
      </div>

      {/* Budget Input */}
      <BudgetInput />

      {/* Budget Status (Hero) */}
      <BudgetHero
        remaining={budgetData.weeklyRemaining}
        total={budgetData.budget.weeklyBudget}
        status={budgetData.status}
        label={budgetData.budgetCycle === "monthly" ? "Natitira ngayong buwan" : "Natitira ngayong linggo"}
        sublabel={`₱${budgetData.dailyBudget.toLocaleString()} daily · ${budgetData.daysLeftInWeek} araw pa`}
      />

      {/* Warnings */}
      {/* {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
              {w}
            </div>
          ))}
        </div>
      )} */}

      {/* Daily Check-in */}
      {todayCheckin && (
        <DailyCheckin message={todayCheckin.message} mood={todayCheckin.mood} />
      )}

      {/* Upcoming Payments */}
      {upcomingReminders.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Bell className="size-3.5 text-highlight" />
              Upcoming Payments
            </h3>
            <Link to="/story" className="text-xs font-bold text-primary hover:underline">
              Calendar →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingReminders.map(r => {
              const days = getDaysUntil(r.dueDate);
              const urgency = getUrgencyLabel(days);
              const dateFormatted = new Date(r.dueDate + "T00:00:00").toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft transition ring-1 ${
                    days === 0 ? "ring-destructive/20 bg-destructive/[0.03]" :
                    days === 1 ? "ring-highlight/20 bg-highlight/[0.03]" :
                    "ring-border/50"
                  }`}
                >
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm ${
                    days === 0 ? "bg-destructive/10 text-destructive" :
                    days <= 3 ? "bg-highlight/10 text-highlight" :
                    "bg-accent/10 text-accent"
                  }`}>
                    🔔
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold truncate">{r.title}</span>
                      <span className="text-sm font-extrabold tabular text-foreground">
                        {formatPeso(r.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{dateFormatted}</span>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ${urgency.className}`}>
                        {urgency.text}
                      </span>
                      {r.note && (
                        <>
                          <span>·</span>
                          <span className="truncate">{r.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => markAsPaid(r.id)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent transition hover:bg-accent/25"
                    title="Mark as paid"
                  >
                    <Check className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Before You Spend (Simulator) */}
      <SpendSimulator
        budgetRemaining={budgetData.weeklyRemaining}
        categorySpent={budgetData.categorySpent}
        categoryLimits={budgetData.budget.categories}
        language={profile.language}
        onSimulated={() => { onBudgetChecked(); signalBudgetCheck(); }}
      />

      {/* Quick Expense Logger */}
      <QuickExpenseBar onExpenseAdded={onExpenseLogged} />

      {/* Active Mission Card */}
      {activeMission && (
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Mission
            </h3>
            <Link to="/missions" className="text-xs font-bold text-primary hover:underline">
              Lahat →
            </Link>
          </div>
          <MissionCard mission={activeMission} compact />
        </div>
      )}

      {/* Tip ng linggo + Quick links row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Tip */}
        <div className="rounded-3xl bg-gradient-warm p-[2px] shadow-card">
          <div className="flex h-full flex-col rounded-[calc(1.5rem-2px)] bg-card p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-4" />
              <span>Financial Literacy Tip 💡</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {loadingTip ? "Iniisip ni Gabay..." : tip?.text ?? "Pay yourself first — magtabi bago gumastos."}
            </p>
          </div>
        </div>

        {/* Quick navigation cards */}
        <div className="grid grid-cols-2 gap-2">
          <Link to="/coach" className="rounded-2xl bg-card p-4 shadow-soft transition-shadow hover:shadow-card">
            <MessageCircle className="size-5 text-primary" />
            <p className="mt-2 text-sm font-bold">Gabay AI</p>
            <p className="text-[10px] text-muted-foreground">Kausapin ang coach</p>
          </Link>
          <Link to="/story" className="rounded-2xl bg-card p-4 shadow-soft transition-shadow hover:shadow-card">
            <Sparkles className="size-5 text-primary" />
            <p className="mt-2 text-sm font-bold">My Story</p>
            <p className="text-[10px] text-muted-foreground">{storyEvents.length} events</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
