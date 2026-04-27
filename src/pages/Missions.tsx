import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, blankProfile, todayISO, type Mission, type Profile } from "@/lib/storage";
import { defaultMissions, NEGOSYANTE_STAGES } from "@/lib/missions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Sparkles, Star, Lock } from "lucide-react";
import { useAwardXP } from "@/hooks/useAwardXP";
import { celebrateMission } from "@/lib/celebrate";
import { cn } from "@/lib/utils";
import { xpProgress } from "@/lib/xp";
import { AvatarArt } from "@/components/AvatarArt";

export default function Missions() {
  const [missions, setMissions] = useLocalStorage<Mission[]>(KEYS.missions, defaultMissions);
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
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

  const prog = xpProgress(profile.totalXP);
  const currentStage = NEGOSYANTE_STAGES.slice().reverse().find((s) => profile.totalXP >= s.xpRequired) ?? NEGOSYANTE_STAGES[0];
  const nextStage = NEGOSYANTE_STAGES.find((s) => s.xpRequired > profile.totalXP);

  const completedCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="FinQuest" subtitle="Tapusin para sa XP at level-up." />

      <Tabs defaultValue="journey">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="journey">🧑‍💼 Journey</TabsTrigger>
          <TabsTrigger value="missions">⚡ Missions</TabsTrigger>
        </TabsList>

        {/* NEGOSYANTE JOURNEY TAB */}
        <TabsContent value="journey" className="mt-4 space-y-4">
          {/* Current character card */}
          <div className="rounded-3xl bg-gradient-warm p-[2px] shadow-card">
            <div className="flex items-center gap-4 rounded-[calc(1.5rem-2px)] bg-card p-5">
              <AvatarArt level={profile.avatarLevel} size={80} ring />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {currentStage.emoji} {currentStage.title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{currentStage.description}</p>
                {nextStage && (
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span>Next: {nextStage.emoji} {nextStage.title}</span>
                      <span className="text-muted-foreground">{profile.totalXP}/{nextStage.xpRequired} XP</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${Math.min(100, (profile.totalXP / nextStage.xpRequired) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {!nextStage && (
                  <p className="mt-1 text-xs font-bold text-highlight">🌟 Max Level! Ikaw ang Lider!</p>
                )}
              </div>
            </div>
          </div>

          {/* All stages progression */}
          <div>
            <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Negosyante Journey
            </h3>
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
              <ul className="space-y-3">
                {NEGOSYANTE_STAGES.map((stage, i) => {
                  const unlocked = profile.totalXP >= stage.xpRequired;
                  const isCurrent = stage.title === currentStage.title;
                  return (
                    <li key={stage.level} className="flex items-start gap-4 pl-0">
                      <div className={cn(
                        "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl transition",
                        isCurrent ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50"
                          : unlocked ? "bg-accent/20 text-accent"
                          : "bg-secondary text-muted-foreground"
                      )}>
                        {unlocked ? stage.emoji : <Lock className="size-4" />}
                      </div>
                      <div className={cn(
                        "flex-1 rounded-2xl p-3 transition",
                        isCurrent ? "bg-card shadow-card" : unlocked ? "bg-card shadow-soft" : "bg-secondary opacity-60"
                      )}>
                        <div className="flex items-center justify-between">
                          <p className={cn("font-bold", isCurrent && "text-primary")}>{stage.title}</p>
                          <span className="text-xs font-semibold text-muted-foreground">{stage.xpRequired} XP</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
                        {isCurrent && (
                          <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            ← Nandito ka ngayon
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Mission progress summary */}
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Missions Completed</p>
              <span className="text-sm font-extrabold text-accent">{completedCount}/{totalCount}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </TabsContent>

        {/* MISSIONS TAB */}
        <TabsContent value="missions" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <Section title="Daily Quests" missions={daily} onComplete={complete} />
            <Section title="Weekly Quests" missions={weekly} onComplete={complete} />
          </div>

          {/* Auto-trigger notice */}
          <div className="mt-4 rounded-2xl bg-secondary p-3 text-xs text-muted-foreground">
            <p className="font-bold text-foreground">⚡ Auto-complete missions</p>
            <p className="mt-0.5">Ang ilang missions ay awtomatikong nakukompleto pag nag-deposit ka, nag-scan ng resibo, o nagtanong kay Gabay!</p>
          </div>
        </TabsContent>
      </Tabs>
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
                {m.trigger && m.trigger !== "manual" && !m.completed && (
                  <p className="mt-0.5 text-[10px] font-semibold text-primary/70">
                    ⚡ Auto-completes when you {
                      m.trigger === "deposit" ? "make a savings deposit" :
                      m.trigger === "scan" ? "scan a receipt" :
                      m.trigger === "chat" ? "chat with Gabay" :
                      m.trigger === "loan-payment" ? "log a loan payment" : ""
                    }
                  </p>
                )}
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
