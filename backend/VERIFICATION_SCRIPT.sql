-- Verification script: run this after migrations to confirm all tables created

-- Count tables
SELECT COUNT(*) as table_count FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check enum types
SELECT typname FROM pg_type
WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY typname;

-- Confirm indexes created
SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;
