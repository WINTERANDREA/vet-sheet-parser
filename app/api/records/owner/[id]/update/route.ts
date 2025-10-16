import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownerId = params.id;
    const body = await req.json();
    const { owner, pets } = body;

    // Update owner information
    if (owner) {
      await prisma.owner.update({
        where: { id: ownerId },
        data: {
          fullName: owner.fullName || null,
          taxCode: owner.taxCode || null,
          address: owner.address || null,
        },
      });

      // Update emails
      if (Array.isArray(owner.emails)) {
        // Delete existing emails
        await prisma.ownerEmail.deleteMany({
          where: { ownerId },
        });
        // Create new emails
        for (const email of owner.emails) {
          if (email.trim()) {
            await prisma.ownerEmail.create({
              data: {
                ownerId,
                email: email.trim(),
              },
            });
          }
        }
      }

      // Update phones
      if (Array.isArray(owner.phones)) {
        // Delete existing phones
        await prisma.ownerPhone.deleteMany({
          where: { ownerId },
        });
        // Create new phones
        for (const phone of owner.phones) {
          if (phone.trim()) {
            await prisma.ownerPhone.create({
              data: {
                ownerId,
                phone: phone.trim(),
              },
            });
          }
        }
      }
    }

    // Update pets
    if (Array.isArray(pets)) {
      for (const pet of pets) {
        if (!pet.id) continue;

        await prisma.pet.update({
          where: { id: pet.id },
          data: {
            name: pet.name || null,
            species: pet.species || null,
            breed: pet.breed || null,
            sex: pet.sex || null,
            dob: pet.dob || null,
            color: pet.color || null,
            sterilized: pet.sterilized ?? null,
            microchip: pet.microchip || null,
          },
        });

        // Update visits
        if (Array.isArray(pet.visits)) {
          for (const visit of pet.visits) {
            if (!visit.id) continue;

            await prisma.visit.update({
              where: { id: visit.id },
              data: {
                visitedAt: visit.visitedAt || null,
                description: visit.description || "",
                examsText: visit.examsText || null,
                prescriptionsText: visit.prescriptionsText || null,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Record updated successfully" });
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update record" },
      { status: 500 }
    );
  }
}
