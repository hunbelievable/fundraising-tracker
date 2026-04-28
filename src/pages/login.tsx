import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace('/');
      } else {
        setError('Incorrect password.');
        setPassword('');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Sign In · Unofficial Stache Trophy Room</title></Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '3rem 1.5rem 4rem',
      }}>

        <div className="font-bebas" style={{ fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '0.25rem' }}>
          Unofficial Stache Trophy Room
        </div>
        <div className="eyebrow" style={{ marginBottom: '2.5rem' }}>
          Fundraising · Hall of Fame · Records
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="panel"
          style={{ width: '100%', maxWidth: '400px', padding: '2rem', marginBottom: '1.5rem' }}
        >
          <div className="eyebrow" style={{ marginBottom: '1.25rem' }}>Enter password to continue</div>

          <input
            className="dark-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            required
            style={{ marginBottom: error ? '0.75rem' : '1.25rem' }}
          />

          {error && (
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.75rem',
              color: '#c0392b',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.7rem 1rem',
              background: loading ? 'rgba(212,168,32,.4)' : 'var(--gold)',
              color: '#0c0a07',
              border: 'none',
              borderRadius: '0.5rem',
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.65rem',
            color: 'var(--dim)',
            textAlign: 'center',
            margin: '1.25rem 0 0',
            lineHeight: 1.6,
          }}>
            By entering this site you agree to the terms below.
          </p>
        </form>

        {/* Disclaimer */}
        <div className="panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: '1rem', color: 'var(--gold)' }}>
            Disclaimer &amp; Terms of Use
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <DisclaimerSection title="No Affiliation">
              This is a personal project and is not affiliated with, endorsed by, or
              representative of M4K Omaha, M4K America, or any other Mustaches for Kids
              chapter or organization.
            </DisclaimerSection>

            <DisclaimerSection title="Data Accuracy">
              All information has been collected on a best-effort basis and may be
              incomplete or incorrect. No guarantees are made regarding the accuracy of
              any data presented.
            </DisclaimerSection>

            <DisclaimerSection title="Correction Requests">
              Correction requests may be submitted via the form at the bottom of each
              individual grower page. Please note:
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>M4K does not have the resources to provide historical data during
                active campaigns. Do not contact them on behalf of this site.</li>
                <li>The burden of proof rests with the requestor. Requests must include
                supporting documentation.</li>
                <li>Changes are reviewed by Mustache Historians and applied
                periodically. There is no guaranteed timeline for updates.</li>
              </ul>
            </DisclaimerSection>

            <DisclaimerSection title="No Scraping or Bots">
              Automated access, bots, and scrapers are prohibited. To access raw data
              programmatically, use the open-source{' '}
              <a
                href="https://github.com/hunbelievable/mustache-historian"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--gold)' }}
              >
                mustache-historian
              </a>{' '}
              package on GitHub.
            </DisclaimerSection>

          </div>
        </div>

      </div>
    </>
  );
}

function DisclaimerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.62rem',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--gold)',
        marginBottom: '0.35rem',
        opacity: 0.8,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.73rem',
        color: 'var(--dim)',
        lineHeight: 1.65,
      }}>
        {children}
      </div>
    </div>
  );
}
