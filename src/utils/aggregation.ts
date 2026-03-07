import { FundraisingRecord } from './loadCSV';

export interface AggregatedLifetime {
  firstName: string;
  lastName: string;
  totalDollars: number;
  top10Finishes: number;
  firstYear: number;
}

interface YearlyTotals {
  year: number;
  total: number;
}

export function aggregateLifetime(data: FundraisingRecord[]): AggregatedLifetime[] {
  const aggregationMap = new Map<string, AggregatedLifetime>();

  data.forEach(row => {
    const key = `${row.firstName} ${row.lastName}`;
    if (!aggregationMap.has(key)) {
      aggregationMap.set(key, {
        firstName: row.firstName,
        lastName: row.lastName,
        totalDollars: 0,
        top10Finishes: 0,
        firstYear: row.year
      });
    }

    const existing = aggregationMap.get(key)!;
    existing.totalDollars += row.totalDollars ?? 0;
    if (row.positionFinished <= 10) {
      existing.top10Finishes += 1;
    }
    existing.firstYear = Math.min(existing.firstYear, row.year);
  });

  return Array.from(aggregationMap.values()).sort((a, b) => b.totalDollars - a.totalDollars);
}

export function aggregateYearlyTotals(data: FundraisingRecord[]): YearlyTotals[] {
  const yearlyMap = new Map<number, number>();

  data.forEach(row => {
    yearlyMap.set(row.year, (yearlyMap.get(row.year) ?? 0) + (row.totalDollars ?? 0));
  });

  return Array.from(yearlyMap.entries())
    .map(([year, total]) => ({ year, total }))
    .sort((a, b) => a.year - b.year);
}

export function bestSingleYearPerformances(data: FundraisingRecord[], limit = 10) {
  return [...data]
    .sort((a, b) => (b.totalDollars ?? 0) - (a.totalDollars ?? 0))
    .slice(0, limit);
}

export function getNiceFinishers(data: FundraisingRecord[]) {
  const years = Array.from(new Set(data.map(row => row.year))).sort();
  return years.map(year => {
    const yearData = data.filter(row => row.year === year);
    const finisher = yearData.find(row => row.positionFinished === 69);
    return { year, finisher: finisher ?? null };
  });
}

export interface RookieYearEntry {
  year: number;
  topRookie: { firstName: string; lastName: string; totalDollars: number; positionFinished: number } | null;
  rookieCount: number;
}

export function getRookiesByYear(data: FundraisingRecord[]): RookieYearEntry[] {
  const years = Array.from(new Set(data.map(r => r.year))).sort();
  const allTimeSeen = new Set<string>();

  return years.map(year => {
    const yearData = data.filter(r => r.year === year);
    const rookies = yearData.filter(r => !allTimeSeen.has(`${r.firstName} ${r.lastName}`));

    yearData.forEach(r => allTimeSeen.add(`${r.firstName} ${r.lastName}`));

    const sorted = [...rookies].sort((a, b) => b.totalDollars - a.totalDollars);
    const top = sorted[0] ?? null;

    return {
      year,
      topRookie: top ? {
        firstName: top.firstName,
        lastName: top.lastName,
        totalDollars: top.totalDollars,
        positionFinished: top.positionFinished,
      } : null,
      rookieCount: rookies.length,
    };
  });
}

export interface ThresholdYearEntry {
  year: number;
  totalGrowers: number;
  count1k: number;
  count10k: number;
}

export function getThresholdGrowthByYear(data: FundraisingRecord[]): ThresholdYearEntry[] {
  const years = Array.from(new Set(data.map(r => r.year))).sort();
  return years.map(year => {
    const yearData = data.filter(r => r.year === year);
    return {
      year,
      totalGrowers: yearData.length,
      count1k: yearData.filter(r => r.totalDollars >= 1000).length,
      count10k: yearData.filter(r => r.totalDollars >= 10000).length,
    };
  });
}
