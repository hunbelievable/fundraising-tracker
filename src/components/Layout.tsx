import Link from 'next/link';

const navLinks = [
  { href: '/leaderboard',                    label: 'Leaderboard'       },
  { href: '/hall-of-fame',                   label: 'Hall of Fame'      },
  { href: '/hall-of-fame-best-performances', label: 'Best Performances' },
  { href: '/compare',                        label: 'Compare'           },
  { href: '/search',                         label: 'Search'            },
  { href: '/nice-finish',                    label: 'Nice Finish'       },
  { href: '/stacheys',                       label: 'Stacheys'          },
  { href: '/stachey-leaderboard',            label: 'Stachey LB'        },
  { href: '/rookies',                        label: 'Rookies'           },
  { href: '/general-stats',                  label: 'Growth Stats'      },
  { href: '/melee',                           label: 'Melee'             },
  { href: '/velocity',                        label: 'Velocity'          },
  { href: '/club-health',                     label: 'Club Health'       },
];

export default function Layout({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,.07)', padding: '1.25rem 1.75rem' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="font-bebas" style={{ fontSize: '2rem', color: 'var(--gold)', lineHeight: 1 }}>
            Stache Trophy Room
          </div>
          <div className="eyebrow" style={{ marginTop: '3px' }}>
            Fundraising · Hall of Fame · Records
          </div>
        </Link>
      </header>

      <nav style={{ borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0.5rem 1.75rem', display: 'flex', flexWrap: 'wrap' as const, gap: '0.25rem' }}>
        {navLinks.map(link => (
          <Link key={link.href} href={link.href} className="nav-tab-link">
            {link.label}
          </Link>
        ))}
      </nav>

      <main style={wide
        ? { padding: '2.5rem 0' }
        : { padding: '2.5rem 1.75rem', maxWidth: '1080px', margin: '0 auto' }
      }>
        {children}
      </main>
    </div>
  );
}
