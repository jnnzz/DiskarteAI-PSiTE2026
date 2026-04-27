import { useEffect, useRef, useState } from "react";
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
} from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildChatContext, streamGabay, type ChatTurn } from "@/lib/ai";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAwardXP } from "@/hooks/useAwardXP";

const SUGGESTIONS = [
  "Paano mag-ipon kahit maliit ang kita?",
  "Ano ba ang emergency fund?",
  "Pwede ba akong mag-invest kahit student pa?",
  "Paano ko ihatian ang sweldo ko?",
];

export default function Gabay() {
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [transactions] = useLocalStorage<Transaction[]>(KEYS.transactions, []);
  const [goals] = useLocalStorage<SavingsGoal[]>(KEYS.goals, []);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(KEYS.chat, []);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const award = useAwardXP();
  const scrollRef = useRef<HTMLDivElement>(null);
  const awardedThisSession = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

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

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col px-4 pb-3">
      <PageHeader title="Gabay AI" subtitle="Coach mo sa pera, sa Tagalog at Cebuano." />

      <div ref={scrollRef} className="-mx-4 flex-1 space-y-3 overflow-y-auto px-4 py-2">
        {messages.length === 0 && (
          <div className="rounded-3xl bg-card p-5 text-center shadow-card">
            <Sparkles className="mx-auto size-8 text-primary" />
            <p className="mt-2 font-bold">Kumusta, {profile.name}!</p>
            <p className="text-sm text-muted-foreground">
              Ako si Gabay. Magtanong ka tungkol sa pera, ipon, o gastos.
            </p>
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
          {SUGGESTIONS.map((s) => (
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
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="I-type ang tanong mo..."
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
