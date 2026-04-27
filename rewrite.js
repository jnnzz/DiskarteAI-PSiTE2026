const fs = require('fs');
const newContent = \import type { GastosCategory, Profile, SavingsGoal, Transaction } from "./storage";

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? "";

function getGeminiUrl(stream = false): string {
  const model = "gemini-1.5-flash";
  const baseUrl = \\\https://generativelanguage.googleapis.com/v1beta/models/\\\\;
  const method = stream ? "streamGenerateContent?alt=sse" : "generateContent";
  return \\\\:\&key=\\\\;
}

const FALLBACK_TIPS = [
  "Pay yourself first — bago ka gumastos, magtabi muna ng kahit ?20. Maliit, pero tuloy-tuloy.",
  "Subukan ang 24-hour rule: bago bumili ng mahal, hintayin mo ng isang araw. Kung hindi mo na naisip, hindi mo kailangan.",
  "I-track ang lahat ng gastos sa isang linggo. Magugulat ka kung saan napupunta ang ?100s mo.",
  "Maglagay ng emergency fund — kahit ?500 lang muna. Para pag may biglaang gastos, hindi ka mag-uutang.",
];

export async function fetchWeeklyTip(name: string): Promise<string> {
  if (!GEMINI_API_KEY) return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  try {
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: \\\Generate a short, very encouraging financial tip in Tagalog/Taglish for a user named \. Keep it 1-2 positive sentences maximum.\\\ }] }]
      })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
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

export async function streamGabay(
  messages: ChatTurn[],
  context: ChatContext,
  onDelta: (delta: string) => void,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    const fallback = "Pasensya, kaibigan — wala pa akong koneksyon kay Gemini. Magtabi ng ?20 ngayon!";
    onDelta(fallback);
    return fallback;
  }

  const geminiMessages = messages.map(m => ({
    role: m.role === "gabay" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const systemInstruction = \\\You are Gabay, a friendly, encouraging, and highly knowledgeable Filipino financial coach. You speak in casual conversational Taglish. The user is named \. Recent spending: \. Active savings goals: \. Keep answers brief, highly actionable, and extremely motivating.\\\;

  const res = await fetch(getGeminiUrl(true), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: geminiMessages,
      systemInstruction: { parts: [{ text: systemInstruction }] }
    })
  });

  if (!res.ok) throw new Error("Gemini stream failed");

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No reader");
  
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let boundary = buf.indexOf('\\n');
    while (boundary !== -1) {
      const line = buf.slice(0, boundary).trim();
      buf = buf.slice(boundary + 1);
      
      if (line.startsWith("data:")) {
        const payload = line.slice(5).trim();
        if (payload) {
          try {
             const json = JSON.parse(payload);
             const delta = json.candidates?.[0]?.content?.parts?.[0]?.text;
             if (delta) {
               full += delta;
               onDelta(delta);
             }
          } catch(e) {}
        }
      }
      
      boundary = buf.indexOf('\\n');
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
  if (!GEMINI_API_KEY) throw new Error("No Gemini key");

  const match = imageDataUrl.match(/^data:(image\\/[a-zA-Z]+);base64,(.+)\s*$/i);
  if (!match) throw new Error("Invalid image source");
  const mimeType = match[1];
  const base64Data = match[2];

  const prompt = \\\Analyze this receipt image. Return ONLY a valid JSON object matching this exact schema: {"total": number, "items": [{"name": string, "price": number}], "suggestedCategory": string (must be one of "pagkain", "transpo", "bahay", "luho", "iba"), "merchant": string (optional store name)}. No markdown blocks.\\\;

  const res = await fetch(\\\https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\\\\, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }]
    })
  });

  if (!res.ok) throw new Error("Gemini analyze failed");
  const data = await res.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  text = text.replace(/\\\\\\\\\json/g, "").replace(/\\\\\\\\\/g, "").trim();
  
  return JSON.parse(text) as ParsedReceipt;
}

export async function generateKwentoSummary(storyTitle: string, choices: { label: string; lesson?: string }[]): Promise<string> {
  if (!GEMINI_API_KEY) return "Magaling! Ang totoong aral: walang masamang pagpipilian sa pera basta't may plano at may pagmamahal sa pamilya.";
  try {
    const prompt = \\\Give me a short, inspiring, 2 sentence Taglish summary/lesson learned based on the story "\" and the user's choices: \\\\;
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch {
    return "Magaling! Ang totoong aral: walang masamang pagpipilian sa pera basta't may plano at may pagmamahal sa pamilya.";
  }
}

export function buildChatContext(profile: Profile, transactions: Transaction[], goals: SavingsGoal[]): ChatContext {
  return {
    profile: {
      name: profile.name,
      avatarLevel: profile.avatarLevel,
      totalXP: profile.totalXP,
      streak: profile.streak,
    },
    recentGastos: transactions.filter((t) => t.type === "gastos").slice(-10).map((t) => ({ amount: t.amount, category: t.category, note: t.note, date: t.date })),
    activeGoals: goals.filter((g) => !g.completed).map((g) => ({ name: g.name, current: g.currentAmount, target: g.targetAmount })),
  };
}
\;

fs.writeFileSync('src/lib/ai.ts', newContent);
console.log('Successfully written ai.ts');
