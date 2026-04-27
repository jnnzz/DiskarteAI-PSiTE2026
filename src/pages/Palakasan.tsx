import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, type LeaderboardEntry } from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { AvatarArt } from "@/components/AvatarArt";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PODIUM_TINT = ["bg-highlight/20 ring-highlight", "bg-muted ring-muted-foreground/40", "bg-primary/15 ring-primary"];
const MEDALS = ["🥇", "🥈", "🥉"];

export default function Palakasan() {
  const [leaderboard] = useLocalStorage<LeaderboardEntry[]>(KEYS.leaderboard, []);
  const sorted = [...leaderboard].sort((a, b) => b.weeklyXP - a.weeklyXP);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const me = sorted.find((e) => e.isCurrentUser);
  const myRank = me ? sorted.indexOf(me) + 1 : null;

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title="Palakasan" subtitle="Linggong rankings ng komunidad." />

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
        </ul>
      </div>
    </div>
  );
}
