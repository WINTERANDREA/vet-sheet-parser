"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Mail, Phone, MapPin, User, Calendar, Loader2, PawPrint } from "lucide-react";
import Link from "next/link";

type Visit = {
  id: string;
  visitedAt?: string | null;
  description: string;
  examsText?: string | null;
  prescriptionsText?: string | null;
};
type PetOwner = {
  id: string;
  role: string;
  startDate?: string | null;
  endDate?: string | null;
  owner: { id: string; fullName?: string | null; taxCode?: string | null };
};
type Pet = {
  id: string;
  name?: string | null;
  species?: string | null;
  microchip?: string | null;
  owners: PetOwner[];
  visits: Visit[];
};
type Owner = {
  id: string;
  fullName?: string | null;
  taxCode?: string | null;
  address?: string | null;
  emails: { email: string }[];
  phones: { phone: string }[];
  pets: Pet[];
};

export default function OwnerDetail({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/records/owner/${params.id}`, {
          cache: "no-store",
        });
        if (!r.ok) throw new Error("Record non trovato");
        setData(await r.json());
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-muted-foreground">Caricamento...</span>
      </div>
    );
  }

  if (err || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-destructive">
            <p>Errore: {err || "dati non disponibili"}</p>
            <Link href="/records" className="mt-4 inline-block">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna all'indice
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/records">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{data.fullName || "—"}</h2>
          <p className="text-sm text-muted-foreground">
            CF: {data.taxCode || "—"}
          </p>
        </div>
      </div>

      {/* Owner Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Informazioni Proprietario</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Indirizzo</p>
                <p className="text-sm">{data.address || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                {data.emails.length > 0 ? (
                  <div className="space-y-1">
                    {data.emails.map((e, i) => (
                      <p key={i} className="text-sm">{e.email}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefoni</p>
                {data.phones.length > 0 ? (
                  <div className="space-y-1">
                    {data.phones.map((p, i) => (
                      <p key={i} className="text-sm">{p.phone}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pets */}
      {data.pets.map((p, i) => (
        <Card key={p.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <PawPrint className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>
                    {p.name || "—"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({p.species || "—"})
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Microchip: {p.microchip || "—"}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">
                {p.visits?.length || 0} visite
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Owner Timeline */}
            {(p.owners || []).length > 0 && (
              <details className="group">
                <summary className="cursor-pointer font-medium text-sm hover:text-primary transition-colors flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline Proprietari ({p.owners.length})
                </summary>
                <div className="mt-3 space-y-2 ml-6">
                  {p.owners.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">{link.role}</Badge>
                      <span className="font-medium">
                        {link.owner?.fullName || "—"}
                      </span>
                      <span className="text-muted-foreground">
                        ({link.owner?.taxCode || "—"})
                      </span>
                      {link.startDate && (
                        <span className="text-xs text-muted-foreground">
                          dal {link.startDate}
                        </span>
                      )}
                      {link.endDate && (
                        <span className="text-xs text-muted-foreground">
                          al {link.endDate}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Visits Table */}
            {(p.visits || []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Nessuna visita registrata
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Data</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Esami</TableHead>
                      <TableHead>Prescrizioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.visits.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {v.visitedAt || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm whitespace-pre-wrap line-clamp-3">
                            {v.description || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <p className="text-sm whitespace-pre-wrap line-clamp-3 text-muted-foreground">
                            {v.examsText || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <p className="text-sm whitespace-pre-wrap line-clamp-3 text-muted-foreground">
                            {v.prescriptionsText || "—"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {data.pets.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Nessun animale registrato per questo proprietario
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
