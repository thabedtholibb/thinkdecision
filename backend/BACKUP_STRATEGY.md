# Think Decision - Database Backup Strategy

## Overview
Comprehensive backup and disaster recovery strategy for Supabase PostgreSQL database.

---

## Backup Architecture

### 1. Automated Backups (Supabase)
**Status**: ✅ Enabled by default
**Frequency**: Daily at 2:00 AM UTC
**Retention**: 14 days (free tier)
**Location**: Supabase managed infrastructure

**Verification**:
```bash
# Access via Supabase Dashboard
https://app.supabase.com
Project: wxhcspcxdblvsfeyiczt
→ Settings → Backups
```

---

### 2. Manual Backups (pg_dump)
**Frequency**: Weekly (recommended)
**Storage**: Local + Cloud (S3 or Google Drive)
**Format**: SQL compressed (.sql.gz)

**Procedure**:
```bash
# Install PostgreSQL client tools
# Windows: https://www.postgresql.org/download/windows/
# Then run:

pg_dump \
  --host=wxhcspcxdblvsfeyiczt.supabase.co \
  --port=5432 \
  --username=postgres \
  --password \
  --database=postgres \
  --format=plain | gzip > backup_$(date +%Y%m%d).sql.gz

# Prompt will ask for password
# Get password from: Supabase Dashboard → Database → Connection String
```

---

### 3. Backup Storage Locations

| Location | Type | Frequency | Retention |
|----------|------|-----------|-----------|
| Supabase | Automated | Daily | 14 days |
| Local disk | Manual | Weekly | 4 weeks |
| Google Drive | Manual | Weekly | Indefinite |

---

## Restore Procedure

### Restore from Supabase Automated Backup
**Time to Restore**: 5-15 minutes

1. Access Supabase Dashboard
2. Go to Settings → Backups
3. Select backup date
4. Click "Restore"
5. Database will restore to point-in-time
6. Monitor: Settings → Logs (for restore status)

### Restore from Manual Backup
**Time to Restore**: 10-30 minutes

```bash
# 1. Create empty database (if needed)
# 2. Decompress backup
gunzip backup_20260523.sql.gz

# 3. Restore
psql \
  --host=wxhcspcxdblvsfeyiczt.supabase.co \
  --port=5432 \
  --username=postgres \
  --database=postgres \
  < backup_20260523.sql

# 4. Verify data
psql -h wxhcspcxdblvsfeyiczt.supabase.co -U postgres -d postgres -c "SELECT COUNT(*) FROM cases;"
```

---

## Recovery Time Objectives (RTO)

| Scenario | RTO | Recovery Point |
|----------|-----|-----------------|
| Single table corruption | 5 min | 1 day ago (Supabase) |
| Accidental data deletion | 15 min | Point-in-time restore |
| Complete DB failure | 30 min | Latest daily backup |
| Region outage | 2 hours | Failover to backup region |

---

## Testing Schedule

### Weekly Backup Verification
```bash
# Every Monday at 10:00 AM
# 1. Download latest backup
# 2. Restore to staging database
# 3. Run data integrity checks
# 4. Verify all tables present
# 5. Check record counts
# 6. Document results
```

### Monthly Restore Drill
```bash
# First Monday of month
# 1. Perform full restore to temporary DB
# 2. Run all critical queries
# 3. Verify API endpoints work with restored data
# 4. Clean up temporary DB
# 5. Update disaster recovery runbook
```

---

## Backup Checklist

- [ ] Automated Supabase backups enabled
- [ ] 14-day retention configured
- [ ] Manual backup script configured
- [ ] Weekly manual backups scheduled
- [ ] Backups stored in multiple locations
- [ ] Restore procedure documented
- [ ] Weekly verification schedule set
- [ ] Monthly restore drill scheduled
- [ ] Alert for backup failures configured
- [ ] RTO/RPO documented and communicated

---

## Failure Scenarios & Response

### Scenario 1: Accidental Data Deletion
**Response Time**: < 5 minutes
**Action**:
1. Identify deletion time
2. Restore from Supabase automated backup to point before deletion
3. Re-apply any changes made after restore point
4. Verify data integrity

### Scenario 2: Database Corruption
**Response Time**: 15 minutes
**Action**:
1. Stop application (prevent further writes)
2. Restore from latest clean backup
3. Apply transaction logs from after restore point (if available)
4. Verify integrity with VACUUM and REINDEX
5. Restart application

### Scenario 3: Complete Region Outage
**Response Time**: 2 hours
**Action**:
1. Activate disaster recovery plan
2. Provision new Supabase project in backup region
3. Restore from latest backup
4. Update DNS and application configuration
5. Test full application flow
6. Notify stakeholders

---

## Monitoring & Alerts

### Set up alerts for:
- ❌ Backup job failure
- ❌ Backup size anomaly (too small)
- ❌ No backups in 24 hours
- ❌ Database growth > 80% of plan limit
- ❌ Query performance degradation

### Monitoring Tool
Use Supabase Logs:
```
Settings → Logs → Database Logs
Filter: backup, restore, error
```

---

## Compliance & Retention

**GDPR Compliance**:
- Right to be forgotten: Must delete from all backups
- Backup retention: 14 days (automated) + 1 month (manual)
- Encrypted at rest: ✓ (Supabase)
- Encrypted in transit: ✓ (TLS)

**Data Retention Policy**:
- Active case data: Indefinite
- Soft-deleted cases: 90 days (then permanent delete)
- Audit logs: 1 year
- Backups: 14 days (automated) + 30 days (manual)

---

## Runbook

### Weekly Backup Verification
**Time**: Monday 10:00 AM
**Duration**: 15 minutes
**Checklist**:
- [ ] Check Supabase backup status
- [ ] Verify latest manual backup exists
- [ ] Download and verify backup file integrity
- [ ] Document file size and timestamp
- [ ] Alert if anything is missing

### Monthly Restore Test
**Time**: First Monday of month, 2:00 PM
**Duration**: 1 hour
**Steps**:
```
1. Create staging database
2. Restore backup to staging
3. Run: SELECT COUNT(*) FROM cases, judgments, users;
4. Test API endpoint: GET /api/v1/health
5. Verify response times
6. Drop staging database
7. Document results
```

### Disaster Recovery Activation
**Time**: As needed (< 2 hours target)
**Contact**: Tech Lead + DevOps
**Steps**:
```
1. Assess damage severity
2. Notify stakeholders (30 min delay ok)
3. Activate backup region
4. Restore database
5. Update DNS/config
6. Run full test suite
7. Notify of restoration
```

---

**Last Updated**: 2026-05-23
**Reviewed By**: Tech Lead
**Next Review**: 2026-06-23
