import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, blankProfile, uid, todayISO, type KwentoProgress, type Profile, type LoanPayment, type Transaction, type SavingsGoal } from "@/lib/storage";
import { KWENTO_STORIES, type KwentoStory } from "@/lib/kwento";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateKwentoSummary, generateCreditNarrative } from "@/lib/ai";
import { useAwardXP } from "@/hooks/useAwardXP";
import { Sparkles, CheckCircle2, Copy, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Peso } from "@/components/Peso";

export default function Kwento() {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [progress, setProgress] = useLocalStorage<KwentoProgress[]>(KEYS.kwento, []);

  if (storyId) {
    const story = KWENTO_STORIES.find((s) => s.id === storyId);
    if (!story) {
      return (
        <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
          <PageHeader title="Walang nahanap" back />
        </div>
      );
    }
    return <StoryView story={story} progress={progress} setProgress={setProgress} />;
  }

  return <KwentoHub progress={progress} />;
}

// ── Main Hub with two tabs ─────────────────────────────────────────
function KwentoHub({ progress }: { progress: KwentoProgress[] }) {
  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="Kwento ng Pera" subtitle="Ang iyong financial journey." />

      <Tabs defaultValue="narrative">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="narrative">📜 Credit Narrative</TabsTrigger>
          <TabsTrigger value="stories">📖 FinStories</TabsTrigger>
        </TabsList>

        <TabsContent value="narrative" className="mt-4">
          <CreditNarrativeTab />
        </TabsContent>

        <TabsContent value="stories" className="mt-4">
          <FinStoriesTab progress={progress} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Credit Narrative Tab ───────────────────────────────────────────
function CreditNarrativeTab() {
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);
  const [goals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const [loanPayments, setLoanPayments] = useLocalStorage<LoanPayment[]>(KEYS.loanPayments, []);
  const [narrative, setNarrative] = useLocalStorage<string | null>(KEYS.creditNarrative, null);
  const [generating, setGenerating] = useState(false);
  const [openAddPayment, setOpenAddPayment] = useState(false);
  const award = useAwardXP();

  // Add loan payment form
  const [payAmt, setPayAmt] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payDue, setPayDue] = useState("");
  const [payLoanType, setPayLoanType] = useState("Micro-loan");
  const [payNote, setPayNote] = useState("");

  function addPayment() {
    if (!payAmt || !payDate) return;
    const dueDate = payDue || payDate;
    const onTime = new Date(payDate) <= new Date(dueDate);
    const payment: LoanPayment = {
      id: uid(),
      amount: Number(payAmt),
      dueDate,
      paidDate: payDate,
      onTime,
      note: payNote || undefined,
      loanType: payLoanType,
    };
    setLoanPayments((all) => [payment, ...all]);
    setPayAmt("");
    setPayDate("");
    setPayDue("");
    setPayNote("");
    setOpenAddPayment(false);
    award(40, "Loan payment na-log!", "loan-payment");
    toast.success(onTime ? "On-time payment! +40 XP 🎉" : "Payment na-record. Subukang maging on-time next time!");
    setNarrative(null); // invalidate old narrative
  }

  async function generateNarrative() {
    setGenerating(true);
    try {
      const text = await generateCreditNarrative(profile, transactions, goals, loanPayments, profile.language);
      setNarrative(text);
    } catch {
      toast.error("Hindi ma-generate ngayon. Subukan ulit.");
    } finally {
      setGenerating(false);
    }
  }

  function copyNarrative() {
    if (!narrative) return;
    navigator.clipboard.writeText(narrative);
    toast.success("Na-copy! I-paste sa message mo sa RAFI officer.");
  }

  const onTimeCount = loanPayments.filter(p => p.onTime).length;
  const totalPaid = loanPayments.reduce((s, p) => s + (p.paidDate ? p.amount : 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
          <p className="text-2xl font-extrabold text-accent">{loanPayments.length}</p>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Loan Payments</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
          <p className="text-2xl font-extrabold text-primary">{goals.length}</p>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Savings Goals</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
          <p className="text-2xl font-extrabold text-highlight">{onTimeCount}</p>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">On-Time Pays</p>
        </div>
      </div>

      {/* Loan payment log */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Loan Payment History
          </h3>
          <Sheet open={openAddPayment} onOpenChange={setOpenAddPayment}>
            <SheetTrigger asChild>
              <Button size="sm" variant="default">
                <Plus className="size-3.5" /> Add Payment
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>I-log ang RAFI Loan Payment</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div>
                  <Label>Loan Type</Label>
                  <select
                    value={payLoanType}
                    onChange={e => setPayLoanType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  >
                    <option>Micro-loan</option>
                    <option>Group Loan</option>
                    <option>Kabuhayan Loan</option>
                    <option>Emergency Loan</option>
                  </select>
                </div>
                <div>
                  <Label>Amount Paid (₱)</Label>
                  <Input type="number" inputMode="numeric" value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder="2500" />
                </div>
                <div>
                  <Label>Date Paid</Label>
                  <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
                </div>
                <div>
                  <Label>Due Date (optional — para makita kung on-time)</Label>
                  <Input type="date" value={payDue} onChange={e => setPayDue(e.target.value)} />
                </div>
                <div>
                  <Label>Note (optional)</Label>
                  <Input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Weekly amortization" />
                </div>
                <Button onClick={addPayment} size="xl" disabled={!payAmt || !payDate}>
                  I-save ang payment
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {loanPayments.length === 0 ? (
          <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">Wala pang loan payments. I-log ang iyong RAFI payments para mapalakas ang credit narrative mo.</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {loanPayments.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-soft">
                <div className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm",
                  p.onTime ? "bg-accent/20 text-accent" : "bg-destructive/10 text-destructive"
                )}>
                  {p.onTime ? "✓" : "⚠️"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.loanType}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.paidDate ? new Date(p.paidDate).toLocaleDateString("en-PH") : "Pending"} · {p.onTime ? "On-time ✅" : "Late"}
                  </p>
                </div>
                <Peso amount={p.amount} className="text-sm font-bold text-foreground" />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI Credit Narrative */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            AI Credit Narrative
          </h3>
          <p className="text-xs text-muted-foreground">Para sa RAFI loan officer</p>
        </div>

        {narrative ? (
          <div className="rounded-3xl bg-gradient-warm p-[2px] shadow-card">
            <div className="rounded-[calc(1.5rem-2px)] bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="size-4" />
                  Iyong Financial Story
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={generateNarrative}
                    disabled={generating}
                    className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary"
                    title="Refresh"
                  >
                    <RefreshCw className={cn("size-3.5", generating && "animate-spin")} />
                  </button>
                  <button
                    onClick={copyNarrative}
                    className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary"
                    title="Copy"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{narrative}</p>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={copyNarrative}>
                <Copy className="size-3.5" />
                I-copy para sa RAFI Officer
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-card p-6 text-center shadow-card">
            <Sparkles className="mx-auto size-10 text-primary" />
            <h3 className="mt-2 font-bold">I-generate ang iyong Credit Story</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Gagawa ang AI ng personalized na financial narrative mo — mula sa iyong unang loan hanggang ngayon. Pwedeng i-share sa RAFI loan officer mo.
            </p>
            <Button onClick={generateNarrative} disabled={generating} size="xl" className="mt-4">
              {generating ? (
                <><RefreshCw className="size-4 animate-spin" /> Iniisip ng AI...</>
              ) : (
                <><Sparkles className="size-4" /> I-generate ang Credit Story</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── FinStories Tab (original interactive stories) ──────────────────
function FinStoriesTab({ progress }: { progress: KwentoProgress[] }) {
  const navigate = useNavigate();
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {KWENTO_STORIES.map((s) => {
        const done = progress.find((p) => p.storyId === s.id)?.completed;
        return (
          <li key={s.id}>
            <button
              onClick={() => navigate(`/kwento/${s.id}`)}
              className="flex w-full items-center gap-4 rounded-3xl bg-card p-5 text-left shadow-card transition-shadow hover:shadow-lift"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-3xl">
                {s.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                {done && <p className="mt-1 text-[11px] font-bold text-accent">✓ Tapos na</p>}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ── Story View (unchanged interactive story reader) ────────────────
function StoryView({
  story,
  progress,
  setProgress,
}: {
  story: KwentoStory;
  progress: KwentoProgress[];
  setProgress: (v: KwentoProgress[] | ((p: KwentoProgress[]) => KwentoProgress[])) => void;
}) {
  const award = useAwardXP();
  const [nodeId, setNodeId] = useState(story.startNodeId);
  const [chosen, setChosen] = useState<{ label: string; lesson?: string }[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const node = story.nodes[nodeId];

  function pick(choiceId: string, label: string, next: string, lesson?: string) {
    setChosen((c) => [...c, { label, lesson }]);
    setNodeId(next);
  }

  async function finishStory() {
    setGenerating(true);
    try {
      const text = await generateKwentoSummary(story.title, chosen);
      setSummary(text);
      setProgress((all) => {
        const filtered = all.filter((p) => p.storyId !== story.id);
        return [
          ...filtered,
          {
            storyId: story.id,
            currentNodeId: nodeId,
            choicesMade: chosen.map((c) => c.label),
            completed: true,
            aiSummary: text,
          },
        ];
      });
      award(20, "Kwento natapos!", "kwento-finisher");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title={story.title} subtitle={story.subtitle} back />

      <div className="rounded-3xl bg-card p-6 shadow-card">
        <div className="mb-3 text-4xl">{story.emoji}</div>
        <p className="whitespace-pre-wrap leading-relaxed text-foreground">{node.text}</p>

        {node.choices && (
          <div className="mt-5 space-y-2">
            {node.choices.map((c) => (
              <Button
                key={c.id}
                onClick={() => pick(c.id, c.label, c.next, c.lesson)}
                variant="outline"
                size="lg"
                className="h-auto w-full justify-start py-3 text-left text-sm"
              >
                {c.label}
              </Button>
            ))}
          </div>
        )}

        {node.ending && !summary && (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-secondary p-3 text-sm font-semibold">{node.ending}</div>
            <Button onClick={finishStory} size="xl" variant="highlight" disabled={generating}>
              {generating ? "Iniisip ng AI ang aral..." : "Tapusin at kunin ang aral"}
            </Button>
          </div>
        )}

        {summary && (
          <div className="mt-5 rounded-2xl bg-gradient-warm p-[2px]">
            <div className="rounded-[calc(1rem-2px)] bg-card p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="size-4" />
                Aral mula sa AI
              </div>
              <p className="text-sm leading-relaxed">{summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
