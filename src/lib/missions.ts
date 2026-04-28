import { uid, todayISO, type Mission } from "./storage";

// ── The 5 Fixed Missions ──────────────────────────────────────────
// These are the only missions in the app. They reset daily so
// users can earn XP every day by performing core financial habits.

type MissionTemplate = Omit<Mission, "id" | "completed" | "completedAt" | "progress" | "generatedAt">;

const FIXED_MISSIONS: MissionTemplate[] = [
  {
    title: "Mag-log ng gastos ngayon",
    description: "I-track ang kahit isang gastos mo ngayong araw. Consistency is key!",
    xpReward: 15,
    type: "daily",
    completionRule: { type: "log-count", threshold: 1 },
    target: 1,
    source: "fallback",
  },
  {
    title: "Huwag lumampas sa daily budget",
    description: "Subukang huwag lumampas sa daily budget mo ngayon. Self-discipline!",
    xpReward: 25,
    type: "daily",
    completionRule: { type: "stay-under-daily" },
    source: "fallback",
  },
  {
    title: "Kausapin si Gabay",
    description: "Magtanong tungkol sa pera o gastos kay Gabay AI. Libre ang advice 24/7!",
    xpReward: 15,
    type: "daily",
    completionRule: { type: "chat-used" },
    source: "fallback",
  },
  {
    title: "I-check ang budget bago bumili",
    description: "Gamitin ang 'Before You Spend' simulator bago bumili ng kahit ano.",
    xpReward: 20,
    type: "daily",
    completionRule: { type: "budget-check" },
    source: "fallback",
  },
  {
    title: "Mag-ipon kahit magkano",
    description: "Mag-deposit sa kahit anong savings goal. Kahit maliit, malaki ang tulong!",
    xpReward: 30,
    type: "daily",
    completionRule: { type: "savings-deposit" },
    source: "fallback",
  },
];

/** Build fresh Mission instances from the fixed templates */
function createFreshMissions(): Mission[] {
  return FIXED_MISSIONS.map(t => ({
    ...t,
    id: uid(),
    completed: false,
    progress: 0,
    generatedAt: todayISO(),
  }));
}

/**
 * Generate the 5 fixed missions (fallback-compatible API).
 */
export function generateFallbackMissions(): Mission[] {
  return createFreshMissions();
}

/**
 * Default missions — returns the 5 fixed missions.
 */
export function defaultMissions(): Mission[] {
  return createFreshMissions();
}

// ── Negosyante Journey Stages ───────────────────────────────────────
export type NegosyanteStage = {
  level: number;
  title: string;
  emoji: string;
  description: string;
  xpRequired: number;
};

export const NEGOSYANTE_STAGES: NegosyanteStage[] = [
  {
    level: 1,
    title: "Baguhan",
    emoji: "🌱",
    description: "Nagsisimula ka pa lang. Matuto sa pag-track ng gastos at pag-ipon.",
    xpRequired: 0,
  },
  {
    level: 2,
    title: "Magsasaka",
    emoji: "🌾",
    description: "Natutunan mo na ang basics. Consistent ka na sa pag-track!",
    xpRequired: 100,
  },
  {
    level: 3,
    title: "Tindera/Tindero",
    emoji: "🏪",
    description: "May sarili ka nang savings at naiintindihan ang gastos.",
    xpRequired: 250,
  },
  {
    level: 4,
    title: "Sari-sari Storeowner",
    emoji: "🛒",
    description: "Budget-conscious ka na at may growing savings!",
    xpRequired: 500,
  },
  {
    level: 5,
    title: "Negosyante",
    emoji: "💼",
    description: "Ikaw ang inspirasyon ng komunidad. Master ng budget!",
    xpRequired: 1000,
  },
  {
    level: 6,
    title: "Lider ng Barangay",
    emoji: "⭐",
    description: "Financial champion ng iyong komunidad!",
    xpRequired: 1750,
  },
];
