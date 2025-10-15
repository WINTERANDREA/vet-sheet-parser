"use client";
import { useEffect, useState } from "react";

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
    <main>
      <h2 style={{ marginBottom: 8 }}>Records (DB)</h2>

      <div style={{ display: "flex", gap: 8, margin: "8px 0 16px" }}>
        <input
          placeholder='Cerca per nome / CF / indirizzo'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            padding: 8,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />
        <a
          href='/review'
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          Importa
        </a>
      </div>

      {loading && <p>Caricamento…</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {!loading && !err && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Proprietario</th>
              <th>CF</th>
              <th>Indirizzo</th>
              <th>Animali</th>
              <th>Visite</th>
              <th>Ultima visita</th>
              <th>Link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{r.fullName || "—"}</td>
                <td style={{ textAlign: "center" }}>{r.taxCode || "—"}</td>
                <td>{r.address || "—"}</td>
                <td style={{ textAlign: "center" }}>{r.petsCount}</td>
                <td style={{ textAlign: "center" }}>{r.visitsCount}</td>
                <td style={{ textAlign: "center" }}>{fmt(r.lastVisitAt)}</td>
                <td style={{ textAlign: "center" }}>{r.linksCount}</td>
                <td style={{ textAlign: "right" }}>
                  <a href={`/records/${r.id}`}>Apri</a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{ padding: 12, textAlign: "center", color: "#777" }}
                >
                  Nessun risultato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
