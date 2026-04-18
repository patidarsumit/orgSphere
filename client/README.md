# OrgSphere Client

This is the Next.js frontend workspace.

For a fresh checkout, follow the root setup guide first:

```text
../README.md
```

## Client Only

Create the frontend env file:

```bash
cp client/.env.example client/.env.local
```

Expected value:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Run only the frontend:

```bash
npm run dev --workspace=client
```

Useful checks:

```bash
npm run lint --workspace=client
npm run typecheck --workspace=client
npm run build --workspace=client
```
