import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import { buildStacheyLeaderboard, StacheyLeaderboardEntry } from '@/utils/aggregateStacheys';

type Props = {
  leaderboard: StacheyLeaderboardEntry[];
};

export async function getStaticProps() {
  const leaderboard = buildStacheyLeaderboard();
  return {
    props: { leaderboard },
  };
}

export default function StacheyLeaderboardPage({ leaderboard }: Props) {
  return (
    <Layout>
      <div className="font-bebas" style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}>
        Stachey Leaderboard
      </div>
      <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>All-time Stachey award winners</div>

      <BaseTable>
        <thead>
          <tr>
            <th className="center" style={{ width: '4rem' }}>Rank</th>
            <th>Name</th>
            <th className="center">Total Awards</th>
            <th>Award History</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={entry.fullName} className={index === 0 ? 'row-gold' : index === 1 ? 'row-silver' : index === 2 ? 'row-bronze' : ''}>
              <td className="center" style={{ fontSize: '1.2rem' }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (
                  <span style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>{index + 1}</span>
                )}
              </td>
              <td>
                <Link href={`/grower/${encodeURIComponent(entry.linkName)}`} className="link">
                  {entry.fullName}
                </Link>
              </td>
              <td className="center">{entry.totalAwards}</td>
              <td className="wrap" style={{ color: 'var(--dim)', fontSize: '0.75rem' }}>
                {entry.awards
                  .sort((a, b) => b.year - a.year)
                  .map(a => `${a.awardName} (${a.year})`)
                  .join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </BaseTable>
    </Layout>
  );
}
