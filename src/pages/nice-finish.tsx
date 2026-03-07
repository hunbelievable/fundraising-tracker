import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import { loadAllCSVData, FundraisingRecord } from '@/utils/loadCSV';
import { formatDollars } from '@/utils/formatDollars';
import { getNiceFinishers } from '@/utils/aggregation';

type NiceFinisher = { year: number; finisher: FundraisingRecord | null };
type Props = { niceFinishers: NiceFinisher[] };

export async function getStaticProps() {
  const data = loadAllCSVData();
  const niceFinishers = getNiceFinishers(data);
  return { props: { niceFinishers } };
}

export default function NiceFinishPage({ niceFinishers }: Props) {
  return (
    <Layout>
      <div className="font-bebas" style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}>
        Nice Finish — 69th Place Club
      </div>
      <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>The annual holder of the most distinguished position</div>

      <BaseTable>
        <thead>
          <tr>
            <th>Year</th>
            <th>Name</th>
            <th>Total Raised</th>
          </tr>
        </thead>
        <tbody>
          {niceFinishers.map(({ year, finisher }, idx) => (
            <tr key={idx}>
              <td style={{ color: 'var(--dim)' }}>{year}</td>
              <td>
                {finisher ? (
                  <Link
                    href={`/grower/${encodeURIComponent(`${finisher.firstName} ${finisher.lastName}`)}`}
                    className="gold-link"
                  >
                    {finisher.firstName} {finisher.lastName}
                  </Link>
                ) : <span style={{ color: 'var(--dim)' }}>No data</span>}
              </td>
              <td>
                {finisher ? `$${formatDollars(finisher.totalDollars)}` : <span style={{ color: 'var(--dim)' }}>N/A</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </BaseTable>
    </Layout>
  );
}
