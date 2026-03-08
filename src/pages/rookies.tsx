import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import { loadOmahaData, loadOmahaAwards, applyOmahaNameCorrection } from 'mustache-historian/server';
import { getRookiesByYear, formatDollars } from 'mustache-historian';
import type { RookieYearEntry, StacheyAwardRecord } from 'mustache-historian';

type RotyWinner = StacheyAwardRecord & {
  linkName: string | null; // corrected name for grower profile URL
};

type Props = {
  rookiesByYear: RookieYearEntry[];
  rotyWinners: RotyWinner[];
};

export async function getStaticProps() {
  const data = loadOmahaData();
  const rookiesByYear = getRookiesByYear(data);

  const awards = loadOmahaAwards();
  const rotyWinners: RotyWinner[] = awards
    .filter(a => a.awardName === 'Rookie of the Year')
    .sort((a, b) => b.year - a.year)
    .map(a => {
      if (!a.firstName || !a.lastName) return { ...a, linkName: null };
      const [fn, ln] = applyOmahaNameCorrection(a.firstName, a.lastName);
      return { ...a, linkName: `${fn} ${ln}` };
    });

  return { props: { rookiesByYear, rotyWinners } };
}

export default function RookiesPage({ rookiesByYear, rotyWinners }: Props) {
  const reversed = [...rookiesByYear].reverse();

  return (
    <Layout>
      <div className="font-bebas" style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}>
        Rookie Records
      </div>
      <div className="eyebrow" style={{ marginBottom: '2.5rem' }}>
        First-year grower highlights and Rookie of the Year award history
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>

        {/* Top Rookie Fundraiser by Year */}
        <div>
          <div className="sec">Top Rookie Fundraiser by Year</div>
          <BaseTable>
            <thead>
              <tr>
                <th>Year</th>
                <th>Rookie</th>
                <th>Raised</th>
                <th className="center">Rank</th>
              </tr>
            </thead>
            <tbody>
              {reversed.map(({ year, topRookie, rookieCount }) => (
                <tr key={year}>
                  <td style={{ color: 'var(--dim)' }}>{year}</td>
                  <td>
                    {topRookie ? (
                      <Link
                        href={`/grower/${encodeURIComponent(`${topRookie.firstName} ${topRookie.lastName}`)}`}
                        className="gold-link"
                      >
                        {topRookie.firstName} {topRookie.lastName}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--dim)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {topRookie
                      ? `$${formatDollars(topRookie.totalDollars)}`
                      : <span style={{ color: 'var(--dim)' }}>—</span>}
                  </td>
                  <td className="center" style={{ color: 'var(--dim)' }}>
                    {topRookie ? `#${topRookie.positionFinished}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </BaseTable>
        </div>

        {/* Rookie of the Year Award */}
        <div>
          <div className="sec">Rookie of the Year Award</div>
          <div className="eyebrow" style={{ marginBottom: '0.75rem', fontSize: '0.7rem' }}>
            Award introduced in 2014 · not always the top fundraising rookie
          </div>
          <BaseTable>
            <thead>
              <tr>
                <th>Year</th>
                <th>Winner</th>
              </tr>
            </thead>
            <tbody>
              {rotyWinners.map((record, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--dim)' }}>{record.year}</td>
                  <td>
                    {record.linkName ? (
                      <Link
                        href={`/grower/${encodeURIComponent(record.linkName)}`}
                        className="gold-link"
                      >
                        {record.firstName} {record.lastName}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--dim)' }}>No Winner</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </BaseTable>
        </div>

      </div>
    </Layout>
  );
}
