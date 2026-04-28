import {
  KEYS,
  type Profile,
  type Budget,
  type SavingsGoal,
  type Transaction,
  type Mission,
  type StoryEvent,
  type DailyCheckin,
  type ChatMessage,
  todayISO,
  todayDateStr,
  uid,
} from "./storage";
import { broadcastStorageChange } from "@/hooks/useLocalStorage";
import { defaultMissions } from "./missions";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function dateStrAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function seedDemo(): void {
  const profile: Profile = {
    id: uid(),
    name: "Maria",
    avatarLevel: 3,
    totalXP: 320,
    streak: 5,
    lastActiveDate: todayISO(),
    milestonesReached: 4,
    createdAt: daysAgo(28),
    language: "tagalog",
  };

  const budget: Budget = {
    weeklyIncome: 5000,
    weeklyBudget: 3500,
    categories: {
      kainan: 1200,
      transpo: 500,
      bills: 800,
      tindahan: 700,
      "iba pa": 300,
    },
    updatedAt: daysAgo(7),
  };

  const goals: SavingsGoal[] = [
    {
      id: uid(),
      name: "Tuition ni Junjun",
      targetAmount: 5000,
      currentAmount: 2400,
      deadline: daysFromNow(45),
      completed: false,
      deposits: [
        { id: uid(), amount: 500, date: daysAgo(20), note: "First deposit" },
        { id: uid(), amount: 800, date: daysAgo(13), note: "Tindahan extra" },
        { id: uid(), amount: 600, date: daysAgo(6) },
        { id: uid(), amount: 500, date: daysAgo(1), note: "Sunday savings" },
      ],
    },
    {
      id: uid(),
      name: "Emergency Fund",
      targetAmount: 3000,
      currentAmount: 850,
      deadline: daysFromNow(90),
      completed: false,
      deposits: [
        { id: uid(), amount: 350, date: daysAgo(15) },
        { id: uid(), amount: 500, date: daysAgo(4) },
      ],
    },
  ];

  const transactions: Transaction[] = [
    { id: uid(), type: "gastos", amount: 247, category: "kainan", note: "Lunch sa karinderya", date: daysAgo(0), source: "manual" },
    { id: uid(), type: "gastos", amount: 80, category: "transpo", note: "Jeep + tricycle", date: daysAgo(0), source: "manual" },
    { id: uid(), type: "gastos", amount: 1250, category: "tindahan", note: "Restock noodles + softdrinks", date: daysAgo(1), source: "manual" },
    { id: uid(), type: "gastos", amount: 320, category: "kainan", date: daysAgo(1), source: "manual" },
    { id: uid(), type: "gastos", amount: 65, category: "transpo", date: daysAgo(2), source: "manual" },
    { id: uid(), type: "gastos", amount: 195, category: "kainan", date: daysAgo(3), source: "manual" },
    { id: uid(), type: "gastos", amount: 90, category: "iba pa", note: "Load", date: daysAgo(4), source: "manual" },
    { id: uid(), type: "gastos", amount: 410, category: "kainan", date: daysAgo(5), source: "manual" },
    { id: uid(), type: "gastos", amount: 75, category: "transpo", date: daysAgo(5), source: "manual" },
  ];

  const missions: Mission[] = defaultMissions().map((m, i) =>
    i < 2 ? { ...m, completed: true, completedAt: daysAgo(1) } : m,
  );

  const storyEvents: StoryEvent[] = [
    {
      id: uid(),
      type: "chapter",
      title: "Simula ng Paglalakbay",
      description: "Sinimulan ni Maria ang kanyang financial journey. Unang araw ng pag-track ng gastos.",
      emoji: "🌱",
      date: daysAgo(28),
    },
    {
      id: uid(),
      type: "achievement",
      title: "Unang Ipon!",
      description: "Naglagay ng unang ₱500 sa tuition fund ni Junjun. Maliit na hakbang, malaking pangarap.",
      emoji: "💰",
      date: daysAgo(20),
    },
    {
      id: uid(),
      type: "milestone",
      title: "3-Day Streak!",
      description: "Tatlong araw na sunod-sunod na nag-log ng gastos. Naging ugali na!",
      emoji: "🔥",
      date: daysAgo(14),
    },
    {
      id: uid(),
      type: "warning",
      title: "Mahigpit na Linggo",
      description: "Halos lumampas sa weekly budget dahil sa bills. Pero nakayanan pa rin!",
      emoji: "⚡",
      date: daysAgo(7),
    },
    {
      id: uid(),
      type: "achievement",
      title: "Level Up: Tindera!",
      description: "Naabot ang 250 XP at naging Tindera/Tindero sa Negosyante Journey!",
      emoji: "🏪",
      date: daysAgo(3),
    },
  ];

  const dailyCheckins: DailyCheckin[] = [
    {
      date: dateStrAgo(1),
      mood: "okay",
      message: "Medyo mataas ang gastos kahapon pero kaya pa. Tuloy lang!",
      budgetRemaining: 1200,
    },
    {
      date: dateStrAgo(0),
      mood: "good",
      message: "Magandang umaga, Maria! Mas mababa ang gastos mo ngayon kumpara kahapon. Keep it up! ✨",
      budgetRemaining: 873,
    },
  ];

  const chat: ChatMessage[] = [
    {
      id: uid(),
      role: "user",
      content: "Gabay, kaya ko bang bumili ng milk tea ngayon?",
      timestamp: daysAgo(1),
    },
    {
      id: uid(),
      role: "gabay",
      content: "Hmm, Maria — ₱120 ang milk tea. Sa ngayon meron ka pang ₱1,200 sa budget this week. Kaya pa naman! Pero tandaan, 3 araw pa bago mag-reset ang weekly budget. Kung madalas ka bumili nito, baka gusto mong i-limit sa 2x per week? 🧋💛",
      timestamp: daysAgo(1),
    },
  ];

  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  localStorage.setItem(KEYS.budget, JSON.stringify(budget));
  localStorage.setItem(KEYS.goals, JSON.stringify(goals));
  localStorage.setItem(KEYS.transactions, JSON.stringify(transactions));
  localStorage.setItem(KEYS.missions, JSON.stringify(missions));
  localStorage.setItem(KEYS.storyEvents, JSON.stringify(storyEvents));
  localStorage.setItem(KEYS.dailyCheckins, JSON.stringify(dailyCheckins));
  localStorage.setItem(KEYS.chat, JSON.stringify(chat));
  localStorage.setItem(KEYS.onboarded, "true");

  broadcastStorageChange();
}

