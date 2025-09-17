# Dashboard Statistics Data Flow Documentation

## 📊 **Complete Data Flow Explanation**

### **Frontend → Backend → Database Chain:**

```
Dashboard.tsx
    ↓ (calls useDashboardStats hook)
useDashboardData.ts
    ↓ (React Query with 5min refresh)
statisticsService.getStats()
    ↓ (determines user role)
statisticsService.getAdminStats() OR getEmployeeStats()
    ↓ (parallel Supabase queries)
Supabase Database Tables
```

---

## 🔍 **Statistics Breakdown:**

### **Admin Dashboard Statistics:**

#### **1. 📋 Registration Requests**

- **Source**: `profiles` table
- **Query**: `profiles.created_at >= first_day_of_current_month`
- **Purpose**: New user registrations this month
- **Refresh**: Every 5 minutes

#### **2. 🏖️ Leave Requests**

- **Source**: `leave_requests` table
- **Query**: `leave_requests.status = 'pending'`
- **Purpose**: Pending leave requests awaiting approval
- **Refresh**: Every 5 minutes

#### **3. 📄 Job Applications**

- **Source**: `applications` table
- **Query**: `applications.status = 'pending'`
- **Purpose**: Job applications awaiting review
- **Refresh**: Every 5 minutes

#### **4. 💼 Active Jobs** ⭐ **MODIFIED**

- **Source**: `jobs` table
- **OLD Query**: `jobs.status = 'Open'` ❌
- **NEW Query**: `jobs.deadline >= today AND jobs.deadline IS NOT NULL` ✅
- **Purpose**: Jobs still accepting applications
- **Logic**: Deadline-based instead of manual status
- **Refresh**: Every 5 minutes

---

## 🔧 **Our Key Modification - Active Jobs Logic:**

### **Before (Problematic):**

```sql
-- Old logic caused inconsistencies
SELECT COUNT(*) FROM jobs WHERE status = 'Open'
```

**Issues:**

- Manual status could be outdated
- UI showed different status than database
- Dashboard counts were incorrect

### **After (Clean):**

```sql
-- New deadline-only logic
SELECT COUNT(*) FROM jobs
WHERE deadline >= CURRENT_DATE
AND deadline IS NOT NULL
```

**Benefits:**

- ✅ Automatic status management
- ✅ UI and database always match
- ✅ Accurate dashboard statistics
- ✅ No manual intervention needed

---

## ⚡ **Performance & Caching:**

### **React Query Configuration:**

- **Refresh Interval**: 5 minutes (300,000ms)
- **Stale Time**: 2 minutes (data considered fresh)
- **Cache Time**: 10 minutes (kept in memory)
- **Enabled**: Only when user has admin/employee role

### **Database Optimization:**

- Uses `count: "exact", head: true` for efficient counting
- Parallel queries with `Promise.all()` for speed
- Indexed columns: `created_at`, `status`, `deadline`

---

## 📋 **Migration Impact:**

### **Database Changes Applied:**

1. All jobs with `deadline >= today` → `status = 'Open'`
2. All jobs with `deadline < today` → `status = 'Closed'`
3. All jobs with `deadline IS NULL` → `status = 'Open'`

### **Frontend Changes Applied:**

1. Removed status dropdown from job creation/edit forms
2. JobCard component uses deadline-only logic
3. Statistics service queries by deadline instead of status
4. Job form automatically sets status based on deadline

### **Result:**

Your job with deadline "Sep 17, 2025" now correctly shows as:

- **UI**: "Open" status with "1 day left"
- **Database**: `status = 'Open'`
- **Dashboard**: Counts as 1 active job
- **Automatic**: Will become "Closed" on Sep 18, 2025

---

## 🎯 **Testing Your Changes:**

1. **Dashboard should show 1 active job** (previously showed 0)
2. **Job card should display "Open" status** with time remaining
3. **Tomorrow (Sep 17) the job should still be "Open"**
4. **Day after tomorrow (Sep 18) it should automatically become "Closed"**

The system is now fully consistent and automatic! 🚀
