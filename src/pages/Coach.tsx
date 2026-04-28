import { useEffect, useRef, useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBudget } from "@/hooks/useBudget";
import { useStoryEngine } from "@/hooks/useStoryEngine";
import {
  KEYS, blankProfile, blankBudget, uid, todayISO,
  type ChatMessage, type Profile, type SavingsGoal, type Transaction,
  type Budget, type Mission, type Language, type Reminder,
} from "@/lib/storage";
import { defaultMissions } from "@/lib/missions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildChatContext, streamGabayV2, parseReminderFromResponse, stripReminderJson, type ChatTurn } from "@/lib/ai";
import { Send, Sparkles, Mic, MicOff, Globe, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import avatarGabay from "@/assets/avatar-gabay.png";
import { toast } from "sonner";

const SUGGESTIONS: Record<Language, string[]> = {
  tagalog: ["Kaya ko bang bumili ng milk tea?", "Magkano pa ang budget ko?", "Paano mag-ipon?", "Ano kung gagastos ng ₱500?"],
  cebuano: ["Kaya pa ba nako mopalit ug milk tea?", "Pila pa ang budget?", "Unsaon pag-ipon?", "Unsa kung mogasto ₱500?"],
  english: ["Can I afford milk tea?", "How much budget left?", "How to save?", "What if I spend ₱500?"],
};
const LANG_LABELS: Record<Language, string> = { tagalog: "Filipino", cebuano: "Cebuano", english: "English" };
const LANG_CYCLE: Language[] = ["tagalog", "cebuano", "english"];

export default function Coach() {
  const [profile, setProfile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
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
  const awarded = useRef(false);
  const recRef = useRef<any>(null);
  const bData = useBudget();
  const { onChatUsed } = useStoryEngine();
  const lang = profile.language ?? "tagalog";

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, streaming]);

  const cycleLang = () => { const n = LANG_CYCLE[(LANG_CYCLE.indexOf(lang)+1)%LANG_CYCLE.length]; setProfile(p=>({...p,language:n})); toast.info(`Language: ${LANG_LABELS[n]}`); };

  const startListen = useCallback(() => {
    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!API) { toast.error("Voice not supported."); return; }
    const r = new API(); r.lang = lang==="english"?"en-US":"fil-PH"; r.continuous=false; r.interimResults=true;
    r.onstart=()=>setIsListening(true);
    r.onresult=(e:any)=>{ setDraft(Array.from(e.results).map(r=>r[0].transcript).join("")); };
    r.onend=()=>setIsListening(false); r.onerror=()=>{setIsListening(false);toast.error("Hindi narinig.");};
    recRef.current=r; r.start();
  }, [lang]);

  async function send(text: string) {
    if (!text.trim()||busy) return;
    const userMsg: ChatMessage = { id:uid(), role:"user", content:text.trim(), timestamp:todayISO() };
    const next = [...messages, userMsg]; setMessages(next); setDraft(""); setBusy(true); setStreaming("");
    try {
      const turns: ChatTurn[] = next.map(m=>({role:m.role,content:m.content}));
      const ctx = buildChatContext(profile,transactions,goals,budget,bData.weeklyRemaining,missions);
      let acc="";
      await streamGabayV2(turns,ctx,d=>{acc+=d;setStreaming(acc);});
      // Parse and save reminder if AI included one
      const reminderData = parseReminderFromResponse(acc);
      const cleanContent = stripReminderJson(acc);
      setMessages(m=>[...m,{id:uid(),role:"gabay",content:cleanContent,timestamp:todayISO()}]);
      setStreaming("");
      if (reminderData) {
        const newReminder: Reminder = {
          id: uid(), ...reminderData,
          completed: false, createdAt: todayISO(), source: "chat",
        };
        setReminders(prev => [...prev, newReminder]);
        toast.success(`✅ Reminder added: ${reminderData.title} — ₱${reminderData.amount.toLocaleString()} on ${reminderData.dueDate}`);
      }
      if(!awarded.current){awarded.current=true;onChatUsed();}
    } catch { setStreaming(""); setMessages(m=>[...m,{id:uid(),role:"gabay",content:"Pasensya, may problema. Subukan ulit?",timestamp:todayISO()}]); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col px-4 pb-3">
      <div className="flex items-start justify-between">
        <PageHeader title="Gabay AI" subtitle="Coach mo sa pera — tanungin bago gumastos." />
        <div className="flex gap-2 pt-4">
          <button onClick={cycleLang} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold transition hover:bg-secondary/70"><Globe className="size-3.5" />{LANG_LABELS[lang]}</button>
          {messages.length>0&&<button onClick={()=>{setMessages([]);awarded.current=false;}} className="rounded-full bg-secondary p-1.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"><Trash2 className="size-3.5" /></button>}
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-xs font-semibold">
        <span className={cn("size-2 rounded-full",bData.status==="green"?"bg-accent":bData.status==="yellow"?"bg-highlight":"bg-destructive")} />
        <span>Budget: ₱{bData.weeklyRemaining.toLocaleString()} natitira</span>
        <span className="text-muted-foreground">· ₱{bData.todaySpent.toLocaleString()} gastos ngayon</span>
      </div>

      <div ref={scrollRef} className="-mx-4 flex-1 space-y-3 overflow-y-auto px-4 py-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {messages.length===0&&(
          <div className="rounded-3xl bg-card p-5 text-center shadow-card flex flex-col items-center">
            <div className="size-24 rounded-full shadow-md overflow-hidden bg-secondary mb-3 flex items-center justify-center">
              <img src={avatarGabay} alt="Gabay AI" className="h-full w-full object-cover scale-125" />
            </div>
            <p className="mt-2 font-bold text-lg">Kumusta, {profile.name}!</p>
            <p className="text-sm text-muted-foreground">Ako si Gabay — coach mo sa pera. Tanungin mo ako bago ka gumastos!</p>
          </div>
        )}
        {messages.map(m=><Bubble key={m.id} role={m.role}>{m.content}</Bubble>)}
        {streaming&&<Bubble role="gabay">{streaming}<span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-primary" /></Bubble>}
        {busy&&!streaming&&<Bubble role="gabay"><span className="inline-flex gap-1"><span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" /><span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{animationDelay:"120ms"}} /><span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{animationDelay:"240ms"}} /></span></Bubble>}
      </div>

      {messages.length===0&&<div className="mb-2 grid grid-cols-2 gap-1.5">{SUGGESTIONS[lang].map(s=><button key={s} onClick={()=>send(s)} className="rounded-xl bg-secondary p-2 text-left text-xs font-semibold leading-tight transition hover:bg-secondary/70">{s}</button>)}</div>}

      <form onSubmit={e=>{e.preventDefault();send(draft);}} className="flex items-center gap-2">
        <button type="button" onClick={isListening?()=>{recRef.current?.stop();setIsListening(false);}:startListen} disabled={busy} className={cn("flex size-10 shrink-0 items-center justify-center rounded-full transition",isListening?"animate-pulse bg-destructive text-destructive-foreground":"bg-secondary text-muted-foreground hover:bg-secondary/70")}>
          {isListening?<MicOff className="size-4" />:<Mic className="size-4" />}
        </button>
        <Input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={isListening?"Nakikinig...":"Tanungin o i-log ang gastos..."} disabled={busy} className="flex-1" />
        <Button type="submit" size="icon" disabled={!draft.trim()||busy} aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}

function Bubble({role,children}:{role:"user"|"gabay";children:React.ReactNode}) {
  return (
    <div className={cn("flex items-end gap-2",role==="user"?"justify-end":"justify-start")}>
      {role === "gabay" && (
        <div className="size-12 shrink-0 rounded-full shadow-sm overflow-hidden bg-secondary flex items-center justify-center">
          <img src={avatarGabay} alt="Gabay" className="h-full w-full object-cover scale-125" />
        </div>
      )}
      <div className={cn("max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft",role==="user"?"rounded-br-sm bg-primary text-primary-foreground":"rounded-bl-sm bg-card text-foreground")}>{children}</div>
    </div>
  );
}
