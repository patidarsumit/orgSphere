# OrgSphere

OrgSphere is a local-only internal collaboration prototype with:

- Next.js frontend in `client`
- Express + TypeORM backend in `server`
- Shared Zod schemas in `packages/schemas`
- PostgreSQL database named `orgsphere_db`

**Start here for fresh checkout setup.** The `client/README.md` and `server/README.md` files are only scoped notes for those workspaces.

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL 16 recommended

## Fresh Checkout Setup

Run every command from the repository root unless noted.

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Update `server/.env` if your local PostgreSQL credentials are not `postgres/postgres`.

Expected client value:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Create the database

If your local `postgres` user uses password `postgres`:

```bash
psql postgresql://postgres:postgres@localhost:5432/postgres -c "CREATE DATABASE orgsphere_db;"
```

If your local PostgreSQL uses peer auth or no password:

```bash
createdb orgsphere_db
```

If the database already exists, skip this step.

### 4. Run migrations

```bash
npm run migration:run --workspace=server
```

### 5. Seed data

```bash
npm run seed --workspace=server
npm run seed:teams --workspace=server
```

Seed login:

```text
Email: sumit@orgsphere.io
Password: Password123!
```

### 6. Start the app

```bash
npm run dev
```

URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Backend health: http://localhost:4000/api/health

## Workspace Commands

Run both apps:

```bash
npm run dev
```

Run only backend:

```bash
npm run dev --workspace=server
```

Run only frontend:

```bash
npm run dev --workspace=client
```

Quality checks:

```bash
npm run typecheck
npm run lint --workspace=client
npm run build --workspace=server
npm run build --workspace=client
```

## Common Database Fixes

### `database "orgsphere_db" does not exist`

Create the database:

```bash
createdb orgsphere_db
```

or:

```bash
psql postgresql://postgres:postgres@localhost:5432/postgres -c "CREATE DATABASE orgsphere_db;"
```

### `password authentication failed for user "postgres"`

Update `server/.env` to match your local PostgreSQL credentials:

```env
DB_USER=postgres
DB_PASSWORD=postgres
```

If your local user has no password, use:

```env
DB_PASSWORD=
```

### `relation "users" does not exist` or `relation "teams" does not exist`

Run migrations:

```bash
npm run migration:run --workspace=server
```

### Login does not work after setup

Run both seed scripts:

```bash
npm run seed --workspace=server
npm run seed:teams --workspace=server
```

### `ECONNREFUSED 127.0.0.1:5432`

PostgreSQL is not running. Start it first.

Linux:

```bash
sudo service postgresql start
```

macOS Homebrew:

```bash
brew services start postgresql@16
```
