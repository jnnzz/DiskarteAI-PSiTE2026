import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  KEYS,
  blankProfile,
  clearAll,
  type Profile,
  type SavingsGoal,
  type Transaction,
  type BadgeId,
} from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { AvatarArt } from "@/components/AvatarArt";
import { XPBar } from "@/components/XPBar";
import { Peso } from "@/components/Peso";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles, Wallet, PiggyBank, Receipt, Target, Sprout, TreePine, Flag, BookOpen } from "lucide-react";
import { useMemo } from "react";

const ALL_BADGES: { id: BadgeId; label: string; icon: React.ElementType; hint: string }[] = [
  { id: "first-ipon", label: "First Ipon", icon: PiggyBank, hint: "Unang deposit" },
  { id: "first-gastos", label: "First Gastos", icon: Receipt, hint: "Unang gastos log" },
  { id: "first-mission", label: "Quester", icon: Target, hint: "Unang mission" },
  { id: "streak-7", label: "Linggong Tuloy", icon: Flame, hint: "7 araw streak" },
  { id: "level-3", label: "Level 3", icon: Sprout, hint: "Lumakas ka na" },
  { id: "level-5", label: "Level 5", icon: TreePine, hint: "Sari-sari spirit" },
  { id: "goal-completed", label: "Goal Achiever", icon: Flag, hint: "Naabot ang goal" },
  { id: "kwento-finisher", label: "Kwentista", icon: BookOpen, hint: "Tapos ang kwento" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [goals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);

  const lifetimeIpon = useMemo(
    () => goals.reduce((s, g) => s + g.currentAmount, 0),
    [goals],
  );
  const totalGastos = useMemo(
    () => transactions.filter((t) => t.type === "gastos").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  function handleReset() {
    if (!confirm("Sigurado ka? Mawawala lahat ng progress mo.")) return;
    clearAll();
    navigate("/");
  }

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="Ako" subtitle="Profile at progress mo." />

      <div className="rounded-3xl bg-card p-6 text-center shadow-card">
        <AvatarArt level={profile.avatarLevel} size={140} ring className="mx-auto" />
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight">{profile.name}</h2>
        <p className="text-sm text-muted-foreground">Avatar Level {profile.avatarLevel}</p>
        <div className="mx-auto mt-4 max-w-xs">
          <XPBar totalXP={profile.totalXP} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat icon={<Sparkles className="size-4" />} label="Total XP" value={profile.totalXP.toLocaleString()} />
        <Stat icon={<Flame className="size-4" />} label="Streak" value={`${profile.streak} araw`} />
        <Stat icon={<Wallet className="size-4" />} label="Ipon" value={<Peso amount={lifetimeIpon} className="text-base" />} />
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Badges</h3>
        <div className="grid grid-cols-4 gap-2">
          {ALL_BADGES.map((b) => {
            const earned = profile.badges.includes(b.id);
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`flex flex-col items-center rounded-2xl p-3 text-center shadow-soft ${
                  earned ? "bg-card" : "bg-card opacity-40 grayscale"
                }`}
                title={b.hint}
              >
                <div className="text-primary pb-1 pt-0.5"><Icon className="size-6" /></div>
                <span className="mt-1 text-[10px] font-bold text-foreground">{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lifetime gastos</p>
        <Peso amount={totalGastos} className="text-2xl text-foreground" />
      </div>

      <Button onClick={handleReset} variant="ghost" className="mt-8 w-full text-muted-foreground">
        I-reset ang app
      </Button>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
      <div className="mb-1 flex justify-center text-primary pb-1 pt-0.5">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-base font-extrabold tabular">{value}</p>
    </div>
  );
}
