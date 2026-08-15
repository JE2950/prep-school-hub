# Deploying to Render (no terminal)

This repo has a `render.yaml` Blueprint. Render reads it and creates both the web service and
a free Postgres database for you, wired together automatically.

1. Go to **https://dashboard.render.com** and sign up / log in (GitHub sign-in is easiest).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub account if asked, then pick the **`prep-school-hub`** repository.
4. Render will detect `render.yaml` and show you what it's about to create:
   - a **Web Service** named `prep-school-hub`
   - a **PostgreSQL database** named `prep-school-hub-db`
5. Click **Apply** (or **Create New Resources**). Render will:
   - provision the free database
   - install dependencies, build the client, run the database migrations, build the server
   - start the app
6. The first deploy takes a few minutes — you can watch progress live in the **Logs** tab.
7. Once it says **Live**, open the URL shown at the top of the service page
   (something like `https://prep-school-hub.onrender.com`). You'll land on the same
   first-run passcode setup screen as local — set a passcode and you're in.

## After that

- **Updates**: every time you (or I) `git push` to `main`, Render automatically rebuilds and
  redeploys. Nothing manual required.
- **Free tier behaviour**: the service spins down after ~15 minutes of no traffic and takes
  10-30 seconds to wake up on the next visit. Your data isn't affected — only the running
  process pauses. The database stays up.
- **File uploads**: CPD certificates / career evidence files are stored on the web service's
  local disk, which is wiped on every redeploy on the free plan. If that becomes a problem,
  the fix is either a Render paid persistent disk, or moving uploads to an object store
  (S3-compatible) — ask if you want that added later.
- **Custom domain**: Render's dashboard → your service → **Settings** → **Custom Domains** lets
  you point your own domain at it later, entirely from the browser.
