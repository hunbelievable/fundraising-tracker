import Link from 'next/link';
import Layout from '@/components/Layout';
import BaseTable from '@/components/BaseTable';
import { loadOmahaData, loadOmahaYearTotals } from 'mustache-historian/server';
import { formatDollars } from 'mustache-historian';

// ── Types ──────────────────────────────────────────────────────────────────────

type RetentionRow = {
  rookieYear: number;
  rookieCount: number;
  yr2Pct: number | null;
  yr3Pct: number | null;
  yr5Pct: number | null;
};

type ConcentrationRow = {
  year: number;
  totalGrowers: number;
  totalRaised: number;
  top5Pct: number;
  top10Pct: number;
  top25Pct: number;
};

type StreakEntry = {
  name: string;
  firstName: string;
  lastName: string;
  currentStreak: number;
  streakStart: number;
};

type MilestoneEntry = {
  name: string;
  firstName: string;
  lastName: string;
  careerTotal: number;
  nextMilestone: number;
  gap: number;
};

type Props = {
  retentionRows: RetentionRow[];
  concentrationRows: ConcentrationRow[];
  streaks: StreakEntry[];
  milestones: MilestoneEntry[];
  latestYear: number;
  totalRaisedAllTime: number;
  totalUniqueGrowers: number;
  activeGrowerCount: number;
  avgYearsPerGrower: number;
};

// ── Data ───────────────────────────────────────────────────────────────────────

