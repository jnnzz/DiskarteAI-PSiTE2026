import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

type Props = {
  insight: string;
  trend?: "up" | "down" | "neutral";
  index?: number;
};

const trendConfig = {
  up: { icon: TrendingUp, color: "text-destructive", bg: "bg-destructive/10" },
  down: { icon: TrendingDown, color: "text-accent", bg: "bg-accent/10" },
  neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-secondary" },
};

export function InsightCard({ insight, trend = "neutral", index = 0 }: Props) {
  const config = trendConfig[trend];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft transition-shadow hover:shadow-card",
    )}>
      <div className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        config.bg, config.color,
      )}>
        <Icon className="size-5" />
      </div>
      <p className="flex-1 text-sm leading-relaxed text-foreground">{insight}</p>
    </div>
  );
}
