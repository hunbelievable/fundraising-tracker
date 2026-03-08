import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import { loadOmahaData } from 'mustache-historian/server';
import { getThresholdGrowthByYear } from 'mustache-historian';
import type { ThresholdYearEntry } from 'mustache-historian';

type Props = {
  stats: ThresholdYearEntry[];
};

export async function getStaticProps() {
  const data = loadOmahaData();
  const stats = getThresholdGrowthByYear(data);
  return { props: { stats } };
}

export default function GeneralStatsPage({ stats }: Props) {
  const reversed = [...stats].reverse();

  // Summary stats
  const latest = stats[stats.length - 1];
  const first = stats[0];
  const peak10k = [...stats].sort((a, b) => b.count10k - a.count10k)[0];
  const peak1k = [...stats].sort((a, b) => b.count1k - a.count1k)[0];

  return (
    <Layout>
      <div className="font-bebas" style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}>
        Growth by the Numbers
      </div>
      <div className="eyebrow" style={{ marginBottom: '2rem' }}>
        How many growers hit milestone fundraising thresholds each year
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{latest.count10k}</div>
          <div className="stat-label">$10k+ Growers in {latest.year}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{peak10k.count10k}</div>
          <div className="stat-label">Most $10k+ in a Year ({peak10k.year})</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{first.count10k}</div>
          <div className="stat-label">$10k+ Growers in {first.year}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{peak1k.count1k}</div>
          <div className="stat-label">Most $1k+ in a Year ({peak1k.year})</div>
        </div>
      </div>

      <div className="sec">Threshold Counts by Year</div>
      <BaseTable>
        <thead>
          <tr>
            <th>Year</th>
            <th className="center">Total Growers</th>
            <th className="center">$1,000+ Raised</th>
            <th className="center">$10,000+ Raised</th>
          </tr>
        </thead>
        <tbody>
          {reversed.map(({ year, totalGrowers, count1k, count10k }) => (
            <tr key={year}>
              <td style={{ color: 'var(--dim)' }}>{year}</td>
              <td className="center">{totalGrowers}</td>
              <td className="center">
                {count1k > 0 ? count1k : <span style={{ color: 'var(--dim)' }}>—</span>}
              </td>
              <td className="center">
                {count10k > 0 ? count10k : <span style={{ color: 'var(--dim)' }}>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </BaseTable>
    </Layout>
  );
}
