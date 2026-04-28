import { useState, useCallback } from "react";
import { GASTOS_CATEGORIES, type GastosCategory, uid, todayISO, type Transaction } from "@/lib/storage";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Plus, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Props = {
  onExpenseAdded?: () => void;
};

export function QuickExpenseBar({ onExpenseAdded }: Props) {
  const [, setTransactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<GastosCategory>("kainan");
  const [expanded, setExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);

  function addExpense() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    const tx: Transaction = {
      id: uid(),
      type: "gastos",
      amount: amt,
      category,
      note: note || undefined,
      date: todayISO(),
      source: "manual",
    };

    setTransactions(prev => [tx, ...prev]);
    setAmount("");
    setNote("");
    setExpanded(false);
    toast.success(`₱${amt.toLocaleString()} ${category} na-log! ✅`);
    onExpenseAdded?.();
  }

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Voice input not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "fil-PH";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
      // Try to parse "₱150 kainan" style input
      const match = transcript.match(/(\d+)/);
      if (match) setAmount(match[1]);
      setNote(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Hindi ko narinig. Subukan ulit.");
    };
    recognition.start();
  }, []);

  return (
    <div className="rounded-3xl bg-card p-4 shadow-card">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-secondary p-3 text-left transition hover:bg-secondary/70"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Plus className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold">I-log ang gastos</p>
            <p className="text-xs text-muted-foreground">Tap para mag-add ng expense</p>
          </div>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pl-7 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={isListening ? () => setIsListening(false) : startListening}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl transition",
                isListening
                  ? "animate-pulse bg-destructive text-destructive-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/70"
              )}
            >
              {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
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
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Note */}
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note (optional)..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { setExpanded(false); setAmount(""); setNote(""); }}
              className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-bold text-muted-foreground transition hover:bg-secondary/70"
            >
              Cancel
            </button>
            <button
              onClick={addExpense}
              disabled={!amount || Number(amount) <= 0}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-40"
            >
              I-log ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
