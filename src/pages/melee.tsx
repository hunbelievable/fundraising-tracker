import { useState } from 'react';
import Layout from '@/components/Layout';
import meleeData from '../../data/melee.json';

interface R16Match {
  p1: string;
  p1Seed?: number;
  p2: string;
  p2Seed?: number;
  winner: string;
}

interface QFMatch {
  p1: string;
  p2: string;
  winner: string;
}

interface Region {
  name: string | null;
  r16: R16Match[];
  qf: QFMatch;
}

interface Side {
  topRegion: Region;
  bottomRegion: Region;
  sf: QFMatch;
}

interface PlayInBracket {
  label: string;
  participants: string[];
  winner: string;
}

interface PlayIn {
  rookie: PlayInBracket;
  experienced: PlayInBracket;
}

interface YearData {
  year: number;
  champion: string;
  notes: string;
  sponsor: string | null;
  bracket: {
    left: Side;
    right: Side;
    final: QFMatch;
  };
  playIn: PlayIn | null;
}

const data = meleeData as { years: YearData[] };

function MatchBox({
  p1,
  p2,
  winner,
  size = 'normal',
}: {
  p1: string;
  p2: string;
  winner: string;
  size?: 'normal' | 'final';
}) {
  const isFinal = size === 'final';
  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.03)',
        width: '100%',
        fontSize: isFinal ? '0.8rem' : '0.72rem',
      }}
    >
      <div
        style={{
          padding: '3px 8px',
          background: winner === p1 ? 'rgba(193,154,73,0.25)' : 'transparent',
          color: winner === p1 ? 'var(--gold)' : 'var(--muted)',
          fontWeight: winner === p1 ? 600 : 400,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {p1}
      </div>
      <div
        style={{
          padding: '3px 8px',
          background: winner === p2 ? 'rgba(193,154,73,0.25)' : 'transparent',
          color: winner === p2 ? 'var(--gold)' : 'var(--muted)',
          fontWeight: winner === p2 ? 600 : 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {p2}
      </div>
    </div>
  );
}

function ColHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: '0.6rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--muted)',
        textAlign: 'center',
        marginBottom: '6px',
      }}
    >
      {label}
    </div>
  );
}

