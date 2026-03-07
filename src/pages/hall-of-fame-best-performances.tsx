import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import { loadAllCSVData, FundraisingRecord } from '@/utils/loadCSV';
import { formatDollars } from '@/utils/formatDollars';
import { bestSingleYearPerformances } from '@/utils/aggregation';

type Props = { topPerformances: FundraisingRecord[] };

export async function getStaticProps() {
  const data = loadAllCSVData();
  const topPerformances = bestSingleYearPerformances(data);
  return { props: { topPerformances } };
}

export default function HallOfFameBestPerformances({ topPerformances }: Props) {
  return (
    <Layout>
      <div className="font-bebas" style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}>
        Best Single-Year Performances
      </div>
      <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>Greatest single-year fundraising runs of all time</div>

      <BaseTable>
        <thead>
          <tr>
            <th className="center" style={{ width: '4rem' }}>Rank</th>
            <th>Name</th>
            <th>Total Raised</th>
            <th>Year</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {topPerformances.map((row, idx) => (
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
              <td style={{ color: 'var(--dim)' }}>{row.year}</td>
              <td style={{ color: 'var(--dim)' }}>#{row.positionFinished}</td>
            </tr>
          ))}
        </tbody>
      </BaseTable>
    </Layout>
  );
}
