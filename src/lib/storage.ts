// DiskarteAI V2 — typed localStorage shapes & helpers.
// Behavior-driven financial coach data model.

export type GastosCategory = "kainan" | "transpo" | "bills" | "tindahan" | "iba pa";

export const GASTOS_CATEGORIES: { id: GastosCategory; label: string; emoji: string }[] = [
  { id: "kainan", label: "Kainan", emoji: "🍚" },
  { id: "transpo", label: "Transpo", emoji: "🚌" },
  { id: "bills", label: "Bills", emoji: "💡" },
  { id: "tindahan", label: "Tindahan", emoji: "🛒" },
  { id: "iba pa", label: "Iba pa", emoji: "✨" },
];

export type AvatarLevel = 1 | 3 | 5 | 10;

export type Language = "tagalog" | "cebuano" | "english";

export type Profile = {
  id: string;
  name: string;
  avatarLevel: AvatarLevel;
  totalXP: number;
  streak: number;
  lastActiveDate: string;
  milestonesReached: number;
  createdAt: string;
  language: Language;
};

// ── Budget ────────────────────────────────────────────────────────
export type Budget = {
  weeklyIncome: number;
  weeklyBudget: number;
  budgetCycle: "weekly" | "monthly";
  categories: Partial<Record<GastosCategory, number>>;
  updatedAt: string;
};

// ── Transactions ──────────────────────────────────────────────────
export type Transaction = {
  id: string;
  type: "gastos" | "kita";
  amount: number;
  category: GastosCategory;
  note?: string;
  date: string;
  source: "manual" | "chat" | "voice";
};

// ── Savings ───────────────────────────────────────────────────────
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

// ── Missions ──────────────────────────────────────────────────────
export type CompletionRuleType =
  | "log-count"           // logged N expenses (today or this week)
  | "expense-under"       // category spending stays under threshold
  | "no-expense-category" // zero spending in category today
  | "budget-check"        // used the spend simulator
  | "chat-used"           // chatted with Gabay
  | "savings-deposit"     // made a savings deposit
  | "stay-under-daily"    // today's total ≤ daily budget
  | "streak";             // maintain N-day streak

export type CompletionRule = {
  type: CompletionRuleType;
  category?: GastosCategory;   // for category-specific rules
  threshold?: number;          // ₱ amount or count target
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: "daily" | "weekly";
  completed: boolean;
  completedAt?: string;
  completionRule: CompletionRule;
  progress?: number;   // current progress toward target
  target?: number;     // numeric target for progress bar
  generatedAt: string; // when this mission was created
  source: "ai" | "fallback"; // who generated it
};

// ── Story Events ──────────────────────────────────────────────────
export type StoryEventType = "milestone" | "warning" | "achievement" | "chapter";

export type StoryEvent = {
  id: string;
  type: StoryEventType;
  title: string;
  description: string;
  emoji: string;
  date: string;
  relatedMissionId?: string;
};

// ── Daily Check-in ────────────────────────────────────────────────
export type DailyCheckin = {
  date: string;          // YYYY-MM-DD
  mood: "good" | "okay" | "tough";
  message: string;       // AI-generated feedback
  budgetRemaining: number;
};

// ── Chat ──────────────────────────────────────────────────────────
export type ChatMessage = {
  id: string;
  role: "user" | "gabay";
  content: string;
  timestamp: string;
};

// ── Payment Reminders ─────────────────────────────────────────────
export type Reminder = {
  id: string;
  title: string;        // e.g. "Tuition Fee"
  amount: number;        // e.g. 500
  dueDate: string;       // YYYY-MM-DD
  note?: string;         // optional extra context
  completed: boolean;    // mark as paid
  createdAt: string;     // ISO timestamp when created
  source: "chat" | "manual";
};

// ── Weekly Tip ────────────────────────────────────────────────────
export type WeeklyTip = {
  text: string;
  generatedAt: string;
};

// ── Storage keys ──────────────────────────────────────────────────
export const KEYS = {
  profile: "diskarte:profile",
  budget: "diskarte:budget",
  transactions: "diskarte:transactions",
  goals: "diskarte:goals",
  missions: "diskarte:missions",
  storyEvents: "diskarte:storyEvents",
  dailyCheckins: "diskarte:dailyCheckins",
  chat: "diskarte:chat",
  weeklyTip: "diskarte:weeklyTip",
  onboarded: "diskarte:onboarded",
  missionMeta: "diskarte:missionMeta",
  reminders: "diskarte:reminders",
} as const;

// ── Helpers ───────────────────────────────────────────────────────
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Returns a local ISO-ish string (YYYY-MM-DDTHH:mm:ss) — NOT UTC.
 *  This ensures dates always align with the user's local calendar. */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function todayDateStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
    milestonesReached: 0,
    createdAt: todayISO(),
    language: "tagalog",
  };
}

export function blankBudget(): Budget {
  return {
    weeklyIncome: 0,
    weeklyBudget: 0,
    budgetCycle: "weekly",
    categories: {},
    updatedAt: todayISO(),
  };
}

export function clearAll(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
