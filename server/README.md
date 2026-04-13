## Database Setup

1. Install PostgreSQL 16 locally.
2. Create database:
   ```bash
   psql -U postgres -c "CREATE DATABASE orgsphere_db;"
   ```
3. Copy `.env.example` to `.env` and fill in your Postgres password.
4. Run migrations:
   ```bash
   npm run migration:run
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```