function BracketColumn({
  header,
  children,
  justify = 'space-around',
}: {
  header: string;
  children: React.ReactNode;
  justify?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ColHeader label={header} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: justify,
          flex: 1,
          gap: '4px',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function RegionLabel({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <div
      style={{
        fontSize: '0.6rem',
        color: 'rgba(193,154,73,0.6)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '3px',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </div>
  );
}

function YearBracket({ y }: { y: YearData }) {
  const { bracket, playIn } = y;
  const { left, right, final } = bracket;

  // Height for the bracket columns so space-around lines up
  const colHeight = 340;

  return (
    <div>
      {/* Champion banner */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          padding: '0 1.75rem',
        }}
      >
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Champion
        </div>
        <div
          className="font-bebas"
          style={{ fontSize: '2.2rem', color: 'var(--gold)', lineHeight: 1.1 }}
        >
          {y.champion}
        </div>
        {y.sponsor && (
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>
            Sponsored by {y.sponsor}
          </div>
        )}
      </div>

      {/* Bracket */}
      <div
        style={{
          paddingBottom: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: '10px',
            padding: '0 1.75rem',
          }}
        >
          {/* ── LEFT SIDE ── */}

          {/* R16 left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minWidth: 0 }}>
            <ColHeader label="Round of 16" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: `${colHeight}px`,
              }}
            >
              {/* top region */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingBottom: '4px' }}>
                <RegionLabel name={left.topRegion.name} />
                {left.topRegion.r16.map((m, i) => (
                  <MatchBox key={i} p1={m.p1} p2={m.p2} winner={m.winner} />
                ))}
              </div>
              {/* divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              {/* bottom region */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingTop: '4px' }}>
                <RegionLabel name={left.bottomRegion.name} />
                {left.bottomRegion.r16.map((m, i) => (
                  <MatchBox key={i} p1={m.p1} p2={m.p2} winner={m.winner} />
                ))}
              </div>
            </div>
          </div>

          {/* QF left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minWidth: 0 }}>
            <ColHeader label="Quarterfinals" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: `${colHeight}px`,
                justifyContent: 'space-around',
              }}
            >
              <MatchBox p1={left.topRegion.qf.p1} p2={left.topRegion.qf.p2} winner={left.topRegion.qf.winner} />
              <MatchBox p1={left.bottomRegion.qf.p1} p2={left.bottomRegion.qf.p2} winner={left.bottomRegion.qf.winner} />
            </div>
          </div>

          {/* SF left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minWidth: 0 }}>
            <ColHeader label="Semifinals" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: `${colHeight}px`,
                justifyContent: 'center',
              }}
            >
              <MatchBox p1={left.sf.p1} p2={left.sf.p2} winner={left.sf.winner} />
            </div>
          </div>

          {/* FINAL center */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minWidth: 0 }}>
            <ColHeader label="Championship" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: `${colHeight}px`,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MatchBox p1={final.p1} p2={final.p2} winner={final.winner} size="final" />
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '0.65rem',
                  color: 'var(--gold)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                🏆 {final.winner}
              </div>
            </div>
          </div>

          {/* SF right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minWidth: 0 }}>
            <ColHeader label="Semifinals" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: `${colHeight}px`,
                justifyContent: 'center',
              }}
            >
              <MatchBox p1={right.sf.p1} p2={right.sf.p2} winner={right.sf.winner} />
            </div>
          </div>

          {/* QF right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minWidth: 0 }}>
            <ColHeader label="Quarterfinals" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: `${colHeight}px`,
                justifyContent: 'space-around',
              }}
            >
              <MatchBox p1={right.topRegion.qf.p1} p2={right.topRegion.qf.p2} winner={right.topRegion.qf.winner} />
              <MatchBox p1={right.bottomRegion.qf.p1} p2={right.bottomRegion.qf.p2} winner={right.bottomRegion.qf.winner} />
            </div>
          </div>

          {/* R16 right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minWidth: 0 }}>
            <ColHeader label="Round of 16" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: `${colHeight}px`,
              }}
            >
              {/* top region */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingBottom: '4px' }}>
                <RegionLabel name={right.topRegion.name} />
                {right.topRegion.r16.map((m, i) => (
                  <MatchBox key={i} p1={m.p1} p2={m.p2} winner={m.winner} />
                ))}
              </div>
              {/* divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              {/* bottom region */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingTop: '4px' }}>
                <RegionLabel name={right.bottomRegion.name} />
                {right.bottomRegion.r16.map((m, i) => (
                  <MatchBox key={i} p1={m.p1} p2={m.p2} winner={m.winner} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Play-in section */}
      {playIn && (
        <div style={{ marginTop: '1.5rem', padding: '0 1.75rem' }}>
          <div className="sec" style={{ marginBottom: '0.75rem' }}>Play-In Games</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {[playIn.rookie, playIn.experienced].map((pi) => (
              <div key={pi.label} className="panel" style={{ flex: '1 1 280px' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  {pi.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  {pi.participants.map((p) => (
                    <span
                      key={p}
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          p === pi.winner
                            ? 'rgba(193,154,73,0.25)'
                            : 'rgba(255,255,255,0.05)',
                        color: p === pi.winner ? 'var(--gold)' : 'var(--muted)',
                        fontWeight: p === pi.winner ? 600 : 400,
                        border:
                          p === pi.winner
                            ? '1px solid rgba(193,154,73,0.4)'
                            : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {p === pi.winner ? '🏅 ' : ''}{p}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                  Winner advanced to main bracket
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {y.notes && (
        <div style={{ padding: '0 1.75rem' }}>
          <div
            style={{
              marginTop: '1.25rem',
              fontSize: '0.78rem',
              color: 'var(--muted)',
              padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '6px',
              borderLeft: '3px solid rgba(193,154,73,0.3)',
            }}
          >
            {y.notes}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeleePage() {
  const years = data.years.slice().reverse(); // newest first
  const [activeYear, setActiveYear] = useState(years[0].year);
  const activeData = years.find((y) => y.year === activeYear)!;

  return (
    <Layout wide>
      <div style={{ padding: '0 1.75rem', marginBottom: '1.5rem' }}>
        <div className="font-bebas" style={{ fontSize: '2.4rem', color: 'var(--gold)', lineHeight: 1 }}>
          Mustache Melee
        </div>
        <div className="eyebrow" style={{ marginTop: '4px' }}>
          Single-elimination bracket · {data.years.length} years · Est. 2020
        </div>
      </div>

      {/* Year tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: '0.5rem',
          padding: '0 1.75rem 0.5rem',
        }}
      >
        {years.map((y) => (
          <button
            key={y.year}
            onClick={() => setActiveYear(y.year)}
            className="nav-tab-link"
            style={{
              background:
                activeYear === y.year ? 'rgba(193,154,73,0.15)' : 'transparent',
              color: activeYear === y.year ? 'var(--gold)' : undefined,
              border:
                activeYear === y.year
                  ? '1px solid rgba(193,154,73,0.35)'
                  : '1px solid transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {y.year}
            {y.champion && (
              <span style={{ marginLeft: '5px', opacity: 0.6, fontSize: '0.7em' }}>
                {y.champion.split(' ').pop()}
              </span>
            )}
          </button>
        ))}
      </div>

      <YearBracket y={activeData} />

      {/* All-time champions summary */}
      <div style={{ marginTop: '3rem', padding: '0 1.75rem' }}>
        <div className="sec" style={{ marginBottom: '0.75rem' }}>All Champions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {data.years
            .slice()
            .reverse()
            .map((y) => (
              <button
                key={y.year}
                onClick={() => setActiveYear(y.year)}
                className="panel"
                style={{
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: '130px',
                  background:
                    activeYear === y.year
                      ? 'rgba(193,154,73,0.12)'
                      : undefined,
                  border:
                    activeYear === y.year
                      ? '1px solid rgba(193,154,73,0.35)'
                      : undefined,
                }}
              >
                <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {y.year}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '0.88rem' }}>
                  {y.champion}
                </div>
              </button>
            ))}
        </div>
      </div>
    </Layout>
  );
}
