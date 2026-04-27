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
  | "kwento-finisher"
  | "loan-payment"
  | "paluwagan-member"
  | "voucher-redeemed";

export type AvatarLevel = 1 | 3 | 5 | 10;

export type Language = "tagalog" | "cebuano" | "english";

export type Profile = {
  id: string;
  name: string;
  avatarLevel: AvatarLevel;
  totalXP: number;
  rewardPoints: number;
  streak: number;
  lastActiveDate: string;
  badges: BadgeId[];
  createdAt: string;
  language: Language;
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
  aiPlan?: string; // AI-generated savings plan
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
  trigger?: "deposit" | "scan" | "chat" | "loan-payment" | "manual";
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

// ── NEW: Loan Payments ─────────────────────────────────────────────
export type LoanPayment = {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  onTime: boolean;
  note?: string;
  loanType: string; // e.g. "Micro-loan", "Group Loan"
};

// ── NEW: Paluwagan (Digital Rotating Savings Group) ────────────────
export type PaluwagaGroup = {
  id: string;
  name: string;
  contributionAmount: number;
  frequency: "weekly" | "monthly";
  members: PaluwagaMember[];
  currentRound: number;
  totalRounds: number;
  startDate: string;
  completed: boolean;
  inviteCode: string;
};

export type PaluwagaMember = {
  id: string;
  name: string;
  isCurrentUser: boolean;
  payoutOrder: number;
  contributions: PaluwagaContribution[];
};

export type PaluwagaContribution = {
  id: string;
  round: number;
  amount: number;
  paidDate?: string;
  paid: boolean;
};

// ── NEW: Rewards / Vouchers ────────────────────────────────────────
export type Voucher = {
  id: string;
  title: string;
  description: string;
  partner: string;
  pointsCost: number;
  category: "food" | "load" | "discount" | "transport" | "business";
  emoji: string;
  expiresAt?: string;
  redeemed?: boolean;
  redeemedAt?: string;
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
  loanPayments: "kabuhayan:loanPayments",
  paluwagan: "kabuhayan:paluwagan",
  vouchers: "kabuhayan:vouchers",
  creditNarrative: "kabuhayan:creditNarrative",
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
    rewardPoints: 0,
    streak: 0,
    lastActiveDate: todayISO(),
    badges: [],
    createdAt: todayISO(),
    language: "tagalog",
  };
}

export function clearAll(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

// ── Mock voucher catalog ───────────────────────────────────────────
export const VOUCHER_CATALOG: Voucher[] = [
  {
    id: "v1",
    title: "₱20 GCash Load",
    description: "Libreng load sa GCash, pwede ring ibigay sa iba.",
    partner: "GCash",
    pointsCost: 200,
    category: "load",
    emoji: "📱",
  },
  {
    id: "v2",
    title: "Libre na Kape",
    description: "Isang libre na kape sa alinmang RAFI partner café sa Cebu.",
    partner: "RAFI Partner Café",
    pointsCost: 150,
    category: "food",
    emoji: "☕",
  },
  {
    id: "v3",
    title: "10% Diskwento sa Sari-sari Store",
    description: "10% off sa susunod na pagbili sa partner sari-sari stores.",
    partner: "RAFI MSME Partners",
    pointsCost: 100,
    category: "discount",
    emoji: "🏪",
  },
  {
    id: "v4",
    title: "₱50 Jeepney e-Discount",
    description: "₱50 off sa eBayad jeepney load sa partner terminals.",
    partner: "eBayad",
    pointsCost: 300,
    category: "transport",
    emoji: "🚌",
  },
  {
    id: "v5",
    title: "Libre na Business Planning Kit",
    description: "Digital negosyo starter kit para sa iyong sari-sari store.",
    partner: "RAFI MFI",
    pointsCost: 500,
    category: "business",
    emoji: "📦",
  },
  {
    id: "v6",
    title: "₱100 Palengke Voucher",
    description: "₱100 credit sa partner palengke stores sa Cebu.",
    partner: "RAFI Partner Markets",
    pointsCost: 400,
    category: "food",
    emoji: "🥬",
  },
];
