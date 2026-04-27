import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  KEYS,
  uid,
  todayISO,
  GASTOS_CATEGORIES,
  type GastosCategory,
  type Transaction,
  type Receipt,
} from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { Peso } from "@/components/Peso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Camera, Plus, Receipt as ReceiptIcon, Sparkles, Upload } from "lucide-react";
import { useAwardXP } from "@/hooks/useAwardXP";
import { analyzeReceipt } from "@/lib/ai";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CATEGORY_COLORS: Record<GastosCategory, string> = {
  kainan: "hsl(17 88% 40%)",
  transpo: "hsl(38 92% 50%)",
  bills: "hsl(0 72% 51%)",
  tindahan: "hsl(82 78% 36%)",
  "iba pa": "hsl(30 30% 60%)",
};

function dayKey(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { weekday: "short" });
}

export default function Gastos() {
  const [params, setParams] = useSearchParams();
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);
  const [receipts, setReceipts] = useLocalStorage<Receipt[]>(KEYS.receipts, []);
  const award = useAwardXP();

  const initialTab = params.get("action") === "scan" ? "scan" : "log";
  const [tab, setTab] = useState<"log" | "scan" | "insights">(initialTab as any);

  // Manual log state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<GastosCategory>("kainan");
  const [note, setNote] = useState("");

  // Receipt scan state
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState<{
    image: string;
    parsed: Awaited<ReturnType<typeof analyzeReceipt>> | null;
  } | null>(null);

  useEffect(() => {
    if (params.get("action")) {
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line
  }, []);

  function logManual() {
    if (!amount) return;
    const tx: Transaction = {
      id: uid(),
      type: "gastos",
      amount: Number(amount),
      category,
      note: note || undefined,
      date: todayISO(),
      source: "manual",
    };
    setTransactions((t) => [tx, ...t]);
    setAmount("");
    setNote("");
    award(5, "Gastos na-log", "first-gastos");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPendingReceipt({ image: dataUrl, parsed: null });
      setScanning(true);
      try {
        const parsed = await analyzeReceipt(dataUrl);
        setPendingReceipt({ image: dataUrl, parsed });
      } catch (err) {
        toast.error("Hindi ma-scan. Subukan ulit.");
        setPendingReceipt(null);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function confirmReceipt() {
    if (!pendingReceipt?.parsed) return;
    const receipt: Receipt = {
      id: uid(),
      imageDataUrl: pendingReceipt.image,
      scannedAt: todayISO(),
      parsedTotal: pendingReceipt.parsed.total,
      parsedItems: pendingReceipt.parsed.items,
      suggestedCategory: pendingReceipt.parsed.suggestedCategory,
    };
    const tx: Transaction = {
      id: uid(),
      type: "gastos",
      amount: pendingReceipt.parsed.total,
      category: pendingReceipt.parsed.suggestedCategory,
      note: pendingReceipt.parsed.merchant ?? "Receipt scan",
      date: todayISO(),
      source: "receipt-scan",
      receiptId: receipt.id,
    };
    setReceipts((r) => [receipt, ...r]);
    setTransactions((t) => [tx, ...t]);
    setPendingReceipt(null);
    award(10, "Receipt na-scan!");
  }

  // ----- Insights data -----
  const last7Days = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString("en-PH", { weekday: "short" })] = 0;
    }
    transactions
      .filter((t) => t.type === "gastos")
      .filter((t) => Date.now() - new Date(t.date).getTime() < 7 * 86400_000)
      .forEach((t) => {
        const k = dayKey(t.date);
        if (k in days) days[k] += t.amount;
      });
    return Object.entries(days).map(([day, amount]) => ({ day, amount }));
  }, [transactions]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "gastos")
      .filter((t) => Date.now() - new Date(t.date).getTime() < 7 * 86400_000)
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const weekTotal = byCategory.reduce((s, c) => s + c.value, 0);
  const topCategory = byCategory.sort((a, b) => b.value - a.value)[0];

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="Gastos Analyzer" subtitle="Saan napupunta ang pera mo?" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="scan">Scan</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Manual log */}
        <TabsContent value="log" className="mt-4 space-y-4">
          <div className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
            <div>
              <Label>Magkano?</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="₱ amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-extrabold tabular"
              />
            </div>
            <div>
              <Label>Kategorya</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {GASTOS_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`rounded-xl border-2 p-2 text-center transition ${
                      category === c.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-secondary hover:border-border"
                    }`}
                  >
                    <div className="text-lg">{c.emoji}</div>
                    <div className="text-[10px] font-bold">{c.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lunch sa karinderya" />
            </div>
            <Button onClick={logManual} size="xl" disabled={!amount}>
              <Plus /> I-log ang gastos
            </Button>
          </div>

          <div>
            <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent
            </h3>
            <ul className="space-y-1.5">
              {transactions
                .filter((t) => t.type === "gastos")
                .slice(0, 10)
                .map((t) => {
                  const cat = GASTOS_CATEGORIES.find((c) => c.id === t.category);
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-soft">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-lg">
                        {cat?.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{t.note ?? cat?.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat?.label} · {new Date(t.date).toLocaleDateString("en-PH")}
                        </p>
                      </div>
                      <Peso amount={t.amount} className="text-primary" sign="minus" />
                    </li>
                  );
                })}
            </ul>
          </div>
        </TabsContent>

        {/* Receipt scan */}
        <TabsContent value="scan" className="mt-4">
          <div className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
            <div className="text-center">
              <ReceiptIcon className="mx-auto size-12 text-primary" />
              <h3 className="mt-2 font-bold">Mag-scan ng resibo</h3>
              <p className="text-sm text-muted-foreground">
                I-tap ang button. Babasahin ng AI ang resibo at mag-suggest ng kategorya.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFile}
            />
            <div className="grid grid-cols-2 gap-2.5">
              <Button onClick={() => fileRef.current?.click()} variant="default" size="xl">
                <Camera /> Camera
              </Button>
              <Button onClick={() => fileRef.current?.click()} variant="outline" size="xl">
                <Upload /> Upload
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="mt-4 space-y-4">
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Linggong gastos
            </p>
            <Peso amount={weekTotal} className="text-3xl text-foreground" />
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--secondary))" }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`₱${v.toLocaleString()}`, "Gastos"]}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {byCategory.length > 0 && (
            <div className="rounded-3xl bg-card p-5 shadow-card">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Kategorya
              </p>
              <div className="flex items-center gap-4">
                <div className="size-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        innerRadius={36}
                        outerRadius={62}
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={2}
                      >
                        {byCategory.map((c) => (
                          <Cell key={c.name} fill={CATEGORY_COLORS[c.name as GastosCategory]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-1.5 text-sm">
                  {byCategory.map((c) => {
                    const meta = GASTOS_CATEGORIES.find((x) => x.id === c.name);
                    return (
                      <li key={c.name} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2.5 rounded-full" style={{ background: CATEGORY_COLORS[c.name as GastosCategory] }} />
                          <span>{meta?.label}</span>
                        </span>
                        <Peso amount={c.value} className="text-sm" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {topCategory && (
            <div className="rounded-3xl bg-gradient-warm p-[2px] shadow-card">
              <div className="rounded-[calc(1.5rem-2px)] bg-card p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="size-4" />
                  AI insight
                </div>
                <p className="text-sm">
                  Ang pinaka-malaking gastos mo ngayong linggo ay sa <strong>{GASTOS_CATEGORIES.find((c) => c.id === topCategory.name)?.label}</strong> — <Peso amount={topCategory.value} className="text-sm" />. Kaya mo pa bang bawasan, kahit konti?
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Receipt confirmation sheet */}
      <Sheet open={!!pendingReceipt} onOpenChange={(o) => !o && setPendingReceipt(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Resibo</SheetTitle>
          </SheetHeader>
          {pendingReceipt && (
            <div className="mt-3 space-y-3">
              <img src={pendingReceipt.image} alt="receipt" className="mx-auto max-h-40 rounded-xl object-contain" />
              {scanning && <p className="text-center text-sm text-muted-foreground">Sandali, binabasa ko...</p>}
              {pendingReceipt.parsed && (
                <>
                  <div className="rounded-2xl bg-secondary p-3 text-sm">
                    <p className="text-xs uppercase font-bold text-muted-foreground">Total</p>
                    <Peso amount={pendingReceipt.parsed.total} className="text-2xl text-foreground" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Suggested: <strong>{GASTOS_CATEGORIES.find((c) => c.id === pendingReceipt.parsed?.suggestedCategory)?.label}</strong>
                    </p>
                  </div>
                  {pendingReceipt.parsed.items.length > 0 && (
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                      {pendingReceipt.parsed.items.slice(0, 8).map((it, i) => (
                        <li key={i} className="flex justify-between border-b border-border/40 py-1">
                          <span className="truncate">{it.name}</span>
                          <span className="tabular">₱{it.price.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button onClick={confirmReceipt} variant="accent" size="xl">
                    I-save bilang gastos
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
