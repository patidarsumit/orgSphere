# OrgSphere

OrgSphere is a full-stack internal collaboration and org-visibility platform built as a monorepo.

It includes:
- `client`: Next.js 16 App Router frontend
- `server`: Express + TypeORM backend
- `packages/schemas`: shared Zod validation package
- `stitch-exports`: design/prototype exports pulled from Stitch

The application currently includes:
- public landing page
- public blog
- authenticated org dashboard
- employees, teams, and projects
- personal workspace for tasks and notes
- settings and role management
- internal content workspace for blog management

## Tech Stack

Frontend:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Redux Toolkit
- TanStack Query
- React Hook Form + Zod
- Tiptap

Backend:
- Node.js
- Express
- TypeORM
- PostgreSQL
- JWT auth with refresh cookies
- Multer uploads

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL 16 recommended

## Fresh Setup

Run these commands from the repository root unless noted otherwise.

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Update `server/.env` if your PostgreSQL username or password is different from the local default.

Expected client value:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Create the database

If your local `postgres` user uses password `postgres`:

```bash
psql postgresql://postgres:postgres@localhost:5432/postgres -c "CREATE DATABASE orgsphere_db;"
```

If your PostgreSQL uses peer auth or your current shell user:

```bash
createdb orgsphere_db
```

If the database already exists, skip this step.

### 4. Run migrations

```bash
npm run migration:run --workspace=server
```

### 5. Seed all baseline data

```bash
npm run seed
```

This now runs the full seed pipeline in order:
- employees
- teams
- projects
- personal workspace tasks and notes
- blog posts
- activity feed

### 6. Start the application

```bash
npm run dev
```

URLs:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api

## Default Login

```text
Email: sumit@orgsphere.io
Password: Password123!
```

## Seed Data Overview

Running `npm run seed` gives a fresh local environment with meaningful baseline data:

- core employee directory across admin, manager, tech lead, HR, employee, and viewer roles
- teams and memberships
- projects with managers, tech leads, and members
- personal tasks and notes for the seeded admin account
- 10 published blog posts across leadership, product, engineering, design, HR, analytics, operations, and editorial workflow topics
- activity feed entries for dashboard and notification experiences

Important blog seed behavior:
- existing blog posts are cleared before new seed posts are created
- the blog seed is deterministic for fresh setups

## Useful Commands

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

Run all seeds:

```bash
npm run seed
```

Run individual seed scripts:

```bash
npm run seed:employees --workspace=server
npm run seed:teams --workspace=server
npm run seed:projects --workspace=server
npm run seed:workspace --workspace=server
npm run seed:blog --workspace=server
npm run seed:activity --workspace=server
```

Quality checks:

```bash
npm run typecheck
npm run lint --workspace=client
npm run build --workspace=server
npm run build --workspace=client
```

## Common Setup Fixes

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

If your local user has no password:

```env
DB_PASSWORD=
```

### `relation does not exist`

Run migrations first:

```bash
npm run migration:run --workspace=server
```

Then run:

```bash
npm run seed
```

### Seed command fails partway through

The aggregate seed command runs each seed in sequence and stops on the first failure.

To debug, run the individual server seed scripts one by one:

```bash
npm run seed:employees --workspace=server
npm run seed:teams --workspace=server
npm run seed:projects --workspace=server
npm run seed:workspace --workspace=server
npm run seed:blog --workspace=server
npm run seed:activity --workspace=server
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

## Project Docs

- [ARCHITECTURE.md](/home/shrini/sumit/orgSphere/ARCHITECTURE.md)
- [PERMISSIONS.md](/home/shrini/sumit/orgSphere/PERMISSIONS.md)

These two files should be treated as the current project reference when making architectural or authorization changes.
