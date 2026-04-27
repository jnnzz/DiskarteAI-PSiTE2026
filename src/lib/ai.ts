import type { GastosCategory, Language, Profile, SavingsGoal, Transaction, LoanPayment } from "./storage";

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? "";

function getGeminiUrl(stream = false): string {
  const model = "gemini-2.5-flash";
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;
  const method = stream ? "streamGenerateContent?alt=sse" : "generateContent";
  return `${baseUrl}:${method}&key=${GEMINI_API_KEY}`;
}

const FALLBACK_TIPS = [
  "Pay yourself first — bago ka gumastos, magtabi muna ng kahit ₱20. Maliit, pero tuloy-tuloy.",
  "Subukan ang 24-hour rule: bago bumili ng mahal, hintayin mo ng isang araw. Kung hindi mo na naisip, hindi mo kailangan.",
  "I-track ang lahat ng gastos sa isang linggo. Magugulat ka kung saan napupunta ang ₱100s mo.",
  "Maglagay ng emergency fund — kahit ₱500 lang muna. Para pag may biglaang gastos, hindi ka mag-uutang.",
];

function langInstruction(lang: Language): string {
  if (lang === "cebuano") return "You MUST respond in Cebuano (Bisaya). Keep it casual and warm.";
  if (lang === "english") return "Respond in clear, friendly English.";
  return "Respond in casual conversational Taglish (Filipino/English mix).";
}

