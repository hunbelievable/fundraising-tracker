import Layout from '@/components/Layout';
import Head from 'next/head';

export default function AboutPage() {
  return (
    <Layout>
      <Head><title>About · Unofficial Stache Trophy Room</title></Head>

      <h1 className="font-bebas page-title" style={{ fontSize: '2.8rem', color: 'var(--gold)', marginBottom: '0.25rem' }}>
        About This Project
      </h1>
      <div className="eyebrow" style={{ marginBottom: '2.5rem' }}>
        Unofficial Stache Trophy Room · M4K Omaha
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '680px' }}>

        <section className="panel" style={{ padding: '1.5rem 1.75rem' }}>
          <div className="sec">What This Is</div>
          <p style={prose}>
            The Unofficial Stache Trophy Room is a personal project built to preserve and
            explore the fundraising history of M4K Omaha. It is not affiliated with,
            endorsed by, or representative of M4K Omaha, M4K America, or any other
            Mustaches for Kids chapter or organization.
          </p>
          <p style={prose}>
            All data has been collected on a best-effort basis from historical records. It
            may be incomplete or incorrect. No guarantees are made regarding accuracy.
          </p>
        </section>

        <section className="panel" style={{ padding: '1.5rem 1.75rem' }}>
          <div className="sec">Correction Requests</div>
          <p style={prose}>
            If you believe a record is incorrect, a correction request form is available
            at the bottom of each individual grower page. Before submitting, please note:
          </p>
          <ul style={{ ...prose, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '0.75rem 0 0' }}>
            <li>
              M4K does not have the resources to supply historical data during active
              campaigns. Please do not contact them on behalf of this site.
            </li>
            <li>
              The burden of proof rests with the requestor. Submissions must include
              supporting documentation.
            </li>
            <li>
              Corrections are reviewed by Mustache Historians and applied periodically.
              There is no guaranteed timeline for updates.
            </li>
          </ul>
        </section>

        <section className="panel" style={{ padding: '1.5rem 1.75rem' }}>
          <div className="sec">No Scraping or Bots</div>
          <p style={prose}>
            Automated access, bots, and scrapers are prohibited on this site. If you need
            programmatic access to the underlying data, use the open-source{' '}
            <a
              href="https://github.com/hunbelievable/mustache-historian"
              target="_blank"
              rel="noopener noreferrer"
            >
              mustache-historian
            </a>{' '}
            package, which provides the raw data used to power this app.
          </p>
        </section>

        <section className="panel" style={{ padding: '1.5rem 1.75rem' }}>
          <div className="sec">Open Source</div>
          <p style={prose}>
            Both this site and the underlying data package are open source. Contributions,
            bug reports, and suggestions are welcome.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <RepoLink
              href="https://github.com/hunbelievable/fundraising-tracker"
              label="fundraising-tracker"
              description="This web app — the Trophy Room UI"
            />
            <RepoLink
              href="https://github.com/hunbelievable/mustache-historian"
              label="mustache-historian"
              description="The data package powering the stats"
            />
          </div>
        </section>

      </div>
    </Layout>
  );
}

const prose: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: '0.82rem',
  color: 'var(--dim)',
  lineHeight: 1.75,
  margin: 0,
};

function RepoLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1rem',
        background: 'rgba(212,168,32,.04)',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,168,32,.35)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--gold)" style={{ flexShrink: 0 }}>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
        </svg>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', color: 'var(--gold)', marginBottom: '0.15rem' }}>
            {label}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: 'var(--dim)' }}>
            {description}
          </div>
        </div>
      </div>
    </a>
  );
}
