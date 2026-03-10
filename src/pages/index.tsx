import Link from 'next/link';
import Layout from '@/components/Layout';
import { loadOmahaData, loadOmahaYearTotals } from 'mustache-historian/server';

type Props = {
  totalRaised: number;
  yearsCount: number;
  participantsCount: number;
};

export async function getStaticProps() {
  const data = loadOmahaData();
  // Use year totals (which include John Doe placeholder rows) so the grand
  // total matches the official event figures, not just attributed-grower amounts.
  const yearTotals = loadOmahaYearTotals();
  const totalRaised = Object.values(yearTotals).reduce((sum, t) => sum + t, 0);
  const yearsCount = new Set(data.map(r => r.year)).size;
  const participantsCount = new Set(data.map(r => `${r.firstName} ${r.lastName}`)).size;
  return { props: { totalRaised, yearsCount, participantsCount } };
}

const cards = [
  { href: '/leaderboard',                    label: 'Fundraising Leaderboard'  },
  { href: '/hall-of-fame',                   label: 'Lifetime Hall of Fame'    },
  { href: '/hall-of-fame-best-performances', label: 'Best Performances'        },
  { href: '/compare',                        label: 'Compare Growers'          },
  { href: '/search',                         label: 'Search Growers'           },
  { href: '/nice-finish',                    label: 'Nice Finish Club'         },
  { href: '/stacheys',                       label: 'Stachey Awards'           },
  { href: '/stachey-leaderboard',            label: 'Stachey Leaderboard'      },
  { href: '/rookies',                        label: 'Rookie Records'           },
  { href: '/five-year-class',               label: '5Y Classes'               },
  { href: '/general-stats',                  label: 'Growth by the Numbers'    },
  { href: '/melee',                          label: 'Mustache Melee Bracket'   },
  { href: '/velocity',                       label: 'Velocity Trends'          },
  { href: '/club-health',                    label: 'Club Health Report'       },
];

export default function HomePage({ totalRaised, yearsCount, participantsCount }: Props) {
  return (
    <Layout>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div className="font-bebas" style={{ fontSize: '4.5rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.5rem' }}>
          Stache Trophy Room
        </div>
        <div className="eyebrow" style={{ marginBottom: '2.5rem' }}>
          Every dollar raised · Every year celebrated · Est. 2009
        </div>

        <div className="stats-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
          <div className="stat-card" style={{ minWidth: '160px' }}>
            <div className="stat-value">
              ${Math.round(totalRaised / 1_000_000 * 10) / 10}M
            </div>
            <div className="stat-label">Total Raised All Time</div>
          </div>
          <div className="stat-card" style={{ minWidth: '160px' }}>
            <div className="stat-value">{yearsCount}</div>
            <div className="stat-label">Years Running</div>
          </div>
          <div className="stat-card" style={{ minWidth: '160px' }}>
            <div className="stat-value">{participantsCount.toLocaleString()}+</div>
            <div className="stat-label">Unique Fundraisers</div>
          </div>
        </div>
      </div>

      {/* Nav cards */}
      <div className="sec">Explore</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
        {cards.map(card => (
          <Link key={card.href} href={card.href} className="panel nav-card">
            <span style={{ color: 'var(--gold)' }}>›</span>
            {card.label}
          </Link>
        ))}
      </div>
    </Layout>
  );
}
