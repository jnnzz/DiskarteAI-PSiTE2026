import { cn } from "@/lib/utils";
import type { StoryEvent } from "@/lib/storage";

type Props = {
  events: StoryEvent[];
  maxItems?: number;
};

const typeStyles: Record<string, { dot: string; line: string }> = {
  chapter: { dot: "bg-primary text-primary-foreground", line: "bg-primary/20" },
  achievement: { dot: "bg-accent text-accent-foreground", line: "bg-accent/20" },
  milestone: { dot: "bg-highlight text-highlight-foreground", line: "bg-highlight/20" },
  warning: { dot: "bg-destructive text-destructive-foreground", line: "bg-destructive/20" },
};

export function StoryTimeline({ events, maxItems }: Props) {
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayed = maxItems ? sorted.slice(0, maxItems) : sorted;

  if (displayed.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
        <p className="text-sm text-muted-foreground">Wala pang events sa iyong journey. Mag-log ng gastos para magsimula!</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />

      <ul className="space-y-3">
        {displayed.map((event, i) => {
          const style = typeStyles[event.type] ?? typeStyles.chapter;
          const dateStr = new Date(event.date).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
          });

          return (
            <li key={event.id} className="flex items-start gap-4">
              {/* Dot */}
              <div className={cn(
                "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow-soft transition",
                style.dot,
                i === 0 && "ring-2 ring-primary/40 shadow-card",
              )}>
                {event.emoji}
              </div>

              {/* Content */}
              <div className={cn(
                "flex-1 rounded-2xl p-3 transition",
                i === 0 ? "bg-card shadow-card" : "bg-card shadow-soft",
              )}>
                <div className="flex items-center justify-between">
                  <p className={cn("font-bold leading-tight", i === 0 && "text-primary")}>
                    {event.title}
                  </p>
                  <span className="text-[10px] font-semibold text-muted-foreground">{dateStr}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
