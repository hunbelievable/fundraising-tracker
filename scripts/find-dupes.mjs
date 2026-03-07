import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const files = readdirSync(dataDir).filter(f => f.match(/fundraising-\d{4}\.csv/)).sort();

// name -> [{year, amount}]
const names = {};

files.forEach(file => {
  const year = parseInt(file.match(/(\d{4})/)[1]);
  const content = readFileSync(join(dataDir, file), 'utf8');
  // BOM-safe, no headers: cols = [position, firstName, lastName, totalDollars]
  const records = parse(content, { columns: false, skip_empty_lines: true, bom: true });
  records.forEach(r => {
    const first = (r[1] || '').trim();
    const last  = (r[2] || '').trim();
    if (!first || !last) return;
    const full = `${first} ${last}`;
    if (!names[full]) names[full] = [];
    names[full].push(year);
  });
});

// Group by lower-cased last name
const byLast = {};
Object.keys(names).forEach(name => {
  const parts = name.trim().split(' ');
  const last = parts[parts.length - 1].toLowerCase();
  if (!byLast[last]) byLast[last] = [];
  byLast[last].push(name);
});

// Only show groups with more than one distinct first name
Object.entries(byLast)
  .filter(([, group]) => {
    const firsts = new Set(group.map(n => n.split(' ').slice(0, -1).join(' ').toLowerCase()));
    return firsts.size > 1;
  })
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([last, group]) => {
    console.log(`\n── ${last.toUpperCase()} ──`);
    group.sort().forEach(name => {
      const years = [...new Set(names[name])].sort().join(', ');
      console.log(`  ${name.padEnd(32)} [${years}]`);
    });
  });
