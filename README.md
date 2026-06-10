# BookKit

A social reading platform — personal bookshelves, in-browser reading, recommendations, and a community feed for book lovers.

See [PROJECT.md](./PROJECT.md) for the full product spec and roadmap.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + shadcn-style UI components
- **PostgreSQL** + Prisma
- **Auth.js** (email/password)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

While you're building the UI, keep `DISABLE_AUTH=true` in `.env.local` — you'll browse as a mock admin user with no login required. Set it to `false` when you want to test real auth.

Generate an `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Set up the database

Point `DATABASE_URL` at a PostgreSQL instance, then run migrations:

```bash
npm run db:migrate
```

For quick local schema sync without migration files:

```bash
npm run db:push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create/apply Prisma migrations |
| `npm run db:push` | Push schema to DB (dev) |
| `npm run db:studio` | Open Prisma Studio |

## Test book (The Poppy War)

A seed script moves `The Poppy War.pdf` into local storage and creates a catalog entry.

```bash
npm run db:seed
```

The PDF lives at `storage/books/the-poppy-war/original.pdf` (gitignored).

**Without a database:** in development, the catalog still shows this book from the local file. Once Postgres is running, run `npm run db:migrate` then `npm run db:seed` to persist it properly.

- Catalog: http://localhost:3000/catalog
- Detail: http://localhost:3000/catalog/the-poppy-war

## Phase 1 — Catalog & admin upload

After migrating the database, admins can upload books and everyone can browse the catalog.

1. Run migrations: `npm run db:migrate`
2. With `DISABLE_AUTH=true`, you're a mock admin — open **Admin → Upload book**
3. Upload a PDF (+ optional cover), fill metadata, set status to **Published**
4. Browse **Catalog** and open the book detail page

**Local storage (default):** PDFs and covers save to `./storage` (gitignored). No cloud setup required for dev.

**Production storage:** Set `STORAGE_DRIVER=s3` and configure the S3/R2 variables in `.env.example`.

**Promote a real user to admin** (when auth is enabled):

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

## Password reset (development)

Without email configured, reset links are logged to the server console when you use **Forgot password**.
