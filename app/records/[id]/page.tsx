"use client";
import { useEffect, useState } from "react";

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

  if (loading) return <p>Caricamento…</p>;
  if (err || !data)
    return (
      <p style={{ color: "crimson" }}>
        Errore: {err || "dati non disponibili"}
      </p>
    );

  return (
    <main>
      <a href='/records'>← Indice</a>
      <h2 style={{ marginTop: 8 }}>{data.fullName || "—"}</h2>
      <div style={{ color: "#666", marginBottom: 12 }}>
        CF: {data.taxCode || "—"} · {data.address || "—"}
      </div>

      <div
        style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div>
          <strong>Email:</strong>{" "}
          {data.emails.length
            ? data.emails.map((e) => e.email).join(", ")
            : "—"}
        </div>
        <div>
          <strong>Telefoni:</strong>{" "}
          {data.phones.length
            ? data.phones.map((p) => p.phone).join(", ")
            : "—"}
        </div>
      </div>

      {data.pets.map((p, i) => (
        <section
          key={p.id}
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <h3>
            Animale {i + 1}: {p.name || "—"}{" "}
            <small style={{ color: "#666" }}>({p.species || "—"})</small>
          </h3>
          <div style={{ color: "#666", marginBottom: 8 }}>
            Microchip: {p.microchip || "—"}
          </div>

          <details style={{ marginBottom: 8 }}>
            <summary>
              <strong>Timeline proprietari</strong>
            </summary>
            {(p.owners || []).length === 0 ? (
              <i>Nessun link proprietario</i>
            ) : (
              <ul>
                {p.owners.map((link) => (
                  <li key={link.id}>
                    {link.owner?.fullName || "—"} ({link.owner?.taxCode || "—"})
                    — <em>{link.role}</em>
                    {link.startDate ? ` · dal ${link.startDate}` : ""}
                    {link.endDate ? ` al ${link.endDate}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </details>

          {(p.visits || []).length === 0 ? (
            <i>Nessuna visita</i>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Data</th>
                  <th>Descrizione</th>
                  <th>Esami</th>
                  <th>Prescrizioni</th>
                </tr>
              </thead>
              <tbody>
                {p.visits.map((v) => (
                  <tr
                    key={v.id}
                    style={{
                      verticalAlign: "top",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <td style={{ whiteSpace: "nowrap" }}>
                      {v.visitedAt || "—"}
                    </td>
                    <td style={{ maxWidth: 520, whiteSpace: "pre-wrap" }}>
                      {v.description || "—"}
                    </td>
                    <td style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>
                      {v.examsText || "—"}
                    </td>
                    <td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>
                      {v.prescriptionsText || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </main>
  );
}
