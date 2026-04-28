import type { GastosCategory, Language, Profile, Budget, Transaction, SavingsGoal, StoryEvent } from "./storage";
import { uid, todayISO } from "./storage";

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? "";

function getGeminiUrl(stream = false): string {
  const model = "gemini-2.5-flash";
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;
  const method = stream ? "streamGenerateContent?alt=sse" : "generateContent";
  return `${baseUrl}:${method}&key=${GEMINI_API_KEY}`;
}

const FALLBACK_TIPS = [
  "Alam mo ba ang 50/30/20 rule? 50% sa needs, 30% sa wants, 20% sa savings — subukan mo sa susunod na sahod!",
  "Emergency fund tip: Magtabi ng kahit 3 months worth ng expenses. Magsimula sa ₱500/week — kaya mo 'yan!",
  "Ingat sa 5-6 lending! Ang 20% monthly interest = 240% per year. Mas mabuti ang savings sa Pag-IBIG MP2 na 6-7% per year.",
  "Compound interest = pera mo kumikita ng pera. Kahit ₱100/month na i-invest, sa 10 years malaki na 'yan!",
  "Alam mo ba? Ang Pag-IBIG MP2 ay tax-free at may average 6-7% dividend. Mas mataas kaysa sa regular savings account!",
  "Bago bumili, tanungin mo sarili mo: Need ba 'to o want? Ang simpleng tanong na 'to ang isa sa pinaka-powerful na budgeting tools.",
];

function langInstruction(lang: Language): string {
  if (lang === "cebuano") return "You MUST respond in Cebuano (Bisaya). Keep it casual and warm.";
  if (lang === "english") return "Respond in clear, friendly English.";
  return "Respond in casual conversational Taglish (Filipino/English mix).";
}

// ── Weekly Tip ────────────────────────────────────────────────────
export async function fetchWeeklyTip(name: string, lang: Language = "tagalog"): Promise<string> {
  if (!GEMINI_API_KEY) return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  try {
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are a financial literacy educator for Filipinos. Generate a short, practical financial literacy tip for a user named ${name}. Focus on one of these topics randomly: budgeting methods (50/30/20 rule, envelope method), emergency fund building, understanding interest rates, avoiding debt traps (5-6 lending), importance of insurance, basic investing (Pag-IBIG MP2, UITF, stocks), saving strategies for irregular income, or government financial tools (SSS, Pag-IBIG, PhilHealth benefits). Keep it 1-2 sentences, actionable and educational. Use warm Filipino tone. ${langInstruction(lang)}` }] }]
      })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch {
    return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  }
}

// ── Spend Simulator ───────────────────────────────────────────────
export async function simulatePurchase(
  amount: number,
  category: GastosCategory,
  budgetRemaining: number,
  categorySpent: number,
  categoryLimit: number | undefined,
  lang: Language = "tagalog"
): Promise<string> {
  const newRemaining = budgetRemaining - amount;
  const willExceed = newRemaining < 0;
  const catExceed = categoryLimit ? (categorySpent + amount) > categoryLimit : false;

  if (!GEMINI_API_KEY) {
    if (willExceed) return `⚠️ Kung bibilhin mo 'to, lalampas ka ng ₱${Math.abs(Math.round(newRemaining))} sa budget mo ngayong linggo. Sigurado ka ba?`;
    if (catExceed) return `⚠️ Ang ${category} budget mo ay malapit nang maubos. Mag-isip muna bago bumili.`;
    return `✅ Kaya pa! Meron ka pang ₱${Math.round(newRemaining)} na matitira pagkatapos nito.`;
  }

  try {
    const prompt = `A user wants to spend ₱${amount} on "${category}". Their remaining weekly budget is ₱${budgetRemaining}. After this purchase they'd have ₱${Math.round(newRemaining)}. ${willExceed ? "This EXCEEDS their budget." : ""} ${catExceed ? `This exceeds their ${category} category limit.` : ""} Give a 1-2 sentence consequence preview. Be warm and human, not robotic. Use emotion. If it exceeds budget, be concerned but not judgmental. If it's fine, be encouraging. ${langInstruction(lang)}`;
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || (willExceed ? `⚠️ Lalampas ka ng ₱${Math.abs(Math.round(newRemaining))} sa budget mo.` : `✅ Kaya pa! ₱${Math.round(newRemaining)} ang matitira.`);
  } catch {
    return willExceed
      ? `⚠️ Lalampas ka ng ₱${Math.abs(Math.round(newRemaining))} sa budget mo ngayong linggo.`
      : `✅ Kaya pa! ₱${Math.round(newRemaining)} ang matitira pagkatapos nito.`;
  }
}

