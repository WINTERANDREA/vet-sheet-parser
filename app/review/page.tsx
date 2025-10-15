"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, FileText, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Owner = {
  fullName?: string;
  taxCode?: string;
  emails?: string[];
  phones?: string[];
  address?: string;
  role?: "primary" | "secondary";
  startDate?: string;
  endDate?: string;
};
type Visit = {
  visitedAt?: string;
  description: string;
  examsText?: string;
  prescriptionsText?: string;
  rawText?: string;
  attachments?: string[];
};
type Pet = {
  name?: string;
  species?: string;
  breed?: string;
  sex?: string;
  dob?: string;
  color?: string;
  sterilized?: boolean;
  microchip?: string;
  visits: Visit[];
};
type Parsed = { owners: Owner[]; pets: Pet[]; raw?: string };

function isEmpty(v?: string | number | null | undefined) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

export default function ReviewPage() {
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [raw, setRaw] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch("/api/list")
      .then((r) => r.json())
      .then(setFiles);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`/api/parse?file=${encodeURIComponent(selected)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const text = await r.text();
        if (!r.ok) {
          let payload: any = null;
          try {
            payload = JSON.parse(text);
          } catch {}
          const msg = payload?.error || text || `HTTP ${r.status}`;
          throw new Error(`Parse API error: ${msg}`);
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error("Parse API non-JSON (body vuoto o corrotto).");
        }
      })
      .then((data) => {
        setParsed(data.parsed);
        setRaw(data.raw);
        setMessage("");
      })
      .catch((err: any) => {
        setParsed(null);
        setRaw("");
        setMessage(err.message || "Errore durante il parse");
      })
      .finally(() => setLoading(false));
  }, [selected]);

  const update = (path: (string | number)[], value: any) => {
    setParsed((prev) => {
      if (!prev) return prev;
      const clone: any = structuredClone(prev);
      let obj: any = clone;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return clone;
    });
  };

  const saveToDB = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js.error || "Errore salvataggio");
      setMessage(`Salvato su DB ✔`);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="grid lg:grid-cols-[280px_1fr] gap-6">
      {/* Sidebar */}
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              File in /data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[70vh] overflow-auto pr-2">
              {files.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setSelected(f.name)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    selected === f.name
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-slate-100"
                  )}
                  title={`${f.size} bytes`}
                >
                  {f.name}
                </button>
              ))}
              {files.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun file disponibile
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Main content */}
      <section className="space-y-6">
        {!selected && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Seleziona un file dalla lista a sinistra per iniziare
              </p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="pt-6 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Caricamento in corso...</span>
            </CardContent>
          </Card>
        )}

        {parsed && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Original Text */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Testo Originale</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap bg-slate-50 p-4 rounded-md border max-h-[70vh] overflow-auto">
                  {raw}
                </pre>
              </CardContent>
            </Card>

            {/* Editable Fields */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Campi DB (editabili)</h3>
                {message && (
                  <Badge variant={message.includes('✔') ? "default" : "destructive"}>
                    {message}
                  </Badge>
                )}
              </div>

              <div className="space-y-6 max-h-[70vh] overflow-auto pr-2">
                {/* Owners */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Proprietari ({parsed.owners.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {parsed.owners.map((o, oi) => (
                      <div
                        key={oi}
                        className="border rounded-lg p-4 space-y-3 bg-slate-50"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Nome completo</Label>
                            <Input
                              value={o.fullName ?? ""}
                              onChange={(e) =>
                                update(["owners", oi, "fullName"], e.target.value)
                              }
                              className={cn(
                                isEmpty(o.fullName) && "bg-amber-50 border-amber-300"
                              )}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Codice fiscale</Label>
                            <Input
                              value={o.taxCode ?? ""}
                              onChange={(e) =>
                                update(["owners", oi, "taxCode"], e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Email (separate da virgola)</Label>
                            <Input
                              value={(o.emails ?? []).join(", ")}
                              onChange={(e) =>
                                update(
                                  ["owners", oi, "emails"],
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Telefoni (separati da virgola)</Label>
                            <Input
                              value={(o.phones ?? []).join(", ")}
                              onChange={(e) =>
                                update(
                                  ["owners", oi, "phones"],
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Indirizzo</Label>
                            <Input
                              value={o.address ?? ""}
                              onChange={(e) =>
                                update(["owners", oi, "address"], e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Ruolo</Label>
                            <Select
                              value={o.role || "secondary"}
                              onChange={(e) =>
                                update(
                                  ["owners", oi, "role"],
                                  e.target.value as any
                                )
                              }
                            >
                              <option value="primary">primary</option>
                              <option value="secondary">secondary</option>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Start Date</Label>
                            <Input
                              placeholder="YYYY-MM-DD"
                              value={o.startDate ?? ""}
                              onChange={(e) =>
                                update(
                                  ["owners", oi, "startDate"],
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Pets + Visits */}
                {parsed.pets?.map((pet, pi) => (
                  <Card key={pi}>
                    <CardHeader>
                      <CardTitle className="text-base">Animale {pi + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={pet.name ?? ""}
                            onChange={(e) =>
                              update(["pets", pi, "name"], e.target.value)
                            }
                            className={cn(
                              isEmpty(pet.name) && "bg-amber-50 border-amber-300"
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Specie</Label>
                          <Input
                            value={pet.species ?? ""}
                            onChange={(e) =>
                              update(["pets", pi, "species"], e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Sesso</Label>
                          <Input
                            value={pet.sex ?? ""}
                            onChange={(e) =>
                              update(["pets", pi, "sex"], e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Razza</Label>
                          <Input
                            value={pet.breed ?? ""}
                            onChange={(e) =>
                              update(["pets", pi, "breed"], e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data nascita</Label>
                          <Input
                            value={pet.dob ?? ""}
                            onChange={(e) =>
                              update(["pets", pi, "dob"], e.target.value)
                            }
                            placeholder="YYYY-MM-DD"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Microchip</Label>
                          <Input
                            value={pet.microchip ?? ""}
                            onChange={(e) =>
                              update(["pets", pi, "microchip"], e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Colore</Label>
                          <Input
                            value={pet.color ?? ""}
                            onChange={(e) =>
                              update(["pets", pi, "color"], e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Sterilizzato/a</Label>
                          <Select
                            value={String(!!pet.sterilized)}
                            onChange={(e) =>
                              update(
                                ["pets", pi, "sterilized"],
                                e.target.value === "true"
                              )
                            }
                          >
                            <option value="true">Sì</option>
                            <option value="false">No</option>
                          </Select>
                        </div>
                      </div>

                      {/* Visits */}
                      <div className="space-y-3">
                        {pet.visits?.map((v, vi) => (
                          <details key={vi} className="group" open>
                            <summary className="cursor-pointer p-3 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors font-medium text-sm">
                              Visita {vi + 1} — {v.visitedAt || "senza data"}
                            </summary>
                            <div className="mt-2 space-y-3 p-3 border rounded-md">
                              <div className="space-y-1">
                                <Label className="text-xs">Data visita (YYYY-MM-DD)</Label>
                                <Input
                                  value={v.visitedAt ?? ""}
                                  onChange={(e) =>
                                    update(
                                      ["pets", pi, "visits", vi, "visitedAt"],
                                      e.target.value
                                    )
                                  }
                                  className={cn(
                                    isEmpty(v.visitedAt) && "bg-amber-50 border-amber-300"
                                  )}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Descrizione (clinica/terapie/comunicazioni)</Label>
                                <Textarea
                                  value={v.description ?? ""}
                                  onChange={(e) =>
                                    update(
                                      ["pets", pi, "visits", vi, "description"],
                                      e.target.value
                                    )
                                  }
                                  className={cn(
                                    "min-h-[100px]",
                                    isEmpty(v.description) && "bg-amber-50 border-amber-300"
                                  )}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Esami (lab/imaging/test)</Label>
                                <Textarea
                                  value={v.examsText ?? ""}
                                  onChange={(e) =>
                                    update(
                                      ["pets", pi, "visits", vi, "examsText"],
                                      e.target.value
                                    )
                                  }
                                  className="min-h-[120px]"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Prescrizioni / Terapie</Label>
                                <Textarea
                                  value={v.prescriptionsText ?? ""}
                                  onChange={(e) =>
                                    update(
                                      [
                                        "pets",
                                        pi,
                                        "visits",
                                        vi,
                                        "prescriptionsText",
                                      ],
                                      e.target.value
                                    )
                                  }
                                  className="min-h-[100px]"
                                />
                              </div>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                  Raw visit text
                                </summary>
                                <pre className="mt-2 whitespace-pre-wrap bg-slate-50 p-2 rounded border text-xs">
                                  {v.rawText || ""}
                                </pre>
                              </details>
                            </div>
                          </details>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Save Button */}
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      onClick={saveToDB}
                      disabled={saving}
                      className="w-full"
                      size="lg"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvataggio in corso...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Conferma e salva su DB
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
