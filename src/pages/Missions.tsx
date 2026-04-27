import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, todayISO, type Mission } from "@/lib/storage";
import { defaultMissions } from "@/lib/missions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useAwardXP } from "@/hooks/useAwardXP";
import { celebrateMission } from "@/lib/celebrate";
import { cn } from "@/lib/utils";

export default function Missions() {
  const [missions, setMissions] = useLocalStorage<Mission[]>(KEYS.missions, defaultMissions);
  const award = useAwardXP();

  function complete(id: string) {
    const m = missions.find((x) => x.id === id);
    if (!m || m.completed) return;
    setMissions((all) =>
      all.map((x) => (x.id === id ? { ...x, completed: true, completedAt: todayISO() } : x)),
    );
    celebrateMission();
    award(m.xpReward, m.title, "first-mission");
  }

  const daily = missions.filter((m) => m.type === "daily");
  const weekly = missions.filter((m) => m.type === "weekly");

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="FinQuest" subtitle="Tapusin para sa XP at level-up." />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Section title="Daily Quests" missions={daily} onComplete={complete} />
        <Section title="Weekly Quests" missions={weekly} onComplete={complete} />
      </div>
    </div>
  );
}

function Section({ title, missions, onComplete }: { title: string; missions: Mission[]; onComplete: (id: string) => void }) {
  return (
    <div>
      <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-2">
        {missions.map((m) => (
          <li
            key={m.id}
            className={cn(
              "rounded-2xl p-4 shadow-soft transition",
              m.completed ? "bg-secondary opacity-70" : "bg-card shadow-card",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  m.completed ? "bg-accent text-accent-foreground" : "bg-highlight/20 text-highlight",
                )}
              >
                {m.completed ? <CheckCircle2 className="size-5" /> : <Sparkles className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold">{m.title}</h4>
                <p className="text-xs text-muted-foreground">{m.description}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-highlight/20 px-2 py-0.5 text-[11px] font-bold text-highlight-foreground">
                    +{m.xpReward} XP
                  </span>
                  {m.completed ? (
                    <span className="text-xs font-bold text-accent">✓ Tapos!</span>
                  ) : (
                    <Button size="sm" variant="highlight" onClick={() => onComplete(m.id)}>
                      Mark complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
