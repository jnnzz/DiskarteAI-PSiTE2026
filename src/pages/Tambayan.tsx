import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  KEYS,
  blankProfile,
  uid,
  todayISO,
  type TambayanPost,
  type PaluwagaGroup,
  type PaluwagaMember,
  type PaluwagaContribution,
  type Profile,
} from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { AvatarArt } from "@/components/AvatarArt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Heart, Plus, Copy, CheckCircle2, Users, Clock, Trophy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAwardXP } from "@/hooks/useAwardXP";
import { Peso } from "@/components/Peso";

// ── Tambayan Main ──────────────────────────────────────────────────
export default function Tambayan() {
  const [posts, setPosts] = useLocalStorage<TambayanPost[]>(KEYS.tambayan, []);
  const [paluwagans, setPaluwagans] = useLocalStorage<PaluwagaGroup[]>(KEYS.paluwagan, []);
  const [profile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);

  function toggleHeart(id: string) {
    setPosts((all) =>
      all.map((p) =>
        p.id === id
          ? { ...p, hearted: !p.hearted, hearts: p.hearts + (p.hearted ? -1 : 1) }
          : p,
      ),
    );
  }

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="Tambayan" subtitle="Komunidad at Paluwagan." />

      <Tabs defaultValue="paluwagan">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paluwagan">💰 Paluwagan</TabsTrigger>
          <TabsTrigger value="community">🤝 Community</TabsTrigger>
        </TabsList>

        {/* PALUWAGAN TAB */}
        <TabsContent value="paluwagan" className="mt-4">
          <PaluwagaHub
            paluwagans={paluwagans}
            setPaluwagans={setPaluwagans}
            profile={profile}
          />
        </TabsContent>

        {/* COMMUNITY WALL TAB */}
        <TabsContent value="community" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button
              size="sm"
              variant="default"
              onClick={() => toast.info("Coming soon, kaibigan!", { description: "Posting feature is on the way." })}
            >
              <Plus className="size-3.5" /> Mag-post
            </Button>
          </div>
          <ul className="grid gap-3 lg:grid-cols-2">
            {posts.map((p) => (
              <li key={p.id} className="rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <AvatarArt level={p.authorAvatar} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold">{p.authorName}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(p.timestamp)}</p>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{p.content}</p>
                    <button
                      onClick={() => toggleHeart(p.id)}
                      className={cn(
                        "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition",
                        p.hearted ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <Heart className={cn("size-3.5", p.hearted && "fill-current")} />
                      {p.hearts}
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {posts.length === 0 && (
              <li className="rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-soft">
                Wala pang posts. Tahimik na komunidad muna.
              </li>
            )}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Paluwagan Hub ──────────────────────────────────────────────────
function PaluwagaHub({
  paluwagans,
  setPaluwagans,
  profile,
}: {
  paluwagans: PaluwagaGroup[];
  setPaluwagans: (v: PaluwagaGroup[] | ((p: PaluwagaGroup[]) => PaluwagaGroup[])) => void;
  profile: Profile;
}) {
  const award = useAwardXP();
  const [openCreate, setOpenCreate] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Create form state
  const [gName, setGName] = useState("");
  const [gAmount, setGAmount] = useState("");
  const [gFreq, setGFreq] = useState<"weekly" | "monthly">("weekly");
  const [gSlots, setGSlots] = useState("5");

  function createGroup() {
    if (!gName.trim() || !gAmount || !gSlots) return;
    const slots = Number(gSlots);
    const members: PaluwagaMember[] = [
      {
        id: uid(),
        name: profile.name,
        isCurrentUser: true,
        payoutOrder: 1,
        contributions: Array.from({ length: slots }, (_, i) => ({
          id: uid(),
          round: i + 1,
          amount: Number(gAmount),
          paid: false,
        })),
      },
    ];

    // Add mock members to fill groupfor demo purposes
    const mockNames = ["Maria Santos", "Juan Dela Cruz", "Ana Reyes", "Pedro Lopez", "Rosa Gomez"];
    for (let i = 1; i < slots; i++) {
      members.push({
        id: uid(),
        name: mockNames[(i - 1) % mockNames.length],
        isCurrentUser: false,
        payoutOrder: i + 1,
        contributions: Array.from({ length: slots }, (_, j) => ({
          id: uid(),
          round: j + 1,
          amount: Number(gAmount),
          paid: Math.random() > 0.3, // mock some as paid
        })),
      });
    }

    const group: PaluwagaGroup = {
      id: uid(),
      name: gName.trim(),
      contributionAmount: Number(gAmount),
      frequency: gFreq,
      members,
      currentRound: 1,
      totalRounds: slots,
      startDate: todayISO(),
      completed: false,
      inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    };

    setPaluwagans((all) => [...all, group]);
    setGName("");
    setGAmount("");
    setGSlots("5");
    setOpenCreate(false);
    award(30, "Paluwagan na-create!", "paluwagan-member");
    toast.success(`Paluwagan "${group.name}" na-create! Invite code: ${group.inviteCode}`);
  }

  const activeGroup = paluwagans.find((g) => g.id === activeGroupId);

  return (
    <div className="space-y-4">
      {/* Intro card */}
      <div className="rounded-2xl bg-secondary p-3 text-sm">
        <p className="font-bold text-foreground">💡 Ano ang Paluwagan?</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Rotating savings group. Bawat miyembro mag-co-contribute bawat round. Isa-isang makakatanggap ng buong koleksyon. Pag tapos na lahat — lahat makakakuha ng Kabuhayan Points!
        </p>
      </div>

      {/* Create button */}
      <div className="flex justify-end">
        <Sheet open={openCreate} onOpenChange={setOpenCreate}>
          <SheetTrigger asChild>
            <Button size="sm" variant="default">
              <Plus className="size-3.5" /> Gumawa ng Paluwagan
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Bagong Paluwagan Group</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Pangalan ng Grupo</Label>
                <Input value={gName} onChange={e => setGName(e.target.value)} placeholder="Samahan ni Aling Rosa" />
              </div>
              <div>
                <Label>Contribution Amount (₱) bawat round</Label>
                <Input type="number" inputMode="numeric" value={gAmount} onChange={e => setGAmount(e.target.value)} placeholder="500" />
              </div>
              <div>
                <Label>Frequency</Label>
                <div className="mt-1 flex gap-2">
                  {(["weekly", "monthly"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setGFreq(f)}
                      className={cn(
                        "flex-1 rounded-xl border-2 py-2 text-sm font-semibold capitalize transition",
                        gFreq === f ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-secondary"
                      )}
                    >
                      {f === "weekly" ? "Lingguhang" : "Buwanang"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Bilang ng miyembro (slots)</Label>
                <Input type="number" inputMode="numeric" value={gSlots} onChange={e => setGSlots(e.target.value)} placeholder="5" min="2" max="10" />
              </div>
              <Button onClick={createGroup} size="xl" disabled={!gName.trim() || !gAmount || !gSlots}>
                I-create ang Paluwagan
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Groups list */}
      {paluwagans.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center shadow-soft">
          <Users className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-2 font-bold">Wala pang paluwagan</p>
          <p className="text-sm text-muted-foreground">Mag-create ng grupo o hanapin ang invite code ng grupo mo.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {paluwagans.map((g) => {
            const me = g.members.find(m => m.isCurrentUser);
            const myRound = me?.payoutOrder ?? 0;
            const progressRounds = Math.min(g.currentRound - 1, g.totalRounds);
            const pct = (progressRounds / g.totalRounds) * 100;
            const potPayout = g.contributionAmount * g.members.length;

            return (
              <li key={g.id}>
                <button
                  onClick={() => setActiveGroupId(g.id)}
                  className="flex w-full flex-col gap-3 rounded-3xl bg-card p-4 text-left shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold">{g.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {g.members.length} miyembro · {g.frequency === "weekly" ? "Lingguhang" : "Buwanang"} · <Peso amount={g.contributionAmount} className="text-xs" />
                      </p>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      g.completed ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                    )}>
                      {g.completed ? "✓ Tapos" : `Round ${g.currentRound}/${g.totalRounds}`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>Payout: <Peso amount={potPayout} className="text-xs font-bold text-accent" /></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {me && (
                    <p className="text-xs">
                      Ikaw ang <strong>#{myRound}</strong> sa payout order.
                      {myRound === g.currentRound ? (
                        <span className="ml-1 font-bold text-highlight"> Ikaw ang susunod na makakatanggap! 🎉</span>
                      ) : myRound < g.currentRound ? (
                        <span className="ml-1 text-accent"> Na-payout ka na ✓</span>
                      ) : (
                        <span className="ml-1 text-muted-foreground"> {myRound - g.currentRound} round pa</span>
                      )}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Group detail sheet */}
      <Sheet open={!!activeGroupId} onOpenChange={(o) => !o && setActiveGroupId(null)}>
        <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl">
          {activeGroup && (
            <GroupDetail
              group={activeGroup}
              onUpdate={(g) => setPaluwagans((all) => all.map((x) => x.id === g.id ? g : x))}
              onComplete={(g) => {
                setPaluwagans((all) => all.map((x) => x.id === g.id ? g : x));
                award(200, "Paluwagan nakumpleto! 🎊", "paluwagan-member");
                toast.success("Paluwagan completed! Lahat ng miyembro ay nakakuha ng Kabuhayan Points!", { duration: 6000 });
                setActiveGroupId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Group Detail Sheet ─────────────────────────────────────────────
function GroupDetail({
  group,
  onUpdate,
  onComplete,
}: {
  group: PaluwagaGroup;
  onUpdate: (g: PaluwagaGroup) => void;
  onComplete: (g: PaluwagaGroup) => void;
}) {
  function copyInviteCode() {
    navigator.clipboard.writeText(group.inviteCode);
    toast.success(`Invite code na-copy: ${group.inviteCode}`);
  }

  function payContribution(memberId: string, round: number) {
    const updated: PaluwagaGroup = {
      ...group,
      members: group.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              contributions: m.contributions.map((c) =>
                c.round === round ? { ...c, paid: true, paidDate: todayISO() } : c
              ),
            }
          : m
      ),
    };
    // Advance round if all members paid for current round
    const allPaidThisRound = updated.members.every((m) =>
      m.contributions.find((c) => c.round === updated.currentRound)?.paid
    );
    if (allPaidThisRound && updated.currentRound < updated.totalRounds) {
      updated.currentRound = updated.currentRound + 1;
      toast.success(`Round ${updated.currentRound - 1} done! Nagsimula na ang Round ${updated.currentRound}.`);
    }

    // Check if fully complete
    const allComplete = updated.currentRound === updated.totalRounds && allPaidThisRound;
    if (allComplete) {
      onComplete({ ...updated, completed: true });
    } else {
      onUpdate(updated);
    }
  }

  const me = group.members.find((m) => m.isCurrentUser);
  const myContrib = me?.contributions.find((c) => c.round === group.currentRound);
  const potPayout = group.contributionAmount * group.members.length;
  const payoutRecipient = group.members.find((m) => m.payoutOrder === group.currentRound);

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>{group.name}</SheetTitle>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4 pt-3">
        {/* Invite code */}
        <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase text-muted-foreground">Invite Code</p>
            <p className="text-xl font-extrabold tracking-widest text-foreground">{group.inviteCode}</p>
          </div>
          <Button size="sm" variant="outline" onClick={copyInviteCode}>
            <Copy className="size-3.5" /> Copy
          </Button>
        </div>

        {/* Current round info */}
        {!group.completed && (
          <div className="rounded-2xl bg-gradient-warm p-[1.5px]">
            <div className="rounded-[calc(1rem-1.5px)] bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Round {group.currentRound} of {group.totalRounds}
              </p>
              <p className="mt-1 text-sm">
                Payout ngayong round: <strong>{payoutRecipient?.name}</strong>
              </p>
              <p className="text-lg font-extrabold text-accent">
                <Peso amount={potPayout} className="text-lg" />
              </p>
            </div>
          </div>
        )}

        {group.completed && (
          <div className="rounded-2xl bg-accent/10 p-4 text-center">
            <Trophy className="mx-auto size-8 text-accent" />
            <p className="mt-1 font-bold text-accent">Paluwagan Completed! 🎊</p>
            <p className="text-sm text-muted-foreground">Lahat ng miyembro ay nakabayad at nakakuha ng payout.</p>
          </div>
        )}

        {/* My contribution status */}
        {me && !group.completed && (
          <div className={cn(
            "rounded-2xl p-4",
            myContrib?.paid ? "bg-accent/10" : "bg-destructive/10"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Aking contribution</p>
                <p className="text-xs text-muted-foreground">Round {group.currentRound}</p>
              </div>
              {myContrib?.paid ? (
                <span className="flex items-center gap-1 text-xs font-bold text-accent">
                  <CheckCircle2 className="size-4" /> Nabayad na!
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => me && payContribution(me.id, group.currentRound)}
                >
                  Bayaran (<Peso amount={group.contributionAmount} className="text-xs" />)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Members list */}
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Users className="mr-1 inline size-3.5" />
            Mga Miyembro ({group.members.length})
          </h4>
          <ul className="space-y-2">
            {group.members.map((m) => {
              const currentContrib = m.contributions.find((c) => c.round === group.currentRound);
              const isPayout = m.payoutOrder === group.currentRound;
              return (
                <li
                  key={m.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5",
                    m.isCurrentUser ? "bg-primary/10 ring-2 ring-primary/30" : "bg-card shadow-soft"
                  )}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary font-bold text-sm">
                    #{m.payoutOrder}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{m.name} {m.isCurrentUser && "(Ikaw)"}</p>
                    {isPayout && !group.completed && (
                      <p className="text-[10px] font-bold text-highlight">🎉 Payout recipient ngayong round!</p>
                    )}
                  </div>
                  {currentContrib?.paid ? (
                    <CheckCircle2 className="size-4 shrink-0 text-accent" />
                  ) : (
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Round history */}
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Round History
          </h4>
          <div className="space-y-1.5">
            {Array.from({ length: group.totalRounds }, (_, i) => {
              const roundNum = i + 1;
              const recipient = group.members.find(m => m.payoutOrder === roundNum);
              const allPaid = group.members.every(m => m.contributions.find(c => c.round === roundNum)?.paid);
              const isCurrent = group.currentRound === roundNum;
              return (
                <div key={roundNum} className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2",
                  isCurrent ? "bg-card shadow-soft ring-2 ring-primary/30" : allPaid ? "bg-accent/5" : "bg-secondary"
                )}>
                  <span className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-extrabold",
                    allPaid ? "bg-accent text-accent-foreground" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {allPaid ? "✓" : roundNum}
                  </span>
                  <div className="flex-1 text-xs">
                    <span className="font-semibold">Round {roundNum}</span>
                    {recipient && <span className="ml-1 text-muted-foreground">→ {recipient.name}</span>}
                  </div>
                  {isCurrent && <span className="text-[10px] font-bold text-primary">Ngayon</span>}
                  {allPaid && !isCurrent && <span className="text-[10px] font-bold text-accent">Done</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400_000);
  if (d === 0) return "ngayon";
  if (d === 1) return "kahapon";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-PH");
}
