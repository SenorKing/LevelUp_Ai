const XP_PER_LEVEL = 100;
const LEVELS_PER_RANK = 10;
const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

/**
 * Turns a total XP number into everything the UI needs to show:
 * current level, current rank, how much XP is left to level up,
 * and how many levels are left to rank up.
 */
function getLevelInfo(totalXp) {
  const xp = Math.max(0, totalXp || 0);

  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel;
  const xpPercent = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);

  const rankIndex = Math.min(Math.floor((level - 1) / LEVELS_PER_RANK), RANKS.length - 1);
  const rank = RANKS[rankIndex];
  const isMaxRank = rankIndex === RANKS.length - 1;
  const nextRankStartLevel = (rankIndex + 1) * LEVELS_PER_RANK + 1;
  const levelsToNextRank = isMaxRank ? 0 : nextRankStartLevel - level;
  const nextRank = isMaxRank ? null : RANKS[rankIndex + 1];

  return {
    totalXp: xp,
    level,
    rank,
    nextRank,
    xpIntoLevel,
    xpToNextLevel,
    xpPercent,
    levelsToNextRank,
    isMaxRank
  };
}

module.exports = { getLevelInfo, XP_PER_LEVEL, LEVELS_PER_RANK, RANKS };
