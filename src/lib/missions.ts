import { uid, type Mission } from "./storage";

export function defaultMissions(): Mission[] {
  return [
    {
      id: uid(),
      title: "Mag-log ng 3 araw na gastos",
      description: "I-track mo ang gastos mo sa tatlong magkakasunod na araw. Ayon sa RAFI, ang expense tracking ang unang hakbang sa financial health.",
      xpReward: 30,
      type: "daily",
      completed: false,
      trigger: "manual",
    },
    {
      id: uid(),
      title: "Mag-ipon ng ₱100 ngayong linggo",
      description: "Idagdag sa kahit anong savings goal. Kahit maliit, ang ugali ng pag-ipon ang mahalaga para maging eligible sa RAFI micro-savings.",
      xpReward: 50,
      type: "weekly",
      completed: false,
      trigger: "deposit",
    },
    {
      id: uid(),
      title: "Tapusin ang isang Kwento ng Pera",
      description: "Magbasa at pumili ng landas sa kahit isang interactive na istorya. Bahagi ito ng RAFI Capacity Building training.",
      xpReward: 20,
      type: "weekly",
      completed: false,
      trigger: "manual",
    },
    {
      id: uid(),
      title: "Mag-scan ng resibo",
      description: "Subukan ang Gastos Analyzer — i-scan ang isang resibo gamit ang AI. Mas madaling mag-track ng gastos para sa iyong RAFI loan renewal.",
      xpReward: 25,
      type: "daily",
      completed: false,
      trigger: "scan",
    },
    {
      id: uid(),
      title: "Magtanong kay Gabay",
      description: "Magtanong tungkol sa pera, RAFI loans, o ipon kay Gabay AI. Libre at available 24/7.",
      xpReward: 15,
      type: "daily",
      completed: false,
      trigger: "chat",
    },
    {
      id: uid(),
      title: "Mag-set ng savings goal",
      description: "Maglagay ng pangarap — tuition, gadget, o emergency fund. Ang may goals ay mas malamang maaprubahan sa RAFI loan renewal.",
      xpReward: 20,
      type: "weekly",
      completed: false,
      trigger: "manual",
    },
    {
      id: uid(),
      title: "Mag-log ng loan payment",
      description: "I-record ang iyong RAFI loan payment sa Kwento ng Pera. Ang on-time payment ay nagpapataas ng iyong Loan Readiness Score.",
      xpReward: 40,
      type: "weekly",
      completed: false,
      trigger: "loan-payment",
    },
    {
      id: uid(),
      title: "Save ₱50 for 7 days straight",
      description: "I-deposit ng ₱50 o higit pa sa loob ng 7 magkakasunod na araw. Weekly challenge — kumita ng bonus XP at Kabuhayan Points!",
      xpReward: 100,
      type: "weekly",
      completed: false,
      trigger: "deposit",
    },
  ];
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
    description: "Natutunan mo na ang basics. Mag-set ng unang savings goal!",
    xpRequired: 100,
  },
  {
    level: 3,
    title: "Tindera/Tindero",
    emoji: "🏪",
    description: "May sarili ka nang savings at naiintindihan ang gastos. Subukan ang RAFI micro-loan!",
    xpRequired: 250,
  },
  {
    level: 4,
    title: "Sari-sari Storeowner",
    emoji: "🛒",
    description: "May negosyo ka na! Palaguin pa lalo gamit ang RAFI Kabuhayan loan.",
    xpRequired: 500,
  },
  {
    level: 5,
    title: "Negosyante",
    emoji: "💼",
    description: "Ikaw ang inspirasyon ng komunidad. Tulungan ang iba sa RAFI Tambayan!",
    xpRequired: 1000,
  },
  {
    level: 6,
    title: "Lider ng Barangay",
    emoji: "⭐",
    description: "Financial champion ng iyong komunidad. RAFI Loyalty Member ka na!",
    xpRequired: 1750,
  },
];
