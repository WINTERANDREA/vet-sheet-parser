# Vet Review — v3 (visits+)
- Segmentazione visite basata su **data a inizio riga**
- Cattura **esami** (blocchi persistenti), **prescrizioni**, e **rawText**
- Script **bulk import**: `pnpm import:all`

## Setup
pnpm i
cp .env.example .env
pnpm prisma:push
pnpm dev

## Import massivo
pnpm import:all
