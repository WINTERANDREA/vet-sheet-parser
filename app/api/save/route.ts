// app/api/save/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// utility: parse "YYYY-MM" o "YYYY-MM-DD"
function toDateOrNull(s?: string | null) {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = m[3] ? Number(m[3]) : 1;
  const dt = new Date(Date.UTC(y, mo, d));
  return isNaN(dt.getTime()) ? null : dt;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { owners = [], pets = [] } = body as {
      owners: Array<{
        fullName?: string;
        taxCode?: string;
        emails?: string[];
        phones?: string[];
        address?: string;
        role?: "primary" | "secondary";
        startDate?: string;
        endDate?: string;
      }>;
      pets: Array<{
        name?: string;
        species?: string;
        breed?: string;
        sex?: string;
        dob?: string;
        color?: string;
        microchip?: string;
        sterilized?: boolean;
        visits?: Array<{
          visitedAt?: string;
          description: string;
          examsText?: string;
          prescriptionsText?: string;
          rawText?: string;
        }>;
      }>;
    };

    // 1) Upsert Owners
    const ownerIds: string[] = [];
    for (const o of owners) {
      let owner = null;

      if (o.taxCode) {
        owner = await prisma.owner.upsert({
          where: { taxCode: o.taxCode },
          update: {
            fullName: o.fullName ?? undefined,
            address: o.address ?? undefined,
          },
          create: {
            fullName: o.fullName ?? null,
            taxCode: o.taxCode,
            address: o.address ?? null,
          },
        });
      } else if (o.fullName) {
        owner = await prisma.owner.findFirst({
          where: {
            fullName: o.fullName,
            ...(o.address ? { address: o.address } : {}),
          },
        });
        if (!owner) {
          owner = await prisma.owner.create({
            data: {
              fullName: o.fullName ?? null,
              address: o.address ?? null,
            },
          });
        } else {
          owner = await prisma.owner.update({
            where: { id: owner.id },
            data: { address: o.address ?? owner.address },
          });
        }
      } else {
        // fallback: crea empty owner
        owner = await prisma.owner.create({ data: {} });
      }

      ownerIds.push(owner.id);

      // emails
      for (const e of o.emails ?? []) {
        if (!e) continue;
        await prisma.ownerEmail.upsert({
          where: { ownerId_email: { ownerId: owner.id, email: e } },
          update: {},
          create: { ownerId: owner.id, email: e },
        });
      }
      // phones
      for (const p of o.phones ?? []) {
        if (!p) continue;
        await prisma.ownerPhone.upsert({
          where: { ownerId_phone: { ownerId: owner.id, phone: p } },
          update: {},
          create: { ownerId: owner.id, phone: p },
        });
      }
    }

    // 2) Upsert Pets + PetOwner link + Visits
    let createdPets = 0;
    let createdVisits = 0;

    for (const p of pets) {
      let pet = null;
      if (p.microchip) {
        pet = await prisma.pet.upsert({
          where: { microchip: p.microchip },
          update: {
            name: p.name ?? undefined,
            species: p.species ?? undefined,
            breed: p.breed ?? undefined,
            sex: p.sex ?? undefined,
            dob: toDateOrNull(p.dob) ?? undefined,
            color: p.color ?? undefined,
            sterilized:
              typeof p.sterilized === "boolean" ? p.sterilized : undefined,
          },
          create: {
            name: p.name ?? null,
            species: p.species ?? null,
            breed: p.breed ?? null,
            sex: p.sex ?? null,
            dob: toDateOrNull(p.dob),
            color: p.color ?? null,
            microchip: p.microchip,
            sterilized: typeof p.sterilized === "boolean" ? p.sterilized : null,
          },
        });
      } else {
        // fallback per pet senza chip: (name+species) come euristica
        const existing = await prisma.pet.findFirst({
          where: { name: p.name ?? undefined, species: p.species ?? undefined },
        });
        pet = existing
          ? await prisma.pet.update({
              where: { id: existing.id },
              data: {
                breed: p.breed ?? existing.breed,
                sex: p.sex ?? existing.sex,
                dob: toDateOrNull(p.dob) ?? existing.dob,
                color: p.color ?? existing.color,
                sterilized:
                  typeof p.sterilized === "boolean"
                    ? p.sterilized
                    : existing.sterilized,
              },
            })
          : await prisma.pet.create({
              data: {
                name: p.name ?? null,
                species: p.species ?? null,
                breed: p.breed ?? null,
                sex: p.sex ?? null,
                dob: toDateOrNull(p.dob),
                color: p.color ?? null,
                sterilized:
                  typeof p.sterilized === "boolean" ? p.sterilized : null,
              },
            });
      }
      if (!pet) continue;
      if (!p.microchip && !pet.microchip) createdPets++; // solo indicativo

      // Link con tutti gli owners del payload (con ruolo/periodo se presenti)
      for (const [idx, o] of owners.entries()) {
        const ownerId = ownerIds[idx];
        const startDate = toDateOrNull(o.startDate ?? null);
        const endDate = toDateOrNull(o.endDate ?? null);
        const role = o.role ?? "secondary";

        // evita duplicati banali (stesso owner/pet/periodo/ruolo)
        const existingLink = await prisma.petOwner.findFirst({
          where: { ownerId, petId: pet.id, role, startDate, endDate },
        });
        if (!existingLink) {
          await prisma.petOwner.create({
            data: { ownerId, petId: pet.id, role, startDate, endDate },
          });
        }
      }

      // Visits (evita duplicati su (petId, visitedAt, description))
      for (const v of p.visits ?? []) {
        const visitedAt = toDateOrNull(v.visitedAt ?? null);
        const existing = await prisma.visit.findFirst({
          where: {
            petId: pet.id,
            visitedAt,
            description: v.description ?? "",
          },
        });
        if (!existing) {
          await prisma.visit.create({
            data: {
              petId: pet.id,
              visitedAt,
              description: v.description ?? "",
              examsText: v.examsText ?? null,
              prescriptionsText: v.prescriptionsText ?? null,
            },
          });
          createdVisits++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      owners: ownerIds.length,
      createdPets,
      createdVisits,
    });
  } catch (e: any) {
    console.error("[save] error", e);
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
