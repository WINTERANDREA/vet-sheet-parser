// app/api/records/owners/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const owners = await prisma.owner.findMany({
      orderBy: [{ fullName: "asc" }],
      include: {
        petLinks: {
          include: {
            pet: {
              select: {
                id: true,
                visits: {
                  select: { visitedAt: true },
                  orderBy: { visitedAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const rows = owners.map((o) => {
      const petIds = new Set(o.petLinks.map((l) => l.pet.id));
      const petsCount = petIds.size;

      // ultima visita tra tutti i pet collegati
      let lastVisit: string | null = null;
      for (const l of o.petLinks) {
        const v = l.pet.visits[0]?.visitedAt;
        if (v) {
          const iso = new Date(v).toISOString();
          if (!lastVisit || iso > lastVisit) lastVisit = iso;
        }
      }

      return {
        id: o.id,
        fullName: o.fullName,
        taxCode: o.taxCode,
        address: o.address,
        petsCount,
        visitsCount: 0, // calcoliamo con query mirata sotto
        linksCount: o.petLinks.length,
        lastVisitAt: lastVisit,
      };
    });

    // calcolo visitsCount per owner (somma visite dei suoi pet)
    // (query unica con aggregazione per performance)
    const visitsByOwner = await prisma.petOwner.findMany({
      select: {
        ownerId: true,
        pet: { select: { _count: { select: { visits: true } } } },
      },
    });

    const visitsMap = new Map<string, number>();
    for (const r of visitsByOwner) {
      visitsMap.set(
        r.ownerId,
        (visitsMap.get(r.ownerId) || 0) + r.pet._count.visits
      );
    }

    for (const r of rows) {
      r.visitsCount = visitsMap.get(r.id) || 0;
    }

    return NextResponse.json(rows);
  } catch (e: any) {
    console.error("[records/owners] error", e);
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
