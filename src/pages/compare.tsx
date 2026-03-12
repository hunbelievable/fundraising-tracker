import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import Layout from '@/components/Layout';
import CompareChart from '@/components/CompareChart';
import { loadOmahaData } from 'mustache-historian/server';
import { formatDollars } from 'mustache-historian';
import type { MeleeAppearance, MeleeRound } from 'mustache-historian';

// ── Types ─────────────────────────────────────────────────────────────────────

type StacheyEntry = { year: number; awardName: string; nickname: string | null };

type GrowerStats = {
  totalDollars: number;
  yearsCompeted: number;
  avgPerYear: number;
  bestRank: number;
  top10Finishes: number;
  firstYear: number;
  lastYear: number;
  stacheyAwards: StacheyEntry[];
  meleeHistory: MeleeAppearance[];
  yearlyData: { year: number; total: number }[];
};

type OptionType = { value: string; label: string };

// Only names + years shipped at build time — stats fetched on demand
type Props = {
  allNames: string[];
  allYears: number[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const PALETTE = ['#d4a820', '#e07030', '#5b8dd9', '#7cc67e', '#c97fd4', '#e05080', '#40c8c8'];

const ROUND_RANK: Record<MeleeRound, number> = { R16: 1, QF: 2, SF: 3, Final: 4, Champion: 5 };

const ROUND_LABEL: Record<MeleeRound, string> = {
  R16: 'Round of 16',
  QF: 'Quarterfinal',
  SF: 'Semifinal',
  Final: 'Runner-Up',
  Champion: 'Champion',
};

const ROUND_COLOR: Record<MeleeRound, string> = {
  R16: 'rgba(255,255,255,0.08)',
  QF: 'rgba(255,255,255,0.08)',
  SF: 'rgba(100,140,200,0.18)',
  Final: 'rgba(193,154,73,0.15)',
  Champion: 'rgba(193,154,73,0.28)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBestRound(history: MeleeAppearance[]): MeleeRound | null {
  if (!history.length) return null;
  return history.reduce((b, c) =>
    ROUND_RANK[c.deepestRound] > ROUND_RANK[b.deepestRound] ? c : b
  ).deepestRound;
}

function isWinner(value: number, allValues: number[], compare: 'higher' | 'lower'): boolean {
  if (allValues.every(v => v === allValues[0])) return false;
  if (compare === 'higher') return value === Math.max(...allValues);
  const validVals = allValues.filter(v => v > 0);
  if (!validVals.length || value === 0) return false;
  return value === Math.min(...validVals);
}

// ── Stat row definitions ──────────────────────────────────────────────────────

type StatRowDef = {
  label: string;
  getValue: (s: GrowerStats) => number;
  format: (s: GrowerStats) => string;
  compare: 'higher' | 'lower';
};

const STAT_ROWS: StatRowDef[] = [
  {
    label: 'Lifetime Raised',
    getValue: s => s.totalDollars,
    format: s => `$${formatDollars(s.totalDollars)}`,
    compare: 'higher',
  },
  {
    label: 'Avg / Year',
    getValue: s => s.avgPerYear,
    format: s => `$${formatDollars(s.avgPerYear)}`,
    compare: 'higher',
  },
  {
    label: 'Years Competed',
    getValue: s => s.yearsCompeted,
    format: s => `${s.yearsCompeted}`,
    compare: 'higher',
  },
  {
    label: 'Best Finish',
    getValue: s => s.bestRank,
    format: s => {
      const r = s.bestRank;
      if (r === 1) return '🥇 1st';
      if (r === 2) return '🥈 2nd';
      if (r === 3) return '🥉 3rd';
      return `#${r}`;
    },
    compare: 'lower',
  },
  {
    label: 'Top-10 Finishes',
    getValue: s => s.top10Finishes,
    format: s => (s.top10Finishes === 0 ? '—' : `${s.top10Finishes}×`),
    compare: 'higher',
  },
  {
    label: 'Stachey Awards',
    getValue: s => s.stacheyAwards.length,
    format: s => (s.stacheyAwards.length === 0 ? '—' : `${s.stacheyAwards.length}`),
    compare: 'higher',
  },
  {
    label: 'Melee Appearances',
    getValue: s => s.meleeHistory.length,
    format: s => (s.meleeHistory.length === 0 ? '—' : `${s.meleeHistory.length}`),
    compare: 'higher',
  },
  {
    label: 'Melee Best Round',
    getValue: s => {
      const r = getBestRound(s.meleeHistory);
      return r ? ROUND_RANK[r] : 0;
    },
    format: s => {
      const r = getBestRound(s.meleeHistory);
      if (!r) return '—';
      return r === 'Champion' ? '🏆 Champion' : ROUND_LABEL[r];
    },
    compare: 'higher',
  },
];

// ── Badge components ──────────────────────────────────────────────────────────

function StacheyBadge({ award }: { award: StacheyEntry }) {
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
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold)', marginTop: '4px', lineHeight: 1.2 }}>
        {award.year}
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--dim)', marginTop: '2px', lineHeight: 1.25 }}>
        {award.awardName}
      </div>
    </div>
  );
}

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
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: isChamp ? 'var(--gold)' : 'var(--white)', marginTop: '4px' }}>
        {entry.year} Melee
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--dim)', marginTop: '2px' }}>
        {ROUND_LABEL[entry.deepestRound]}
      </div>
    </div>
  );
}

