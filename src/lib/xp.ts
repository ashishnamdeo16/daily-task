// XP & Leveling system.
// Level curve: XP required to *reach* level L = 100 * (L-1) * L / 2 (triangular-ish, scaled).
// i.e. each level needs an extra 100 XP than the previous.

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // total cumulative XP needed to reach `level`
  return 50 * (level - 1) * level;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

export interface LevelProgress {
  level: number;
  currentXp: number;
  levelStartXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpForThisLevel: number;
  progress: number; // 0-100
}

export function getLevelProgress(xp: number): LevelProgress {
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  const level = levelForXp(safeXp);
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = safeXp - levelStartXp;
  const xpForThisLevel = nextLevelXp - levelStartXp;
  const progress =
    xpForThisLevel > 0
      ? Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpForThisLevel) * 100)))
      : 0;

  return {
    level,
    currentXp: safeXp,
    levelStartXp,
    nextLevelXp,
    xpIntoLevel,
    xpForThisLevel,
    progress,
  };
}
