"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Upload, Loader2, User, Calendar } from "lucide-react";
import Link from "next/link";

type OwnerRow = {
  id: string;
  fullName?: string | null;
  taxCode?: string | null;
  address?: string | null;
  petsCount: number;
  visitsCount: number;
  linksCount: number;
  lastVisitAt?: string | null;
};

export default function Records() {
  const [rows, setRows] = useState<OwnerRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/records/owners", { cache: "no-store" });
        if (!r.ok) throw new Error("Errore caricamento owners");
        setRows(await r.json());
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const s = `${r.fullName || ""} ${r.taxCode || ""} ${
      r.address || ""
    }`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const fmt = (iso?: string | null) => (iso ? iso.slice(0, 10) : "—");

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Database Records</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filtered.length} proprietar{filtered.length === 1 ? "io" : "i"} trovato
                  {filtered.length === 1 ? "" : "i"}
                </p>
              </div>
            </div>
            <Link href="/review">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Importa Nuovi
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, CF o indirizzo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-muted-foreground">Caricamento...</span>
            </div>
          )}

          {err && (
            <div className="text-center py-8 text-destructive">
              <p>{err}</p>
            </div>
          )}

          {!loading && !err && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proprietario</TableHead>
                    <TableHead className="text-center">CF</TableHead>
                    <TableHead>Indirizzo</TableHead>
                    <TableHead className="text-center">Animali</TableHead>
                    <TableHead className="text-center">Visite</TableHead>
                    <TableHead className="text-center">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Ultima Visita
                    </TableHead>
                    <TableHead className="text-center">Link</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.fullName || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {r.taxCode || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {r.address || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{r.petsCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{r.visitsCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {fmt(r.lastVisitAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{r.linksCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/records/${r.id}`}>
                          <Button variant="ghost" size="sm">
                            Dettagli
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nessun risultato trovato
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
