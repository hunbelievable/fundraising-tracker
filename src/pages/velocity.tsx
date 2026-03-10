import Link from 'next/link';
import Layout from '@/components/Layout';
import { loadOmahaData } from 'mustache-historian/server';
import { formatDollars } from 'mustache-historian';

// ── Types ──────────────────────────────────────────────────────────────────────

type VelocityEntry = {
  name: string;
  firstName: string;
  lastName: string;
  amount: number;
  prevAmount: number;
  yoyChange: number;
  yoyPct: number;
  deviationFromGroup: number;
  deviationFromPersonal: number | null;
  isPersonalOutlier: boolean;
};

type YearVelocityData = {
  year: number;
  returnerCount: number;
  groupMedianPct: number;
  groupPositivePct: number;
  accelerators: VelocityEntry[];
  decelerators: VelocityEntry[];
};

type Props = {
  years: YearVelocityData[];
  allTimeAccel: { entry: VelocityEntry; year: number } | null;
  allTimeDecel: { entry: VelocityEntry; year: number } | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${Math.round(n)}%`;
}

function fmtChange(n: number): string {
  const abs = formatDollars(Math.abs(n));
  return n >= 0 ? `+$${abs}` : `-$${abs}`;
}

// ── Data ───────────────────────────────────────────────────────────────────────

export async function getStaticProps() {
  const data = loadOmahaData();

  // Build: name -> { firstName, lastName, yearTotals: { year: total } }
  type GrowerInfo = { firstName: string; lastName: string; yearTotals: Record<number, number> };
  const growerMap: Record<string, GrowerInfo> = {};

  for (const r of data) {
    const name = `${r.firstName} ${r.lastName}`;
    if (!growerMap[name]) {
      growerMap[name] = { firstName: r.firstName, lastName: r.lastName, yearTotals: {} };
    }
    growerMap[name].yearTotals[r.year] = (growerMap[name].yearTotals[r.year] ?? 0) + r.totalDollars;
  }

  // Pre-compute consecutive-year YoY records for each grower
  type YoyRecord = { pct: number; change: number; amount: number; prevAmount: number };
  const yoyByGrowerYear: Record<string, Record<number, YoyRecord>> = {};

  for (const [name, info] of Object.entries(growerMap)) {
    const years = Object.keys(info.yearTotals).map(Number).sort((a, b) => a - b);
    yoyByGrowerYear[name] = {};
    for (let i = 1; i < years.length; i++) {
      const prevYr = years[i - 1];
      const currYr = years[i];
      if (currYr - prevYr !== 1) continue; // only consecutive years
      const prevAmt = info.yearTotals[prevYr];
      const currAmt = info.yearTotals[currYr];
      if (prevAmt <= 0) continue;
      yoyByGrowerYear[name][currYr] = {
        pct: ((currAmt - prevAmt) / prevAmt) * 100,
        change: currAmt - prevAmt,
        amount: currAmt,
        prevAmount: prevAmt,
      };
    }
  }

  // Get all years sorted ascending
  const allYears = [...new Set(data.map(r => r.year))].sort((a, b) => a - b);

  const velocityYears: YearVelocityData[] = [];
  let allTimeAccel: { entry: VelocityEntry; year: number } | null = null;
  let allTimeDecel: { entry: VelocityEntry; year: number } | null = null;

  for (let yi = 1; yi < allYears.length; yi++) {
    const year = allYears[yi];
    const prevYear = allYears[yi - 1];
    if (year - prevYear !== 1) continue; // skip non-consecutive year gaps

    // Collect all returners (growers with a consecutive YoY for this year)
    const returnerList: Array<{
      name: string;
      firstName: string;
      lastName: string;
      yoy: YoyRecord;
      priorHistory: number[];
    }> = [];

    for (const [name, yoyByYear] of Object.entries(yoyByGrowerYear)) {
      if (!yoyByYear[year]) continue;
      const yoy = yoyByYear[year];
      const info = growerMap[name];

      // Require at least 3 years of total participation for meaningful context
      if (Object.keys(info.yearTotals).length < 3) continue;

      // Collect this grower's prior YoY pcts (years before current)
      const priorHistory: number[] = [];
      for (const [yr, rec] of Object.entries(yoyByYear)) {
        if (Number(yr) < year) priorHistory.push(rec.pct);
      }

      returnerList.push({
        name,
        firstName: info.firstName,
        lastName: info.lastName,
        yoy,
        priorHistory,
      });
    }

    if (returnerList.length < 10) continue; // need a meaningful cohort

    // Group stats
    const allPcts = returnerList.map(r => r.yoy.pct);
    const groupMedianPct = median(allPcts);
    const groupPositivePct = Math.round(
      (allPcts.filter(p => p >= 0).length / allPcts.length) * 100,
    );

    // Build full VelocityEntry objects
    const entries: VelocityEntry[] = returnerList.map(r => {
      const deviationFromGroup = r.yoy.pct - groupMedianPct;
      const personalAvgPct =
        r.priorHistory.length > 0
          ? r.priorHistory.reduce((a, b) => a + b, 0) / r.priorHistory.length
          : null;
      const deviationFromPersonal =
        personalAvgPct !== null ? r.yoy.pct - personalAvgPct : null;
      const isPersonalOutlier =
        deviationFromPersonal !== null && Math.abs(deviationFromPersonal) > 50;

      return {
        name: r.name,
        firstName: r.firstName,
        lastName: r.lastName,
        amount: r.yoy.amount,
        prevAmount: r.yoy.prevAmount,
        yoyChange: r.yoy.change,
        yoyPct: r.yoy.pct,
        deviationFromGroup,
        deviationFromPersonal,
        isPersonalOutlier,
      };
    });

    // Sort by deviation from group (desc = accelerators first)
    const sorted = [...entries].sort((a, b) => b.deviationFromGroup - a.deviationFromGroup);
    const accelerators = sorted.slice(0, 5);
    const decelerators = [...sorted].reverse().slice(0, 5);

    // Track all-time records
    const topAccel = accelerators[0];
    const topDecel = decelerators[0];
    if (!allTimeAccel || topAccel.deviationFromGroup > allTimeAccel.entry.deviationFromGroup) {
      allTimeAccel = { entry: topAccel, year };
    }
    if (!allTimeDecel || topDecel.deviationFromGroup < allTimeDecel.entry.deviationFromGroup) {
      allTimeDecel = { entry: topDecel, year };
    }

    velocityYears.push({
      year,
      returnerCount: returnerList.length,
      groupMedianPct,
      groupPositivePct,
      accelerators,
      decelerators,
    });
  }

  velocityYears.sort((a, b) => b.year - a.year);

  return { props: { years: velocityYears, allTimeAccel, allTimeDecel } };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EntryRow({
  entry,
  isAccel,
  isLast,
}: {
  entry: VelocityEntry;
  isAccel: boolean;
  isLast: boolean;
}) {
  const changeColor = entry.yoyChange >= 0 ? '#7cc67e' : '#e05080';
  const pctColor = entry.yoyPct >= 0 ? '#7cc67e' : '#e05080';

  return (
    <div
      style={{
        padding: '0.7rem 1rem',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,.06)',
      }}
    >
      {/* Name + % change */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '0.5rem',
          marginBottom: '0.2rem',
        }}
      >
        <Link
          href={`/grower/${encodeURIComponent(entry.name)}`}
          className="gold-link"
          style={{ fontSize: '0.85rem' }}
        >
          {entry.firstName} {entry.lastName}
        </Link>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.8rem',
            fontWeight: 600,
            color: pctColor,
            flexShrink: 0,
          }}
        >
          {fmtPct(entry.yoyPct)}
        </span>
      </div>

      {/* Amount + raw change */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.72rem',
            color: 'var(--dim)',
          }}
        >
          ${formatDollars(entry.amount)}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.72rem',
            color: changeColor,
          }}
        >
          {fmtChange(entry.yoyChange)}
        </span>
      </div>

      {/* Personal outlier badge */}
      {entry.isPersonalOutlier && entry.deviationFromPersonal !== null && (
        <div style={{ marginTop: '0.3rem' }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.06em',
              color: 'var(--gold)',
              background: 'rgba(212,168,32,.12)',
              padding: '0.15rem 0.45rem',
              borderRadius: '3px',
            }}
          >
            {isAccel ? '↑' : '↓'} personal outlier ·{' '}
            {fmtPct(entry.deviationFromPersonal)} vs own avg
          </span>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function VelocityPage({ years, allTimeAccel, allTimeDecel }: Props) {
  return (
    <Layout>
      <div
        className="font-bebas"
        style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}
      >
        Velocity Trends
      </div>
      <div className="eyebrow" style={{ marginBottom: '2rem' }}>
        Year-over-year acceleration &amp; deceleration · ranked against the returning cohort
      </div>

      {/* All-time highlight cards */}
      {(allTimeAccel || allTimeDecel) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          {allTimeAccel && (
            <div className="stat-card" style={{ flex: '1 1 240px', textAlign: 'left' }}>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.58rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#7cc67e',
                  marginBottom: '0.5rem',
                }}
              >
                All-Time Biggest Surge
              </div>
              <div
                className="font-bebas"
                style={{ fontSize: '1.4rem', color: 'var(--gold)', lineHeight: 1 }}
              >
                <Link
                  href={`/grower/${encodeURIComponent(allTimeAccel.entry.name)}`}
                  className="gold-link"
                  style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
                >
                  {allTimeAccel.entry.name}
                </Link>
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.78rem',
                  color: '#7cc67e',
                  marginTop: '0.3rem',
                }}
              >
                {fmtPct(allTimeAccel.entry.yoyPct)} in {allTimeAccel.year}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.65rem',
                  color: 'var(--dim)',
                  marginTop: '0.15rem',
                }}
              >
                +{Math.round(allTimeAccel.entry.deviationFromGroup)}pp above group median
              </div>
            </div>
          )}

          {allTimeDecel && (
            <div className="stat-card" style={{ flex: '1 1 240px', textAlign: 'left' }}>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.58rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#e05080',
                  marginBottom: '0.5rem',
                }}
              >
                All-Time Biggest Pullback
              </div>
              <div
                className="font-bebas"
                style={{ fontSize: '1.4rem', color: 'var(--gold)', lineHeight: 1 }}
              >
                <Link
                  href={`/grower/${encodeURIComponent(allTimeDecel.entry.name)}`}
                  className="gold-link"
                  style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
                >
                  {allTimeDecel.entry.name}
                </Link>
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.78rem',
                  color: '#e05080',
                  marginTop: '0.3rem',
                }}
              >
                {fmtPct(allTimeDecel.entry.yoyPct)} in {allTimeDecel.year}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.65rem',
                  color: 'var(--dim)',
                  marginTop: '0.15rem',
                }}
              >
                {Math.round(allTimeDecel.entry.deviationFromGroup)}pp below group median
              </div>
            </div>
          )}
        </div>
      )}

      {/* Year-by-year sections */}
      {years.map(yearData => (
        <div key={yearData.year} style={{ marginBottom: '2.5rem' }}>
          {/* Year header */}
          <div
            className="sec"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <span>{yearData.year}</span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.68rem',
                fontWeight: 400,
                color: 'var(--dim)',
                letterSpacing: '0.03em',
              }}
            >
              {yearData.returnerCount} returners · median{' '}
              <span style={{ color: yearData.groupMedianPct >= 0 ? '#7cc67e' : '#e05080' }}>
                {fmtPct(yearData.groupMedianPct)}
              </span>{' '}
              · {yearData.groupPositivePct}% grew
            </span>
          </div>

          {/* Two-column layout */}
          <div
            className="side-by-side"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            {/* Breakouts (accelerators) */}
            <div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#7cc67e',
                  marginBottom: '0.5rem',
                }}
              >
                Breakouts ↑
              </div>
              <div
                style={{
                  background: 'var(--panel)',
                  border: '1px solid rgba(124,198,126,.18)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                }}
              >
                {yearData.accelerators.map((entry, i) => (
                  <EntryRow
                    key={entry.name}
                    entry={entry}
                    isAccel={true}
                    isLast={i === yearData.accelerators.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Pullbacks (decelerators) */}
            <div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#e05080',
                  marginBottom: '0.5rem',
                }}
              >
                Pullbacks ↓
              </div>
              <div
                style={{
                  background: 'var(--panel)',
                  border: '1px solid rgba(224,80,128,.18)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                }}
              >
                {yearData.decelerators.map((entry, i) => (
                  <EntryRow
                    key={entry.name}
                    entry={entry}
                    isAccel={false}
                    isLast={i === yearData.decelerators.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </Layout>
  );
}