export function seedFresh(name: string, weeklyBudget: number): void {
  const profile: Profile = {
    id: uid(),
    name: name || "Kaibigan",
    avatarLevel: 1,
    totalXP: 0,
    streak: 0,
    lastActiveDate: todayISO(),
    milestonesReached: 0,
    createdAt: todayISO(),
    language: "tagalog",
  };

  const budget: Budget = {
    weeklyIncome: weeklyBudget,
    weeklyBudget: weeklyBudget,
    categories: {},
    updatedAt: todayISO(),
  };

  const firstEvent: StoryEvent = {
    id: uid(),
    type: "chapter",
    title: "Simula ng Paglalakbay",
    description: `Sinimulan ni ${name || "Kaibigan"} ang kanyang financial journey. Ang unang hakbang sa mas magandang buhay.`,
    emoji: "🌱",
    date: todayISO(),
  };

  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  localStorage.setItem(KEYS.budget, JSON.stringify(budget));
  localStorage.setItem(KEYS.goals, JSON.stringify([]));
  localStorage.setItem(KEYS.transactions, JSON.stringify([]));
  localStorage.setItem(KEYS.missions, JSON.stringify(defaultMissions()));
  localStorage.setItem(KEYS.storyEvents, JSON.stringify([firstEvent]));
  localStorage.setItem(KEYS.dailyCheckins, JSON.stringify([]));
  localStorage.setItem(KEYS.chat, JSON.stringify([]));
  localStorage.setItem(KEYS.onboarded, "true");

  broadcastStorageChange();
}
