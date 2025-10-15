import './globals.css'
import { Stethoscope, FileSearch, Database } from 'lucide-react'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <header className="mb-8 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Vet Review System</h1>
                  <p className="text-sm text-muted-foreground">Import & Records Management v3</p>
                </div>
              </Link>
              <nav className="flex gap-2">
                <Link
                  href="/review"
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  <FileSearch className="h-4 w-4" />
                  Review
                </Link>
                <Link
                  href="/records"
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  <Database className="h-4 w-4" />
                  Records
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
