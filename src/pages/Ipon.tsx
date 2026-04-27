import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, uid, todayISO, type SavingsGoal } from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { ProgressRing } from "@/components/ProgressRing";
import { Peso } from "@/components/Peso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, PiggyBank, CheckCircle2 } from "lucide-react";
import { useAwardXP } from "@/hooks/useAwardXP";
import { celebrateGoal } from "@/lib/celebrate";
import { toast } from "sonner";

export default function Ipon() {
  const [goals, setGoals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const award = useAwardXP();

  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [depositAmt, setDepositAmt] = useState("");
  const [depositNote, setDepositNote] = useState("");

  function addGoal() {
    if (!name.trim() || !target) return;
    const goal: SavingsGoal = {
      id: uid(),
      name: name.trim(),
      targetAmount: Number(target),
      currentAmount: 0,
      deadline: deadline || new Date(Date.now() + 90 * 86400_000).toISOString(),
      deposits: [],
      completed: false,
    };
    setGoals((g) => [...g, goal]);
    setName("");
    setTarget("");
    setDeadline("");
    setOpenNew(false);
    award(20, "Bagong goal", "first-ipon");
  }

  function addDeposit() {
    if (!activeGoalId || !depositAmt) return;
    const amt = Number(depositAmt);
    setGoals((all) =>
      all.map((g) => {
        if (g.id !== activeGoalId) return g;
        const newCurrent = g.currentAmount + amt;
        const justCompleted = !g.completed && newCurrent >= g.targetAmount;
        if (justCompleted) {
          setTimeout(() => {
            celebrateGoal();
            award(100, "Goal nakumpleto!", "goal-completed");
          }, 50);
        }
        return {
          ...g,
          currentAmount: newCurrent,
          completed: justCompleted || g.completed,
          deposits: [
            ...g.deposits,
            { id: uid(), amount: amt, date: todayISO(), note: depositNote || undefined },
          ],
        };
      }),
    );
    if (!goals.find((g) => g.id === activeGoalId)?.completed) {
      award(10, "Bagong deposit", "first-ipon");
    }
    setDepositAmt("");
    setDepositNote("");
    toast.success(`Naipon mo na ang +₱${amt}!`);
  }

  const activeGoal = goals.find((g) => g.id === activeGoalId);

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader
        title="Ipon Tracker"
        subtitle="Mga pangarap mo, isa-isa."
        right={
          <Sheet open={openNew} onOpenChange={setOpenNew}>
            <SheetTrigger asChild>
              <Button size="icon" variant="default" aria-label="Mag-set ng goal">
                <Plus />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Bagong savings goal</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="g-name">Pangalan ng goal</Label>
                  <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tuition ni Junjun" />
                </div>
                <div>
                  <Label htmlFor="g-target">Target (₱)</Label>
                  <Input id="g-target" type="number" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="5000" />
                </div>
                <div>
                  <Label htmlFor="g-deadline">Deadline (optional)</Label>
                  <Input id="g-deadline" type="date" value={deadline.slice(0, 10)} onChange={(e) => setDeadline(new Date(e.target.value).toISOString())} />
                </div>
                <Button onClick={addGoal} size="xl" disabled={!name.trim() || !target}>
                  I-save ang goal
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        }
      />

      {goals.length === 0 ? (
        <div className="rounded-3xl bg-card p-8 text-center shadow-card">
          <PiggyBank className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-3 font-bold">Wala pang goal</p>
          <p className="text-sm text-muted-foreground">Mag-tap ng + para magdagdag.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {goals.map((g) => {
            const pct = (g.currentAmount / g.targetAmount) * 100;
            return (
              <li key={g.id}>
                <button
                  onClick={() => setActiveGoalId(g.id)}
                  className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left shadow-card transition-shadow hover:shadow-lift"
                >
                  <ProgressRing value={pct} size={88} stroke={8} fillClassName={g.completed ? "stroke-highlight" : "stroke-accent"}>
                    {g.completed ? (
                      <CheckCircle2 className="size-7 text-highlight" />
                    ) : (
                      <span className="text-xs font-bold tabular">{Math.round(pct)}%</span>
                    )}
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{g.name}</h3>
                    <p className="text-sm text-foreground/80">
                      <Peso amount={g.currentAmount} className="text-base" /> <span className="text-muted-foreground">/ <Peso amount={g.targetAmount} className="text-sm font-semibold" /></span>
                    </p>
                    {!g.completed && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <Peso amount={g.targetAmount - g.currentAmount} className="text-xs text-accent" /> pa
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={!!activeGoalId} onOpenChange={(o) => !o && setActiveGoalId(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          {activeGoal && (
            <>
              <SheetHeader>
                <SheetTitle>{activeGoal.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-2 text-center">
                <ProgressRing
                  value={(activeGoal.currentAmount / activeGoal.targetAmount) * 100}
                  size={140}
                  className="mx-auto"
                  fillClassName={activeGoal.completed ? "stroke-highlight" : "stroke-accent"}
                >
                  <Peso amount={activeGoal.currentAmount} className="text-xl" />
                  <span className="text-xs text-muted-foreground tabular">
                    sa <Peso amount={activeGoal.targetAmount} className="text-xs font-semibold" />
                  </span>
                </ProgressRing>
              </div>

              {!activeGoal.completed && (
                <div className="mt-4 space-y-3 rounded-2xl bg-secondary p-4">
                  <Label>Magdagdag ng deposit</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="₱ amount"
                    value={depositAmt}
                    onChange={(e) => setDepositAmt(e.target.value)}
                  />
                  <Input
                    placeholder="Note (optional)"
                    value={depositNote}
                    onChange={(e) => setDepositNote(e.target.value)}
                  />
                  <Button onClick={addDeposit} variant="accent" size="lg" className="w-full" disabled={!depositAmt}>
                    Mag-deposit
                  </Button>
                </div>
              )}

              <div className="mt-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">History</h4>
                <ul className="space-y-1.5">
                  {activeGoal.deposits.slice().reverse().map((d) => (
                    <li key={d.id} className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-sm shadow-soft">
                      <div>
                        <p className="font-semibold">{d.note ?? "Deposit"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString("en-PH")}</p>
                      </div>
                      <Peso amount={d.amount} className="text-accent" sign="plus" />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