export async function fetchWeeklyTip(name: string, lang: Language = "tagalog"): Promise<string> {
  if (!GEMINI_API_KEY) return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  try {
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate a short, very encouraging financial savings tip for a user named ${name}. Keep it 1-2 positive sentences maximum. ${langInstruction(lang)}` }] }]
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
  language: Language;
};

// ── RAFI knowledge base injected into Gabay system prompt ──────────
const RAFI_KNOWLEDGE = `
You are Gabay, the AI financial coach of the KabuhayanAI app from RAFI MFI (Ramon Aboitiz Foundation, Inc. - Micro Finance). 

RAFI MFI KNOWLEDGE BASE:
- RAFI MFI provides micro-loans to low-income entrepreneurs primarily in Cebu, Philippines.
- Loan types: Individual Micro-loans (₱5,000–₱150,000), Group Loans (Samahan/Solidarity Groups), Kabuhayan Loans for livelihood/sari-sari store capital.
- Loan terms: 4–12 months. Repayment: weekly, bi-weekly, or monthly.
- Interest: Declining balance method. Typical effective rate ~2-3% per month.
- For MISSED PAYMENTS: advise client to call RAFI office immediately, ask for restructuring, never ignore.
- RAFI Insurance: CLIMBS Life Insurance covers loan balance upon death. CARD MBA offers health and accident coverage.
- INSURANCE CLAIMS: Submit death certificate + loan documents to nearest RAFI branch within 60 days.
- Kabuhayan Points (KabuhayanAI): Earned from savings, on-time loan payments, and completing financial education modules. Redeemable for vouchers from local MSME partners.
- RAFI offices: Cebu main branches. For nearest branch: call 032-232-1281.
- Savings products: RAFI encourages micro-savings alongside loan repayment.
`;

export async function streamGabay(
  messages: ChatTurn[],
  context: ChatContext,
  onDelta: (delta: string) => void,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    const fallback = "Pasensya, kaibigan — wala pa akong koneksyon kay Gemini. Magtabi ng ₱20 ngayon!";
    onDelta(fallback);
    return fallback;
  }

  const geminiMessages = messages.map(m => ({
    role: m.role === "gabay" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const systemInstruction = `${RAFI_KNOWLEDGE}
The user is named ${context.profile.name}. 
Recent spending: ${JSON.stringify(context.recentGastos)}.
Active savings goals: ${JSON.stringify(context.activeGoals)}.
${langInstruction(context.language)}
Keep answers brief, highly actionable, and extremely motivating. Use emojis occasionally.`;

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
    
    let boundary = buf.indexOf('\n');
    while (boundary !== -1) {
      const line = buf.slice(0, boundary).trim();
      buf = buf.slice(boundary + 1);
      
      if (line.startsWith("data:")) {
        const payload = line.slice(5).trim();
        if (payload && payload !== "[DONE]") {
          try {
             const json = JSON.parse(payload);
             const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
             if (text) {
               full += text;
               onDelta(text);
             }
          } catch(e) {}
        }
      }
      
      boundary = buf.indexOf('\n');
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

  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)\s*$/i);
  if (!match) throw new Error("Invalid image source");
  const mimeType = match[1];
  const base64Data = match[2];

  const prompt = `Analyze this receipt image. Return ONLY a valid JSON object matching this exact schema: {"total": number, "items": [{"name": string, "price": number}], "suggestedCategory": string (must be one of "kainan", "transpo", "bills", "tindahan", "iba pa"), "merchant": string (optional store name)}. No markdown blocks.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
  text = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
  
  return JSON.parse(text) as ParsedReceipt;
}

export async function generateKwentoSummary(storyTitle: string, choices: { label: string; lesson?: string }[]): Promise<string> {
  if (!GEMINI_API_KEY) return "Magaling! Ang totoong aral: walang masamang pagpipilian sa pera basta't may plano at may pagmamahal sa pamilya.";
  try {
    const prompt = `Give me a short, inspiring, 2 sentence Taglish summary/lesson learned based on the story "${storyTitle}" and the user's choices: ${JSON.stringify(choices)}`;
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

// ── NEW: AI Savings Plan ───────────────────────────────────────────
export async function generateSavingsPlan(
  goalName: string,
  targetAmount: number,
  currentAmount: number,
  deadlineISO: string,
  lang: Language = "tagalog"
): Promise<string> {
  const remaining = targetAmount - currentAmount;
  const daysLeft = Math.max(1, Math.ceil((new Date(deadlineISO).getTime() - Date.now()) / 86400000));
  const dailyTarget = Math.ceil(remaining / daysLeft);

  if (!GEMINI_API_KEY) {
    return `Para maabot ang "${goalName}", kailangan mong mag-ipon ng ₱${dailyTarget}/araw sa loob ng ${daysLeft} araw. Kaya mo 'yan! 💪`;
  }
  try {
    const prompt = `Create a very short (2-3 sentences max), encouraging savings plan for the goal "${goalName}". Remaining: ₱${remaining}, Days left: ${daysLeft}, required daily savings: ₱${dailyTarget}. Include a practical tip. ${langInstruction(lang)}`;
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch {
    return `Para maabot ang "${goalName}", mag-ipon ng ₱${dailyTarget}/araw sa loob ng ${daysLeft} araw. Kaya mo 'yan! 💪`;
  }
}

// ── NEW: Loan Readiness Score ──────────────────────────────────────
export type LoanReadinessResult = {
  score: number; // 0-100
  rating: "Hindi pa handa" | "Papalapit na" | "Handang-handa";
  breakdown: { label: string; score: number; max: number }[];
  insight: string;
};

export async function generateLoanReadinessScore(
  transactions: Transaction[],
  goals: SavingsGoal[],
  loanPayments: LoanPayment[],
  lang: Language = "tagalog"
): Promise<LoanReadinessResult> {
  // Calculate score components
  const gastos = transactions.filter(t => t.type === "gastos");
  const last30 = gastos.filter(t => Date.now() - new Date(t.date).getTime() < 30 * 86400000);
  const totalSpent = last30.reduce((s, t) => s + t.amount, 0);
  const hasGoals = goals.length > 0 ? 20 : 0;
  const savingsProgress = goals.reduce((s, g) => s + Math.min(1, g.currentAmount / g.targetAmount), 0);
  const savingsScore = Math.min(30, Math.round((savingsProgress / Math.max(1, goals.length)) * 30));
  const onTimePayments = loanPayments.filter(p => p.onTime).length;
  const paymentScore = Math.min(30, onTimePayments * 10);
  const trackingScore = Math.min(20, last30.length * 2); // tracks spending = good habit

  const total = hasGoals + savingsScore + paymentScore + trackingScore;
  const score = Math.min(100, total);
  const rating: LoanReadinessResult["rating"] =
    score >= 70 ? "Handang-handa" : score >= 40 ? "Papalapit na" : "Hindi pa handa";

  const breakdown = [
    { label: "May savings goal", score: hasGoals, max: 20 },
    { label: "Savings progress", score: savingsScore, max: 30 },
    { label: "On-time payments", score: paymentScore, max: 30 },
    { label: "Expense tracking", score: trackingScore, max: 20 },
  ];

  let insight = `Score mo: ${score}/100. `;
  if (score >= 70) insight += "Handa ka na para sa RAFI loan renewal! Ipakita ito sa iyong loan officer.";
  else if (score >= 40) insight += "Malapit ka na! Dagdagan ang savings at i-track ang gastos.";
  else insight += "Magsimula sa pagtatabi at i-track ang lahat ng gastos para mapataas ang score.";

  if (GEMINI_API_KEY) {
    try {
      const prompt = `In 2 sentences max, give encouraging advice to improve a RAFI micro-loan readiness score of ${score}/100. Breakdown: ${JSON.stringify(breakdown)}. ${langInstruction(lang)}`;
      const res = await fetch(getGeminiUrl(false), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      insight = data.candidates?.[0]?.content?.parts?.[0]?.text || insight;
    } catch {}
  }

  return { score, rating, breakdown, insight };
}

// ── NEW: Real AI Spending Insight ─────────────────────────────────
export async function generateSpendingInsight(
  transactions: Transaction[],
  lang: Language = "tagalog"
): Promise<string> {
  const gastos = transactions.filter(t => t.type === "gastos")
    .filter(t => Date.now() - new Date(t.date).getTime() < 7 * 86400000);

  if (gastos.length === 0) return "Wala pang gastos na na-log ngayong linggo. Simulan na mag-track! 📝";

  const summary = gastos.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(summary).sort((a, b) => b[1] - a[1])[0];
  const total = Object.values(summary).reduce((s, v) => s + v, 0);

  if (!GEMINI_API_KEY) {
    return `₱${total.toLocaleString()} ang gastos mo ngayong linggo. Ang pinaka-malaki ay ${topCategory?.[0]} na ₱${topCategory?.[1].toLocaleString()}. Kaya mo bang bawasan ng kahit 10%?`;
  }

  try {
    const prompt = `Analyze this weekly spending and give 2-sentence personalized actionable advice: ${JSON.stringify(summary)}. Total: ₱${total}. ${langInstruction(lang)}`;
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || `₱${total.toLocaleString()} ang gastos mo ngayong linggo.`;
  } catch {
    return `₱${total.toLocaleString()} ang gastos mo ngayong linggo. Pinaka-malaki: ${topCategory?.[0]}.`;
  }
}

// ── NEW: Personal Credit Narrative ────────────────────────────────
export async function generateCreditNarrative(
  profile: Profile,
  transactions: Transaction[],
  goals: SavingsGoal[],
  loanPayments: LoanPayment[],
  lang: Language = "tagalog"
): Promise<string> {
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completedGoals = goals.filter(g => g.completed).length;
  const onTimeCount = loanPayments.filter(p => p.onTime).length;
  const totalPaid = loanPayments.reduce((s, p) => s + (p.paidDate ? p.amount : 0), 0);
  const txCount = transactions.length;

  if (!GEMINI_API_KEY) {
    return `Si ${profile.name} ay isa sa mga aktibong miyembro ng RAFI MFI. Nakapagtrack ng ${txCount} transaksyon, may ${goals.length} savings goal, at nakapag-ipon ng ₱${totalSaved.toLocaleString()}. Nakapagsagawa ng ${onTimeCount} on-time na bayad.`;
  }

  try {
    const prompt = `Write a short, warm, 3-paragraph financial narrative (like a credit story) for a RAFI MFI micro-finance client named ${profile.name}. Data: Level ${profile.avatarLevel} user, ${profile.totalXP} XP, ${txCount} tracked transactions, ₱${totalSaved.toLocaleString()} saved across ${goals.length} goals (${completedGoals} completed), ${onTimeCount} on-time loan payments totaling ₱${totalPaid.toLocaleString()}. Make it positive, highlight their journey, suitable for sharing with a RAFI loan officer during renewal. ${langInstruction(lang)}`;
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || `Si ${profile.name} ay isang responsableng miyembro ng RAFI MFI.`;
  } catch {
    return `Si ${profile.name} ay isang responsableng miyembro ng RAFI MFI na may ${goals.length} savings goals at ${onTimeCount} on-time payments.`;
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
    language: profile.language ?? "tagalog",
  };
}
