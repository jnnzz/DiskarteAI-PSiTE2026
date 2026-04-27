// KabuhayanAI — typed localStorage shapes & helpers.
// Designed to map 1:1 to Postgres tables for future migration.

export type GastosCategory = "kainan" | "transpo" | "bills" | "tindahan" | "iba pa";

export const GASTOS_CATEGORIES: { id: GastosCategory; label: string; emoji: string }[] = [
  { id: "kainan", label: "Kainan", emoji: "🍚" },
  { id: "transpo", label: "Transpo", emoji: "🚌" },
  { id: "bills", label: "Bills", emoji: "💡" },
  { id: "tindahan", label: "Tindahan", emoji: "🛒" },
  { id: "iba pa", label: "Iba pa", emoji: "✨" },
];

export type BadgeId =
  | "first-ipon"
  | "first-gastos"
  | "first-mission"
  | "streak-7"
  | "level-3"
  | "level-5"
  | "goal-completed"
  | "kwento-finisher";

export type AvatarLevel = 1 | 3 | 5 | 10;

export type Profile = {
  id: string;
  name: string;
  avatarLevel: AvatarLevel;
  totalXP: number;
  streak: number;
  lastActiveDate: string;
  badges: BadgeId[];
  createdAt: string;
};

export type Deposit = {
  id: string;
  amount: number;
  date: string;
  note?: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  deposits: Deposit[];
  completed: boolean;
};

export type Transaction = {
  id: string;
  type: "gastos" | "kita";
  amount: number;
  category: GastosCategory;
  note?: string;
  date: string;
  source: "manual" | "receipt-scan";
  receiptId?: string;
};

export type Receipt = {
  id: string;
  imageDataUrl: string;
  scannedAt: string;
  parsedTotal: number;
  parsedItems: { name: string; price: number }[];
  suggestedCategory: GastosCategory;
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: "daily" | "weekly";
  completed: boolean;
  completedAt?: string;
};

export type KwentoProgress = {
  storyId: string;
  currentNodeId: string;
  choicesMade: string[];
  completed: boolean;
  aiSummary?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "gabay";
  content: string;
  timestamp: string;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  avatarVariant: number;
  weeklyXP: number;
  isCurrentUser: boolean;
};

export type TambayanPost = {
  id: string;
  authorName: string;
  authorAvatar: number;
  content: string;
  hearts: number;
  hearted: boolean;
  timestamp: string;
};

export type WeeklyTip = {
  text: string;
  generatedAt: string; // ISO
};

// Storage keys
export const KEYS = {
  profile: "kabuhayan:profile",
  goals: "kabuhayan:goals",
  transactions: "kabuhayan:transactions",
  receipts: "kabuhayan:receipts",
  missions: "kabuhayan:missions",
  kwento: "kabuhayan:kwento",
  chat: "kabuhayan:chat",
  leaderboard: "kabuhayan:leaderboard",
  tambayan: "kabuhayan:tambayan",
  weeklyTip: "kabuhayan:weeklyTip",
  onboarded: "kabuhayan:onboarded",
} as const;

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function todayISO(): string {
  return new Date().toISOString();
}

export function formatPeso(amount: number, withDecimals = false): string {
  const n = Math.round(withDecimals ? amount * 100 : amount) / (withDecimals ? 100 : 1);
  return "₱" + n.toLocaleString("en-PH", {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  });
}

export function blankProfile(): Profile {
  return {
    id: uid(),
    name: "Kaibigan",
    avatarLevel: 1,
    totalXP: 0,
    streak: 0,
    lastActiveDate: todayISO(),
    badges: [],
    createdAt: todayISO(),
  };
}

export function clearAll(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
