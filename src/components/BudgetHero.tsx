import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/storage";
import { Wallet } from "lucide-react";

type Props = {
  remaining: number;
  total: number;
  status: "green" | "yellow" | "red";
  label: string;
  sublabel?: string;
};

const statusColors = {
  green: {
    bg: "bg-accent/10",
    ring: "ring-accent/30",
    text: "text-accent",
    bar: "bg-accent",
    icon: "text-accent",
  },
  yellow: {
    bg: "bg-highlight/10",
    ring: "ring-highlight/30",
    text: "text-highlight",
    bar: "bg-highlight",
    icon: "text-highlight",
  },
  red: {
    bg: "bg-destructive/10",
    ring: "ring-destructive/30",
    text: "text-destructive",
    bar: "bg-destructive",
    icon: "text-destructive",
  },
};

export function BudgetHero({ remaining, total, status, label, sublabel }: Props) {
  const colors = statusColors[status];
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;

  return (
    <div className={cn("rounded-3xl p-5 shadow-card ring-1 transition-colors", colors.bg, colors.ring)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex size-12 items-center justify-center rounded-2xl bg-card shadow-soft", colors.icon)}>
          <Wallet className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn("text-3xl font-extrabold tabular", colors.text)}>
            {formatPeso(Math.max(0, remaining))}
          </p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-card">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colors.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-muted-foreground">
        <span>{Math.round(pct)}% natitira</span>
        <span>{formatPeso(total)} budget</span>
      </div>
    </div>
  );
}
