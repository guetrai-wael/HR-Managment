# SIMPLE FIX: Close Expired Jobs in Cloud Database

## The Problem

Your dashboard shows incorrect job counts because some jobs are expired (past their deadline) but still marked as "Open" in the Supabase cloud database. The UI correctly shows them as "Closed" but the cloud database hasn't been updated.

## The Simple Solution

Run this SQL directly in your Supabase cloud dashboard to fix it immediately:

### Step 1: Check which jobs are expired but still open

```sql
SELECT
  id,
  title,
  deadline,
  status,
  (deadline < now()) as is_expired
FROM jobs
WHERE status = 'Open'
  AND deadline < now()
  AND deadline IS NOT NULL;
```

### Step 2: Close all expired jobs

```sql
UPDATE jobs
SET status = 'Closed',
    updated_at = now()
WHERE status = 'Open'
  AND deadline < now()
  AND deadline IS NOT NULL;
```

### Step 3: Verify it worked

```sql
SELECT
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN status = 'Open' THEN 1 END) as open_jobs,
  COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_jobs
FROM jobs;
```

## How to Apply the Fix (Supabase Cloud Dashboard)

1. **Open your Supabase project**: Go to https://app.supabase.com/projects
2. **Select your HR Management project** (the one with URL: https://dpdyslaainpozdlfjdbu.supabase.co)
3. **Open SQL Editor**: Click on "SQL Editor" in the left sidebar
4. **Run the queries**: Copy and paste each SQL query above, run them one by one
5. **Refresh your app**: Go back to your application and refresh the dashboard

## Result

- Your cloud database will have all expired jobs marked as "Closed"
- Dashboard will show correct job counts immediately
- No more console spam or complex job maintenance code
- Database and UI will be perfectly in sync

**Important**: This is a one-time fix. Once you run this SQL in your Supabase cloud dashboard, your dashboard should show the correct number of active jobs!
