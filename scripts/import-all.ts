import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { parseNoteV4 } from "../parser/parser";

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

async function upsertOne(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = parseNoteV4(raw, true);
  const owners = parsed.owners || [];
  const pets = parsed.pets || [];
  const ownerIds: string[] = [];

  for (const ow of owners) {
    let dbOwner = null as any;
    if (ow.taxCode)
      dbOwner = await prisma.owner.findUnique({
        where: { taxCode: ow.taxCode },
      });
    if (!dbOwner && ow.fullName)
      dbOwner = await prisma.owner.findFirst({
        where: { fullName: ow.fullName },
      });
    if (!dbOwner)
      dbOwner = await prisma.owner.create({
        data: {
          fullName: ow.fullName || null,
          taxCode: ow.taxCode || null,
          address: ow.address || null,
        },
      });
    else
      dbOwner = await prisma.owner.update({
        where: { id: dbOwner.id },
        data: {
          fullName: ow.fullName || dbOwner.fullName,
          address: ow.address || dbOwner.address,
        },
      });
    ownerIds.push(dbOwner.id);

    if (Array.isArray(ow.emails)) {
      const existing = await prisma.ownerEmail.findMany({
        where: { ownerId: dbOwner.id },
      });
      const want = new Set(ow.emails.map((e) => e.toLowerCase()));
      const toDelete = existing
        .filter((e) => !want.has(e.email.toLowerCase()))
        .map((e) => e.id);
      if (toDelete.length)
        await prisma.ownerEmail.deleteMany({ where: { id: { in: toDelete } } });
      for (const em of ow.emails) {
        await prisma.ownerEmail.upsert({
          where: { ownerId_email: { ownerId: dbOwner.id, email: em } },
          update: {},
          create: { ownerId: dbOwner.id, email: em },
        });
      }
    }
    if (Array.isArray(ow.phones)) {
      const existing = await prisma.ownerPhone.findMany({
        where: { ownerId: dbOwner.id },
      });
      const want = new Set(ow.phones.map((e) => e));
      const toDelete = existing
        .filter((e) => !want.has(e.phone))
        .map((e) => e.id);
      if (toDelete.length)
        await prisma.ownerPhone.deleteMany({ where: { id: { in: toDelete } } });
      for (const ph of ow.phones) {
        await prisma.ownerPhone.upsert({
          where: { ownerId_phone: { ownerId: dbOwner.id, phone: ph } },
          update: {},
          create: { ownerId: dbOwner.id, phone: ph },
        });
      }
    }
  }

  for (const p of pets) {
    let dbPet = null as any;
    if (p.microchip)
      dbPet = await prisma.pet.findFirst({ where: { microchip: p.microchip } });
    if (!dbPet && p.name)
      dbPet = await prisma.pet.findFirst({ where: { name: p.name } });
    if (!dbPet)
      dbPet = await prisma.pet.create({
        data: {
          name: p.name || null,
          species: p.species || null,
          breed: p.breed || null,
          sex: p.sex || null,
          dob: p.dob || null,
          color: p.color || null,
          sterilized: p.sterilized ?? null,
          microchip: p.microchip || null,
        },
      });
    else
      dbPet = await prisma.pet.update({
        where: { id: dbPet.id },
        data: {
          name: p.name || dbPet.name,
          species: p.species || dbPet.species,
          breed: p.breed || dbPet.breed,
          sex: p.sex || dbPet.sex,
          dob: p.dob || dbPet.dob,
          color: p.color || dbPet.color,
          sterilized: p.sterilized ?? dbPet.sterilized,
          microchip: p.microchip || dbPet.microchip,
        },
      });

    await prisma.petOwner.deleteMany({ where: { petId: dbPet.id } });
    for (const [i, ow] of owners.entries()) {
      const ownerId = ownerIds[i];
      await prisma.petOwner.create({
        data: {
          petId: dbPet.id,
          ownerId,
          role: ow.role || "secondary",
          startDate: ow.startDate || null,
          endDate: ow.endDate || null,
          note: null,
        },
      });
    }
    const primaryIdx = owners.findIndex(
      (o) => o.role === "primary" && (!o.endDate || o.endDate === "")
    );
    const currentOwnerId = primaryIdx >= 0 ? ownerIds[primaryIdx] : null;
    await prisma.pet.update({
      where: { id: dbPet.id },
      data: { ownerId: currentOwnerId },
    });

    for (const v of p.visits || []) {
      await prisma.visit.create({
        data: {
          petId: dbPet.id,
          visitedAt: v.visitedAt || null,
          description: v.description || "",
          examsText: v.examsText || null,
          prescriptionsText: v.prescriptionsText || null,
          rawText: v.rawText || null,
          attachments: v.attachments ? JSON.stringify(v.attachments) : null,
        },
      });
    }
  }
  console.log("Imported:", path.basename(filePath));
}

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  const files = fs.existsSync(dataDir)
    ? fs.readdirSync(dataDir).filter((n) => n.toLowerCase().endsWith(".txt"))
    : [];
  for (const f of files) await upsertOne(path.join(dataDir, f));
  console.log("Done.");
}
main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
