# Database Migration Guide

## Status
Database schema migration files ready. Supabase credentials configured in `.env`.

## Prerequisites
- Supabase project created
- `.env` file updated with valid credentials
- Network connectivity to Supabase (if using alembic)

## Migration Methods

### Method 1: Supabase Web Console (Recommended)
**Use this if network connectivity to DB is having issues**

Steps:
1. Open https://app.supabase.com and login
2. Navigate to your Think Decision project
3. Click **SQL Editor** in the left sidebar
4. Click **"New Query"** button
5. Copy content from `MIGRATION_SQL.sql` file
6. Paste into the SQL editor
7. Click **"Run"** button
8. Confirm all tables created (see verification below)

### Method 2: Alembic CLI
**Use this if network connectivity is working**

```bash
cd backend
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001, initial_schema
```

## Verification

After running migration (either method), verify in Supabase SQL Editor:

```bash
-- Run content from VERIFICATION_SCRIPT.sql
```

Expected results:
- 8 tables created: users, cases, criteria, alternatives, expert_invites, comparisons, aggregated_results, (plus 1 alembic version table)
- 5 enum types: userrole, decisionmethod, aggregationmethod, casestatus, invitestatus  
- 9 indexes created for performance

## Troubleshooting

### Network Error (getaddrinfo failed)
- Check internet connection
- Check if VPN is blocking database access
- Try Method 1 (Web Console) as alternative

### Password Auth Failed
- Verify credentials in `.env` are correct
- Check `.env` DATABASE_URL format: `postgresql+asyncpg://user:pass@host:5432/db`

### Unique Constraint Error
- Tables already exist - verify with Method 1 first, or drop schema and retry

## Next Steps

1. **Verify** migrations completed successfully
2. **Start the server**: `uvicorn app.main:app --reload --port 8000`
3. **Access Swagger docs**: http://localhost:8000/docs
4. **Test API endpoints** with Swagger interface

## Files

- `MIGRATION_SQL.sql` - Raw SQL for web console or direct execution
- `migrations/versions/001_initial_schema.py` - Alembic migration script
- `VERIFICATION_SCRIPT.sql` - Confirm migration success

---

**Version**: 0.1.0  
**Created**: 2026-04-27
