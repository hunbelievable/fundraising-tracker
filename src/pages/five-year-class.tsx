import Link from 'next/link';
import Layout from '@/components/Layout';
import { loadOmahaData } from 'mustache-historian/server';
import { getRookiesByFiveYearClass, formatDollars } from 'mustache-historian';
import type { FiveYearClassEntry } from 'mustache-historian';

type Props = {
  classes: FiveYearClassEntry[];
};

export async function getStaticProps() {
  const data = loadOmahaData();
  const classes = getRookiesByFiveYearClass(data);
  classes.forEach(cls => {
    cls.members.sort((a, b) => b.totalDollars - a.totalDollars);
  });
  return { props: { classes } };
}

export default function FiveYearClassPage({ classes }: Props) {
  const reversed = [...classes].reverse();

  return (
    <Layout>
      <div className="font-bebas" style={{ fontSize: '2.8rem', color: 'var(--white)', marginBottom: '0.25rem' }}>
        5Y Classes
      </div>
      <div className="eyebrow" style={{ marginBottom: '2.5rem' }}>
        Growers grouped by their rookie year · members sorted by lifetime dollars raised
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {reversed.map(cls => (
          <div
            key={cls.classYear}
            id={`class-${cls.classYear}`}
            style={{
              background: 'var(--panel)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="font-bebas" style={{ fontSize: '1.8rem', color: 'var(--gold)', lineHeight: 1 }}>
                {cls.classLabel}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                {cls.memberCount} {cls.memberCount === 1 ? 'member' : 'members'}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {cls.members.map((m, i) => (
                <Link
                  key={i}
                  href={`/grower/${encodeURIComponent(`${m.firstName} ${m.lastName}`)}`}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '0.4rem 0.7rem',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '110px',
                  }}
                >
                  <span style={{ color: 'var(--white)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
                    {m.firstName} {m.lastName}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: 'var(--dim)', marginTop: '2px' }}>
                    ${formatDollars(m.totalDollars)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
