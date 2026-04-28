import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles, Bot, Zap } from "lucide-react";
import type { Mission } from "@/lib/storage";

type Props = {
  mission: Mission;
  compact?: boolean;
};

export function MissionCard({ mission: m, compact = false }: Props) {
  const hasProgress = m.target && m.target > 0;
  const progressPct = hasProgress ? Math.min(100, ((m.progress ?? 0) / m.target!) * 100) : 0;

  // Status label
  const statusLabel = m.completed
    ? "Achieved! ✅"
    : hasProgress && progressPct >= 70
      ? "Almost there! 🔥"
      : hasProgress && progressPct > 0
        ? "In Progress..."
        : "Active";

  const statusColor = m.completed
    ? "text-accent"
    : progressPct >= 70
      ? "text-highlight"
      : "text-muted-foreground";

  return (
    <div className={cn(
      "rounded-2xl p-4 shadow-soft transition-all duration-500",
      m.completed
        ? "bg-accent/10 border border-accent/30 scale-[0.98]"
        : "bg-card shadow-card",
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500",
          m.completed
            ? "bg-accent text-accent-foreground shadow-md"
            : "bg-highlight/20 text-highlight",
        )}>
          {m.completed ? <CheckCircle2 className="size-5" /> : <Sparkles className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-bold leading-tight transition-all",
              m.completed && "line-through opacity-70",
            )}>
              {m.title}
            </h4>
            {m.source === "ai" && !compact && (
              <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                <Bot className="size-2.5" /> AI
              </span>
            )}
          </div>

          {!compact && (
            <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
          )}

          {/* Progress bar */}
          {hasProgress && !m.completed && (
            <div className="mt-2">
              <div className="mb-0.5 flex justify-between text-[10px] font-semibold text-muted-foreground">
                <span>{m.progress ?? 0}/{m.target}</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    progressPct >= 70 ? "bg-accent" : "bg-highlight",
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 rounded-full bg-highlight/20 px-2 py-0.5 text-[11px] font-bold text-highlight-foreground">
              <Zap className="size-3" />
              +{m.xpReward} XP
            </span>
            <span className={cn("text-[11px] font-bold", statusColor)}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