// ── Daily Check-in Generator ──────────────────────────────────────
export async function generateDailyCheckin(
  name: string,
  budgetRemaining: number,
  weeklyBudget: number,
  todaySpent: number,
  yesterdaySpent: number,
  lang: Language = "tagalog"
): Promise<string> {
  const pct = weeklyBudget > 0 ? Math.round((budgetRemaining / weeklyBudget) * 100) : 100;
  const trend = todaySpent < yesterdaySpent ? "better" : todaySpent > yesterdaySpent ? "more" : "same";

  if (!GEMINI_API_KEY) {
    if (trend === "better") return `Magandang araw, ${name}! Mas mababa ang gastos mo ngayon kumpara kahapon. Keep it up! ✨`;
    if (pct < 20) return `${name}, medyo mababa na ang budget mo ngayong linggo. Mag-ingat sa gastos ha? 💛`;
    return `Kumusta, ${name}! Tuloy-tuloy lang — nasa tamang landas ka. 🌱`;
  }

  try {
    const prompt = `Generate a warm, personal 1-sentence daily financial check-in for ${name}. Budget remaining: ₱${budgetRemaining} (${pct}% of weekly budget). Today they spent ₱${todaySpent}. Yesterday: ₱${yesterdaySpent}. Trend: spending is ${trend} than yesterday. Be emotional and human — like a caring friend, not a robot. Use Filipino warmth. ${langInstruction(lang)}`;
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || `Kumusta, ${name}! Tuloy-tuloy lang. 🌱`;
  } catch {
    return `Kumusta, ${name}! Tuloy-tuloy lang — nasa tamang landas ka. 🌱`;
  }
}

