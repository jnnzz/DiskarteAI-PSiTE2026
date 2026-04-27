# KabuhayanAI — Build Plan

A mobile-first Filipino financial wellness web app for sari-sari store owners, jeepney drivers, OFW families, and young earners. Features savings tracking, AI receipt analysis, gamified missions, a Cebuano/Tagalog AI coach, community stories, and avatar progression — all running on browser storage with stateless AI edge functions for a fast 20-hour hackathon build.

---

## Brand & Theme

**Theme: Bayanihan Warmth** — warm, distinctly Filipino, calm base with playful moments on level-ups and rewards.

**Palette (light mode only):**
- Primary: Terracotta `#C2410C` (Vigan clay)
- Background: Cream `#FEF3E2` (rice paper)
- Surface: White `#FFFFFF`
- Accent (growth/ipon): Bamboo green `#65A30D`
- Highlight (rewards/level-ups): Gold `#F59E0B`
- Text: Deep brown `#1C1917`
- Muted: Warm tan `#A8A29E`
- Destructive: Soft red `#DC2626`

**Typography:** Nunito (friendly, rounded) for both headings and body, with bolder weights for headlines.

**Visual style:** Calm base — clean cards, generous spacing, subtle shadows. Playful moments — confetti on mission complete, avatar bounce on level-up, gold badge animations on Palakasan podium, gentle slide-in transitions.

All colors stored as HSL semantic tokens in `index.css` and mapped through `tailwind.config.ts`. Dark mode skipped to save build time.

---

## The 7 Modules

### 1. Landing / Pitch (`/`)
Single hero screen with logo, tagline ("Pera mo, kabuhayan mo."), 3-line value prop, and two CTAs:
- **Try Demo Account** → seeds Maria's Level 3 dataset, routes to `/home`
- **Start Fresh** → blank Level 1 profile, routes to `/home`

Bottom strip: "Built for the Filipino Hustle" with module icons.

### 2. Home Dashboard (`/home`)
The daily hub. Shows:
- Avatar card (level, XP bar, streak)
- Today's tip card (AI-generated weekly tip, cached)
- Ipon progress ring (toward active savings goal)
- Quick actions: Add Gastos, Scan Receipt, Talk to Gabay, View Missions
- Bottom nav to all modules

### 3. Ipon Tracker (`/ipon`)
Set savings goals (e.g., "Tuition – ₱5,000 by Dec"). Add deposits manually. Visual progress ring + history list. Goal completion triggers confetti + XP reward.

### 4. Gastos Analyzer (`/gastos`)
Two ways to log expenses:
- **Manual:** category + amount + note
- **Scan Receipt:** upload/capture photo → `analyze-receipt` edge function (Gemini multimodal) returns parsed line items + total + suggested category

Weekly chart (recharts), category breakdown, AI insight card ("Sobra kang gumastos sa kainan this week, kaya mo pa bang bawasan?").

### 5. FinQuest Missions (`/missions`)
List of weekly/daily missions with XP rewards:
- "Mag-ipon ng ₱100 ngayong linggo" (+50 XP)
- "I-log ang 3 araw na gastos" (+30 XP)
- "Tapusin ang Kwento #1" (+20 XP)

Tap to mark complete (honor system for demo). Completion → confetti + XP + level check.

### 6. Palakasan Leaderboard (`/palakasan`)
Weekly rankings showing user vs. seeded community members (Maria, Jun, Aling Nena, etc.). Top 3 get gold/silver/bronze badge animations. "Your rank: #4 — 2 missions away from podium!" nudge.

### 7. Kwento ng Pera (`/kwento`)
Short interactive money stories with choices ("Si Aling Rosa got ₱10,000 bonus. Ano ang gagawin niya?"). Each choice teaches a financial concept. AI-generated summary at end via `generate-kwento` function. Completion → XP.

### 8. Tambayan (`/tambayan`)
Community feed (seeded posts only — read-only for demo, with a "Post" button that shows a "Coming soon, kaibigan!" toast). Posts show avatar, name, money tip/question, hearts. Demonstrates the social vision without building moderation.

