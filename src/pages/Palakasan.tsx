import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, blankProfile, VOUCHER_CATALOG, type LeaderboardEntry, type Profile, type Voucher } from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { AvatarArt } from "@/components/AvatarArt";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, ShoppingBag, CheckCircle2, AlertCircle, Lightbulb, Ticket, Coffee, Smartphone, Store, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PODIUM_TINT = ["bg-highlight/20 ring-highlight", "bg-muted ring-muted-foreground/40", "bg-primary/15 ring-primary"];
const MEDALS = ["🥇", "🥈", "🥉"];

const CATEGORY_LABELS: Record<Voucher["category"], string> = {
  food: "Pagkain",
  load: "Load",
  discount: "Diskwento",
  transport: "Transpo",
  business: "Negosyo",
};

const CATEGORY_COLORS: Record<Voucher["category"], string> = {
  food: "bg-orange-500/10 text-orange-600",
  load: "bg-blue-500/10 text-blue-600",
  discount: "bg-green-500/10 text-green-600",
  transport: "bg-yellow-500/10 text-yellow-600",
  business: "bg-purple-500/10 text-purple-600",
};

export default function Palakasan() {
  const [leaderboard] = useLocalStorage<LeaderboardEntry[]>(KEYS.leaderboard, []);
  const [profile, setProfile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);
  const [vouchers, setVouchers] = useLocalStorage<Voucher[]>(KEYS.vouchers, VOUCHER_CATALOG);
  const [confirmVoucher, setConfirmVoucher] = useState<Voucher | null>(null);

  const sorted = [...leaderboard].sort((a, b) => b.weeklyXP - a.weeklyXP);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const me = sorted.find((e) => e.isCurrentUser);
  const myRank = me ? sorted.indexOf(me) + 1 : null;

  // Points: 1 XP = 1 point (simple for demo)
  const points = profile.rewardPoints ?? Math.floor(profile.totalXP * 0.5);

  function redeemVoucher(voucher: Voucher) {
    if (voucher.redeemed) return;
    if (points < voucher.pointsCost) {
      toast.error(`Hindi pa sapat ang points! Kulang pa ng ${voucher.pointsCost - points} pts.`);
      return;
    }
    setConfirmVoucher(voucher);
  }

  function confirmRedeem() {
    if (!confirmVoucher) return;
    setProfile((p) => ({ ...p, rewardPoints: Math.max(0, (p.rewardPoints ?? 0) - confirmVoucher.pointsCost) }));
    setVouchers((all) =>
      all.map((v) => v.id === confirmVoucher.id ? { ...v, redeemed: true, redeemedAt: new Date().toISOString() } : v)
    );
    toast.success(`Na-redeem na! ${confirmVoucher.emoji} ${confirmVoucher.title}`, {
      description: "Ipakita ang notification na ito sa partner store.",
    });
    setConfirmVoucher(null);
  }

  const availableVouchers = vouchers.filter((v) => !v.redeemed);
  const redeemedVouchers = vouchers.filter((v) => v.redeemed);

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="Palakasan" subtitle="Rankings at Rewards ng komunidad." />

      {/* Points balance */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-warm p-[2px] shadow-card">
        <div className="flex w-full items-center gap-3 rounded-[calc(1rem-2px)] bg-card px-4 py-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-highlight/20 text-primary">
            <Star className="size-6 fill-current" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kabuhayan Points</p>
            <p className="text-2xl font-extrabold text-foreground tabular">{points.toLocaleString()} pts</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Mula sa</p>
            <p className="text-xs font-bold text-primary">ipon, bayad & edukasyon</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leaderboard"><Trophy className="mr-2 size-4 text-primary" /> Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards"><Gift className="mr-2 size-4 text-primary" /> Rewards Store</TabsTrigger>
        </TabsList>

        {/* LEADERBOARD TAB */}
        <TabsContent value="leaderboard" className="mt-4">
          {myRank && (
            <div className="mb-4 rounded-2xl bg-card p-3 text-sm shadow-soft">
              <p>
                <span className="font-bold text-primary">Rank #{myRank}</span> ka ngayon —{" "}
                {myRank > 3 ? `${myRank - 3} missions na lang para sa podium!` : "Ikaw ang isa sa top 3! 🔥"}
              </p>
            </div>
          )}

          {/* Podium */}
          <div className="mb-6 grid grid-cols-3 items-end gap-2">
            {[top3[1], top3[0], top3[2]].map((entry, displayIdx) => {
              if (!entry) return <div key={displayIdx} />;
              const realIdx = sorted.indexOf(entry);
              const heights = [88, 110, 76];
              return (
                <motion.div
                  key={entry.id}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: displayIdx * 0.12, duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                  <div className={cn("relative", entry.isCurrentUser && "animate-bounce-in")}>
                    <AvatarArt level={entry.avatarVariant} size={displayIdx === 1 ? 72 : 56} />
                    <span className="absolute -right-1 -top-1 text-2xl">{MEDALS[realIdx]}</span>
                  </div>
                  <p className="mt-2 max-w-[90px] truncate text-center text-xs font-bold">{entry.name}</p>
                  <p className="text-[11px] text-muted-foreground tabular">{entry.weeklyXP} XP</p>
                  <div
                    className={cn("mt-1.5 w-full rounded-t-xl ring-2 ring-inset", PODIUM_TINT[realIdx])}
                    style={{ height: heights[displayIdx] }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Rest */}
          <div>
            <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Iba pang ranking
            </h3>
            <ul className="space-y-1.5">
              {rest.map((entry, i) => {
                const rank = i + 4;
                return (
                  <li
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 shadow-soft",
                      entry.isCurrentUser ? "bg-primary/10 ring-2 ring-primary/40" : "bg-card",
                    )}
                  >
                    <span className="w-6 text-center text-sm font-extrabold text-muted-foreground tabular">
                      #{rank}
                    </span>
                    <AvatarArt level={entry.avatarVariant} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{entry.name}</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-bold tabular">
                      <Trophy className="size-3.5 text-highlight" />
                      {entry.weeklyXP}
                    </span>
                  </li>
                );
              })}
              {rest.length === 0 && leaderboard.length === 0 && (
                <li className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
                  Mag-complete ng missions para lumabas sa leaderboard!
                </li>
              )}
            </ul>
          </div>
        </TabsContent>

        {/* REWARDS STORE TAB */}
        <TabsContent value="rewards" className="mt-4 space-y-4">
          <div className="rounded-2xl bg-secondary p-3 text-sm">
            <p className="font-semibold flex items-center gap-1"><Lightbulb className="size-4 text-primary" /> Paano mo kita ang Kabuhayan Points?</p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              <li>• Mag-ipon at mag-deposit sa goals</li>
              <li>• Mag-bayad ng RAFI loan on-time</li>
              <li>• Tapusin ang education modules</li>
              <li>• Mag-scan ng receipts at mag-log ng gastos</li>
            </ul>
          </div>

          {/* Available vouchers */}
          <div>
            <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <ShoppingBag className="mr-1 inline size-3.5" />
              Available Vouchers
            </h3>
            <ul className="space-y-3">
              {availableVouchers.map((v) => {
                const canAfford = points >= v.pointsCost;
                let Icon = Ticket;
                if (v.category === "load") Icon = Smartphone;
                if (v.category === "food") Icon = Coffee;
                if (v.category === "discount") Icon = Store;
                return (
                  <li key={v.id} className={cn(
                    "rounded-2xl bg-card p-4 shadow-card transition",
                    !canAfford && "opacity-70"
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Icon className="size-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold">{v.title}</p>
                            <p className="text-xs text-muted-foreground">{v.partner}</p>
                          </div>
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", CATEGORY_COLORS[v.category])}>
                            {CATEGORY_LABELS[v.category]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-sm font-extrabold text-highlight">
                            <Star className="size-3.5 fill-current" />
                            {v.pointsCost} pts
                          </div>
                          <Button
                            size="sm"
                            variant={canAfford ? "default" : "outline"}
                            disabled={!canAfford}
                            onClick={() => redeemVoucher(v)}
                          >
                            {canAfford ? "I-redeem" : `Kulang pa ng ${v.pointsCost - points} pts`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Redeemed vouchers */}
          {redeemedVouchers.length > 0 && (
            <div>
              <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <CheckCircle2 className="mr-1 inline size-3.5" />
                Na-redeem na
              </h3>
              <ul className="space-y-2">
                {redeemedVouchers.map((v) => {
                  let Icon = Ticket;
                  if (v.category === "load") Icon = Smartphone;
                  if (v.category === "food") Icon = Coffee;
                  if (v.category === "discount") Icon = Store;
                  return (
                    <li key={v.id} className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5 opacity-60">
                      <Icon className="size-5 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold line-through">{v.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Na-redeem {v.redeemedAt ? new Date(v.redeemedAt).toLocaleDateString("en-PH") : ""}
                        </p>
                      </div>
                      <CheckCircle2 className="size-4 text-accent" />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm redemption modal */}
      <AnimatePresence>
        {confirmVoucher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4"
            onClick={() => setConfirmVoucher(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                  {confirmVoucher.category === "load" && <Smartphone className="size-8" />}
                  {confirmVoucher.category === "food" && <Coffee className="size-8" />}
                  {confirmVoucher.category === "discount" && <Store className="size-8" />}
                  {confirmVoucher.category !== "load" && confirmVoucher.category !== "food" && confirmVoucher.category !== "discount" && <Ticket className="size-8" />}
                </div>
                <h3 className="text-lg font-extrabold">{confirmVoucher.title}</h3>
                <p className="text-sm text-muted-foreground">{confirmVoucher.partner}</p>
                <p className="mt-2 text-sm">{confirmVoucher.description}</p>
              </div>
              <div className="mb-4 rounded-2xl bg-secondary p-3 text-center">
                <p className="text-xs text-muted-foreground">Gagastusin</p>
                <p className="text-2xl font-extrabold text-highlight">{confirmVoucher.pointsCost} pts</p>
                <p className="text-xs text-muted-foreground">Matitira: {points - confirmVoucher.pointsCost} pts</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setConfirmVoucher(null)}>
                  Kanselahin
                </Button>
                <Button size="lg" className="flex-1" onClick={confirmRedeem}>
                  I-confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
