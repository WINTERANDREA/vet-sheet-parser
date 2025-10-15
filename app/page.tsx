import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileSearch, Database, Upload, List } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="space-y-8">
      <div className="text-center space-y-4 py-8">
        <h2 className="text-4xl font-bold text-slate-900">Benvenuto al Sistema Veterinario</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gestisci l'importazione e la revisione dei record veterinari in modo efficiente
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileSearch className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Review e Import</CardTitle>
                <CardDescription>Importa e revisiona nuovi file di dati</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Seleziona i file da importare, verifica i dati parsati e salvali nel database dopo la revisione.
            </p>
            <div className="flex gap-2">
              <Link href="/review" className="flex-1">
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Vai a Review
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Database className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Database Records</CardTitle>
                <CardDescription>Esplora i record salvati</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Visualizza, cerca e gestisci tutti i proprietari, animali e visite salvati nel database.
            </p>
            <div className="flex gap-2">
              <Link href="/records" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <List className="h-4 w-4 mr-2" />
                  Vai a Records
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}