export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body style={{ fontFamily: 'Inter, system-ui, -apple-system' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>Vet — Import Review v3 (visits+)</h1>
            <nav style={{display:'flex', gap:12}}>
              <a href="/review">Review</a>
              <a href="/records">Records</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
