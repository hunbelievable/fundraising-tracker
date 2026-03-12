import { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
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

  return (
    <Layout>
      <div
        className="font-bebas"
        style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}
      >
        Search Growers
      </div>
      <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
        Find any fundraiser across all years
      </div>
      <div className="eyebrow" style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>
        {entries.length} growers in the database
      </div>

      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <input
          className="dark-input"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingRight: search ? '2.5rem' : undefined }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer',
              fontSize: '1.1rem', lineHeight: 1, padding: '0.25rem',
            }}
          >×</button>
        )}
      </div>

      {search && filtered.length === 0 && (
        <div className="eyebrow" style={{ padding: '1rem 0' }}>No results found.</div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(entry => (
            <div
              key={entry.name}
              className="panel"
              style={{ overflow: 'hidden' }}
            >
              {/* Grower header */}
              <div style={{
                padding: '0.7rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}>
                <Link
                  href={`/grower/${encodeURIComponent(entry.name)}`}
                  className="font-bebas gold-link"
                  style={{ fontSize: '1.3rem', letterSpacing: '0.04em' }}
                >
                  {entry.name}
                </Link>
                <span className="eyebrow" style={{ flexShrink: 0 }}>
                  {entry.rows.length} {entry.rows.length === 1 ? 'year' : 'years'}
                </span>
              </div>

              {/* Year rows */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {entry.rows.map(([year, pos, total], i) => (
                    <tr key={year} style={{ borderBottom: i < entry.rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '0.5rem 1.25rem', color: 'var(--dim)', fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', width: '5rem' }}>
                        {year}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--dim)', fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', width: '4.5rem' }}>
                        #{pos}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: 'var(--white)', textAlign: 'right' }}>
                        ${formatDollars(total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
