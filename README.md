# Prep School Hub

A personal planning hub for a UK independent prep school teacher — dashboard, academic
calendar, timetable, classes, markbook, cover work, pastoral/tutor group, co-curricular,
CPD & career, contacts and emergency procedures, all in one private app.

Built as a real full-stack app (not a single HTML file):

- **Client**: React + TypeScript + Vite + Tailwind CSS, React Router
- **Server**: Node.js + Express + TypeScript — in production it also serves the built client,
  so the whole app is one web service
- **Database**: PostgreSQL via Prisma
- **Auth**: single passcode you set on first run (hashed, stored in the database — this app has one user: you)

The "AI assistant" panels don't call any external AI API. They build a ready-made prompt from
your own data and let you copy it into Claude or ChatGPT yourself, so no API key or billing is needed.

## Hosting it live (Render)

This repo includes a `render.yaml` Blueprint, so Render can provision the web service *and*
a free Postgres database in one go, straight from GitHub — no terminal required. See
`DEPLOY.md` for the exact click-through steps.

## Local development

### Requirements

- Node.js 20+ (`brew install node`)
- PostgreSQL (`brew install postgresql@16 && brew services start postgresql@16`)

### First-time setup

```bash
# create a local database once
createuser prep_school_hub --pwprompt   # or use psql, see below
createdb prep_school_hub -O prep_school_hub

cd server
npm install
npx prisma migrate deploy
cd ../client
npm install
```

`server/.env` already points at `postgresql://prep_school_hub:localdevpassword@localhost:5432/prep_school_hub`
— update it if you used a different local username/password. If you ever deploy this
somewhere yourself (outside the Render Blueprint), change `JWT_SECRET` to a long random string.

### Running it

Open two terminals:

```bash
# Terminal 1 — API server (http://localhost:4000)
cd server
npm run dev

# Terminal 2 — web app (http://localhost:5173)
cd client
npm run dev
```

Then open **http://localhost:5173**. On first visit you'll be asked to set a passcode — that's
what protects your data.

## Data & backups

Everything lives in the Postgres database, plus any uploaded files in `server/uploads/`
(CPD certificates, career evidence). Locally, `pg_dump prep_school_hub > backup.sql` backs up
your data. On Render's free tier, uploaded files do **not** persist across redeploys (the free
plan has no persistent disk) — treat file uploads there as convenience, not long-term storage,
until/unless you add a paid disk.

## Project layout

```
server/
  prisma/schema.prisma   — full data model (terms, classes, pupils, markbook, CE tracker,
                            cover folders, duties, pastoral notes, teams, fixtures, CPD, etc.)
  src/routes/            — REST API (generic CRUD for most models + bespoke endpoints for
                            the dashboard, cover sheet generation, markbook, search, CSV
                            exports and AI prompt building)
client/
  src/pages/              — one page/tab set per module in the spec
  src/components/         — shared Layout, Modal, generic CRUD table/form, AI prompt panel
render.yaml               — Render Blueprint (web service + Postgres database)
DEPLOY.md                 — click-through deployment guide
```

## Notes

- Dates are shown as DD/MM/YYYY throughout, and terms follow Michaelmas/Lent/Summer.
- Pastoral notes and the tutor group are visually separated (amber "private" banner) from
  academic records, per the brief.
- Contacts never store actual passwords — only a "where credentials are stored" note.
- The Cover Work page's "Print cover sheet" button uses the browser's print dialog with a
  print stylesheet that hides all navigation chrome.
