import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const corrections = JSON.parse(readFileSync(join(dataDir, 'name-corrections.json'), 'utf8'));

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const files = readdirSync(dataDir).filter(f => f.match(/fundraising-\d{4}\.csv/)).sort();

const hits = {};

files.forEach(file => {
  const year = file.match(/(\d{4})/)[1];
  const content = readFileSync(join(dataDir, file), 'utf8');
  const records = parse(content, { columns: false, skip_empty_lines: true, bom: true });
  records.forEach(r => {
    const first = normalizeName((r[1] || '').trim());
    const last  = normalizeName((r[2] || '').trim());
    const full  = `${first} ${last}`;
    if (corrections[full]) {
      if (!hits[full]) hits[full] = [];
      hits[full].push(year);
    }
  });
});

if (Object.keys(hits).length === 0) {
  console.log('No corrections matched — check normalization logic');
} else {
  console.log(`${Object.keys(hits).length} correction(s) will fire:\n`);
  Object.entries(hits).sort().forEach(([from, years]) => {
    console.log(`  "${from}" → "${corrections[from]}"  (years: ${years.join(', ')})`);
  });
}

// Also check for any keys in corrections that never matched
const unmatched = Object.keys(corrections).filter(k => !hits[k]);
if (unmatched.length) {
  console.log(`\n${unmatched.length} correction key(s) never matched raw data:`);
  unmatched.forEach(k => console.log(`  "${k}"`));
}
