'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global app error', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#070c16',
          color: '#edf3ff',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <section style={{
            maxWidth: 560,
            width: '100%',
            border: '1px solid #223250',
            borderRadius: 24,
            padding: 24,
            background: '#0d1524',
            textAlign: 'center',
          }}>
            <p style={{ color: '#fca5a5', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              Application recovered
            </p>
            <h1 style={{ marginTop: 8, fontSize: 26 }}>The app hit an unexpected error.</h1>
            <p style={{ marginTop: 12, color: '#aebad1', lineHeight: 1.6 }}>
              Retry the page. If it still fails, return to the dashboard after reconnecting.
            </p>
            {error.digest ? (
              <p style={{
                marginTop: 14,
                borderRadius: 12,
                background: '#471825',
                color: '#fecdd3',
                padding: 10,
                fontSize: 12,
              }}>
                Error digest: {error.digest}
              </p>
            ) : null}
            <button
              onClick={reset}
              style={{
                marginTop: 20,
                border: 0,
                borderRadius: 14,
                padding: '12px 18px',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
