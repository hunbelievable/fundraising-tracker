import { loadOmahaAwards, applyOmahaNameCorrection } from 'mustache-historian/server';
import type { StacheyAwardRecord } from 'mustache-historian';

export type StacheyLeaderboardEntry = {
  fullName: string;
  /** Canonical name used for the /grower/[name] URL (after name corrections). */
  linkName: string;
  totalAwards: number;
  awards: {
    awardName: string;
    year: number;
    nickname?: string | null;
  }[];
};

export function buildStacheyLeaderboard(): StacheyLeaderboardEntry[] {
  const records = loadOmahaAwards();

  const map = new Map<string, StacheyLeaderboardEntry>();

  records.forEach((record: StacheyAwardRecord) => {
    if (!record.firstName || !record.lastName) {
      // Skip blank/no winner rows
      return;
    }

    const fullName = `${record.firstName} ${record.lastName}`;
    const [corrFirst, corrLast] = applyOmahaNameCorrection(record.firstName, record.lastName);
    const linkName = `${corrFirst} ${corrLast}`;

    if (!map.has(fullName)) {
      map.set(fullName, {
        fullName,
        linkName,
        totalAwards: 1,
        awards: [{ awardName: record.awardName, year: record.year, nickname: record.nickname }],
      });
    } else {
      const entry = map.get(fullName)!;
      entry.totalAwards += 1;
      entry.awards.push({ awardName: record.awardName, year: record.year, nickname: record.nickname });
    }
  });

  const leaderboard = Array.from(map.values());
  leaderboard.sort((a, b) => b.totalAwards - a.totalAwards);

  return leaderboard;
}
