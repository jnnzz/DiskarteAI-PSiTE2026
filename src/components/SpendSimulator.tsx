import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GASTOS_CATEGORIES, type GastosCategory } from "@/lib/storage";
import { simulatePurchase } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { Eye, Loader2 } from "lucide-react";

type Props = {
  budgetRemaining: number;
  categorySpent: Record<string, number>;
  categoryLimits: Partial<Record<GastosCategory, number>>;
  language?: "tagalog" | "cebuano" | "english";
  onSimulated?: () => void;
};

export function SpendSimulator({ budgetRemaining, categorySpent, categoryLimits, language = "tagalog", onSimulated }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<GastosCategory>("kainan");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  async function handleSimulate() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    setLoading(true);
    setResult(null);
    try {
      const text = await simulatePurchase(
        amt,
        category,
        budgetRemaining,
        categorySpent[category] ?? 0,
        categoryLimits[category],
        language,
      );
      setResult(text);
      setIsWarning(text.includes("⚠️") || (budgetRemaining - amt) < 0);
      onSimulated?.();
    } catch {
      setResult("Hindi ko ma-simulate ngayon. Subukan ulit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
        <Eye className="size-4" />
        <span>Before You Spend</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            className="pl-7"
          />
        </div>
        <Button onClick={handleSimulate} disabled={!amount || loading} size="default">
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Simulate"}
        </Button>
      </div>

      {/* Category pills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {GASTOS_CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition",
              category === c.id
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-secondary text-muted-foreground hover:bg-secondary/70"
            )}
          >
            <span className={cn("mr-0.5", category !== c.id && "grayscale")}>{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div className={cn(
          "mt-4 rounded-2xl p-4 text-sm leading-relaxed",
          isWarning
            ? "bg-destructive/10 text-destructive"
            : "bg-accent/10 text-accent"
        )}>
          {result}
        </div>
      )}
    </div>
  );
}