// ── Select styles ─────────────────────────────────────────────────────────────

const selectStyles = {
  control: (base: object) => ({
    ...base,
    background: '#161210',
    borderColor: 'rgba(255,255,255,.07)',
    borderRadius: '0.5rem',
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.82rem',
    color: '#f0ece0',
    boxShadow: 'none',
    '&:hover': { borderColor: '#d4a820' },
  }),
  menu: (base: object) => ({
    ...base,
    background: '#1a1510',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: '0.5rem',
  }),
  option: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.82rem',
    background: state.isFocused ? 'rgba(212,168,32,.12)' : 'transparent',
    color: state.isFocused ? '#d4a820' : '#f0ece0',
    cursor: 'pointer',
  }),
  multiValue: (base: object) => ({ ...base, background: 'rgba(212,168,32,.15)', borderRadius: '0.35rem' }),
  multiValueLabel: (base: object) => ({ ...base, fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#d4a820' }),
  multiValueRemove: (base: object) => ({ ...base, color: '#6b5a3a', '&:hover': { background: 'rgba(212,168,32,.25)', color: '#f0ece0' } }),
  placeholder: (base: object) => ({ ...base, fontFamily: "'DM Mono', monospace", color: '#6b5a3a', fontSize: '0.82rem' }),
  input: (base: object) => ({ ...base, color: '#f0ece0', fontFamily: "'DM Mono', monospace" }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base: object) => ({ ...base, color: '#6b5a3a' }),
  clearIndicator: (base: object) => ({ ...base, color: '#6b5a3a' }),
};

// ── getStaticProps — only names + years, no per-grower stats ──────────────────

export async function getStaticProps() {
  const allData = loadOmahaData();
  const allNames = Array.from(new Set(allData.map(r => `${r.firstName} ${r.lastName}`))).sort();
  const allYears = Array.from(new Set(allData.map(r => r.year))).sort();
  return { props: { allNames, allYears } };
}

// ── Page component ────────────────────────────────────────────────────────────

export default function ComparePage({ allNames, allYears }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  // Local cache: once fetched, stats are kept for the session so re-selecting is instant
  const [statsCache, setStatsCache] = useState<Record<string, GrowerStats>>({});
  const [loadingNames, setLoadingNames] = useState<Set<string>>(new Set());
  const inflightRef = useRef<Set<string>>(new Set());

  const options: OptionType[] = allNames.map(name => ({ value: name, label: name }));

  // Fetch stats for any newly selected growers not already cached
  useEffect(() => {
    const missing = selected.filter(
      name => !statsCache[name] && !inflightRef.current.has(name),
    );
    if (missing.length === 0) return;

    missing.forEach(n => inflightRef.current.add(n));
    setLoadingNames(prev => new Set([...prev, ...missing]));

    const params = missing.map(n => `name=${encodeURIComponent(n)}`).join('&');
    fetch(`/api/grower-compare?${params}`)
      .then(r => r.json())
      .then((data: Record<string, GrowerStats>) => {
        setStatsCache(prev => ({ ...prev, ...data }));
        setLoadingNames(prev => {
          const next = new Set(prev);
          missing.forEach(n => next.delete(n));
          return next;
        });
        missing.forEach(n => inflightRef.current.delete(n));
      });
  }, [selected, statsCache]);

  const MAX_GROWERS = 4;

  const handleSelect = (selectedOptions: readonly OptionType[] | null) => {
    const values = selectedOptions ? selectedOptions.map(o => o.value) : [];
    setSelected(values.slice(0, MAX_GROWERS));
  };

  const n = selected.length;
  const colTemplate = `160px repeat(${n}, 1fr)`;

  const allLoaded = selected.length > 0 && selected.every(name => !!statsCache[name]);
  const anyLoading = loadingNames.size > 0 && selected.some(n => loadingNames.has(n));

  const hasAnyTrophies = allLoaded && selected.some(
    name =>
      (statsCache[name]?.stacheyAwards.length ?? 0) > 0 ||
      (statsCache[name]?.meleeHistory.length ?? 0) > 0,
  );

  const chartData = allLoaded
    ? selected.map(name => ({
        name,
        yearlyMap: Object.fromEntries(
          (statsCache[name]?.yearlyData ?? []).map(d => [d.year, d.total]),
        ) as Record<number, number>,
      }))
    : [];

  return (
    <Layout>
      <div
        className="font-bebas"
        style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}
      >
        Compare Growers
      </div>
      <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>
        Head-to-head breakdown across every stat
      </div>

      <Select
        options={options}
        isMulti
        onChange={handleSelect}
        placeholder="Search and select growers to compare…"
        styles={selectStyles}
      />

      {/* Empty state */}
      {n === 0 && (
        <div style={{ padding: '3.5rem 0', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>👥</div>
          <div className="eyebrow">Select one or more growers above to get started</div>
        </div>
      )}

      {/* Loading state */}
      {n > 0 && anyLoading && (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--dim)',
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
          }}
        >
          Loading{' '}
          {[...loadingNames].filter(name => selected.includes(name)).join(', ')}…
        </div>
      )}

      {/* ── Content (shown once all selected growers are loaded) ─────────── */}
      {n > 0 && allLoaded && (
        <>
          {/* ── Grower header cards ──────────────────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${n}, 1fr)`,
              gap: '0.75rem',
              marginTop: '1.5rem',
            }}
          >
            {selected.map((name, i) => {
              const stats = statsCache[name];
              const color = PALETTE[i % PALETTE.length];
              const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
              const yearRange =
                stats?.firstYear && stats.firstYear !== stats.lastYear
                  ? `Active ${stats.firstYear}–${stats.lastYear}`
                  : stats?.firstYear
                    ? `Active ${stats.firstYear}`
                    : '';
              return (
                <div
                  key={name}
                  className="panel"
                  style={{ padding: '1rem 1.25rem', borderTop: `3px solid ${color}`, display: 'flex', alignItems: 'center', gap: '0.875rem' }}
                >
                  <div
                    style={{
                      width: '52px', height: '52px', borderRadius: '50%',
                      background: `${color}1a`, border: `2px solid ${color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontFamily: "'Bebas Neue', serif",
                      fontSize: '1.3rem', color, letterSpacing: '0.04em',
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="font-bebas"
                      title={name}
                      style={{
                        fontSize: '1.5rem', color: 'var(--white)', lineHeight: 1,
                        marginBottom: '0.2rem', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </div>
                    <div className="eyebrow" style={{ fontSize: '0.6rem' }}>{yearRange}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Stats comparison grid ─────────────────────────────────────── */}
          <div className="panel" style={{ marginTop: '0.75rem', padding: 0, overflow: 'hidden' }}>
            {/* Column header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: colTemplate,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ padding: '0.6rem 1.25rem' }} />
              {selected.map((name, i) => (
                <div
                  key={name}
                  style={{
                    padding: '0.6rem 1rem', textAlign: 'center',
                    fontSize: '0.68rem', fontWeight: 700,
                    color: PALETTE[i % PALETTE.length],
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    fontFamily: "'DM Mono', monospace",
                    borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  {name.split(' ')[0]}
                </div>
              ))}
            </div>

            {/* Stat rows */}
            {STAT_ROWS.map((row, rowIdx) => {
              const values = selected.map(name => row.getValue(statsCache[name]));
              return (
                <div
                  key={row.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: colTemplate,
                    borderTop: rowIdx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    alignItems: 'center',
                    minHeight: '54px',
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 1.25rem', fontSize: '0.67rem',
                      color: 'var(--dim)', textTransform: 'uppercase',
                      letterSpacing: '0.09em', fontFamily: "'DM Mono', monospace",
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {row.label}
                  </div>
                  {selected.map((name, i) => {
                    const val = row.getValue(statsCache[name]);
                    const formatted = row.format(statsCache[name]);
                    const winning = n > 1 && isWinner(val, values, row.compare);
                    const color = PALETTE[i % PALETTE.length];
                    const isDash = formatted === '—';
                    return (
                      <div
                        key={name}
                        style={{
                          padding: '0.75rem 1rem', textAlign: 'center',
                          fontFamily: "'DM Mono', monospace",
                          fontSize: winning ? '1.05rem' : '0.9rem',
                          fontWeight: winning ? 700 : 400,
                          color: isDash ? 'rgba(240,236,224,0.18)' : winning ? color : 'rgba(240,236,224,0.55)',
                          borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          position: 'relative',
                        }}
                      >
                        {winning && (
                          <span
                            style={{
                              position: 'absolute', inset: 0,
                              background: `${color}0a`, borderRadius: 0,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        {formatted}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* ── Year-over-year chart ──────────────────────────────────────── */}
          <CompareChart data={chartData} allYears={allYears} />

          {/* ── Trophy cases ─────────────────────────────────────────────── */}
          {hasAnyTrophies && (
            <div className="panel" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
              <div className="sec" style={{ marginBottom: '1.25rem' }}>Trophy Cases</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: '1.5rem' }}>
                {selected.map((name, i) => {
                  const stats = statsCache[name];
                  const color = PALETTE[i % PALETTE.length];
                  const hasStacheys = stats.stacheyAwards.length > 0;
                  const hasMelee = stats.meleeHistory.length > 0;
                  return (
                    <div key={name}>
                      <div
                        style={{
                          fontSize: '0.65rem', color, textTransform: 'uppercase',
                          letterSpacing: '0.1em', fontWeight: 700,
                          marginBottom: '0.75rem', fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {name}
                      </div>
                      {!hasStacheys && !hasMelee && (
                        <div style={{ color: 'var(--dim)', fontSize: '0.78rem', fontFamily: "'DM Mono', monospace" }}>
                          No awards yet
                        </div>
                      )}
                      {hasStacheys && (
                        <div style={{ marginBottom: hasMelee ? '1rem' : 0 }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                            Stachey Awards
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {stats.stacheyAwards.map((award, idx) => (
                              <StacheyBadge key={idx} award={award} />
                            ))}
                          </div>
                        </div>
                      )}
                      {hasMelee && (
                        <div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                            Mustache Melee
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {stats.meleeHistory.map((entry, idx) => (
                              <MeleeBadge key={idx} entry={entry} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
