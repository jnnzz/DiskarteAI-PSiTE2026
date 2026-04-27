import { cn } from "@/lib/utils";
import { xpProgress } from "@/lib/xp";

interface XPBarProps {
  totalXP: number;
  className?: string;
  showLabel?: boolean;
}

export function XPBar({ totalXP, className, showLabel = true }: XPBarProps) {
  const { level, current, needed, pct } = xpProgress(totalXP);
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Level {level}</span>
          <span className="tabular">
            {current} / {needed} XP
          </span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-warm transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
