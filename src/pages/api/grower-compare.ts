import type { NextApiRequest, NextApiResponse } from 'next';
import { loadAllCSVData, applyNameCorrection } from '@/utils/loadCSV';
import { loadAwardsCSV } from '@/utils/loadAwardsCSV';
import { getMeleeHistoryForGrower } from '@/utils/melee';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query;
  const names: string[] = Array.isArray(name) ? name : name ? [name] : [];

  if (names.length === 0) {
    return res.status(400).json({ error: 'name parameter required' });
  }

  const allData = loadAllCSVData();
  const allAwards = loadAwardsCSV();

  // Build awards lookup once
  const awardsMap: Record<string, Array<{ year: number; awardName: string; nickname: string | null }>> = {};
  for (const award of allAwards) {
    if (!award.firstName || !award.lastName) continue;
    const [cf, cl] = applyNameCorrection(award.firstName, award.lastName);
    const key = `${cf} ${cl}`;
    if (!awardsMap[key]) awardsMap[key] = [];
    awardsMap[key].push({ year: award.year, awardName: award.awardName, nickname: award.nickname ?? null });
  }

  const result: Record<string, object> = {};

  for (const targetName of names) {
    const records = allData.filter(r => `${r.firstName} ${r.lastName}` === targetName);

    const yearMap: Record<number, number> = {};
    for (const r of records) yearMap[r.year] = (yearMap[r.year] ?? 0) + r.totalDollars;
    const yearlyData = Object.entries(yearMap)
      .map(([y, t]) => ({ year: parseInt(y), total: t }))
      .sort((a, b) => a.year - b.year);

    const totalDollars = records.reduce((s, r) => s + r.totalDollars, 0);
    const yearsCompeted = yearlyData.length;
    const top10Finishes = records.filter(r => r.positionFinished <= 10).length;
    const bestRank = records.length > 0 ? Math.min(...records.map(r => r.positionFinished)) : 999;

    result[targetName] = {
      totalDollars,
      yearsCompeted,
      avgPerYear: yearsCompeted > 0 ? Math.round(totalDollars / yearsCompeted) : 0,
      bestRank,
      top10Finishes,
      firstYear: yearsCompeted > 0 ? yearlyData[0].year : 0,
      lastYear: yearsCompeted > 0 ? yearlyData[yearlyData.length - 1].year : 0,
      stacheyAwards: (awardsMap[targetName] ?? []).sort((a, b) => a.year - b.year),
      meleeHistory: getMeleeHistoryForGrower(targetName),
      yearlyData,
    };
  }

  res.status(200).json(result);
}
