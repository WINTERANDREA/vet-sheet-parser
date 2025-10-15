"use client";
import { useEffect, useState } from "react";

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

function warnStyle(v?: string | number | null | undefined) {
  const bad =
    v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  return bad ? { background: "#fff4d6" } : undefined;
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
        const text = await r.text(); // <-- leggiamo sempre testo
        if (!r.ok) {
          // server ha risposto con JSON o string semplice: mostriamo info utili
          let payload: any = null;
          try {
            payload = JSON.parse(text);
          } catch {}
          const msg = payload?.error || text || `HTTP ${r.status}`;
          throw new Error(`Parse API error: ${msg}`);
        }
        // risposta OK: deve essere JSON
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
    <main
      style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}
    >
      <aside style={{ borderRight: "1px solid #ddd", paddingRight: 12 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>File in /data</h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            maxHeight: "70vh",
            overflow: "auto",
          }}
        >
          {files.map((f) => (
            <li key={f.name}>
              <button
                onClick={() => setSelected(f.name)}
                style={{
                  background: selected === f.name ? "#eef" : "transparent",
                  border: 0,
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
                title={`${f.size} bytes`}
              >
                {f.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section>
        {!selected && <p>Seleziona un file a sinistra.</p>}
        {loading && <p>Caricamento…</p>}

        {parsed && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* Orig */}
            <div>
              <h3>Originale</h3>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "#fafafa",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #eee",
                  maxHeight: "70vh",
                  overflow: "auto",
                }}
              >
                {raw}
              </pre>
            </div>

            {/* Editable DB fields */}
            <div>
              <h3>Campi DB (editabili)</h3>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  maxHeight: "70vh",
                  overflow: "auto",
                }}
              >
                {/* Owners */}
                <fieldset
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <legend style={{ padding: "0 6px" }}>
                    Proprietari ({parsed.owners.length})
                  </legend>
                  {parsed.owners.map((o, oi) => (
                    <div
                      key={oi}
                      style={{
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        padding: 8,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                        }}
                      >
                        <label>
                          Nome completo
                          <input
                            value={o.fullName ?? ""}
                            onChange={(e) =>
                              update(["owners", oi, "fullName"], e.target.value)
                            }
                            style={{ width: "100%", ...warnStyle(o.fullName) }}
                          />
                        </label>
                        <label>
                          Codice fiscale
                          <input
                            value={o.taxCode ?? ""}
                            onChange={(e) =>
                              update(["owners", oi, "taxCode"], e.target.value)
                            }
                            style={{ width: "100%" }}
                          />
                        </label>
                        <label>
                          Email (separate da virgola)
                          <input
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
                            style={{ width: "100%" }}
                          />
                        </label>
                        <label>
                          Telefoni (separati da virgola)
                          <input
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
                            style={{ width: "100%" }}
                          />
                        </label>
                        <label style={{ gridColumn: "1 / -1" }}>
                          Indirizzo
                          <input
                            value={o.address ?? ""}
                            onChange={(e) =>
                              update(["owners", oi, "address"], e.target.value)
                            }
                            style={{ width: "100%" }}
                          />
                        </label>
                        <label>
                          Ruolo
                          <select
                            value={o.role || "secondary"}
                            onChange={(e) =>
                              update(
                                ["owners", oi, "role"],
                                e.target.value as any
                              )
                            }
                          >
                            <option value='primary'>primary</option>
                            <option value='secondary'>secondary</option>
                          </select>
                        </label>
                        <label>
                          Start
                          <input
                            placeholder='YYYY-MM-DD'
                            value={o.startDate ?? ""}
                            onChange={(e) =>
                              update(
                                ["owners", oi, "startDate"],
                                e.target.value
                              )
                            }
                          />
                        </label>
                        <label>
                          End
                          <input
                            placeholder='YYYY-MM-DD'
                            value={o.endDate ?? ""}
                            onChange={(e) =>
                              update(["owners", oi, "endDate"], e.target.value)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </fieldset>

                {/* Pets + Visits */}
                {parsed.pets?.map((pet, pi) => (
                  <fieldset
                    key={pi}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <legend>Animale {pi + 1}</legend>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        gap: 8,
                      }}
                    >
                      <label style={{ gridColumn: "span 2" }}>
                        Nome
                        <input
                          value={pet.name ?? ""}
                          onChange={(e) =>
                            update(["pets", pi, "name"], e.target.value)
                          }
                          style={{ width: "100%", ...warnStyle(pet.name) }}
                        />
                      </label>
                      <label>
                        Specie
                        <input
                          value={pet.species ?? ""}
                          onChange={(e) =>
                            update(["pets", pi, "species"], e.target.value)
                          }
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        Sesso
                        <input
                          value={pet.sex ?? ""}
                          onChange={(e) =>
                            update(["pets", pi, "sex"], e.target.value)
                          }
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        Razza
                        <input
                          value={pet.breed ?? ""}
                          onChange={(e) =>
                            update(["pets", pi, "breed"], e.target.value)
                          }
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        Data nascita
                        <input
                          value={pet.dob ?? ""}
                          onChange={(e) =>
                            update(["pets", pi, "dob"], e.target.value)
                          }
                          style={{ width: "100%" }}
                          placeholder='YYYY-MM o YYYY-MM-DD'
                        />
                      </label>
                      <label style={{ gridColumn: "span 2" }}>
                        Colore
                        <input
                          value={pet.color ?? ""}
                          onChange={(e) =>
                            update(["pets", pi, "color"], e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Microchip
                        <input
                          value={pet.microchip ?? ""}
                          onChange={(e) =>
                            update(["pets", pi, "microchip"], e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Sterilizzato/a
                        <select
                          value={String(!!pet.sterilized)}
                          onChange={(e) =>
                            update(
                              ["pets", pi, "sterilized"],
                              e.target.value === "true"
                            )
                          }
                        >
                          <option value='true'>Sì</option>
                          <option value='false'>No</option>
                        </select>
                      </label>
                    </div>

                    {pet.visits?.map((v, vi) => (
                      <details key={vi} style={{ marginTop: 8 }} open>
                        <summary>
                          Visita {vi + 1} — {v.visitedAt || "senza data"}
                        </summary>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                            padding: 8,
                            border: "1px solid #f0f0f0",
                            borderRadius: 8,
                          }}
                        >
                          <label>
                            Data visita (YYYY-MM-DD)
                            <input
                              value={v.visitedAt ?? ""}
                              onChange={(e) =>
                                update(
                                  ["pets", pi, "visits", vi, "visitedAt"],
                                  e.target.value
                                )
                              }
                              style={{
                                width: "100%",
                                ...warnStyle(v.visitedAt),
                              }}
                            />
                          </label>
                          <div style={{ gridColumn: "span 2" }}>
                            <label>
                              Descrizione (clinica/terapie/comunicazioni)
                            </label>
                            <textarea
                              value={v.description ?? ""}
                              onChange={(e) =>
                                update(
                                  ["pets", pi, "visits", vi, "description"],
                                  e.target.value
                                )
                              }
                              style={{
                                width: "100%",
                                height: 100,
                                ...warnStyle(v.description),
                              }}
                            />
                          </div>
                          <div style={{ gridColumn: "span 2" }}>
                            <label>Esami (lab/imaging/test)</label>
                            <textarea
                              value={v.examsText ?? ""}
                              onChange={(e) =>
                                update(
                                  ["pets", pi, "visits", vi, "examsText"],
                                  e.target.value
                                )
                              }
                              style={{ width: "100%", height: 120 }}
                            />
                          </div>
                          <div style={{ gridColumn: "span 2" }}>
                            <label>Prescrizioni / Terapie</label>
                            <textarea
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
                              style={{ width: "100%", height: 100 }}
                            />
                          </div>
                          <details style={{ gridColumn: "span 2" }}>
                            <summary>Raw visit text</summary>
                            <pre style={{ whiteSpace: "pre-wrap" }}>
                              {v.rawText || ""}
                            </pre>
                          </details>
                        </div>
                      </details>
                    ))}
                  </fieldset>
                ))}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={saveToDB}
                    disabled={saving}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                    }}
                  >
                    {saving ? "Salvataggio…" : "Conferma e salva su DB"}
                  </button>
                  {message && <span>{message}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
