import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import YearSelector from '@/components/YearSelector';
import { loadOmahaData, loadOmahaYearTotals } from 'mustache-historian/server';
import { aggregateLifetime, formatDollars } from 'mustache-historian';

interface AggregatedRecord {
  firstName: string;
  lastName: string;
  totalDollars: number;
  top10Finishes: number;
  firstYear: number;
  positionFinished?: number; // present in per-year (API) data only; lifetime uses array index
}

type Props = {
  lifetimeLeaderboard: AggregatedRecord[];
  years: number[];
  allTimeTotal: number;
  yearTotals: Record<number, number>;
};

// Pre-compute everything server-side — no raw records shipped to the client
export async function getStaticProps() {
  const allData = loadOmahaData();
  const years = Array.from(new Set(allData.map(r => r.year))).sort();
  // positionFinished is omitted — the component uses the array index instead,
  // saving ~20 kB of repeated JSON key overhead across 1,089 records.
  const lifetimeLeaderboard = aggregateLifetime(allData).map(record => ({
    firstName: record.firstName,
    lastName: record.lastName,
    totalDollars: record.totalDollars,
    top10Finishes: record.top10Finishes,
    firstYear: record.firstYear,
  }));
  // Use official year totals (include JD placeholders) so the "total raised"
  // figure shown above the table matches the real event numbers.
  const yearTotals = loadOmahaYearTotals();
  const allTimeTotal = Object.values(yearTotals).reduce((s, t) => s + t, 0);
  return { props: { lifetimeLeaderboard, years, allTimeTotal, yearTotals } };
}

function rowClass(idx: number) {
  if (idx === 0) return 'row-gold';
  if (idx === 1) return 'row-silver';
  if (idx === 2) return 'row-bronze';
  return '';
}

export default function LeaderboardPage({ lifetimeLeaderboard, years, allTimeTotal, yearTotals }: Props) {
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [yearData, setYearData] = useState<AggregatedRecord[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch per-year data from the API route when a year is selected
  useEffect(() => {
    if (selectedYear === 'ALL') {
      setYearData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/year/${selectedYear}`)
      .then(r => r.json())
      .then((data: Array<{ firstName: string; lastName: string; totalDollars: number; positionFinished: number; year: number }>) => {
        const sorted = [...data].sort((a, b) => a.positionFinished - b.positionFinished);
        setYearData(
          sorted.map(row => ({
            firstName: row.firstName,
            lastName: row.lastName,
            totalDollars: row.totalDollars,
            top10Finishes: row.positionFinished <= 10 ? 1 : 0,
            firstYear: row.year,
            positionFinished: row.positionFinished,
          })),
        );
        setLoading(false);
      });
  }, [selectedYear]);

  const leaderboard = selectedYear === 'ALL' ? lifetimeLeaderboard : (yearData ?? []);
  // Use pre-computed official totals (include JD placeholders) rather than
  // summing only the displayed grower rows, which would under-count.
  const totalRaised =
    selectedYear === 'ALL'
      ? allTimeTotal
      : (yearTotals[selectedYear as number] ?? leaderboard.reduce((s, r) => s + r.totalDollars, 0));

  return (
    <Layout>
      <div
        className="font-bebas"
        style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}
      >
        Fundraising Leaderboard
      </div>
      <div className="dm-mono" style={{ fontSize: '0.75rem', color: 'var(--dim)', marginBottom: '1.5rem' }}>
        Total raised:{' '}
        <span style={{ color: 'var(--gold)' }}>${formatDollars(totalRaised)}</span>
        {selectedYear === 'ALL' && <span> · {years.length} years</span>}
      </div>

      <YearSelector years={years} selectedYear={selectedYear} onChange={setSelectedYear} />

      {loading ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--dim)',
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
          }}
        >
          Loading {selectedYear}…
        </div>
      ) : (
        <BaseTable>
          <thead>
            <tr>
              <th className="center" style={{ width: '4rem' }}>Rank</th>
              <th>Name</th>
              <th>Total Raised</th>
              <th>Top 10s</th>
              <th>First Year</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, idx) => (
              <tr key={idx} className={rowClass(idx)}>
                <td className="center" style={{ fontSize: '1.2rem' }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (
                    <span style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>{idx + 1}</span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/grower/${encodeURIComponent(`${row.firstName} ${row.lastName}`)}`}
                    className="gold-link"
                  >
                    {row.firstName} {row.lastName}
                  </Link>
                </td>
                <td>${formatDollars(row.totalDollars)}</td>
                <td style={{ color: 'var(--dim)' }}>{row.top10Finishes}</td>
                <td style={{ color: 'var(--dim)' }}>{row.firstYear}</td>
              </tr>
            ))}
          </tbody>
        </BaseTable>
      )}
    </Layout>
  );
}
