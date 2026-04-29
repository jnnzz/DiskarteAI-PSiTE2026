import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, blankProfile, clearAll, type Profile, type StoryEvent, type Transaction, type Reminder } from "@/lib/storage";
import { NEGOSYANTE_STAGES } from "@/lib/missions";
import { PageHeader } from "@/components/PageHeader";
import { AvatarArt } from "@/components/AvatarArt";
import { XPBar } from "@/components/XPBar";
import { StoryTimeline } from "@/components/StoryTimeline";
import { ExpenseCalendar } from "@/components/ExpenseCalendar";
import { ReminderForm } from "@/components/ReminderForm";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { useState } from "react";
import { seedDemo } from "@/lib/seedDemo";

export default function Story() {
  const [resetFlash, setResetFlash] = useState(false);

  function handleReset() {
    setResetFlash(true);
    setTimeout(() => {
      clearAll();
      seedDemo();
      window.location.reload();
    }, 400);
  }

  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [storyEvents] = useLocalStorage<StoryEvent[]>(KEYS.storyEvents, []);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(KEYS.reminders, []);

  const currentStage = NEGOSYANTE_STAGES.slice().reverse().find(s => profile.totalXP >= s.xpRequired) ?? NEGOSYANTE_STAGES[0];
  const nextStage = NEGOSYANTE_STAGES.find(s => s.xpRequired > profile.totalXP);

  return (
    <div className="space-y-5 px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="My Story" subtitle="Ang iyong financial journey." />

      {/* Avatar Spotlight */}
      <div className="rounded-3xl bg-gradient-warm p-[2px] shadow-card">
        <div className="flex items-center gap-4 rounded-[calc(1.5rem-2px)] bg-card p-5">
          <AvatarArt level={profile.avatarLevel} size={80} ring />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              <span className="grayscale">{currentStage.emoji}</span> {currentStage.title}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">{currentStage.description}</p>
            {nextStage && (
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span>Next: <span className="grayscale">{nextStage.emoji}</span> {nextStage.title}</span>
                  <span className="text-muted-foreground">{profile.totalXP}/{nextStage.xpRequired} XP</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, (profile.totalXP / nextStage.xpRequired) * 100)}%` }} />
                </div>
              </div>
            )}
            {!nextStage && <p className="mt-1 text-xs font-bold text-highlight">🌟 Max Level!</p>}
          </div>
        </div>
      </div>

      {/* Expense Calendar */}
      <div>
        <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span className="grayscale">📅</span> Expense Calendar
        </h3>
        <ExpenseCalendar transactions={transactions} avatarLevel={profile.avatarLevel} reminders={reminders} />
        <div className="mt-3">
          <ReminderForm onAdd={(r) => setReminders(prev => [...prev, r])} />
        </div>
      </div>

      {/* XP Bar */}
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <XPBar totalXP={profile.totalXP} />
        <div className="mt-2 flex justify-between text-xs font-semibold text-muted-foreground">
          <span>{profile.milestonesReached} milestones reached</span>
          <span>{storyEvents.length} events</span>
        </div>
      </div>

      {/* Journey Timeline */}
      <div>
        <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Timeline ng Journey
        </h3>
        <StoryTimeline events={storyEvents} />
      </div>

      {/* Negosyante Stages */}
      <div>
        <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Negosyante Journey
        </h3>
        <div className="relative">
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
          <ul className="space-y-3">
            {NEGOSYANTE_STAGES.map(stage => {
              const unlocked = profile.totalXP >= stage.xpRequired;
              const isCurrent = stage.title === currentStage.title;
              return (
                <li key={stage.level} className="flex items-start gap-4">
                  <div className={cn(
                    "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl transition",
                    isCurrent ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50"
                      : unlocked ? "bg-accent/20 text-accent"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {unlocked ? <span className={cn(!isCurrent && "grayscale")}>{stage.emoji}</span> : <Lock className="size-4" />}
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

      {/* ── Demo Reset Button ─────────────────────────────────────── */}
      <button
        onClick={handleReset}
        className={cn(
          "mt-6 w-full rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive transition-all duration-300 hover:bg-destructive/20 active:scale-95",
          resetFlash && "scale-95 bg-destructive/30"
        )}
      >
        🔄 Reset Demo Data
      </button>
    </div>
  );
}

