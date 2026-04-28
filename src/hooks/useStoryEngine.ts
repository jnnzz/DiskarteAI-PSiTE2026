import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  KEYS,
  uid,
  todayISO,
  blankProfile,
  type Profile,
  type StoryEvent,
  type Transaction,
} from "@/lib/storage";

/**
 * The story / streak hook.
 * Handles streak updates and story event generation.
 * Mission auto-completion is now handled by useMissionEngine.
 */
export function useStoryEngine() {
  const [profile, setProfile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [storyEvents, setStoryEvents] = useLocalStorage<StoryEvent[]>(KEYS.storyEvents, []);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);

  /** Call after an expense is logged */
  const onExpenseLogged = useCallback(() => {
    // 1. Update streak
    const today = new Date().toISOString().slice(0, 10);
    const lastActive = profile.lastActiveDate?.slice(0, 10);
    if (lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive = lastActive === yesterday.toISOString().slice(0, 10);
      setProfile(p => ({
        ...p,
        streak: isConsecutive ? p.streak + 1 : 1,
        lastActiveDate: todayISO(),
      }));
    }

    // 2. Check for milestone story events
    const txCount = transactions.length + 1; // +1 for the one just added
    const milestones = [
      { count: 1, title: "Unang Gastos", desc: "Na-log ang unang gastos! Ang pag-track ng gastos ang simula ng pagbabago.", emoji: "📝" },
      { count: 10, title: "10 Transactions!", desc: "Sampung gastos na ang na-track. Naging ugali na ang pag-record!", emoji: "🔥" },
      { count: 25, title: "Quarter Century", desc: "25 na transactions! Talagang dedicated sa pag-track.", emoji: "🌟" },
      { count: 50, title: "Half-Century Hero", desc: "50 transactions na-track. Isa ka nang expense tracking master!", emoji: "🏆" },
    ];

    for (const ms of milestones) {
      if (txCount === ms.count) {
        const exists = storyEvents.some(e => e.title === ms.title);
        if (!exists) {
          setStoryEvents(prev => [...prev, {
            id: uid(),
            type: "achievement" as const,
            title: ms.title,
            description: ms.desc,
            emoji: ms.emoji,
            date: todayISO(),
          }]);
          setProfile(p => ({ ...p, milestonesReached: p.milestonesReached + 1 }));
        }
      }
    }
  }, [profile, transactions, storyEvents, setProfile, setStoryEvents]);

  /** Call after a budget check / simulation (now just for story, not missions) */
  const onBudgetChecked = useCallback(() => {
    // Missions are handled by useMissionEngine, this is just for story/logging
  }, []);

  /** Call after chatting with Gabay (now just for story, not missions) */
  const onChatUsed = useCallback(() => {
    // Missions are handled by useMissionEngine
  }, []);

  /** Call after making a savings deposit */
  const onSavingsDeposit = useCallback((amount: number) => {
    // Story event for savings milestones
    setStoryEvents(prev => [...prev, {
      id: uid(),
      type: "achievement" as const,
      title: "Nag-ipon!",
      description: `Nagdagdag ng ₱${amount.toLocaleString()} sa savings. Bawat piso, isang hakbang sa pangarap!`,
      emoji: "💰",
      date: todayISO(),
    }]);
  }, [setStoryEvents]);

  /** Add a custom story event */
  const addStoryEvent = useCallback((event: Omit<StoryEvent, "id" | "date">) => {
    setStoryEvents(prev => [...prev, {
      ...event,
      id: uid(),
      date: todayISO(),
    }]);
  }, [setStoryEvents]);

  return {
    onExpenseLogged,
    onBudgetChecked,
    onChatUsed,
    onSavingsDeposit,
    addStoryEvent,
  };
}
