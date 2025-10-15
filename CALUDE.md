# CLAUDE.md

> Documento di “istruzioni operative” che Claude Code include automaticamente nel contesto.  
> Scopo: aumentare qualità, velocità e sicurezza nello sviluppo del tool **TXT → DB** (Next.js + Prisma), e fornire una playbook di **migrazione da SQLite a Postgres/Supabase**.

---

## 0 Contesto progetto (veloce)

- **Stack**: Next 14 (App Router, TS), Prisma, **SQLite** in locale, parser deterministico (regex + regole), UI di review, import massivo.
- **Path chiave**
  - `parser/parser.ts` – regole parsing TXT → { owners, pets, visits }
  - `app/review/page.tsx` – UI di validazione/edit inline (owners, pets, visite)
  - `app/api/save/route.ts` – upsert su Prisma (Owner/Email/Phone/Pet/PetOwner/Visit)
  - `app/api/parse/route.ts` – parsing “on demand” di un file in `/data`
  - `scripts/import-all.ts` – import massivo su tutti i `.txt` in `/data`
  - `prisma/schema.prisma` – schema **unico** del dominio
- **Comandi rapidi**
  - `pnpm dev` – avvio UI (`/review`, `/records`)
  - `pnpm prisma:push` – crea/aggiorna schema nel DB corrente
  - `pnpm prisma:studio` – ispezione DB
  - `pnpm import:all` – importa tutti i `.txt` in `/data`

---

## 1 Come usare Claude in questo repo (pattern consigliati)

> Claude Code include automaticamente i file `CLAUDE.md` nel prompt e supporta un flusso “agentic” personalizzabile (allowlist strumenti, slash commands, ecc.). Mantieni questo file breve ma mirato; iteralo nel tempo. (Rif.: best practice ufficiali)

### 1.1 Workflow base — **Explore → Plan → Code → Commit**

1. **Explore**: chiedi a Claude di leggere i file rilevanti (non scrivere codice).
2. **Plan**: “**think hard**” e proponi un piano in più step. Conferma/edita il piano.
3. **Code**: implementa a step, verificando ipotesi ed edge case.
4. **Commit/PR**: aggiorna README/changelog se necessario.
   > Questo evita salti prematuri al coding e migliora la qualità dell’output.

### 1.2 Workflow **TDD** mirato al parser

1. Scrivi/aggiorna **test** (input `.txt` realistici → output atteso).
2. Esegui e **verifica che falliscano**.
3. Implementa/affina parser finché i test **passano**.
4. Commit separando “test” e “fix”.
   > Il parser è deterministico: ogni nuova regola deve mantenere precisione alta e **non rompere** i casi esistenti.

### 1.3 Correggi la rotta presto e spesso

- Chiedi un **piano** prima del codice; interrompi/ri-lancia se prende una strada sbagliata.
- Usa **checklist** in un Markdown come “scratchpad” quando i task sono lunghi (refactor multipli, migrazioni, ecc.).
- Usa `/clear` per pulire il contesto tra attività.

### 1.4 Altri pattern utili

- **Q&A di codebase**: usa Claude per “onboarding” o per trovare dove intervenire.
- **Iterazioni visuali**: condividi screenshot/mock e iterare finché il risultato converge.
- **Headless mode** (CI/automation): esegui prompt non interattivi per lint/triage/build.
- **Multi-Claude**: un’istanza scrive codice, un’altra fa **review indipendente**.

> Suggerimenti ispirati alle best practice ufficiali di Anthropic per Claude Code (config `CLAUDE.md`, allowlist strumenti, workflow TDD/visual, headless, multi-Claude).

---

## 2 Regole di qualità per questo repo

### 2.1 Parser & Import

- Non perdere dati: **sempre** consolidare il non classificato in `description` o `rawText`.
- Blocchi **esami** → `examsText`; **prescrizioni** → `prescriptionsText`; visita segmentata da **data a inizio riga**.
- Aggiungi regole solo se **deterministiche** e **coperti da fixture** realistiche.

### 2.2 UI di Review

- Mostra **tutti** i campi editabili (owners, pets, visits).
- Evidenzia campi vuoti/sospetti (low-confidence) con background tenue.
- Non salvare se `visitedAt` e `description` sono palesemente inconsistenti.

### 2.3 Prisma/DB

- Usa **upsert** idempotenti per emails/phones e **link** proprietari in ordine.
- Non “ampliare” lo schema senza motivi forti. Evita migrazioni rumorose.

### 2.4 Stile codice

- TypeScript **strict**, niente `any` non necessario.
- Componenti React **funzionali**; “`use client`” solo quando serve.
- Nomi chiari, commenti essenziali (spiega regole di parsing non ovvie).

---

## 3 Comandi e diagnostica

- **Sviluppo locale (SQLite)**
  ```bash
  pnpm i
  cp .env.example .env     # DATABASE_URL=file:./dev.db
  pnpm prisma:push
  pnpm dev
  ```
