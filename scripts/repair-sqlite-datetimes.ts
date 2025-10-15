// scripts/repair-sqlite-datetimes.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Nota: SQLite salva DateTime come TEXT. Qui forziamo a NULL tutto ciò che non assomiglia a "YYYY-MM-DD" (o "YYYY-MM-DDT...")
// È un fix conservativo: non prova a correggere, solo a ripulire illeggibili.

async function main() {
  // Visit.visitedAt
  await prisma.$executeRawUnsafe(`
    UPDATE Visit
    SET visitedAt = NULL
    WHERE visitedAt IS NOT NULL
      AND (length(visitedAt) < 10 OR substr(visitedAt,1,4) NOT GLOB '[0-9][0-9][0-9][0-9]'
           OR substr(visitedAt,5,1) <> '-' OR substr(visitedAt,8,1) <> '-' );
  `);

  // Pet.dob
  await prisma.$executeRawUnsafe(`
    UPDATE Pet
    SET dob = NULL
    WHERE dob IS NOT NULL
      AND (length(dob) < 10 OR substr(dob,1,4) NOT GLOB '[0-9][0-9][0-9][0-9]'
           OR substr(dob,5,1) <> '-' OR substr(dob,8,1) <> '-' );
  `);

  // PetOwner.startDate / endDate
  await prisma.$executeRawUnsafe(`
    UPDATE PetOwner
    SET startDate = NULL
    WHERE startDate IS NOT NULL
      AND (length(startDate) < 10 OR substr(startDate,1,4) NOT GLOB '[0-9][0-9][0-9][0-9]'
           OR substr(startDate,5,1) <> '-' OR substr(startDate,8,1) <> '-' );
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE PetOwner
    SET endDate = NULL
    WHERE endDate IS NOT NULL
      AND (length(endDate) < 10 OR substr(endDate,1,4) NOT GLOB '[0-9][0-9][0-9][0-9]'
           OR substr(endDate,5,1) <> '-' OR substr(endDate,8,1) <> '-' );
  `);

  console.log("✅ DateTime ripuliti (valori invalidi -> NULL).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
