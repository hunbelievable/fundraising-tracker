import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import { loadOmahaAwards, loadOmahaCompanyAwards, loadOmahaData, applyOmahaNameCorrection } from 'mustache-historian/server';
import { formatDollars } from 'mustache-historian';
import type { StacheyAwardRecord, CompanyAwardRecord } from 'mustache-historian';

// ── Types ─────────────────────────────────────────────────────────────────────

type AwardRecordWithLink = StacheyAwardRecord & {
  /** Canonical grower name for /grower/[name] link, or null if not a grower. */
  linkName: string | null;
  /** Amount the winner raised in the award year, or null if not a grower. */
  yearTotal: number | null;
};

type GroupedAwards = {
  [awardName: string]: AwardRecordWithLink[];
};

// ── Award display order ───────────────────────────────────────────────────────

const AWARD_ORDER = [
  'Most Fundraisingest',
  'Sweetest Stache',
  'Most Testosterone',
  'Best Costume',
  'Nastiest Stache',
  'Best Mustache Name',
  'Rookie of the Year',
  'Jen Rudd Lady of the Year',
];

// ── Data ──────────────────────────────────────────────────────────────────────

export async function getStaticProps() {
  const awards = loadOmahaAwards();
  const allGrowerData = loadOmahaData();

  // Set of canonical grower names for link gating
  const growerNames = new Set(allGrowerData.map(r => `${r.firstName} ${r.lastName}`));

  // Per-grower year totals: canonical name → { year → total }
  const growerYearMap: Record<string, Record<number, number>> = {};
  for (const r of allGrowerData) {
    const key = `${r.firstName} ${r.lastName}`;
    if (!growerYearMap[key]) growerYearMap[key] = {};
    growerYearMap[key][r.year] = (growerYearMap[key][r.year] ?? 0) + r.totalDollars;
  }

  const grouped: GroupedAwards = awards.reduce((acc: GroupedAwards, record) => {
    if (!acc[record.awardName]) acc[record.awardName] = [];

    let linkName: string | null = null;
    let yearTotal: number | null = null;

    if (record.firstName && record.lastName) {
      const [corrFirst, corrLast] = applyOmahaNameCorrection(record.firstName, record.lastName);
      const corrected = `${corrFirst} ${corrLast}`;
      if (growerNames.has(corrected)) {
        linkName = corrected;
        yearTotal = growerYearMap[corrected]?.[record.year] ?? null;
      }
    }

    acc[record.awardName].push({ ...record, linkName, yearTotal });
    return acc;
  }, {});

  Object.values(grouped).forEach(group => group.sort((a, b) => b.year - a.year));

  const companyAwards = loadOmahaCompanyAwards().sort((a, b) => b.year - a.year);

  return { props: { grouped, companyAwards } };
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Props = { grouped: GroupedAwards; companyAwards: CompanyAwardRecord[] };

export default function StacheyAwardsPage({ grouped, companyAwards }: Props) {
  const orderedKeys = [
    ...AWARD_ORDER.filter(k => grouped[k]),
    ...Object.keys(grouped).filter(k => !AWARD_ORDER.includes(k)),
  ];

  return (
    <Layout>
      <div
        className="font-bebas"
        style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}
      >
        Stachey Awards
      </div>
      <div className="eyebrow" style={{ marginBottom: '2rem' }}>
        Annual awards for the stache community
      </div>

      {companyAwards.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="sec">Sexiest Company in America</div>
          <BaseTable>
            <thead>
              <tr>
                <th>Year</th>
                <th>Company</th>
              </tr>
            </thead>
            <tbody>
              {companyAwards.map((record, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--dim)' }}>{record.year}</td>
                  <td>{record.company}</td>
                </tr>
              ))}
            </tbody>
          </BaseTable>
        </div>
      )}

      {orderedKeys.map(awardName => {
        const records = grouped[awardName];
        const withData = records.filter(r => r.yearTotal !== null);
        const total = withData.reduce((s, r) => s + (r.yearTotal ?? 0), 0);
        const avg = withData.length > 0 ? Math.round(total / withData.length) : 0;

        return (
          <div key={awardName} style={{ marginBottom: '2.5rem' }}>
            {/* Section header: award name + total */}
            <div
              className="sec"
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <span>{awardName}</span>
              {total > 0 && (
                <span
                  style={{
                    color: 'var(--gold)',
                    fontSize: '0.85rem',
                    fontWeight: 400,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: '0.02em',
                  }}
                >
                  ${formatDollars(total)}
                </span>
              )}
            </div>

            {/* Avg sub-line */}
            {avg > 0 && (
              <div style={{ marginBottom: '0.6rem' }}>
                <span style={{ color: 'var(--dim)', fontSize: '0.72rem', fontFamily: "'DM Mono', monospace" }}>
                  avg raised in winning year:{' '}
                  <span style={{ color: 'var(--muted)' }}>${formatDollars(avg)}</span>
                </span>
              </div>
            )}

            <BaseTable>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Winner</th>
                  <th>That Year</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--dim)' }}>{record.year}</td>
                    <td>
                      {record.firstName && record.lastName ? (
                        record.linkName ? (
                          <Link
                            href={`/grower/${encodeURIComponent(record.linkName)}`}
                            className="gold-link"
                          >
                            {record.firstName} {record.lastName}
                          </Link>
                        ) : (
                          `${record.firstName} ${record.lastName}`
                        )
                      ) : (
                        <span style={{ color: 'var(--dim)' }}>No Winner</span>
                      )}
                    </td>
                    <td style={{ color: record.yearTotal != null ? 'var(--white)' : 'var(--dim)' }}>
                      {record.yearTotal != null ? `$${formatDollars(record.yearTotal)}` : '—'}
                    </td>
                    <td style={{ color: 'var(--dim)' }}>{record.nickname || ''}</td>
                  </tr>
                ))}
              </tbody>
            </BaseTable>
          </div>
        );
      })}
    </Layout>
  );
}
