import { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import { loadOmahaData } from 'mustache-historian/server';
import { formatDollars } from 'mustache-historian';

// Compact grouped structure: one entry per unique grower, rows as tuples
// [year, positionFinished, totalDollars] — eliminates repeated JSON key names
// vs. shipping 5,100 raw FundraisingRecord objects with 5 named fields each.
type SearchEntry = {
  name: string;
  rows: Array<[year: number, pos: number, total: number]>;
};

type Props = { entries: SearchEntry[] };

export async function getStaticProps() {
  const allData = loadOmahaData();

  const byName = new Map<string, Array<[number, number, number]>>();
  for (const r of allData) {
    const name = `${r.firstName} ${r.lastName}`;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name)!.push([r.year, r.positionFinished, r.totalDollars]);
  }

  const entries: SearchEntry[] = [];
  for (const [name, rows] of byName) {
    rows.sort((a, b) => b[0] - a[0]); // newest year first
    entries.push({ name, rows });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));

  return { props: { entries } };
}

export default function SearchPage({ entries }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? entries.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  // Expand compact tuples into display rows
  const displayRows = filtered.flatMap(e =>
    e.rows.map(([year, pos, total]) => ({ name: e.name, year, pos, total })),
  );

  return (
    <Layout>
      <div
        className="font-bebas"
        style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}
      >
        Search Growers
      </div>
      <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>
        Find any fundraiser across all years
      </div>

      <input
        className="dark-input"
        style={{ marginBottom: '1.25rem' }}
        placeholder="Search by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {search && displayRows.length === 0 && (
        <div className="eyebrow" style={{ padding: '1rem 0' }}>No results found.</div>
      )}

      {displayRows.length > 0 && (
        <BaseTable>
          <thead>
            <tr>
              <th>Year</th>
              <th>Position</th>
              <th>Name</th>
              <th>Total Raised</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ color: 'var(--dim)' }}>{row.year}</td>
                <td style={{ color: 'var(--dim)' }}>#{row.pos}</td>
                <td>
                  <Link
                    href={`/grower/${encodeURIComponent(row.name)}`}
                    className="gold-link"
                  >
                    {row.name}
                  </Link>
                </td>
                <td>${formatDollars(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </BaseTable>
      )}
    </Layout>
  );
}
