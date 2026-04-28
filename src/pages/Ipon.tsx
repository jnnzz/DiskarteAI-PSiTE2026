import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, uid, todayISO, blankProfile, type SavingsGoal, type Profile } from "@/lib/storage";
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
import { Plus, PiggyBank, CheckCircle2, Sparkles, RefreshCw, Bell, Building, Handshake, LineChart } from "lucide-react";
import { useAwardXP } from "@/hooks/useAwardXP";
import { celebrateGoal } from "@/lib/celebrate";
import { toast } from "sonner";
import { generateSavingsPlan } from "@/lib/ai";
import { cn } from "@/lib/utils";

// RAFI micro-savings product cards
const RAFI_PRODUCTS = [
  {
    icon: Building,
    title: "RAFI Micro-Savings",
    desc: "Buksan ang savings account sa pinakamalapit na RAFI branch. No maintaining balance.",
  },
  {
    icon: Handshake,
    title: "Samahan Group Savings",
    desc: "Mag-ipon kasama ang grupo. Mas mataas ang commitment at support.",
  },
  {
    icon: LineChart,
    title: "Kabuhayan Loan",
    desc: "Gamitin ang savings history mo para mag-apply ng RAFI Kabuhayan loan para sa negosyo.",
  },
];

export default function Ipon() {
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [goals, setGoals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const award = useAwardXP();

  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [depositAmt, setDepositAmt] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [generatingPlan, setGeneratingPlan] = useState<string | null>(null);

  // Nudge: check if any goal hasn't had a deposit in 3+ days
  useEffect(() => {
    const activeGoal = goals.find((g) => !g.completed);
    if (!activeGoal) return;
    const lastDeposit = activeGoal.deposits.slice(-1)[0];
    if (!lastDeposit) return;
    const daysSinceDeposit = Math.floor((Date.now() - new Date(lastDeposit.date).getTime()) / 86400000);
    if (daysSinceDeposit >= 3) {
      toast.info(`💰 Hindi ka pa nag-deposit sa "${activeGoal.name}" sa loob ng ${daysSinceDeposit} araw. Tuloy-tuloy lang!`, {
        duration: 6000,
        action: { label: "Mag-deposit", onClick: () => setActiveGoalId(activeGoal.id) },
      });
    }
  // eslint-disable-next-line
  }, []);

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
    // Auto-generate plan for new goal
    generatePlan(goal);
  }

  async function generatePlan(goal: SavingsGoal) {
    setGeneratingPlan(goal.id);
    try {
      const plan = await generateSavingsPlan(
        goal.name,
        goal.targetAmount,
        goal.currentAmount,
        goal.deadline,
        profile.language
      );
      setGoals((all) => all.map((g) => g.id === goal.id ? { ...g, aiPlan: plan } : g));
    } catch {}
    finally {
      setGeneratingPlan(null);
    }
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
            const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000));
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
                        <Peso amount={g.targetAmount - g.currentAmount} className="text-xs text-accent" /> pa · {daysLeft}d na lang
                      </p>
                    )}
                  </div>
                </button>

                {/* AI Savings Plan card */}
                <div className="mt-1.5 rounded-2xl bg-gradient-warm p-[1.5px]">
                  <div className="flex items-start gap-2 rounded-[calc(1rem-1.5px)] bg-card px-3 py-2.5">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <p className="flex-1 text-xs leading-relaxed text-foreground/80">
                      {generatingPlan === g.id ? (
                        "Iniisip ng AI ang plano mo..."
                      ) : g.aiPlan ? (
                        g.aiPlan
                      ) : (
                        "Walang AI plan pa. Mag-tap para ma-generate."
                      )}
                    </p>
                    {!g.aiPlan && generatingPlan !== g.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); generatePlan(g); }}
                        className="shrink-0 rounded-full p-1 transition hover:bg-secondary"
                      >
                        <RefreshCw className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* RAFI Products section */}
      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Building className="size-3.5" /> RAFI Savings Products
        </h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {RAFI_PRODUCTS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="rounded-2xl bg-card p-3 shadow-soft">
                <div className="text-primary pb-1 pt-0.5"><Icon className="size-5" /></div>
                <p className="mt-1 text-sm font-bold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deposit sheet */}
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

              {/* AI plan inside sheet */}
              {activeGoal.aiPlan && (
                <div className="mt-3 rounded-2xl bg-gradient-warm p-[1.5px]">
                  <div className="flex items-start gap-2 rounded-[calc(1rem-1.5px)] bg-card px-3 py-2">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <p className="text-xs leading-relaxed">{activeGoal.aiPlan}</p>
                  </div>
                </div>
              )}

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
