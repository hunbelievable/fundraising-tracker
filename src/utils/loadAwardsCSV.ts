import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export type StacheyAwardRecord = {
  year: number;
  awardName: string;
  firstName: string | null;
  lastName: string | null;
  nickname?: string;
};

// Re-use name normalizer
function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function loadAwardsCSV() {
  const filePath = path.join(process.cwd(), 'data', 'stachey-awards.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: false,
    skip_empty_lines: true,
  });

  const parsed: StacheyAwardRecord[] = records.map((row: string[]) => {
    const year = parseInt(row[0]);
    const awardName = row[1];
    const firstName = row[2] ? normalizeName(row[2]) : null;
    const lastName = row[3] ? normalizeName(row[3]) : null;
    const nickname = row[4] || null;

    return { year, awardName, firstName, lastName, nickname };
  });

  return parsed;
}
