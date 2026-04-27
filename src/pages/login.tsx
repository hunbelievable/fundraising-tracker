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
      <Head><title>Sign In · Stache Trophy Room</title></Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div className="font-bebas" style={{ fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '0.25rem' }}>
          Stache Trophy Room
        </div>
        <div className="eyebrow" style={{ marginBottom: '2.5rem' }}>
          Fundraising · Hall of Fame · Records
        </div>

        <form
          onSubmit={handleSubmit}
          className="panel"
          style={{ width: '100%', maxWidth: '360px', padding: '2rem' }}
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
        </form>
      </div>
    </>
  );
}
