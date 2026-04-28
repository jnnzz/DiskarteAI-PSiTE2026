import { useCallback, useEffect, useRef, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useBudget } from "./useBudget";
import { useAwardXP } from "./useAwardXP";
import {
  KEYS,
  blankProfile,
  uid,
  todayISO,
  type Mission,
  type Profile,
  type Transaction,
  type ChatMessage,
  type SavingsGoal,
  type StoryEvent,
} from "@/lib/storage";
import { defaultMissions } from "@/lib/missions";
import { checkMissionCompletion, type MissionCheckContext } from "@/lib/missionEngine";
import { celebrateMission } from "@/lib/celebrate";
import { toast } from "sonner";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Simplified Mission Engine hook.
 * 
 * - 5 fixed missions, same every day
 * - Daily reset: all missions reset to incomplete at the start of each new day
 * - Auto-completion: watches user behavior and marks missions as achieved
 * - Awards XP + confetti on completion
 */
export function useMissionEngine() {
  const [missions, setMissions] = useLocalStorage<Mission[]>(KEYS.missions, defaultMissions);
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);
  const [chatMessages] = useLocalStorage<ChatMessage[]>(KEYS.chat, []);
  const [goals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const [, setStoryEvents] = useLocalStorage<StoryEvent[]>(KEYS.storyEvents, []);
  const [lastResetDate, setLastResetDate] = useLocalStorage<string>(KEYS.missionMeta, "");

  const budgetData = useBudget();
  const award = useAwardXP();
  // Track budget-check events via a session counter stored in ref
  const budgetChecksRef = useRef(0);

  // ── Daily reset check ───────────────────────────────────────────
  useEffect(() => {
    const today = todayStr();
    if (lastResetDate === today) return;

    // New day — reset all 5 missions
    const fresh = defaultMissions();
    setMissions(fresh);
    setLastResetDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Build check context ──────────────────────────────────────
  const checkCtx: MissionCheckContext = useMemo(() => ({
    transactions,
    budget: budgetData.budget,
    profile,
    chatMessages,
    goals,
    todaySpent: budgetData.todaySpent,
    dailyBudget: budgetData.dailyBudget,
    categorySpent: budgetData.categorySpent,
    budgetChecks: budgetChecksRef.current,
  }), [transactions, budgetData, profile, chatMessages, goals]);

  // ── Auto-completion checker ──────────────────────────────────
  useEffect(() => {
    const activeMissionsList = missions.filter(m => !m.completed);
    if (activeMissionsList.length === 0) return;

    let changed = false;
    const updatedMissions = missions.map(m => {
      if (m.completed) return m;

      // Guard: old-format missions without completionRule
      if (!m.completionRule) return m;

      const { achieved, progress } = checkMissionCompletion(m, checkCtx);

      if (achieved && !m.completed) {
        changed = true;
        // Award XP and celebrate
        setTimeout(() => {
          celebrateMission();
          award(m.xpReward, m.title);

          // Add story event
          setStoryEvents(prev => [...prev, {
            id: uid(),
            type: "achievement" as const,
            title: `Mission Complete: ${m.title}`,
            description: `Na-achieve ang mission! +${m.xpReward} XP earned.`,
            emoji: "🏆",
            date: todayISO(),
            relatedMissionId: m.id,
          }]);
        }, 300);

        return { ...m, completed: true, completedAt: todayISO(), progress };
      }

      // Update progress even if not completed
      if (progress !== (m.progress ?? 0)) {
        changed = true;
        return { ...m, progress };
      }

      return m;
    });

    if (changed) {
      setMissions(updatedMissions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkCtx]);

  // ── Budget check signal ──────────────────────────────────────
  const signalBudgetCheck = useCallback(() => {
    budgetChecksRef.current += 1;
    // Trigger re-check by touching missions
    setMissions(prev => [...prev]);
  }, [setMissions]);

  const activeMissions = useMemo(() => missions.filter(m => !m.completed), [missions]);
  const completedMissions = useMemo(() => missions.filter(m => m.completed), [missions]);

  return {
    missions,
    activeMissions,
    completedMissions,
    signalBudgetCheck,
  };
}
