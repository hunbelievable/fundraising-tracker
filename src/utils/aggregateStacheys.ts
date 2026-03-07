import { loadAwardsCSV, StacheyAwardRecord } from './loadAwardsCSV';
import { applyNameCorrection } from './loadCSV';

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
  const records = loadAwardsCSV();

  const map = new Map<string, StacheyLeaderboardEntry>();

  records.forEach((record: StacheyAwardRecord) => {
    if (!record.firstName || !record.lastName) {
      // Skip blank/no winner rows
      return;
    }

    const fullName = `${record.firstName} ${record.lastName}`;
    const [corrFirst, corrLast] = applyNameCorrection(record.firstName, record.lastName);
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
