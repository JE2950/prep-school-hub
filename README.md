# Prep School Hub

A personal planning hub for a UK independent prep school teacher — dashboard, academic
calendar, timetable, classes, markbook, cover work, pastoral/tutor group, co-curricular,
CPD & career, contacts and emergency procedures, all in one private app.

Built as a real full-stack app (not a single HTML file):

- **Client**: React + TypeScript + Vite + Tailwind CSS, React Router
- **Server**: Node.js + Express + TypeScript
- **Database**: SQLite via Prisma (local file, `server/prisma/dev.db`)
- **Auth**: single passcode you set on first run (hashed, stored locally — this app has one user: you)

The "AI assistant" panels don't call any external AI API. They build a ready-made prompt from
your own data and let you copy it into Claude or ChatGPT yourself, so no API key or billing is needed.

## Requirements

- Node.js 20+ (this was set up with Node 26 via Homebrew: `brew install node`)

## First-time setup

```bash
cd server
npm install
npx prisma migrate deploy   # creates server/prisma/dev.db
cd ../client
npm install
```

The server reads config from `server/.env` (already created, safe local defaults). If you ever
deploy this somewhere other than your own machine, change `JWT_SECRET` to a long random string.

## Running it

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
what protects your data on this machine.

## Data & backups

Everything lives in `server/prisma/dev.db` (SQLite) plus any uploaded files in `server/uploads/`.
To back up your data, just copy those. To reset everything, delete `dev.db` and re-run
`npx prisma migrate deploy`.

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
```

## Notes

- Dates are shown as DD/MM/YYYY throughout, and terms follow Michaelmas/Lent/Summer.
- Pastoral notes and the tutor group are visually separated (amber "private" banner) from
  academic records, per the brief.
- Contacts never store actual passwords — only a "where credentials are stored" note.
- The Cover Work page's "Print cover sheet" button uses the browser's print dialog with a
  print stylesheet that hides all navigation chrome.