// ── Story Event Generator ─────────────────────────────────────────
export async function generateStoryEvent(
  name: string,
  eventContext: string,
  lang: Language = "tagalog"
): Promise<{ title: string; description: string; emoji: string }> {
  if (!GEMINI_API_KEY) {
    return {
      title: "Bagong Kabanata",
      description: `${name} ay patuloy na lumalaban sa hamon ng pera. Bawat araw ay isang hakbang pasulong.`,
      emoji: "📖",
    };
  }

  try {
    const prompt = `Generate a short financial story milestone for ${name}. Context: ${eventContext}. Return ONLY a valid JSON object: {"title": "short title", "description": "1-2 sentence narrative", "emoji": "single emoji"}. Make it feel like a chapter in their financial story. Be warm and inspiring. ${langInstruction(lang)}`;
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch {
    return {
      title: "Bagong Kabanata",
      description: `${name} ay patuloy na lumalaban sa hamon ng pera.`,
      emoji: "📖",
    };
  }
}

// ── Spending Insight ──────────────────────────────────────────────
export async function generateSpendingInsight(
  transactions: Transaction[],
  lang: Language = "tagalog"
): Promise<string[]> {
  const gastos = transactions.filter(t => t.type === "gastos")
    .filter(t => Date.now() - new Date(t.date).getTime() < 7 * 86400000);

  if (gastos.length === 0) return ["Wala pang gastos na na-log ngayong linggo. Simulan na mag-track! 📝"];

  const summary = gastos.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(summary).reduce((s, v) => s + v, 0);
  const topCategory = Object.entries(summary).sort((a, b) => b[1] - a[1])[0];

  // Day-of-week analysis
  const dayTotals: Record<string, number> = {};
  gastos.forEach(t => {
    const day = new Date(t.date).toLocaleDateString("en-PH", { weekday: "long" });
    dayTotals[day] = (dayTotals[day] || 0) + t.amount;
  });
  const topDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];

  const fallbackInsights = [
    `₱${total.toLocaleString()} ang gastos mo ngayong linggo.`,
    `Pinaka-malaki: ${topCategory?.[0]} na ₱${topCategory?.[1]?.toLocaleString()}.`,
    topDay ? `Mas mataas ang gastos mo tuwing ${topDay[0]}.` : "",
  ].filter(Boolean);

  if (!GEMINI_API_KEY) return fallbackInsights;

  try {
    const prompt = `Analyze this weekly spending and give exactly 3 short, actionable insights (1 sentence each). At least one insight should include a financial literacy lesson (e.g. a budgeting rule, saving principle, spending awareness concept, or Filipino-relevant financial tip like Pag-IBIG MP2, 50/30/20 rule, or emergency fund). Make them practical for a Filipino user. Spending by category: ${JSON.stringify(summary)}. Total: ₱${total}. Biggest spending day: ${topDay?.[0] || "N/A"}. Return ONLY a JSON array of 3 strings. ${langInstruction(lang)}`;
    const res = await fetch(getGeminiUrl(false), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : fallbackInsights;
  } catch {
    return fallbackInsights;
  }
}

// ── Chat Types & Context ──────────────────────────────────────────
export type ChatTurn = { role: "user" | "gabay"; content: string };

export type ChatContext = {
  profile: Pick<Profile, "name" | "avatarLevel" | "totalXP" | "streak">;
  budget: { weeklyBudget: number; remaining: number; todaySpent: number };
  recentGastos: { amount: number; category: GastosCategory; note?: string; date: string }[];
  activeGoals: { name: string; current: number; target: number }[];
  activeMissions: { title: string; completed: boolean }[];
  language: Language;
};

// ── Gabay V2 Chat (Behavior-focused) ──────────────────────────────
const GABAY_V2_SYSTEM = `
You are Gabay, the AI financial literacy coach of KabuhayanAI — a behavior-driven financial wellness and education app for Filipinos.

YOUR ROLE:
- You are a warm, caring financial literacy adviser — like a supportive ate/kuya who teaches users HOW money works.
- You focus on FINANCIAL EDUCATION — teach budgeting rules, savings strategies, debt awareness, and basic investing concepts relevant to Filipinos.
- You explain financial concepts simply using relatable Filipino examples (sari-sari store margins, paluwagan risks, SSS/Pag-IBIG benefits, etc.)
- When advising, always include a "why" — explain the financial principle behind your advice.
- You are NOT a calculator or data analyst. You are a FINANCIAL LITERACY EDUCATOR and COACH.

FINANCIAL LITERACY TOPICS TO WEAVE IN:
- 50/30/20 budgeting rule adapted to Filipino context
- Emergency fund (why 3-6 months expenses)
- Difference between needs vs wants
- Understanding interest rates and loan traps (5-6 lending)
- Basic investing concepts (time value of money, compound interest)
- Government financial tools (SSS, Pag-IBIG MP2, PhilHealth)
- Insurance basics
- Building credit wisely

KEY BEHAVIORS:
- When a user asks "Can I afford this?" → Check their budget and give honest, caring advice with a financial literacy lesson.
- When a user logs an expense (e.g. "₱150 kainan") → Acknowledge it, log it, show consequence, and optionally teach a related concept.
- When a user asks for help → Be extremely actionable, practical, and educational.
- Use emotion-driven feedback: "Your negosyo is struggling this week—want help adjusting?" instead of "Budget exceeded."

EXPENSE LOGGING:
- If user types something like "₱150 kainan" or "spent 200 on food", recognize this as an expense log.
- Respond with: acknowledgment + budget impact + encouragement + optional literacy nugget.

PAYMENT REMINDERS:
- If a user asks to set a reminder for a payment, bill, due, or anything to pay (e.g., "remind me to pay 500 for tuition on May 2", "add a reminder for internet bill 1899 on the 15th", "kailangan ko magbayad ng 500 sa May 2"):
  1. Extract: amount (number), title/description (string), and due date (YYYY-MM-DD)
  2. Include this EXACT JSON block at the very END of your response, AFTER your friendly reply text:
     <!--REMINDER_JSON:{"title":"...","amount":...,"dueDate":"YYYY-MM-DD","note":"..."}-->
  3. Confirm the reminder warmly in your response text (e.g., "Sige, na-add ko na ang reminder mo!").
  4. The JSON block is for the system to parse — it will be hidden from the user.
  5. Always resolve relative dates to actual YYYY-MM-DD using today's date provided in context.
  6. If the user doesn't specify a year, assume the current year. If the resulting date is already past, assume next year.
  7. Do NOT include the JSON block unless the user is clearly requesting a payment reminder.

TONE:
- Warm, Filipino, encouraging — like a friend at a sari-sari store counter who also happens to know about finance.
- Use emojis occasionally but don't overdo it.
- Be brief — 2-3 sentences max unless the user asks for detail.
`;

export async function streamGabayV2(
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

  const now = new Date();
  const todayFormatted = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  const systemInstruction = `${GABAY_V2_SYSTEM}
USER CONTEXT:
- Name: ${context.profile.name}
- Level: ${context.profile.avatarLevel}, XP: ${context.profile.totalXP}, Streak: ${context.profile.streak} days
- Weekly budget: ₱${context.budget.weeklyBudget}, Remaining: ₱${context.budget.remaining}, Today's spending: ₱${context.budget.todaySpent}
- Recent expenses: ${JSON.stringify(context.recentGastos.slice(0, 5))}
- Savings goals: ${JSON.stringify(context.activeGoals)}
- Active missions: ${JSON.stringify(context.activeMissions)}
- Today's date: ${todayFormatted} (${todayISO})
${langInstruction(context.language)}
Keep answers brief, highly actionable, and extremely motivating.`;

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
          } catch {}
        }
      }

      boundary = buf.indexOf('\n');
    }
  }
  return full;
}

