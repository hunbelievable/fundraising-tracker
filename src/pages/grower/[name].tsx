import type { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import YearlyTotalsChart from '@/components/YearlyTotalsChart';
import { loadOmahaData, loadOmahaAwards, getOmahaMeleeHistory, applyOmahaNameCorrection } from 'mustache-historian/server';
import { formatDollars } from 'mustache-historian';
import type { FundraisingRecord, StacheyAwardRecord, MeleeAppearance, MeleeRound } from 'mustache-historian';

type Props = {
  name: string;
  records: FundraisingRecord[];
  totalDollars: number;
  top10Finishes: number;
  bestRank: number;
  stacheyAwards: StacheyAwardRecord[];
  meleeHistory: MeleeAppearance[];
  selleckYears: number;
  nextMilestone: number | null;
  prevMilestone: number;
};

const MILESTONES = [5_000, 10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 200_000, 250_000, 300_000];

export const getStaticPaths: GetStaticPaths = async () => {
  const data = loadOmahaData();
  const names = Array.from(new Set(data.map(r => `${r.firstName} ${r.lastName}`)));
  const paths = names.map(name => ({ params: { name } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const name = params!.name as string;
  const data = loadOmahaData();
  const records = data
    .filter(r => `${r.firstName} ${r.lastName}` === name)
    .sort((a, b) => a.year - b.year);

  const totalDollars = records.reduce((sum, r) => sum + r.totalDollars, 0);
  const top10Finishes = records.filter(r => r.positionFinished <= 10).length;
  const bestRank = records.length > 0 ? Math.min(...records.map(r => r.positionFinished)) : 0;

  // Stachey awards — apply name correction so award CSV names resolve to canonical names
  const allAwards = loadOmahaAwards();
  const stacheyAwards = allAwards
    .filter(a => {
      if (!a.firstName || !a.lastName) return false;
      const [corrFirst, corrLast] = applyOmahaNameCorrection(a.firstName, a.lastName);
      return `${corrFirst} ${corrLast}` === name;
    })
    .sort((a, b) => a.year - b.year);

  // Melee history
  const meleeHistory = getOmahaMeleeHistory(name);

  // Selleck Years: years where $1,000+ was raised (the group's highest recognition)
  const selleckYears = records.filter(r => r.totalDollars >= 1000).length;

  // Next career milestone
  const nextMilestone = MILESTONES.find(m => m > totalDollars) ?? null;
  const prevMilestone = nextMilestone
    ? (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] ?? 0)
    : MILESTONES[MILESTONES.length - 1];

  return { props: { name, records, totalDollars, top10Finishes, bestRank, stacheyAwards, meleeHistory, selleckYears, nextMilestone, prevMilestone } };
};

// ── Trophy Case helpers ──────────────────────────────────────────────────────

const ROUND_LABEL: Record<MeleeRound, string> = {
  R16:      'Round of 16',
  QF:       'Quarterfinal',
  SF:       'Semifinal',
  Final:    'Runner-Up',
  Champion: 'Champion',
};

const ROUND_COLOR: Record<MeleeRound, string> = {
  R16:      'rgba(255,255,255,0.08)',
  QF:       'rgba(255,255,255,0.08)',
  SF:       'rgba(100,140,200,0.18)',
  Final:    'rgba(193,154,73,0.15)',
  Champion: 'rgba(193,154,73,0.28)',
};

function MeleeBadge({ entry }: { entry: MeleeAppearance }) {
  const isChamp = entry.isChampion;
  return (
    <div
      style={{
        background: ROUND_COLOR[entry.deepestRound],
        border: `1px solid ${isChamp ? 'rgba(193,154,73,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '8px',
        padding: '0.5rem 0.75rem',
        minWidth: '90px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.1rem', lineHeight: 1 }}>{isChamp ? '🏆' : '⚔️'}</div>
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: isChamp ? 'var(--gold)' : 'var(--white)',
          marginTop: '4px',
        }}
      >
        {entry.year} Melee
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: '2px' }}>
        {ROUND_LABEL[entry.deepestRound]}
      </div>
    </div>
  );
}

function StacheyBadge({ award }: { award: StacheyAwardRecord }) {
  return (
    <div
      style={{
        background: 'rgba(193,154,73,0.1)',
        border: '1px solid rgba(193,154,73,0.3)',
        borderRadius: '8px',
        padding: '0.5rem 0.75rem',
        minWidth: '90px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.1rem', lineHeight: 1 }}>🎖️</div>
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--gold)',
          marginTop: '4px',
          lineHeight: 1.2,
        }}
      >
        {award.year}
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.25 }}>
        {award.awardName}
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function GrowerProfilePage({
  name, records, totalDollars, top10Finishes, bestRank, stacheyAwards, meleeHistory, selleckYears,
  nextMilestone, prevMilestone,
}: Props) {
  const chartData = records.map(r => ({ year: r.year, total: r.totalDollars }));
  const initials = name.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  const hasTrophies = stacheyAwards.length > 0 || meleeHistory.length > 0;

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/leaderboard" className="back-link">
          ← Back to Leaderboard
        </Link>
      </div>

      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--panel)',
          border: '2px solid var(--gold)',
          boxShadow: '0 0 0 6px rgba(212,168,32,.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: "'Bebas Neue', serif",
          fontSize: '1.9rem',
          color: 'var(--gold)',
          letterSpacing: '0.05em',
        }}>
          {initials}
        </div>

        <div>
          <div className="font-bebas" style={{ fontSize: '3rem', color: 'var(--white)', lineHeight: 1, marginBottom: '0.2rem' }}>
            {name}
          </div>
          <div className="eyebrow">
            {records.length > 0 ? `Active ${records[0].year}–${records[records.length - 1].year}` : ''}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-value">${(totalDollars / 1000).toFixed(0)}K</div>
          <div className="stat-label">Lifetime Raised</div>
          {nextMilestone && (() => {
            const pct = Math.min(100, Math.round(((totalDollars - prevMilestone) / (nextMilestone - prevMilestone)) * 100));
            const gap = nextMilestone - totalDollars;
            const label = nextMilestone >= 1000 ? `$${(nextMilestone / 1000).toFixed(0)}k` : `$${nextMilestone}`;
            return (
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: '2px', transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'var(--dim)', marginTop: '0.3rem', letterSpacing: '0.04em' }}>
                  ${formatDollars(gap)} to {label}
                </div>
              </div>
            );
          })()}
        </div>
        <div className="stat-card">
          <div className="stat-value">{records.length}</div>
          <div className="stat-label">Years Competed</div>
        </div>
        <div className="stat-card" style={selleckYears > 0 ? { border: '1px solid rgba(212,168,32,.35)' } : undefined}>
          <div className="stat-value" style={{ color: selleckYears > 0 ? 'var(--gold)' : undefined }}>
            {selleckYears}
          </div>
          <div className="stat-label">Selleck Years</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{top10Finishes}</div>
          <div className="stat-label">Top 10 Finishes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '2.8rem' }}>
            {bestRank === 1 ? '🥇' : bestRank === 2 ? '🥈' : bestRank === 3 ? '🥉' : `#${bestRank}`}
          </div>
          <div className="stat-label">Best Finish</div>
        </div>
      </div>

      {/* ── Trophy Case ────────────────────────────────────────────── */}
      {hasTrophies && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="sec" style={{ marginBottom: '0.75rem' }}>Trophy Case</div>

          {stacheyAwards.length > 0 && (
            <div style={{ marginBottom: meleeHistory.length > 0 ? '1rem' : 0 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Stachey Awards
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {stacheyAwards.map((award, i) => (
                  <StacheyBadge key={i} award={award} />
                ))}
              </div>
            </div>
          )}

          {meleeHistory.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Mustache Melee
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {meleeHistory.map((entry, i) => (
                  <MeleeBadge key={i} entry={entry} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trend chart */}
      {records.length > 1 && (
        <YearlyTotalsChart yearlyData={chartData} title={`${name.split(' ')[0]}'s Fundraising by Year`} />
      )}

      {/* Year-by-year table */}
      <div className="sec" style={{ marginTop: '1.5rem' }}>Year-by-Year History</div>
      <BaseTable>
        <thead>
          <tr>
            <th>Year</th>
            <th>Rank</th>
            <th>Amount Raised</th>
          </tr>
        </thead>
        <tbody>
          {records.map((row, idx) => (
            <tr
              key={idx}
              style={row.totalDollars >= 1000 ? { background: 'rgba(212,168,32,.05)' } : undefined}
            >
              <td style={{ color: 'var(--dim)' }}>{row.year}</td>
              <td style={{ fontSize: '1.1rem' }}>
                {row.positionFinished === 1 ? '🥇'
                  : row.positionFinished === 2 ? '🥈'
                  : row.positionFinished === 3 ? '🥉'
                  : <span style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>#{row.positionFinished}</span>}
              </td>
              <td>
                ${formatDollars(row.totalDollars)}
                {row.totalDollars >= 1000 && (
                  <span
                    title="Selleck Year — $1,000+ raised"
                    style={{ marginLeft: '0.5rem', color: 'var(--gold)', fontSize: '0.7rem', verticalAlign: 'middle', opacity: 0.8 }}
                  >
                    ★
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </BaseTable>
      {selleckYears > 0 && (
        <div style={{ marginTop: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: 'var(--dim)', letterSpacing: '0.06em' }}>
          ★ Selleck Year — raised $1,000 or more
        </div>
      )}
    </Layout>
  );
}
