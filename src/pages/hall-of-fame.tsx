import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import { loadOmahaData } from 'mustache-historian/server';
import { aggregateLifetime, formatDollars } from 'mustache-historian';
import type { AggregatedLifetime } from 'mustache-historian';

type Props = { lifetimeLeaders: AggregatedLifetime[] };

export async function getStaticProps() {
  const data = loadOmahaData();
  const lifetimeLeaders = aggregateLifetime(data).slice(0, 10);
  return { props: { lifetimeLeaders } };
}

export default function HallOfFamePage({ lifetimeLeaders }: Props) {
  return (
    <Layout>
      <div className="font-bebas" style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}>
        Lifetime Hall of Fame
      </div>
      <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>Top 10 all-time fundraisers</div>

      <BaseTable>
        <thead>
          <tr>
            <th className="center" style={{ width: '4rem' }}>Rank</th>
            <th>Name</th>
            <th>Total Raised</th>
            <th>First Year</th>
            <th>Top 10 Finishes</th>
          </tr>
        </thead>
        <tbody>
          {lifetimeLeaders.map((row, idx) => (
            <tr key={idx} className={idx === 0 ? 'row-gold' : idx === 1 ? 'row-silver' : idx === 2 ? 'row-bronze' : ''}>
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
              <td style={{ color: 'var(--dim)' }}>{row.firstYear}</td>
              <td style={{ color: 'var(--dim)' }}>{row.top10Finishes}</td>
            </tr>
          ))}
        </tbody>
      </BaseTable>
    </Layout>
  );
}
