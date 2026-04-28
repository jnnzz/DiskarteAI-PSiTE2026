import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, blankProfile, type Profile } from "@/lib/storage";
import { awardXP } from "@/lib/xp";
import { celebrateLevelUp } from "@/lib/celebrate";
import { useCallback } from "react";

/** Returns a function to award XP, show toast, and trigger level-up celebration. */
export function useAwardXP() {
  const [, setProfile] = useLocalStorage<Profile>(KEYS.profile, blankProfile);

  return useCallback(
    (amount: number, reason?: string) => {
      setProfile((prev) => {
        const { newProfile, leveledUp, newLevel } = awardXP(prev, amount);
        if (leveledUp) {
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
