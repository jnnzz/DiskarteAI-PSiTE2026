import {
  KEYS,
  type Profile,
  type SavingsGoal,
  type Transaction,
  type Mission,
  type LeaderboardEntry,
  type TambayanPost,
  type ChatMessage,
  todayISO,
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

export function seedDemo(): void {
  const profile: Profile = {
    id: uid(),
    name: "Maria",
    avatarLevel: 3,
    totalXP: 320, // Level 3
    streak: 5,
    lastActiveDate: todayISO(),
    badges: ["first-ipon", "first-gastos", "first-mission", "level-3"],
    createdAt: daysAgo(28),
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
    { id: uid(), type: "gastos", amount: 1480, category: "bills", note: "Meralco", date: daysAgo(3), source: "manual" },
    { id: uid(), type: "gastos", amount: 195, category: "kainan", date: daysAgo(3), source: "manual" },
    { id: uid(), type: "gastos", amount: 90, category: "iba pa", note: "Load", date: daysAgo(4), source: "manual" },
    { id: uid(), type: "gastos", amount: 410, category: "kainan", date: daysAgo(5), source: "manual" },
    { id: uid(), type: "gastos", amount: 75, category: "transpo", date: daysAgo(5), source: "manual" },
    { id: uid(), type: "gastos", amount: 2300, category: "tindahan", note: "Bigas + ulam supplies", date: daysAgo(6), source: "manual" },
    { id: uid(), type: "gastos", amount: 180, category: "kainan", date: daysAgo(6), source: "manual" },
  ];

  // Pre-complete 2 missions
  const missions: Mission[] = defaultMissions().map((m, i) =>
    i < 2 ? { ...m, completed: true, completedAt: daysAgo(1) } : m,
  );

  const leaderboard: LeaderboardEntry[] = [
    { id: uid(), name: "Aling Nena", avatarVariant: 5, weeklyXP: 480, isCurrentUser: false },
    { id: uid(), name: "Kuya Jun", avatarVariant: 5, weeklyXP: 410, isCurrentUser: false },
    { id: uid(), name: "Tita Beth", avatarVariant: 3, weeklyXP: 360, isCurrentUser: false },
    { id: profile.id, name: "Maria (ikaw)", avatarVariant: 3, weeklyXP: 320, isCurrentUser: true },
    { id: uid(), name: "Mang Tonyo", avatarVariant: 3, weeklyXP: 280, isCurrentUser: false },
    { id: uid(), name: "Ate Cris", avatarVariant: 1, weeklyXP: 220, isCurrentUser: false },
    { id: uid(), name: "Kuya Boy", avatarVariant: 1, weeklyXP: 180, isCurrentUser: false },
    { id: uid(), name: "Lola Pacing", avatarVariant: 5, weeklyXP: 140, isCurrentUser: false },
  ];

  const tambayan: TambayanPost[] = [
    {
      id: uid(),
      authorName: "Aling Nena",
      authorAvatar: 5,
      content: "Tip ko sa mga kasamahang tindera: maglagay kayo ng ₱20 araw-araw sa hiwalay na lata. Sa katapusan ng buwan, ₱600 na yan — pang-restock o pang-emergency!",
      hearts: 47,
      hearted: false,
      timestamp: daysAgo(1),
    },
    {
      id: uid(),
      authorName: "Kuya Jun",
      authorAvatar: 5,
      content: "Tanong lang po — sino dito nakapag-ipon ng emergency fund kahit OFW dependent? Paano niyo ginawa?",
      hearts: 23,
      hearted: false,
      timestamp: daysAgo(2),
    },
    {
      id: uid(),
      authorName: "Tita Beth",
      authorAvatar: 3,
      content: "Natapos ko na yung tuition goal ko! 3 buwan lang, ₱8,000 na-ipon. Salamat sa Gabay AI sa daily tips. 🥹",
      hearts: 89,
      hearted: true,
      timestamp: daysAgo(3),
    },
    {
      id: uid(),
      authorName: "Mang Tonyo",
      authorAvatar: 3,
      content: "Driver ako ng jeep. Dati lahat ng kita, ubos. Ngayon, may ₱50/araw na tinatabi para sa anak ko sa college. Mahirap pero kaya.",
      hearts: 134,
      hearted: false,
      timestamp: daysAgo(4),
    },
    {
      id: uid(),
      authorName: "Ate Cris",
      authorAvatar: 1,
      content: "Kabago lang dito. Saan magsisimula? May suggestions po ba kayo?",
      hearts: 12,
      hearted: false,
      timestamp: daysAgo(5),
    },
  ];

  const chat: ChatMessage[] = [
    {
      id: uid(),
      role: "user",
      content: "Gabay, paano ako makakapag-ipon kahit ₱200 lang ang sobra ko per week?",
      timestamp: daysAgo(2),
    },
    {
      id: uid(),
      role: "gabay",
      content: "Ay grabe, Maria — laking bagay na yang ₱200 per week! 'Yan ay ₱10,400 sa isang taon. Gawin natin ganito: ilagay mo agad sa hiwalay na bote o bank account pagdating ng sobra, bago mo pa magamit. 'Yung sinasabi nilang 'pay yourself first.' Try mo for one month, sabihin mo sakin paano!",
      timestamp: daysAgo(2),
    },
  ];

  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  localStorage.setItem(KEYS.goals, JSON.stringify(goals));
  localStorage.setItem(KEYS.transactions, JSON.stringify(transactions));
  localStorage.setItem(KEYS.missions, JSON.stringify(missions));
  localStorage.setItem(KEYS.leaderboard, JSON.stringify(leaderboard));
  localStorage.setItem(KEYS.tambayan, JSON.stringify(tambayan));
  localStorage.setItem(KEYS.chat, JSON.stringify(chat));
  localStorage.setItem(KEYS.kwento, JSON.stringify([]));
  localStorage.setItem(KEYS.receipts, JSON.stringify([]));
  localStorage.setItem(KEYS.onboarded, "true");

  broadcastStorageChange();
}

export function seedFresh(): void {
  const profile: Profile = {
    id: uid(),
    name: "Kaibigan",
    avatarLevel: 1,
    totalXP: 0,
    streak: 0,
    lastActiveDate: todayISO(),
    badges: [],
    createdAt: todayISO(),
  };

  const blankLb: LeaderboardEntry[] = [
    { id: uid(), name: "Aling Nena", avatarVariant: 5, weeklyXP: 480, isCurrentUser: false },
    { id: uid(), name: "Kuya Jun", avatarVariant: 5, weeklyXP: 410, isCurrentUser: false },
    { id: uid(), name: "Tita Beth", avatarVariant: 3, weeklyXP: 360, isCurrentUser: false },
    { id: uid(), name: "Mang Tonyo", avatarVariant: 3, weeklyXP: 280, isCurrentUser: false },
    { id: uid(), name: "Ate Cris", avatarVariant: 1, weeklyXP: 220, isCurrentUser: false },
    { id: profile.id, name: "Ikaw", avatarVariant: 1, weeklyXP: 0, isCurrentUser: true },
  ];

  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  localStorage.setItem(KEYS.goals, JSON.stringify([]));
  localStorage.setItem(KEYS.transactions, JSON.stringify([]));
  localStorage.setItem(KEYS.missions, JSON.stringify(defaultMissions()));
  localStorage.setItem(KEYS.leaderboard, JSON.stringify(blankLb));
  localStorage.setItem(KEYS.tambayan, JSON.stringify([]));
  localStorage.setItem(KEYS.chat, JSON.stringify([]));
  localStorage.setItem(KEYS.kwento, JSON.stringify([]));
  localStorage.setItem(KEYS.receipts, JSON.stringify([]));
  localStorage.setItem(KEYS.onboarded, "true");

  broadcastStorageChange();
}
