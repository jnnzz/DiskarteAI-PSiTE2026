import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBudget } from "@/hooks/useBudget";
import { useStoryEngine } from "@/hooks/useStoryEngine";
import {
  KEYS, blankProfile, blankBudget, uid, todayISO,
  type ChatMessage, type Profile, type SavingsGoal, type Transaction,
  type Budget, type Mission, type Language, type Reminder,
} from "@/lib/storage";
import { defaultMissions } from "@/lib/missions";
import { buildChatContext, streamGabayV2, parseReminderFromResponse, stripReminderJson, type ChatTurn } from "@/lib/ai";
import { Send, X, Minus, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import avatarGabay from "@/assets/avatar-gabay.png";

const MINI_SUGGESTIONS: Record<Language, string[]> = {
  tagalog: ["Magkano pa budget ko?", "Kaya pa bang bumili?", "Paano mag-ipon?"],
  cebuano: ["Pila pa ang budget?", "Kaya pa ba mopalit?", "Unsaon pag-ipon?"],
  english: ["How much budget left?", "Can I afford it?", "How to save?"],
};

export function FloatingChat() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Shared state with Coach page
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);
  const [goals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const [budget] = useLocalStorage<Budget>(KEYS.budget, blankBudget);
  const [missions] = useLocalStorage<Mission[]>(KEYS.missions, defaultMissions);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(KEYS.chat, []);
  const [, setReminders] = useLocalStorage<Reminder[]>(KEYS.reminders, []);

  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const awarded = useRef(false);
  const recRef = useRef<any>(null);

  const bData = useBudget();
  const { onChatUsed } = useStoryEngine();
  const lang = profile.language ?? "tagalog";

  // Whether to hide (on /coach page)
  const hidden = location.pathname === "/coach";

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  // Clear unread when opening
  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  // Stop listening when panel closes
  useEffect(() => {
    if (!open && isListening) {
      recRef.current?.stop();
      setIsListening(false);
    }
  }, [open, isListening]);

  const startListen = useCallback(() => {
    const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!API) { toast.error("Voice not supported in this browser."); return; }
    const r = new API();
    r.lang = lang === "english" ? "en-US" : lang === "cebuano" ? "ceb-PH" : "fil-PH";
    r.continuous = false;
    r.interimResults = true;
    r.onstart = () => setIsListening(true);
    r.onresult = (e: any) => {
      setDraft(Array.from(e.results).map((r: any) => r[0].transcript).join(""));
    };
    r.onend = () => setIsListening(false);
    r.onerror = () => { setIsListening(false); toast.error("Hindi narinig — subukan ulit."); };
    recRef.current = r;
    r.start();
  }, [lang]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || busy) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text.trim(), timestamp: todayISO() };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setStreaming("");

    try {
      const turns: ChatTurn[] = next.map(m => ({ role: m.role, content: m.content }));
      const ctx = buildChatContext(profile, transactions, goals, budget, bData.weeklyRemaining, missions);
      let acc = "";
      await streamGabayV2(turns, ctx, d => { acc += d; setStreaming(acc); });
      // Parse and save reminder if AI included one
      const reminderData = parseReminderFromResponse(acc);
      const cleanContent = stripReminderJson(acc);
      setMessages(m => [...m, { id: uid(), role: "gabay", content: cleanContent, timestamp: todayISO() }]);
      setStreaming("");
      if (reminderData) {
        const newReminder: Reminder = {
          id: uid(), ...reminderData,
          completed: false, createdAt: todayISO(), source: "chat",
        };
        setReminders(prev => [...prev, newReminder]);
        toast.success(`✅ Reminder added: ${reminderData.title} — ₱${reminderData.amount.toLocaleString()} on ${reminderData.dueDate}`);
      }
      if (!open) setHasUnread(true);
      if (!awarded.current) { awarded.current = true; onChatUsed(); }
    } catch {
      setStreaming("");
      setMessages(m => [...m, { id: uid(), role: "gabay", content: "Pasensya, may problema. Subukan ulit?", timestamp: todayISO() }]);
    } finally {
      setBusy(false);
    }
  }, [busy, messages, setMessages, profile, transactions, goals, budget, bData.weeklyRemaining, missions, open, onChatUsed]);

  // Hide on /coach page — AFTER all hooks to satisfy Rules of Hooks
  if (hidden) return null;

  return (
    <>
      {/* ── Floating Action Button ──────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <div className="fixed z-50 bottom-[88px] right-4 lg:bottom-6 lg:right-6 flex items-end gap-2">
            {/* Whisper bubble */}
            <motion.div
              initial={{ opacity: 0, x: 12, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 300, damping: 22, delay: 1 }}
              className="relative mb-2 max-w-[160px] rounded-2xl bg-card px-3.5 py-2 shadow-card"
            >
              <p className="text-[11px] font-bold leading-snug text-foreground">
                Kailangan mo ba ng tulong sa budget?
              </p>
              {/* Tail arrow pointing right toward the FAB */}
              <div className="absolute right-[-6px] bottom-3 size-3 rotate-45 bg-card shadow-sm" />
            </motion.div>

            {/* FAB button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => setOpen(true)}
              className={cn(
                "flex items-center justify-center rounded-full shadow-lift",
                "size-14",
                "ring-2 ring-primary/30 hover:ring-primary/60 transition-all hover:scale-105",
                "gabay-fab-pulse"
              )}
              aria-label="Open Gabay AI chat"
            >
              <img
                src={avatarGabay}
                alt="Gabay AI"
                className="h-full w-full rounded-full object-cover"
              />
              {/* Unread indicator */}
              {hasUnread && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex size-4 rounded-full bg-accent ring-2 ring-card" />
                </span>
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden rounded-3xl bg-card shadow-lift",
              "bottom-[88px] right-4 w-[calc(100%-2rem)] max-w-[360px] h-[480px]",
              "lg:bottom-6 lg:right-6 lg:w-[360px]",
              "border border-border/60"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-primary px-4 py-3 rounded-t-3xl">
              <div className="size-9 shrink-0 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/30">
                <img src={avatarGabay} alt="Gabay" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-white">Gabay AI</p>
                <p className="text-[10px] font-semibold text-white/70">Financial Literacy Coach</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white/80 transition hover:bg-white/25 hover:text-white"
                aria-label="Minimize chat"
              >
                <Minus className="size-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white/80 transition hover:bg-white/25 hover:text-white"
                aria-label="Close chat"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Budget status bar */}
            <div className="flex items-center gap-2 border-b border-border/40 bg-secondary/50 px-4 py-1.5 text-[10px] font-bold text-muted-foreground">
              <span className={cn(
                "size-1.5 rounded-full",
                bData.status === "green" ? "bg-accent" : bData.status === "yellow" ? "bg-highlight" : "bg-destructive"
              )} />
              <span>₱{bData.weeklyRemaining.toLocaleString()} natitira</span>
              <span>· ₱{bData.todaySpent.toLocaleString()} gastos ngayon</span>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {messages.length === 0 && !streaming && (
                <div className="flex flex-col items-center pt-6 text-center">
                  <div className="mb-3 size-16 overflow-hidden rounded-full bg-secondary shadow-soft">
                    <img src={avatarGabay} alt="Gabay" className="h-full w-full object-cover scale-125" />
                  </div>
                  <p className="text-sm font-bold">Kumusta, {profile.name}!</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ako si Gabay — tanong ka lang tungkol sa budget mo!
                  </p>
                </div>
              )}
              {messages.map(m => (
                <MiniBubble key={m.id} role={m.role}>{m.content}</MiniBubble>
              ))}
              {streaming && (
                <MiniBubble role="gabay">
                  {streaming}
                  <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-primary" />
                </MiniBubble>
              )}
              {busy && !streaming && (
                <MiniBubble role="gabay">
                  <span className="inline-flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "120ms" }} />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "240ms" }} />
                  </span>
                </MiniBubble>
              )}
            </div>

            {/* Quick suggestions */}
            {messages.length === 0 && !busy && (
              <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-hide">
                {MINI_SUGGESTIONS[lang].map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold transition hover:bg-secondary/70"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <form
              onSubmit={e => { e.preventDefault(); send(draft); }}
              className="flex items-center gap-2 border-t border-border/40 bg-card px-3 py-2.5"
            >
              {/* Mic button */}
              <button
                type="button"
                onClick={isListening ? () => { recRef.current?.stop(); setIsListening(false); } : startListen}
                disabled={busy}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full transition",
                  isListening
                    ? "animate-pulse bg-destructive text-destructive-foreground shadow-soft"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                )}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
              <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={isListening ? "Nakikinig..." : "Tanungin si Gabay..."}
                disabled={busy}
                className="flex-1 rounded-full bg-secondary px-3.5 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || busy}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full transition",
                  draft.trim() && !busy
                    ? "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
                    : "bg-secondary text-muted-foreground"
                )}
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Mini chat bubble ────────────────────────────────────────────────
function MiniBubble({ role, children }: { role: "user" | "gabay"; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-end gap-1.5", role === "user" ? "justify-end" : "justify-start")}>
      {role === "gabay" && (
        <div className="size-6 shrink-0 overflow-hidden rounded-full bg-secondary">
          <img src={avatarGabay} alt="Gabay" className="h-full w-full object-cover scale-110" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-soft",
          role === "user"
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-secondary text-foreground"
        )}
      >
        {children}
      </div>
    </div>
  );
}
