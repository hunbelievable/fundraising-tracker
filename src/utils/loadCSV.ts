import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import corrections from '../../data/name-corrections.json';

export interface FundraisingRecord {
  year: number;
  positionFinished: number;
  firstName: string;
  lastName: string;
  totalDollars: number;
}

function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function applyNameCorrection(firstName: string, lastName: string): [string, string] {
  const full = `${firstName} ${lastName}`;
  const corrected = (corrections as Record<string, string>)[full];
  if (!corrected) return [firstName, lastName];
  const parts = corrected.split(' ');
  return [parts.slice(0, -1).join(' '), parts[parts.length - 1]];
}

export function loadCSV(year: string): FundraisingRecord[] {
  const filePath = path.join(process.cwd(), 'data', `fundraising-${year}.csv`);
  // Normalize line endings: some CSVs mix CRLF (original rows) with LF (appended rows).
  // csv-parse auto-detects the record delimiter from the first newline it sees, so a
  // stray bare LF in an otherwise CRLF file gets folded into a field value.
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const fileContent = rawContent.replace(/\r\n/g, '\n');

  const columns = ['POSITIONFINISHED', 'FIRSTNAME', 'LASTNAME', 'TOTALDOLLARS'];
  const records = parse(fileContent, {
    columns,
    skip_empty_lines: true,
    relax_quotes: true,        // handle mixed quoted/unquoted dollar fields in original CSVs
    relax_column_count: true,  // tolerate rows like "MISC.,MISC." that parse as extra columns
  });

  return records.map((record: Record<string, string>) => {
    const cleanValue = parseFloat((record.TOTALDOLLARS || '').replace(/[^0-9.]/g, ''));
    const [firstName, lastName] = applyNameCorrection(
      normalizeName(record.FIRSTNAME),
      normalizeName(record.LASTNAME),
    );
    return {
      year: parseInt(year),
      positionFinished: parseInt(record.POSITIONFINISHED),
      firstName,
      lastName,
      totalDollars: isNaN(cleanValue) ? 0 : cleanValue,
    };
  });
}

function csvYears(): string[] {
  const dataDir = path.join(process.cwd(), 'data');
  return fs
    .readdirSync(dataDir)
    .map(f => f.match(/fundraising-(\d{4})\.csv/)?.[1] ?? null)
    .filter(Boolean) as string[];
}

let _cache: FundraisingRecord[] | null = null;

export function loadAllCSVData(): FundraisingRecord[] {
  if (_cache) return _cache;

  // Exclude "John Doe" placeholder rows — these are unattributed-dollar entries
  // added to reconcile CSV totals against official event totals. They should
  // never appear on leaderboards, grower pages, or any analysis.
  _cache = csvYears()
    .flatMap(year => loadCSV(year))
    .filter(r => !(r.firstName === 'John' && r.lastName === 'Doe'));
  return _cache;
}

let _yearTotalsCache: Record<number, number> | null = null;

/**
 * Returns the true total dollars raised per year INCLUDING John Doe placeholder
 * rows. Use this for any displayed financial totals so the numbers match the
 * official event totals, not just the attributed-grower amounts.
 */
export function loadYearTotals(): Record<number, number> {
  if (_yearTotalsCache) return _yearTotalsCache;
  _yearTotalsCache = {};
  for (const year of csvYears()) {
    const total = loadCSV(year).reduce((sum, r) => sum + r.totalDollars, 0);
    _yearTotalsCache[parseInt(year)] = total;
  }
  return _yearTotalsCache;
}

export { formatDollars } from './formatDollars';
