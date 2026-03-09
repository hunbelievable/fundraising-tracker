import { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { loadOmahaData } from 'mustache-historian/server';
import { getRookiesByFiveYearClass, formatDollars } from 'mustache-historian';
import type { FiveYearClassEntry } from 'mustache-historian';

type StatusFilter = 'all' | 'active' | 'departed';

type Props = {
  classes: FiveYearClassEntry[];
};

export async function getStaticProps() {
  const data = loadOmahaData();
  const classes = getRookiesByFiveYearClass(data);
  classes.forEach(cls => {
    cls.members.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.totalDollars - a.totalDollars;
    });
  });
  return { props: { classes } };
}

function MemberChip({ m }: { m: FiveYearClassEntry['members'][number] }) {
  return (
    <Link
      href={`/grower/${encodeURIComponent(`${m.firstName} ${m.lastName}`)}`}
      style={{
        background: m.isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${m.isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '6px',
        padding: '0.4rem 0.7rem',
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '110px',
        opacity: m.isActive ? 1 : 0.45,
      }}
    >
      <span style={{ color: m.isActive ? 'var(--white)' : 'var(--muted)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
        {m.firstName} {m.lastName}
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: m.isActive ? 'var(--dim)' : 'var(--muted)', marginTop: '2px' }}>
        ${formatDollars(m.totalDollars)}
      </span>
    </Link>
  );
}

const CHIP_BASE: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: '0.65rem',
  padding: '0.25rem 0.65rem',
  borderRadius: '4px',
  cursor: 'pointer',
  letterSpacing: '0.06em',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'transparent',
  color: 'var(--muted)',
};

const CHIP_ACTIVE: React.CSSProperties = {
  border: '1px solid var(--gold)',
  background: 'rgba(193,154,73,0.15)',
  color: 'var(--gold)',
};

export default function FiveYearClassPage({ classes }: Props) {
  const reversed = [...classes].reverse();

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  const toggleYear = (year: number) => {
    if (selectedYear === year) {
      setSelectedYear(null);
    } else {
      setSelectedYear(year);
    }
  };

  const toggleExpanded = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year); else next.add(year);
      return next;
    });
  };

  const isExpanded = (year: number) => selectedYear !== null || expandedYears.has(year);

  const visibleClasses = selectedYear ? reversed.filter(c => c.classYear === selectedYear) : reversed;

  const getMembers = (cls: FiveYearClassEntry) => {
    if (statusFilter === 'active') return cls.members.filter(m => m.isActive);
    if (statusFilter === 'departed') return cls.members.filter(m => !m.isActive);
    return cls.members;
  };

  return (
    <Layout>
      <div className="font-bebas" style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}>
        5Y Classes
      </div>
      <div className="eyebrow" style={{ marginBottom: '1.25rem' }}>
        Growers grouped by their rookie year · active = competed in the most recent season
      </div>

      {/* ── Sticky filter bar ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--bg, #0d0d0d)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: '0.75rem',
        marginBottom: '1.25rem',
      }}>
        {/* Year chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
          <button
            style={{ ...CHIP_BASE, ...(selectedYear === null ? CHIP_ACTIVE : {}) }}
            onClick={() => setSelectedYear(null)}
          >
            All
          </button>
          {reversed.map(cls => (
            <button
              key={cls.classYear}
              style={{ ...CHIP_BASE, ...(selectedYear === cls.classYear ? CHIP_ACTIVE : {}) }}
              onClick={() => toggleYear(cls.classYear)}
            >
              {cls.classYear}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {(['all', 'active', 'departed'] as StatusFilter[]).map(f => {
            const isOn = statusFilter === f;
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  ...CHIP_BASE,
                  fontSize: '0.6rem',
                  padding: '0.2rem 0.55rem',
                  ...(isOn ? { border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: 'var(--white)' } : {}),
                }}
              >
                {f === 'all' ? 'All members' : f === 'active' ? 'Active only' : 'Departed only'}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Class cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {visibleClasses.map(cls => {
          const expanded = isExpanded(cls.classYear);
          const members = getMembers(cls);
          const active = members.filter(m => m.isActive);
          const inactive = members.filter(m => !m.isActive);
          const showToggle = selectedYear === null;

          return (
            <div
              key={cls.classYear}
              id={`class-${cls.classYear}`}
              style={{
                background: 'var(--panel)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Card header — click to collapse/expand when in All view */}
              <div
                onClick={() => showToggle && toggleExpanded(cls.classYear)}
                style={{
                  padding: '0.9rem 1.5rem',
                  cursor: showToggle ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div className="font-bebas" style={{ fontSize: '1.6rem', color: 'var(--gold)', lineHeight: 1 }}>
                    {cls.classLabel}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                    {cls.memberCount} {cls.memberCount === 1 ? 'member' : 'members'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Retained
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', fontWeight: 700, color: 'var(--white)' }}>
                      {cls.retainedCount}/{cls.memberCount}
                      <span style={{ fontSize: '0.62rem', color: 'var(--muted)', marginLeft: '0.3rem' }}>({cls.retainedPct}%)</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Class Total
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)' }}>
                      ${formatDollars(cls.classTotalDollars)}
                    </div>
                  </div>
                  {showToggle && (
                    <span style={{ color: 'var(--muted)', fontSize: '0.7rem', width: '12px', textAlign: 'center' }}>
                      {expanded ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </div>

              {/* Member list */}
              {expanded && (
                <div style={{ padding: '0 1.5rem 1.25rem' }}>
                  {members.length === 0 ? (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: 'var(--muted)' }}>
                      No members match this filter.
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {active.map((m, i) => <MemberChip key={i} m={m} />)}
                        {active.length > 0 && inactive.length > 0 && (
                          <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 0.25rem', alignSelf: 'stretch' }} />
                        )}
                        {inactive.map((m, i) => <MemberChip key={`d-${i}`} m={m} />)}
                      </div>
                      {inactive.length > 0 && active.length > 0 && statusFilter === 'all' && (
                        <div style={{ marginTop: '0.6rem', fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>
                          Dimmed = no longer active · {inactive.length} departed
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
