import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const navGroups = [
  {
    label: 'Individual',
    links: [
      { href: '/leaderboard',                    label: 'Leaderboard'       },
      { href: '/hall-of-fame',                   label: 'Hall of Fame'      },
      { href: '/hall-of-fame-best-performances', label: 'Best Performances' },
      { href: '/compare',                        label: 'Compare'           },
      { href: '/search',                         label: 'Search'            },
      { href: '/nice-finish',                    label: 'Nice Finish'       },
    ],
  },
  {
    label: 'Awards',
    links: [
      { href: '/stacheys',            label: 'Stacheys'   },
      { href: '/stachey-leaderboard', label: 'Stachey LB' },
    ],
  },
  {
    label: 'Club',
    links: [
      { href: '/rookies',       label: 'Rookies'      },
      { href: '/five-year-class', label: '5Y Classes' },
      { href: '/general-stats', label: 'Growth Stats' },
      { href: '/velocity',      label: 'Velocity'     },
      { href: '/club-health',   label: 'Club Health'  },
    ],
  },
  {
    label: 'Competition',
    links: [
      { href: '/melee', label: 'Melee' },
    ],
  },
];

// Flat list kept for any logic that needs it
const navLinks = navGroups.flatMap(g => g.links);

export default function Layout({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  // Close drawer on navigation
  useEffect(() => { setDrawerOpen(false); }, [router.pathname]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Backdrop overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 40,
          }}
        />
      )}

      {/* Slide-out drawer (mobile) */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '280px',
        background: 'var(--panel)',
        borderRight: '1px solid rgba(212,168,32,.2)',
        zIndex: 50,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflowY: 'auto',
        padding: '1.25rem 1rem 2rem',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.25rem', paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="font-bebas" style={{ fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1 }}>
              Stache Trophy Room
            </div>
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'none', border: 'none',
              color: 'var(--dim)', fontSize: '1.6rem',
              cursor: 'pointer', padding: '0.5rem 0.75rem', lineHeight: 1,
            }}
          >×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {navGroups.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && (
                <div style={{
                  margin: '0.5rem 0.85rem',
                  borderTop: '1px solid var(--border)',
                }} />
              )}
              <div style={{
                padding: '0.4rem 0.85rem 0.1rem',
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.55rem',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--dim)',
                opacity: 0.6,
              }}>
                {group.label}
              </div>
              {group.links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-tab-link${router.pathname === link.href ? ' nav-tab-active' : ''}`}
                  style={{ display: 'block', padding: '0.6rem 0.85rem', width: '100%', boxSizing: 'border-box' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,.07)',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="font-bebas" style={{ fontSize: '2rem', color: 'var(--gold)', lineHeight: 1 }}>
            Stache Trophy Room
          </div>
          <div className="eyebrow" style={{ marginTop: '3px' }}>
            Fundraising · Hall of Fame · Records
          </div>
        </Link>

        {/* Hamburger button — shown on mobile only via CSS */}
        <button
          className="nav-hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          style={{
            display: 'none',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            color: 'var(--dim)',
            cursor: 'pointer',
            padding: '0.5rem 0.6rem',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
            <rect y="0" width="18" height="2" rx="1" />
            <rect y="6" width="18" height="2" rx="1" />
            <rect y="12" width="18" height="2" rx="1" />
          </svg>
        </button>
      </header>

      {/* Desktop nav — hidden on mobile via CSS */}
      <nav
        className="nav-desktop"
        style={{
          borderBottom: '1px solid rgba(255,255,255,.07)',
          padding: '0.5rem 1.75rem',
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: '0.25rem',
        }}
      >
        {navGroups.map((group, gi) => (
          <div key={group.label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {gi > 0 && (
              <span style={{
                display: 'inline-block', width: '1px',
                background: 'rgba(255,255,255,0.1)',
                height: '1.1rem', margin: '0 0.3rem',
                flexShrink: 0,
              }} />
            )}
            {group.links.map(link => (
              <Link key={link.href} href={link.href} className={`nav-tab-link${router.pathname === link.href ? ' nav-tab-active' : ''}`}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <main
        className={wide ? undefined : 'main-padded'}
        style={wide
          ? { padding: '2.5rem 0' }
          : { maxWidth: '1080px', margin: '0 auto', paddingTop: '2.5rem', paddingBottom: '2.5rem' }
        }
      >
        {children}
      </main>
    </div>
  );
}
