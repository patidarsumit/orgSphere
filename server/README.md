# OrgSphere Server

This is the Express + TypeORM backend workspace.

For a fresh checkout, follow the root setup guide first:

```text
../README.md
```

## Server Only

Create the backend env file:

```bash
cp server/.env.example server/.env
```

Create the database if it does not exist:

```bash
psql postgresql://postgres:postgres@localhost:5432/postgres -c "CREATE DATABASE orgsphere_db;"
```

Run migrations:

```bash
npm run migration:run --workspace=server
```

Seed development data:

```bash
npm run seed --workspace=server
npm run seed:teams --workspace=server
```

Run only the backend:

```bash
npm run dev --workspace=server
```

Useful checks:

```bash
npm run typecheck --workspace=server
npm run build --workspace=server
```

Health check:

```text
http://localhost:4000/api/health
```
