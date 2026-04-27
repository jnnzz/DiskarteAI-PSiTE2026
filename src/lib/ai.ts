// AI client — calls Lovable Cloud edge functions.
// All functions are stateless. The browser holds all user data;
// only request payloads are sent to the cloud.

import type { GastosCategory, Profile, SavingsGoal, Transaction } from "./storage";

// VITE_SUPABASE_URL is provided by Lovable Cloud at build time.
// Falls back gracefully when the cloud isn't enabled (returns sensible defaults).
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";

function fnUrl(name: string): string | null {
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

async function callFn<T>(name: string, body: unknown): Promise<T> {
  const url = fnUrl(name);
  if (!url) throw new Error("AI not configured");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON}`,
      apikey: SUPABASE_ANON,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Edge fn ${name} failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as T;
}

const FALLBACK_TIPS = [
  "Pay yourself first — bago ka gumastos, magtabi muna ng kahit ₱20. Maliit, pero tuloy-tuloy.",
  "Subukan ang 24-hour rule: bago bumili ng mahal, hintayin mo ng isang araw. Kung hindi mo na naisip, hindi mo kailangan.",
  "I-track ang lahat ng gastos sa isang linggo. Magugulat ka kung saan napupunta ang ₱100s mo.",
  "Maglagay ng emergency fund — kahit ₱500 lang muna. Para pag may biglaang gastos, hindi ka mag-uutang.",
];

export async function fetchWeeklyTip(name: string): Promise<string> {
  try {
    const r = await callFn<{ tip: string }>("weekly-tip", { name });
    return r.tip;
  } catch {
    return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  }
}

export type ChatTurn = { role: "user" | "gabay"; content: string };

export type ChatContext = {
  profile: Pick<Profile, "name" | "avatarLevel" | "totalXP" | "streak">;
  recentGastos: { amount: number; category: GastosCategory; note?: string; date: string }[];
  activeGoals: { name: string; current: number; target: number }[];
};

/** Streams Gabay's response chunk-by-chunk via Server-Sent Events from edge fn. */
export async function streamGabay(
  messages: ChatTurn[],
  context: ChatContext,
  onDelta: (delta: string) => void,
): Promise<string> {
  const url = fnUrl("chat");
  if (!url) {
    const fallback =
      "Pasensya, kaibigan — wala pa akong koneksyon. Pero alam mo kung ano ang gagawin: magtabi ng kahit ₱20 ngayon, pagdating ng kita. Magsisimula tayo doon!";
    onDelta(fallback);
    return fallback;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON}`,
      apikey: SUPABASE_ANON,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`chat failed: ${res.status}`);
  }

  // Stream parser: handles OpenAI-compatible SSE chunks
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch {
        /* ignore */
      }
    }
  }
  return full;
}

export type ParsedReceipt = {
  total: number;
  items: { name: string; price: number }[];
  suggestedCategory: GastosCategory;
  merchant?: string;
};

export async function analyzeReceipt(imageDataUrl: string): Promise<ParsedReceipt> {
  return callFn<ParsedReceipt>("analyze-receipt", { image: imageDataUrl });
}

export async function generateKwentoSummary(
  storyTitle: string,
  choices: { label: string; lesson?: string }[],
): Promise<string> {
  try {
    const r = await callFn<{ summary: string }>("generate-kwento", {
      storyTitle,
      choices,
    });
    return r.summary;
  } catch {
    return "Magaling! Ang totoong aral: walang masamang pagpipilian sa pera basta't may plano at may pagmamahal sa pamilya. Tuloy-tuloy lang sa pag-aaral.";
  }
}

// Helper to build a compact context from current state
export function buildChatContext(
  profile: Profile,
  transactions: Transaction[],
  goals: SavingsGoal[],
): ChatContext {
  return {
    profile: {
      name: profile.name,
      avatarLevel: profile.avatarLevel,
      totalXP: profile.totalXP,
      streak: profile.streak,
    },
    recentGastos: transactions
      .filter((t) => t.type === "gastos")
      .slice(-10)
      .map((t) => ({ amount: t.amount, category: t.category, note: t.note, date: t.date })),
    activeGoals: goals
      .filter((g) => !g.completed)
      .map((g) => ({ name: g.name, current: g.currentAmount, target: g.targetAmount })),
  };
}
