import fs from 'fs';
import path from 'path';

export type MeleeRound = 'R16' | 'QF' | 'SF' | 'Final' | 'Champion';

export interface MeleeAppearance {
  year: number;
  deepestRound: MeleeRound;
  isChampion: boolean;
}

const ROUND_RANK: Record<MeleeRound, number> = {
  R16: 1,
  QF: 2,
  SF: 3,
  Final: 4,
  Champion: 5,
};

function deeper(current: MeleeRound | null, candidate: MeleeRound): MeleeRound {
  if (!current) return candidate;
  return ROUND_RANK[candidate] > ROUND_RANK[current] ? candidate : current;
}

/** True if the grower's full name appears anywhere in a bracket participant string.
 *  Handles substitution notes like "Tom Rosencrans (Ryan Herrick)" gracefully. */
function nameMatch(participant: string, growerName: string): boolean {
  return participant.includes(growerName);
}

interface R16Match  { p1: string; p2: string; winner: string }
interface QFMatch   { p1: string; p2: string; winner: string }
interface Region    { name: string | null; r16: R16Match[]; qf: QFMatch }
interface Side      { topRegion: Region; bottomRegion: Region; sf: QFMatch }
interface Bracket   { left: Side; right: Side; final: QFMatch }
interface YearEntry { year: number; champion: string; bracket: Bracket }
interface MeleeData { years: YearEntry[] }

let _meleeCache: MeleeData | null = null;

function loadMeleeData(): MeleeData {
  if (_meleeCache) return _meleeCache;
  const filePath = path.join(process.cwd(), 'data', 'melee.json');
  _meleeCache = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MeleeData;
  return _meleeCache;
}

export function getMeleeHistoryForGrower(growerName: string): MeleeAppearance[] {
  const data = loadMeleeData();
  const results: MeleeAppearance[] = [];

  for (const yearData of data.years) {
    let deepest: MeleeRound | null = null;

    for (const side of [yearData.bracket.left, yearData.bracket.right]) {
      for (const region of [side.topRegion, side.bottomRegion]) {
        // Round of 16
        for (const match of region.r16) {
          if (nameMatch(match.p1, growerName) || nameMatch(match.p2, growerName)) {
            deepest = deeper(deepest, 'R16');
            if (nameMatch(match.winner, growerName)) {
              deepest = deeper(deepest, 'QF');
            }
          }
        }
        // Quarterfinal
        if (nameMatch(region.qf.p1, growerName) || nameMatch(region.qf.p2, growerName)) {
          deepest = deeper(deepest, 'QF');
          if (nameMatch(region.qf.winner, growerName)) {
            deepest = deeper(deepest, 'SF');
          }
        }
      }
      // Semifinal
      if (nameMatch(side.sf.p1, growerName) || nameMatch(side.sf.p2, growerName)) {
        deepest = deeper(deepest, 'SF');
        if (nameMatch(side.sf.winner, growerName)) {
          deepest = deeper(deepest, 'Final');
        }
      }
    }

    // Championship
    if (nameMatch(yearData.bracket.final.p1, growerName) || nameMatch(yearData.bracket.final.p2, growerName)) {
      deepest = deeper(deepest, 'Final');
      if (nameMatch(yearData.bracket.final.winner, growerName)) {
        deepest = deeper(deepest, 'Champion');
      }
    }

    if (deepest) {
      results.push({ year: yearData.year, deepestRound: deepest, isChampion: deepest === 'Champion' });
    }
  }

  return results.sort((a, b) => a.year - b.year);
}
