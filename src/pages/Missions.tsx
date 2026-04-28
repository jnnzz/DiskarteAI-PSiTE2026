import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useMissionEngine } from "@/hooks/useMissionEngine";
import { useStoryEngine } from "@/hooks/useStoryEngine";
import { KEYS, blankProfile, uid, todayISO, type Profile, type SavingsGoal, type Deposit } from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { MissionCard } from "@/components/MissionCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Peso } from "@/components/Peso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Missions() {
  const { activeMissions, completedMissions } = useMissionEngine();
  const [goals, setGoals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const { onSavingsDeposit } = useStoryEngine();

  // Goal form
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [openGoalSheet, setOpenGoalSheet] = useState(false);

  // Deposit form
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmt, setDepositAmt] = useState("");

  function addGoal() {
    if (!goalName || !goalTarget) return;
    const goal: SavingsGoal = {
      id: uid(), name: goalName, targetAmount: Number(goalTarget),
      currentAmount: 0, deadline: goalDeadline || new Date(Date.now() + 90 * 86400000).toISOString(),
      deposits: [], completed: false,
    };
    setGoals(prev => [...prev, goal]);
    setGoalName(""); setGoalTarget(""); setGoalDeadline(""); setOpenGoalSheet(false);
    toast.success("Goal na-set! 🎯");
  }

  function addDeposit() {
    const amt = Number(depositAmt);
    if (!depositGoalId || !amt || amt <= 0) return;
    const dep: Deposit = { id: uid(), amount: amt, date: todayISO() };
    setGoals(prev => prev.map(g => {
      if (g.id !== depositGoalId) return g;
      const newAmt = g.currentAmount + amt;
      return { ...g, currentAmount: newAmt, deposits: [dep, ...g.deposits], completed: newAmt >= g.targetAmount };
    }));
    setDepositAmt(""); setDepositGoalId(null);
    onSavingsDeposit(amt);
    toast.success(`₱${amt.toLocaleString()} na-deposit! 💰`);
  }

  const activeGoals = goals.filter(g => !g.completed);

  return (
    <div className="space-y-5 px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="Missions & Goals" subtitle="5 daily missions — auto-complete for XP!" />

      {/* Active Missions */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Active Missions ({activeMissions.length})
        </h3>
        {activeMissions.length === 0 ? (
          <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
            <Sparkles className="mx-auto mb-2 size-8 text-primary opacity-50" />
            <p className="font-semibold">Lahat ng missions ay tapos na! 🎉</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bukas may bagong 5 missions ulit. Keep it up!
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {activeMissions.map(m => (
              <li key={m.id}>
                <MissionCard mission={m} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Savings Goals */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Savings Goals ({activeGoals.length})
          </h3>
          <Sheet open={openGoalSheet} onOpenChange={setOpenGoalSheet}>
            <SheetTrigger asChild>
              <Button size="sm" variant="default"><Plus className="size-3.5" /> Bagong Goal</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader><SheetTitle>Mag-set ng Savings Goal</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-3">
                <div><Label>Pangalan ng Goal</Label><Input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Tuition, Emergency Fund..." /></div>
                <div><Label>Target (₱)</Label><Input type="number" inputMode="numeric" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="5000" /></div>
                <div><Label>Deadline (optional)</Label><Input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} /></div>
                <Button onClick={addGoal} size="xl" disabled={!goalName || !goalTarget}>I-save ang goal</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {activeGoals.length === 0 ? (
          <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
            <p className="font-semibold">Wala pang savings goal.</p>
            <p className="mt-1 text-sm text-muted-foreground">Mag-set ng pangarap para may ipon!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {activeGoals.map(g => {
              const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
              return (
                <li key={g.id} className="rounded-3xl bg-card p-5 shadow-card">
                  <div className="flex items-center gap-4">
                    <ProgressRing value={pct} size={80} stroke={8}>
                      <Peso amount={g.currentAmount} className="text-sm" />
                    </ProgressRing>
                    <div className="flex-1">
                      <h4 className="font-bold">{g.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        <Peso amount={g.targetAmount - g.currentAmount} className="text-accent" /> pa para sa target
                      </p>
                      <p className="text-xs text-muted-foreground">{Math.round(pct)}% complete</p>
                    </div>
                  </div>
                  {/* Inline deposit */}
                  {depositGoalId === g.id ? (
                    <div className="mt-3 flex gap-2">
                      <Input type="number" inputMode="numeric" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} placeholder="₱ amount" className="flex-1" autoFocus />
                      <Button size="sm" onClick={addDeposit} disabled={!depositAmt}>Ipon</Button>
                      <Button size="sm" variant="outline" onClick={() => setDepositGoalId(null)}>✕</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setDepositGoalId(g.id)}>
                      <Plus className="size-3.5" /> Mag-deposit
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Completed ({completedMissions.length})
          </h3>
          <ul className="space-y-2">
            {completedMissions.slice(0, 5).map(m => (
              <li key={m.id}><MissionCard mission={m} compact /></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
