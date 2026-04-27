import type { AvatarLevel, Profile } from "./storage";

/** Cumulative XP required to reach each level. */
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500];

export function levelForXP(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function avatarLevelFor(level: number): AvatarLevel {
  if (level >= 10) return 10;
  if (level >= 5) return 5;
  if (level >= 3) return 3;
  return 1;
}

export function xpProgress(xp: number): {
  level: number;
  current: number;
  needed: number;
  pct: number;
} {
  const level = levelForXP(xp);
  const floor = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const ceil = LEVEL_THRESHOLDS[level] ?? floor + 1000;
  const current = xp - floor;
  const needed = ceil - floor;
  return { level, current, needed, pct: Math.min(100, (current / needed) * 100) };
}

export type XpAwardResult = {
  newProfile: Profile;
  leveledUp: boolean;
  newLevel: number;
};

export function awardXP(profile: Profile, amount: number): XpAwardResult {
  const oldLevel = levelForXP(profile.totalXP);
  const totalXP = profile.totalXP + amount;
  const newLevel = levelForXP(totalXP);
  const newProfile: Profile = {
    ...profile,
    totalXP,
    avatarLevel: avatarLevelFor(newLevel),
  };
  return { newProfile, leveledUp: newLevel > oldLevel, newLevel };
}