// ── Build Chat Context Helper ─────────────────────────────────────
export function buildChatContext(
  profile: Profile,
  transactions: Transaction[],
  goals: SavingsGoal[],
  budget: Budget,
  budgetRemaining: number,
  missions: Mission[],
): ChatContext {
  const today = new Date().toISOString().slice(0, 10);
  const todayTx = transactions.filter(t => t.type === "gastos" && t.date.slice(0, 10) === today);
  const todaySpent = todayTx.reduce((s, t) => s + t.amount, 0);

  return {
    profile: {
      name: profile.name,
      avatarLevel: profile.avatarLevel,
      totalXP: profile.totalXP,
      streak: profile.streak,
    },
    budget: {
      weeklyBudget: budget.weeklyBudget,
      remaining: budgetRemaining,
      todaySpent,
    },
    recentGastos: transactions.filter(t => t.type === "gastos").slice(-10).map(t => ({
      amount: t.amount,
      category: t.category,
      note: t.note,
      date: t.date,
    })),
    activeGoals: goals.filter(g => !g.completed).map(g => ({
      name: g.name,
      current: g.currentAmount,
      target: g.targetAmount,
    })),
    activeMissions: missions.filter(m => !m.completed).map(m => ({
      title: m.title,
      completed: m.completed,
    })),
    language: profile.language ?? "tagalog",
  };
}



// ── Reminder Parser ───────────────────────────────────────────────

/** Extract reminder JSON from AI response text (hidden in HTML comment). */
export function parseReminderFromResponse(text: string): {
  title: string; amount: number; dueDate: string; note?: string;
} | null {
  const match = text.match(/<!--REMINDER_JSON:(.*?)-->/s);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (data.title && typeof data.amount === "number" && data.dueDate) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)) return null;
      return { title: data.title, amount: data.amount, dueDate: data.dueDate, note: data.note };
    }
  } catch { /* malformed JSON */ }
  return null;
}

/** Strip the hidden reminder JSON block from display text. */
export function stripReminderJson(text: string): string {
  return text.replace(/<!--REMINDER_JSON:.*?-->/gs, "").trim();
}