### 9. Gabay AI (`/gabay`)
Chat interface with the Gabay coach. Streams responses from `chat` edge function (Gemini 2.5 Flash). System prompt: warm Cebuano/Tagalog/Taglish financial coach who knows the user's profile, recent gastos, and active goals. Suggested prompts: "Paano mag-ipon kahit maliit ang kita?", "Ano ang emergency fund?".

### 10. Profile / Avatar (`/profile`)
Shows current avatar art (stylized AI-generated, unified art style), level, total XP, badges earned, streak, and lifetime ipon. Avatar visually evolves at levels 1, 3, 5, 10 (4 art variants generated upfront, swapped by level).

---

## Technical Architecture

**Stack:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui + react-router-dom + recharts + sonner (toasts) + canvas-confetti.

**State & persistence:**
- `src/lib/storage.ts` — typed shapes: `Profile`, `SavingsGoal`, `Transaction`, `Receipt`, `Mission`, `KwentoProgress`, `ChatMessage`, `LeaderboardEntry`, `TambayanPost`
- `src/hooks/useLocalStorage.ts` — generic typed hook with SSR-safe init and cross-tab sync
- `src/lib/seedDemo.ts` — populates Maria's Level 3 dataset on demand
- `src/lib/xp.ts` — XP/level math, level-up detection, badge unlocks

**AI (Lovable Cloud edge functions, stateless, Gemini via AI Gateway):**
1. `chat` — Gabay coach, streaming, accepts profile + recent context
2. `analyze-receipt` — multimodal Gemini Pro, returns structured JSON of line items
3. `weekly-tip` — generates one personalized tip from profile+gastos summary, cached in localStorage for 7 days
4. `generate-kwento` — produces story summary/lesson at end of a Kwento

No auth, no database tables, no RLS. Edge functions are pure compute that only need the AI key.

**Routing:** `react-router-dom` with a `<Layout>` wrapping all `/` routes (top header + bottom nav). Landing has its own layout.

**Asset generation:** 4 avatar variants (level 1/3/5/10) + module hero illustrations generated upfront in unified Filipino-illustration style, stored in `src/assets/`.

**Mobile-first:** Designed at 375–428px, scales up gracefully. Bottom tab nav on mobile, side rail on tablet+.

---

## Build Order (20-hour budget)

1. **Foundation (2h)** — theme tokens, Nunito font, Layout shell, bottom nav, routing, storage hook + types, seedDemo skeleton
2. **Landing + Home + Profile (3h)** — avatar card, XP system, level-up animation, demo seed flow
3. **Ipon Tracker (1.5h)** — goals CRUD, progress ring, deposit flow
4. **Gastos Analyzer (3h)** — manual log + chart + `analyze-receipt` edge function + receipt upload UI
5. **FinQuest Missions (1.5h)** — mission list, completion flow, XP rewards, confetti
6. **Palakasan (1h)** — seeded leaderboard, podium animation
7. **Gabay AI (2h)** — `chat` edge function with streaming, chat UI, suggested prompts, context injection
8. **Kwento ng Pera (2h)** — 3 hand-authored stories with branching, `generate-kwento` summary
9. **Tambayan (1h)** — seeded feed, hearts (local state), coming-soon post modal
10. **Polish (3h)** — avatar art generation, weekly-tip function, Cebuano microcopy pass, sound effects, demo dry-run

---

## Demo Strategy

Judges tap **Try Demo Account** → instantly land in Maria's world: Level 3 sari-sari store owner, ₱2,400 saved toward a ₱5,000 tuition goal, 12 logged gastos this week, 2 completed missions, ranked #4 on Palakasan, mid-conversation with Gabay about emergency funds.

Pitch flow: Home → scan a receipt live → check Gastos insight → complete a mission (confetti) → ask Gabay a question in Cebuano → show Palakasan podium → close on Profile showing the level-up journey.

**Honest answer if asked about real users:** "Browser storage today so we shipped 7 modules in 20 hours. Data model is typed for Postgres — half a day to move to Lovable Cloud before any pilot."
