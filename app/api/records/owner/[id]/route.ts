// app/api/records/owner/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const o = await prisma.owner.findUnique({
      where: { id },
      include: {
        emails: true,
        phones: true,
        petLinks: {
          include: {
            pet: {
              include: {
                owners: { include: { owner: true } }, // timeline completa
                visits: { orderBy: { visitedAt: "desc" } },
              },
            },
          },
        },
      },
    });
    if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // dedup pets (in caso di link multipli)
    const seen = new Set<string>();
    const pets = [];
    for (const l of o.petLinks) {
      if (seen.has(l.pet.id)) continue;
      seen.add(l.pet.id);
      pets.push(l.pet);
    }

    return NextResponse.json({
      id: o.id,
      fullName: o.fullName,
      taxCode: o.taxCode,
      address: o.address,
      emails: o.emails.map((e) => ({ email: e.email })),
      phones: o.phones.map((p) => ({ phone: p.phone })),
      pets: pets.map((p) => ({
        id: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        sex: p.sex,
        dob: p.dob,
        color: p.color,
        microchip: p.microchip,
        sterilized: p.sterilized,
        owners: p.owners.map((lnk) => ({
          id: lnk.id,
          role: lnk.role,
          startDate: lnk.startDate,
          endDate: lnk.endDate,
          owner: {
            id: lnk.owner.id,
            fullName: lnk.owner.fullName,
            taxCode: lnk.owner.taxCode,
          },
        })),
        visits: p.visits.map((v) => ({
          id: v.id,
          visitedAt: v.visitedAt,
          description: v.description,
          examsText: v.examsText,
          prescriptionsText: v.prescriptionsText,
        })),
      })),
    });
  } catch (e: any) {
    console.error("[records/owner/:id] error", e);
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
