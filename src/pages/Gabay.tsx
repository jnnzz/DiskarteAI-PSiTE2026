import { useEffect, useRef, useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  KEYS,
  blankProfile,
  uid,
  todayISO,
  type ChatMessage,
  type Profile,
  type SavingsGoal,
  type Transaction,
  type Language,
} from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildChatContext, streamGabay, type ChatTurn } from "@/lib/ai";
import { Send, Sparkles, Mic, MicOff, Globe, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAwardXP } from "@/hooks/useAwardXP";
import { toast } from "sonner";

const SUGGESTIONS_BY_LANG: Record<Language, string[]> = {
  tagalog: [
    "Paano ako makakakuha ng RAFI loan?",
    "Paano mag-claim ng CLIMBS insurance?",
    "Paano mag-ipon kahit maliit ang kita?",
    "Ano ang gagawin kung miss ko ang bayad sa loan?",
  ],
  cebuano: [
    "Unsaon nako pag-apply sa RAFI loan?",
    "Unsaon pag-claim sa CLIMBS insurance?",
    "Unsaon nako pag-ipon kung gamay akong kita?",
    "Unsa ang buhaton kung ma-miss nako ang akong bayad?",
  ],
  english: [
    "How do I apply for a RAFI micro-loan?",
    "How do I file a CLIMBS insurance claim?",
    "How do I save with a small income?",
    "What if I miss a loan payment?",
  ],
};

const LANG_LABELS: Record<Language, string> = {
  tagalog: "Filipino",
  cebuano: "Cebuano",
  english: "English",
};

const LANG_CYCLE: Language[] = ["tagalog", "cebuano", "english"];

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Gabay() {
  const [profile, setProfile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);
  const [goals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(KEYS.chat, []);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const award = useAwardXP();
  const scrollRef = useRef<HTMLDivElement>(null);
  const awardedThisSession = useRef(false);
  const recognitionRef = useRef<any>(null);

  const lang = profile.language ?? "tagalog";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Cycle language toggle
  function cycleLanguage() {
    const next = LANG_CYCLE[(LANG_CYCLE.indexOf(lang) + 1) % LANG_CYCLE.length];
    setProfile((p) => ({ ...p, language: next }));
    toast.info(`Language: ${LANG_LABELS[next]}`);
  }

  // Voice-to-text
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Voice input not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang === "cebuano" ? "fil-PH" : lang === "english" ? "en-US" : "fil-PH";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setDraft(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Hindi ko narinig. Subukan ulit.");
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [lang]);

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text.trim(), timestamp: todayISO() };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setStreaming("");
    try {
      const turns: ChatTurn[] = next.map((m) => ({ role: m.role, content: m.content }));
      const context = buildChatContext(profile, transactions, goals);
      let acc = "";
      await streamGabay(turns, context, (delta) => {
        acc += delta;
        setStreaming(acc);
      });
      const reply: ChatMessage = { id: uid(), role: "gabay", content: acc, timestamp: todayISO() };
      setMessages((m) => [...m, reply]);
      setStreaming("");
      if (!awardedThisSession.current) {
        awardedThisSession.current = true;
        award(15, "Tanong kay Gabay");
      }
    } catch (err) {
      setStreaming("");
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "gabay",
          content: "Pasensya, kaibigan. May konting problema sa koneksyon. Subukan ulit?",
          timestamp: todayISO(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = SUGGESTIONS_BY_LANG[lang];

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col px-4 pb-3">
      <div className="flex items-start justify-between">
        <PageHeader title="Gabay AI" subtitle="Coach mo sa pera — RAFI expert." />
        <div className="flex gap-2 pt-4">
          {/* Language toggle */}
          <button
            onClick={cycleLanguage}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold transition hover:bg-secondary/70"
            title="Toggle language"
          >
            <Globe className="size-3.5" />
            {LANG_LABELS[lang]}
          </button>
          {/* Clear chat */}
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); awardedThisSession.current = false; }}
              className="rounded-full bg-secondary p-1.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
              title="Clear chat"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="-mx-4 flex-1 space-y-3 overflow-y-auto px-4 py-2">
        {messages.length === 0 && (
          <div className="rounded-3xl bg-card p-5 text-center shadow-card">
            <Sparkles className="mx-auto size-8 text-primary" />
            <p className="mt-2 font-bold">Kumusta, {profile.name}!</p>
            <p className="text-sm text-muted-foreground">
              Ako si Gabay — RAFI AI coach mo. Magtanong tungkol sa loans, insurance, ipon, o gastos.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {["🏦 RAFI Loans", "🛡️ Insurance", "💰 Ipon", "📊 Gastos"].map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role}>
            {m.content}
          </Bubble>
        ))}
        {streaming && <Bubble role="gabay">{streaming}<span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-primary" /></Bubble>}
        {busy && !streaming && (
          <Bubble role="gabay">
            <span className="inline-flex gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "120ms" }} />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "240ms" }} />
            </span>
          </Bubble>
        )}
      </div>

      {messages.length === 0 && (
        <div className="mb-2 grid grid-cols-2 gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-xl bg-secondary p-2 text-left text-xs font-semibold leading-tight transition hover:bg-secondary/70"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex items-center gap-2"
      >
        {/* Voice button */}
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={busy}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full transition",
            isListening
              ? "animate-pulse bg-destructive text-destructive-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/70"
          )}
          title={isListening ? "Stop listening" : "Voice input"}
        >
          {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        </button>

        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isListening ? "Nakikinig..." : "I-type o i-speak ang tanong mo..."}
          disabled={busy}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || busy} aria-label="Send">
          <Send />
        </Button>
      </form>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "gabay"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft",
          role === "user"
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-card text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
