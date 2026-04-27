import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, blankProfile, type Profile, type BadgeId } from "@/lib/storage";
import { awardXP } from "@/lib/xp";
import { celebrateLevelUp } from "@/lib/celebrate";
import { useCallback } from "react";

/** Returns a function to award XP, show toast, and trigger level-up celebration. */
export function useAwardXP() {
  const [, setProfile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);

  return useCallback(
    (amount: number, reason?: string, badge?: BadgeId) => {
      setProfile((prev) => {
        const { newProfile, leveledUp, newLevel } = awardXP(prev, amount);
        if (badge && !newProfile.badges.includes(badge)) {
          newProfile.badges = [...newProfile.badges, badge];
        }
        if (leveledUp) {
          if (newLevel >= 3 && !newProfile.badges.includes("level-3")) newProfile.badges.push("level-3");
          if (newLevel >= 5 && !newProfile.badges.includes("level-5")) newProfile.badges.push("level-5");
          setTimeout(() => {
            celebrateLevelUp();
            toast.success(`Lvl up! Welcome sa Level ${newLevel}.`, {
              description: "Ang galing-galing mo, kaibigan!",
            });
          }, 100);
        } else {
          toast.success(`+${amount} XP${reason ? ` — ${reason}` : ""}`, {
            description: "Tuloy-tuloy lang!",
          });
        }
        return newProfile;
      });
    },
    [setProfile],
  );
}
