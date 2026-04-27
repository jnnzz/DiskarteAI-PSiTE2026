import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Flame, MessageCircle, Plus, Sparkles, Trophy } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, blankProfile, type Profile, type SavingsGoal, type WeeklyTip } from "@/lib/storage";
import { AvatarArt } from "@/components/AvatarArt";
import { XPBar } from "@/components/XPBar";
import { ProgressRing } from "@/components/ProgressRing";
import { Peso } from "@/components/Peso";
import { Button } from "@/components/ui/button";
import { fetchWeeklyTip } from "@/lib/ai";

const QUICK_ACTIONS = [
  { to: "/gastos?action=add", label: "Add Gastos", icon: Plus, variant: "default" as const },
  { to: "/gastos?action=scan", label: "Scan Receipt", icon: Camera, variant: "default" as const },
  { to: "/gabay", label: "Tanong kay Gabay", icon: MessageCircle, variant: "outline" as const },
  { to: "/missions", label: "View Missions", icon: Trophy, variant: "outline" as const },
];

export default function Home() {
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [goals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const [tip, setTip] = useLocalStorage<WeeklyTip | null>(KEYS.weeklyTip, null);
  const [loadingTip, setLoadingTip] = useState(false);

  const activeGoal = useMemo(() => goals.find((g) => !g.completed) ?? goals[0], [goals]);
  const goalPct = activeGoal ? (activeGoal.currentAmount / activeGoal.targetAmount) * 100 : 0;

  // Weekly tip — fetch if missing or >7 days old
  useEffect(() => {
    const stale = !tip || Date.now() - new Date(tip.generatedAt).getTime() > 7 * 24 * 3600 * 1000;
    if (!stale) return;
    setLoadingTip(true);
    fetchWeeklyTip(profile.name)
      .then((text) => setTip({ text, generatedAt: new Date().toISOString() }))
      .catch(() =>
        setTip({
          text: "Pay yourself first — bago ka gumastos, magtabi muna ng kahit ₱20. Maliit, pero tuloy-tuloy.",
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
      {/* Avatar header */}
      <div className="rounded-3xl bg-card p-5 shadow-card lg:p-7">
        <div className="flex items-center gap-4">
          <AvatarArt level={profile.avatarLevel} size={80} ring />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">{greeting},</p>
            <h2 className="truncate text-2xl font-extrabold tracking-tight">{profile.name}!</h2>
            <div className="mt-1 flex items-center gap-2 text-xs font-bold text-primary">
              <Flame className="size-4" />
              <span>{profile.streak} araw streak</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <XPBar totalXP={profile.totalXP} />
        </div>
      </div>

      {/* Tip + Ipon row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Today's tip */}
        <div className="rounded-3xl bg-gradient-warm p-[2px] shadow-card">
          <div className="flex h-full flex-col rounded-[calc(1.5rem-2px)] bg-card p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-4" />
              <span>Tip ng linggo</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {loadingTip ? "Iniisip ni Gabay..." : tip?.text ?? "Pay yourself first — magtabi bago gumastos."}
            </p>
          </div>
        </div>

        {/* Ipon ring */}
        {activeGoal ? (
          <Link to="/ipon" className="block">
            <div className="flex h-full items-center gap-4 rounded-3xl bg-card p-5 shadow-card transition-shadow hover:shadow-lift">
              <ProgressRing value={goalPct} size={120} stroke={10}>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Ipon</span>
                <Peso amount={activeGoal.currentAmount} className="text-lg" />
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted-foreground">Active goal</p>
                <h3 className="truncate text-lg font-bold">{activeGoal.name}</h3>
                <p className="mt-1 text-sm text-foreground/80">
                  <Peso amount={activeGoal.targetAmount - activeGoal.currentAmount} className="text-accent" /> pa para sa target
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{Math.round(goalPct)}% complete</p>
              </div>
            </div>
          </Link>
        ) : (
          <Link to="/ipon" className="block rounded-3xl bg-card p-5 text-center shadow-card hover:shadow-lift">
            <p className="font-semibold text-foreground">Anong gusto mong ipunin?</p>
            <p className="mt-1 text-sm text-muted-foreground">Mag-set ng unang savings goal mo.</p>
            <Button variant="accent" size="sm" className="mt-3">
              <Plus className="size-4" /> Mag-set ng goal
            </Button>
          </Link>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Mabilisang gawain
        </h3>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon, variant }) => (
            <Link key={to} to={to}>
              <Button variant={variant} className="h-auto w-full flex-col gap-2 py-4">
                <Icon className="size-5" />
                <span className="text-xs">{label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Secondary nav cards */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Link to="/kwento" className="rounded-2xl bg-card p-4 shadow-soft transition-shadow hover:shadow-card">
          <p className="text-xl">📖</p>
          <p className="mt-1 text-sm font-bold">Kwento ng Pera</p>
          <p className="text-xs text-muted-foreground">Interactive stories</p>
        </Link>
        <Link to="/tambayan" className="rounded-2xl bg-card p-4 shadow-soft transition-shadow hover:shadow-card">
          <p className="text-xl">🤝</p>
          <p className="mt-1 text-sm font-bold">Tambayan</p>
          <p className="text-xs text-muted-foreground">Community feed</p>
        </Link>
        <Link to="/palakasan" className="rounded-2xl bg-card p-4 shadow-soft transition-shadow hover:shadow-card">
          <p className="text-xl">🏆</p>
          <p className="mt-1 text-sm font-bold">Palakasan</p>
          <p className="text-xs text-muted-foreground">Weekly rankings</p>
        </Link>
        <Link to="/gabay" className="rounded-2xl bg-card p-4 shadow-soft transition-shadow hover:shadow-card">
          <p className="text-xl">💬</p>
          <p className="mt-1 text-sm font-bold">Gabay AI</p>
          <p className="text-xs text-muted-foreground">Chat coach</p>
        </Link>
      </div>
    </div>
  );
}
