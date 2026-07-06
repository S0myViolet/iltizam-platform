# Deploying Iltzam to Vercel

The app runs on Vercel with a hosted Postgres database and Vercel Blob for
evidence file uploads. One-time setup takes about 15 minutes.

## 1. Create the database (Neon)

1. Sign up at https://neon.tech (free tier is fine for a demo).
2. Create a project (region close to your users), database name `iltizam`.
3. From the connection details, copy **two** connection strings:
   - the **pooled** string (host contains `-pooler`) → this is `DATABASE_URL`
   - the **direct** string (no `-pooler`) → this is `DIRECT_URL`

> Any other hosted Postgres works too — if it has no pooler, use the same
> string for both variables.

## 2. Create the Vercel project

1. Sign in at https://vercel.com and **Import** the `iltizam-platform` GitHub
   repository.
2. Under **Settings → Environment Variables**, add:
   - `DATABASE_URL` — the pooled Neon string
   - `DIRECT_URL` — the direct Neon string
3. Under **Storage**, create a **Blob** store and connect it to the project —
   this injects `BLOB_READ_WRITE_TOKEN` automatically. (Without it, file
   uploads are rejected in production; evidence links still work.)
4. If deploying a branch (not `main`), set the production branch under
   **Settings → Git**, or just open the branch's preview deployment URL.

## 3. Create the schema and seed the control library

Run once from your machine, pointing at the production database:

```bash
DATABASE_URL="<direct-neon-url>" DIRECT_URL="<direct-neon-url>" npx prisma migrate deploy
DATABASE_URL="<direct-neon-url>" DIRECT_URL="<direct-neon-url>" npx prisma db seed
```

You should see: `Seeded 64 controls (54 legally mandatory, 10 important), 2 regulations.`

## 4. Deploy

Push to the connected branch — Vercel builds and deploys automatically. Add a
custom domain under **Settings → Domains** if you want one.

## Notes and limits

- **No authentication yet.** Anyone with the URL can view and edit every
  assessment. Share the link privately; do not put real client data on a
  public deployment until auth lands.
- Evidence uploads are capped at **4 MB** (Vercel request-body limit).
  Uploaded files live in Vercel Blob under unguessable public URLs.
- Local development is unchanged except the database: point `DATABASE_URL`
  and `DIRECT_URL` in `.env` at any Postgres (a free Neon dev branch works
  well), then `npx prisma migrate dev && npx prisma db seed`. Without a
  `BLOB_READ_WRITE_TOKEN`, uploads store on local disk under `./uploads`.
