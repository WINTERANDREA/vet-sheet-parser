"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Mail, Phone, MapPin, User, Calendar, Loader2, PawPrint, Edit, Save, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  breed?: string | null;
  sex?: string | null;
  dob?: string | null;
  color?: string | null;
  sterilized?: boolean | null;
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
  const [editData, setEditData] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const r = await fetch(`/api/records/owner/${params.id}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error("Record non trovato");
      const owner = await r.json();
      setData(owner);
      setEditData(JSON.parse(JSON.stringify(owner))); // Deep clone
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateEditData = (path: (string | number)[], value: any) => {
    setEditData((prev) => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev)); // Deep clone
      let obj: any = clone;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
  };

  const handleSaveClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!editData) return;

    setSaving(true);
    setSaveMessage("");
    setShowConfirmDialog(false);

    try {
      const payload = {
        owner: {
          fullName: editData.fullName,
          taxCode: editData.taxCode,
          address: editData.address,
          emails: editData.emails.map(e => e.email),
          phones: editData.phones.map(p => p.phone),
        },
        pets: editData.pets.map(pet => ({
          id: pet.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          sex: pet.sex,
          dob: pet.dob,
          color: pet.color,
          sterilized: pet.sterilized,
          microchip: pet.microchip,
          visits: pet.visits.map(v => ({
            id: v.id,
            visitedAt: v.visitedAt,
            description: v.description,
            examsText: v.examsText,
            prescriptionsText: v.prescriptionsText,
          })),
        })),
      };

      const res = await fetch(`/api/records/owner/${params.id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Errore durante il salvataggio");

      setSaveMessage("Modifiche salvate con successo!");
      setIsEditing(false);

      // Reload data to reflect changes
      await loadData();

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (e: any) {
      setSaveMessage(e.message || "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData(JSON.parse(JSON.stringify(data))); // Reset to original data
    setIsEditing(false);
    setSaveMessage("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-muted-foreground">Caricamento...</span>
      </div>
    );
  }

  if (err || !data || !editData) {
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

  const currentData = isEditing ? editData : data;

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/records">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{currentData.fullName || "—"}</h2>
            <p className="text-sm text-muted-foreground">
              CF: {currentData.taxCode || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <Badge variant={saveMessage.includes("successo") ? "default" : "destructive"}>
              {saveMessage}
            </Badge>
          )}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Annulla
              </Button>
              <Button onClick={handleSaveClick} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salva Modifiche
                  </>
                )}
              </Button>
            </>
          )}
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
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={editData.fullName || ""}
                    onChange={(e) => updateEditData(["fullName"], e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Codice Fiscale</Label>
                  <Input
                    value={editData.taxCode || ""}
                    onChange={(e) => updateEditData(["taxCode"], e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Indirizzo</Label>
                <Input
                  value={editData.address || ""}
                  onChange={(e) => updateEditData(["address"], e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email (separate da virgola)</Label>
                <Input
                  value={editData.emails.map(e => e.email).join(", ")}
                  onChange={(e) =>
                    updateEditData(
                      ["emails"],
                      e.target.value.split(",").map(email => ({ email: email.trim() })).filter(e => e.email)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Telefoni (separati da virgola)</Label>
                <Input
                  value={editData.phones.map(p => p.phone).join(", ")}
                  onChange={(e) =>
                    updateEditData(
                      ["phones"],
                      e.target.value.split(",").map(phone => ({ phone: phone.trim() })).filter(p => p.phone)
                    )
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Indirizzo</p>
                  <p className="text-sm">{currentData.address || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  {currentData.emails.length > 0 ? (
                    <div className="space-y-1">
                      {currentData.emails.map((e, i) => (
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
                  {currentData.phones.length > 0 ? (
                    <div className="space-y-1">
                      {currentData.phones.map((p, i) => (
                        <p key={i} className="text-sm">{p.phone}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pets */}
      {currentData.pets.map((p, petIndex) => (
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
            {/* Pet Details - Editable */}
            {isEditing && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={editData.pets[petIndex]?.name || ""}
                    onChange={(e) => updateEditData(["pets", petIndex, "name"], e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Specie</Label>
                  <Input
                    value={editData.pets[petIndex]?.species || ""}
                    onChange={(e) => updateEditData(["pets", petIndex, "species"], e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Razza</Label>
                  <Input
                    value={editData.pets[petIndex]?.breed || ""}
                    onChange={(e) => updateEditData(["pets", petIndex, "breed"], e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sesso</Label>
                  <Input
                    value={editData.pets[petIndex]?.sex || ""}
                    onChange={(e) => updateEditData(["pets", petIndex, "sex"], e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Data di Nascita</Label>
                  <Input
                    value={editData.pets[petIndex]?.dob || ""}
                    onChange={(e) => updateEditData(["pets", petIndex, "dob"], e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Colore</Label>
                  <Input
                    value={editData.pets[petIndex]?.color || ""}
                    onChange={(e) => updateEditData(["pets", petIndex, "color"], e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Microchip</Label>
                  <Input
                    value={editData.pets[petIndex]?.microchip || ""}
                    onChange={(e) => updateEditData(["pets", petIndex, "microchip"], e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sterilizzato/a</Label>
                  <Select
                    value={String(!!editData.pets[petIndex]?.sterilized)}
                    onChange={(e) =>
                      updateEditData(["pets", petIndex, "sterilized"], e.target.value === "true")
                    }
                  >
                    <option value="true">Sì</option>
                    <option value="false">No</option>
                  </Select>
                </div>
              </div>
            )}

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

            {/* Visits */}
            {(p.visits || []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Nessuna visita registrata
              </p>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Visite ({p.visits.length})
                </h4>
                {isEditing ? (
                  <div className="space-y-4">
                    {editData.pets[petIndex]?.visits?.map((v, visitIndex) => (
                      <div key={v.id} className="border rounded-lg p-4 space-y-3 bg-white">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Visita {visitIndex + 1}</Badge>
                        </div>
                        <div className="grid gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Data Visita (YYYY-MM-DD)</Label>
                            <Input
                              value={v.visitedAt || ""}
                              onChange={(e) =>
                                updateEditData(
                                  ["pets", petIndex, "visits", visitIndex, "visitedAt"],
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Descrizione</Label>
                            <Textarea
                              value={v.description || ""}
                              onChange={(e) =>
                                updateEditData(
                                  ["pets", petIndex, "visits", visitIndex, "description"],
                                  e.target.value
                                )
                              }
                              className="min-h-[80px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Esami</Label>
                            <Textarea
                              value={v.examsText || ""}
                              onChange={(e) =>
                                updateEditData(
                                  ["pets", petIndex, "visits", visitIndex, "examsText"],
                                  e.target.value
                                )
                              }
                              className="min-h-[60px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Prescrizioni</Label>
                            <Textarea
                              value={v.prescriptionsText || ""}
                              onChange={(e) =>
                                updateEditData(
                                  ["pets", petIndex, "visits", visitIndex, "prescriptionsText"],
                                  e.target.value
                                )
                              }
                              className="min-h-[60px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {currentData.pets.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Nessun animale registrato per questo proprietario
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Conferma Salvataggio
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler salvare le modifiche? Questa azione aggiornerà i dati nel database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Annulla
            </Button>
            <Button onClick={handleConfirmSave}>
              Conferma Salvataggio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
