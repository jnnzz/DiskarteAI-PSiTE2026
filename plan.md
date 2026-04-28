# KabuhayanAI - Version 2 Implementation Plan

## Core UX Principle
"One main screen. Everything else is secondary." 
The goal is a predictive, story-driven financial coach focused on behavior *before* spending, heavily aligned with financial literacy, and without feeling like a complex tracker.

## Architecture & Tab Structure
The system will be simplified to a maximum of 4-5 tabs to avoid overwhelming users.

### 1. HOME (Main Dashboard)
- **Purpose:** Your financial life in one glance. Everything important happens here.
- **Features:**
  - Remaining budget (daily/weekly).
  - "If you spend today..." preview / "Simulate a Purchase" button.
  - Avatar / Story status.
  - Active mission from AI.
  - Warnings (e.g., nearing budget limit).
  - **Quick Input Bar:** "Add expense", voice input, chat-style logging.
  - "Daily Financial Check-in" (humanized feedback).

### 2. AI COACH (Gabay AI - Chat/Voice Tab)
- **Purpose:** An extension of the Home screen for conversational financial advice.
- **Features:**
  - Ask questions ("Can I afford this?", "What happens if I spend ₱500 today?").
  - Log expenses conversationally.
  - Emotion-driven feedback ("Your negosyo is struggling this week—want help adjusting?").

### 3. STORY / JOURNEY
- **Purpose:** The core differentiator showcasing the user's financial narrative.
- **Features:**
  - Avatar progression.
  - Key milestones ("You survived a tight week").
  - Visual and emotional timeline/chapters ("Paths taken").

### 4. MISSIONS / GOALS
- **Purpose:** Gamification core driven by AI insights.
- **Features:**
  - Active missions ("Reduce snack spending", "Log expenses for 3 days").
  - Progress bars.
  - Rewards and XP tracking.

### 5. INSIGHTS (Optional/Simplified)
- **Purpose:** Very simple overview of spending habits.
- **Features:**
  - 2-3 key insights ONLY (e.g., "You overspend on weekends").
  - *Avoid:* Complex graphs or Excel-like data dumps.

## Ideal User Flow
1. **Open App:** User sees remaining budget (e.g., "You have ₱300 left today").
2. **Consider Purchase:** User thinks "Can I buy milk tea?" and taps input/asks AI.
3. **Simulation:** App responds with immediate consequence ("If you buy this, your food budget will exceed by ₱120").
4. **Decision:** If proceed, expense logged. AI updates Budget, Story, and Mission.
5. **Outcome:** User sees XP gained, new suggestion, and updated "path". Everything is connected.

## Refactoring Steps
1. **Cleanup:** Remove redundant pages, separate complex systems, and clean up the current routing (remove old Palakasan, Gastos, Ipon, etc. if they don't fit the new model).
2. **Layout Update:** Implement a clean BottomNav with exactly these 4-5 tabs (Home, Coach, Story, Missions, Insights).
3. **Component Development:** 
   - Build the "Before You Spend" simulator component.
   - Refactor the AI Coach chat interface to be central and context-aware.
   - Build the Story/Timeline visualizer.
4. **Integration:** Connect the AI insights to the Mission and Story generators to ensure every logged expense triggers a state change in the user's journey.