export async function getStaticProps() {
  const data = loadOmahaData();
  // Official per-year totals include JD placeholder rows so dollar figures
  // match the real event numbers rather than just the attributed-grower amounts.
  const officialYearTotals = loadOmahaYearTotals();

  // Build per-grower year-total map
  type GrowerInfo = { firstName: string; lastName: string; years: Set<number>; yearTotals: Record<number, number> };
  const growerMap: Record<string, GrowerInfo> = {};

  for (const r of data) {
    const name = `${r.firstName} ${r.lastName}`;
    if (!growerMap[name]) {
      growerMap[name] = { firstName: r.firstName, lastName: r.lastName, years: new Set(), yearTotals: {} };
    }
    growerMap[name].years.add(r.year);
    growerMap[name].yearTotals[r.year] = (growerMap[name].yearTotals[r.year] ?? 0) + r.totalDollars;
  }

  const allYears = [...new Set(data.map(r => r.year))].sort((a, b) => a - b);
  const latestYear = allYears[allYears.length - 1];

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalRaisedAllTime = Object.values(officialYearTotals).reduce((s, t) => s + t, 0);
  const totalUniqueGrowers = Object.keys(growerMap).length;
  const activeGrowerCount = Object.values(growerMap).filter(g => g.years.has(latestYear)).length;
  const avgYearsPerGrower = Math.round(
    Object.values(growerMap).reduce((s, g) => s + g.years.size, 0) / totalUniqueGrowers,
  );

  // ── Retention by cohort ────────────────────────────────────────────────────
  // Group growers by first year
  const cohortMap: Record<number, string[]> = {};
  for (const [name, info] of Object.entries(growerMap)) {
    const firstYear = Math.min(...Array.from(info.years));
    if (!cohortMap[firstYear]) cohortMap[firstYear] = [];
    cohortMap[firstYear].push(name);
  }

  const retentionRows: RetentionRow[] = [];
  for (const [yearStr, members] of Object.entries(cohortMap)) {
    const rookieYear = Number(yearStr);
    const n = members.length;
    const pct = (yr: number) => {
      if (yr > latestYear) return null;
      const returned = members.filter(name => growerMap[name].years.has(yr)).length;
      return Math.round((returned / n) * 100);
    };

    retentionRows.push({
      rookieYear,
      rookieCount: n,
      yr2Pct: pct(rookieYear + 1),
      yr3Pct: pct(rookieYear + 2),
      yr5Pct: rookieYear + 4 <= latestYear ? pct(rookieYear + 4) : null,
    });
  }
  retentionRows.sort((a, b) => b.rookieYear - a.rookieYear);

  // ── Concentration by year ──────────────────────────────────────────────────
  const concentrationRows: ConcentrationRow[] = [];
  for (const year of allYears) {
    const yearRecords = data
      .filter(r => r.year === year)
      .sort((a, b) => b.totalDollars - a.totalDollars);
    // Use official total (includes JD placeholders) so % figures reflect true
    // share of all dollars raised, not just the attributed-grower portion.
    const totalRaised = officialYearTotals[year] ?? yearRecords.reduce((s, r) => s + r.totalDollars, 0);
    if (totalRaised === 0) continue;
    const top5 = yearRecords.slice(0, 5).reduce((s, r) => s + r.totalDollars, 0);
    const top10 = yearRecords.slice(0, 10).reduce((s, r) => s + r.totalDollars, 0);
    const top25 = yearRecords.slice(0, 25).reduce((s, r) => s + r.totalDollars, 0);
    concentrationRows.push({
      year,
      totalGrowers: yearRecords.length,
      totalRaised,
      top5Pct: Math.round((top5 / totalRaised) * 100),
      top10Pct: Math.round((top10 / totalRaised) * 100),
      top25Pct: Math.round((top25 / totalRaised) * 100),
    });
  }
  concentrationRows.sort((a, b) => b.year - a.year);

  // ── Active streaks ─────────────────────────────────────────────────────────
  const streaks: StreakEntry[] = [];
  for (const [name, info] of Object.entries(growerMap)) {
    if (!info.years.has(latestYear)) continue; // only active growers
    let streak = 0;
    let yr = latestYear;
    while (info.years.has(yr)) {
      streak++;
      yr--;
    }
    streaks.push({
      name,
      firstName: info.firstName,
      lastName: info.lastName,
      currentStreak: streak,
      streakStart: latestYear - streak + 1,
    });
  }
  streaks.sort((a, b) => b.currentStreak - a.currentStreak || a.name.localeCompare(b.name));
  const topStreaks = streaks.slice(0, 20);

  // ── Milestone watch ────────────────────────────────────────────────────────
  const MILESTONES = [5_000, 10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 200_000, 250_000, 300_000];
  const MILESTONE_GAP = 10_000; // within $10k of next milestone

  const milestones: MilestoneEntry[] = [];
  for (const [name, info] of Object.entries(growerMap)) {
    // Only show growers active in the last 2 years
    if (!info.years.has(latestYear) && !info.years.has(latestYear - 1)) continue;
    const careerTotal = Object.values(info.yearTotals).reduce((s, v) => s + v, 0);
    const nextMilestone = MILESTONES.find(m => m > careerTotal);
    if (!nextMilestone) continue;
    const gap = nextMilestone - careerTotal;
    if (gap <= MILESTONE_GAP) {
      milestones.push({
        name,
        firstName: info.firstName,
        lastName: info.lastName,
        careerTotal,
        nextMilestone,
        gap,
      });
    }
  }
  milestones.sort((a, b) => a.gap - b.gap);

  return {
    props: {
      retentionRows,
      concentrationRows,
      streaks: topStreaks,
      milestones,
      latestYear,
      totalRaisedAllTime,
      totalUniqueGrowers,
      activeGrowerCount,
      avgYearsPerGrower,
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function PctCell({ pct }: { pct: number | null }) {
  if (pct === null) return <span style={{ color: 'var(--dim)' }}>—</span>;
  const color = pct >= 60 ? '#7cc67e' : pct >= 40 ? 'var(--gold)' : '#e05080';
  return <span style={{ color }}>{pct}%</span>;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ClubHealthPage({
  retentionRows,
  concentrationRows,
  streaks,
  milestones,
  latestYear,
  totalRaisedAllTime,
  totalUniqueGrowers,
  activeGrowerCount,
  avgYearsPerGrower,
}: Props) {
  return (
    <Layout>
      <div
        className="font-bebas"
        style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}
      >
        Club Health
      </div>
      <div className="eyebrow" style={{ marginBottom: '2rem' }}>
        Retention, concentration, streaks, and milestone watch · {latestYear}
      </div>

      {/* Summary stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '0.75rem',
          marginBottom: '2.5rem',
        }}
      >
        <div className="stat-card">
          <div className="stat-value">${Math.round(totalRaisedAllTime / 1_000_000).toLocaleString()}M+</div>
          <div className="stat-label">Raised All-Time</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalUniqueGrowers.toLocaleString()}</div>
          <div className="stat-label">Total Growers Ever</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeGrowerCount}</div>
          <div className="stat-label">Active in {latestYear}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgYearsPerGrower}</div>
          <div className="stat-label">Avg Years per Grower</div>
        </div>
      </div>

      {/* ── Retention by Cohort ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="sec">Retention by Rookie Class</div>
        <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>
          Of each year's first-timers, how many returned in subsequent years
        </div>
        <BaseTable>
          <thead>
            <tr>
              <th>Class</th>
              <th className="center">Rookies</th>
              <th className="center">Yr 2</th>
              <th className="center">Yr 3</th>
              <th className="center">Yr 5</th>
            </tr>
          </thead>
          <tbody>
            {retentionRows.map(row => (
              <tr key={row.rookieYear}>
                <td style={{ color: 'var(--dim)' }}>{row.rookieYear}</td>
                <td className="center">{row.rookieCount}</td>
                <td className="center"><PctCell pct={row.yr2Pct} /></td>
                <td className="center"><PctCell pct={row.yr3Pct} /></td>
                <td className="center"><PctCell pct={row.yr5Pct} /></td>
              </tr>
            ))}
          </tbody>
        </BaseTable>
      </div>

      {/* ── Fundraising Concentration ────────────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="sec">Fundraising Concentration</div>
        <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>
          Share of total dollars raised by the top performers each year
        </div>
        <BaseTable>
          <thead>
            <tr>
              <th>Year</th>
              <th className="center">Growers</th>
              <th className="right">Total Raised</th>
              <th className="center">Top 5</th>
              <th className="center">Top 10</th>
              <th className="center">Top 25</th>
            </tr>
          </thead>
          <tbody>
            {concentrationRows.map(row => (
              <tr key={row.year}>
                <td style={{ color: 'var(--dim)' }}>{row.year}</td>
                <td className="center">{row.totalGrowers}</td>
                <td className="right" style={{ color: 'var(--gold)' }}>${formatDollars(row.totalRaised)}</td>
                <td className="center" style={{ color: 'var(--dim)' }}>{row.top5Pct}%</td>
                <td className="center" style={{ color: 'var(--dim)' }}>{row.top10Pct}%</td>
                <td className="center" style={{ color: 'var(--dim)' }}>{row.top25Pct}%</td>
              </tr>
            ))}
          </tbody>
        </BaseTable>
      </div>

      {/* ── Active Streaks + Milestone Watch (side by side) ──────────────────── */}
      <div className="side-by-side" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

        {/* Active Streaks */}
        <div>
          <div className="sec">Current Consecutive Streaks</div>
          <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>
            Unbroken run of years — active growers only ({latestYear})
          </div>
          <BaseTable>
            <thead>
              <tr>
                <th>Grower</th>
                <th className="center">Years</th>
                <th className="center">Since</th>
              </tr>
            </thead>
            <tbody>
              {streaks.map((entry, i) => (
                <tr key={entry.name} className={i === 0 ? 'row-gold' : i === 1 ? 'row-silver' : i === 2 ? 'row-bronze' : ''}>
                  <td>
                    <Link href={`/grower/${encodeURIComponent(entry.name)}`} className="gold-link">
                      {entry.firstName} {entry.lastName}
                    </Link>
                  </td>
                  <td className="center" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                    {entry.currentStreak}
                  </td>
                  <td className="center" style={{ color: 'var(--dim)' }}>
                    {entry.streakStart}
                  </td>
                </tr>
              ))}
            </tbody>
          </BaseTable>
        </div>

        {/* Milestone Watch */}
        <div>
          <div className="sec">Milestone Watch</div>
          <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>
            Active growers within $10,000 of a career milestone
          </div>
          {milestones.length === 0 ? (
            <div style={{ color: 'var(--dim)', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
              No growers within $10,000 of a milestone right now.
            </div>
          ) : (
            <BaseTable>
              <thead>
                <tr>
                  <th>Grower</th>
                  <th className="right">Career</th>
                  <th className="right">Target</th>
                  <th className="right">Gap</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map(entry => (
                  <tr key={entry.name}>
                    <td>
                      <Link href={`/grower/${encodeURIComponent(entry.name)}`} className="gold-link">
                        {entry.firstName} {entry.lastName}
                      </Link>
                    </td>
                    <td className="right" style={{ color: 'var(--dim)' }}>
                      ${formatDollars(entry.careerTotal)}
                    </td>
                    <td className="right" style={{ color: 'var(--gold)' }}>
                      ${(entry.nextMilestone / 1000).toFixed(0)}k
                    </td>
                    <td className="right" style={{ color: '#e05080' }}>
                      -${formatDollars(entry.gap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </BaseTable>
          )}
        </div>

      </div>
    </Layout>
  );
}
