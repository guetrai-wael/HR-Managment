# Database Tables

This document lists all tables in our HR Management Supabase database.

## 🔍 How to Extract Current Table Information

**Copy and paste this query into your Supabase SQL Editor:**

```sql
-- Get all tables in your database
SELECT
    table_name,
    obj_description((quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass, 'pg_class') as description
FROM
    information_schema.tables
WHERE
    table_schema = 'public'
ORDER BY
    table_name;
```

**For detailed column information of a specific table:**

```sql
-- Replace 'your_table_name' with actual table name
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    is_generated
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'your_table_name'
ORDER BY
    ordinal_position;
```

## 📋 Tables Documentation

### Overview

Your HR Management system has **8 tables**:

1. **applications** - Job applications submitted by users
2. **departments** - Company departments/divisions
3. **jobs** - Job postings and opportunities
4. **leave_requests** - Leave requests submitted by users ✅ _Has description_
5. **leave_types** - Types of leave (vacation, sick, etc.)
6. **profiles** - User profile information
7. **roles** - System roles (admin, employee, etc.)
8. **user_roles** - Junction table linking users to roles

### Detailed Table Structures

_📝 Please run the column queries above for each table and paste the results. I'll help format them properly._

#### applications ✅

**Purpose**: Job applications submitted by users

| Column       | Type        | Nullable | Default                        | Description                                      |
| ------------ | ----------- | -------- | ------------------------------ | ------------------------------------------------ |
| id           | integer     | NO       | nextval('applications_id_seq') | Primary key (auto-increment)                     |
| job_id       | integer     | NO       | -                              | Foreign key to jobs table                        |
| user_id      | uuid        | NO       | -                              | Foreign key to auth.users                        |
| cover_letter | text        | YES      | -                              | Optional cover letter                            |
| resume_url   | text        | YES      | -                              | URL to uploaded resume file                      |
| status       | text        | YES      | 'pending'                      | Application status (pending, approved, rejected) |
| applied_at   | timestamptz | YES      | now()                          | When application was submitted                   |

**Relationships:**

- `job_id` → `jobs(id)`
- `user_id` → `auth.users(id)` and `profiles(id)`

#### profiles ✅

**Purpose**: Extended user profile information (links to Supabase auth.users)

| Column               | Type        | Nullable | Default  | Description                                    |
| -------------------- | ----------- | -------- | -------- | ---------------------------------------------- |
| id                   | uuid        | NO       | -        | Primary key (matches auth.users.id)            |
| email                | text        | NO       | -        | User email address                             |
| phone                | text        | YES      | -        | Phone number                                   |
| position             | text        | YES      | -        | Current job position                           |
| created_at           | timestamptz | YES      | now()    | Profile creation timestamp                     |
| updated_at           | timestamptz | YES      | -        | Last update timestamp                          |
| department_id        | integer     | YES      | -        | Foreign key to departments                     |
| hiring_date          | date        | YES      | -        | Employee hiring date                           |
| physical_address     | text        | YES      | -        | Home address                                   |
| bio                  | text        | YES      | -        | Biography/description                          |
| employment_status    | text        | YES      | 'Active' | Active, Inactive, Terminated                   |
| avatar_url           | text        | YES      | -        | Profile picture URL                            |
| first_name           | text        | YES      | -        | First name                                     |
| last_name            | text        | YES      | -        | Last name                                      |
| carried_forward_days | integer     | NO       | 0        | Leave days carried from previous year (max 48) |

**Relationships:**

- `id` → `auth.users(id)` (one-to-one)
- `department_id` → `departments(id)`

**Leave System Notes:**

- `hiring_date` determines anniversary-based leave years (e.g., hired Jan 15 = leave years run Jan 15 - Jan 14)
- `carried_forward_days` stores unused leave days from previous anniversary year
- Maximum total annual entitlement: 72 days (24 base + 48 max carryover)

#### jobs ✅

**Purpose**: Job postings and opportunities

| Column           | Type        | Nullable | Default                | Description                      |
| ---------------- | ----------- | -------- | ---------------------- | -------------------------------- |
| id               | integer     | NO       | nextval('jobs_id_seq') | Primary key (auto-increment)     |
| title            | text        | NO       | -                      | Job title                        |
| description      | text        | NO       | -                      | Job description                  |
| requirements     | text        | NO       | -                      | Required qualifications          |
| responsibilities | text        | NO       | -                      | Job responsibilities             |
| status           | text        | NO       | 'Open'                 | Job status (Open, Closed, Draft) |
| deadline         | date        | YES      | -                      | Application deadline             |
| location         | text        | NO       | -                      | Job location                     |
| salary           | text        | YES      | -                      | Salary information               |
| posted_at        | timestamptz | YES      | now()                  | When job was posted              |
| posted_by        | uuid        | NO       | -                      | Who posted the job (user ID)     |
| department_id    | integer     | YES      | -                      | Foreign key to departments       |

**Relationships:**

- `posted_by` → `auth.users(id)` / `profiles(id)`
- `department_id` → `departments(id)`
- Referenced by: `applications(job_id)`

#### leave_requests ✅

**Purpose**: Stores leave requests submitted by users.

| Column        | Type              | Nullable | Default                | Description                     |
| ------------- | ----------------- | -------- | ---------------------- | ------------------------------- |
| id            | uuid              | NO       | gen_random_uuid()      | Primary key                     |
| user_id       | uuid              | NO       | -                      | Foreign key to auth.users       |
| leave_type_id | uuid              | NO       | -                      | Foreign key to leave_types      |
| start_date    | date              | NO       | -                      | Leave start date                |
| end_date      | date              | NO       | -                      | Leave end date                  |
| reason        | text              | YES      | -                      | Reason for leave                |
| status        | leave_status_enum | NO       | 'pending'              | pending/approved/rejected       |
| created_at    | timestamptz       | NO       | timezone('utc', now()) | Request creation time           |
| updated_at    | timestamptz       | NO       | timezone('utc', now()) | Last update time                |
| approved_by   | uuid              | YES      | -                      | Who approved/rejected (user ID) |
| approved_at   | timestamptz       | YES      | -                      | When decision was made          |
| comments      | text              | YES      | -                      | Admin comments on decision      |

**Relationships:**

- `user_id` → `auth.users(id)` / `profiles(id)`
- `leave_type_id` → `leave_types(id)`
- `approved_by` → `auth.users(id)` / `profiles(id)`

**Note**: Uses custom enum `leave_status_enum`

#### departments ✅

**Purpose**: Company departments/divisions

| Column      | Type        | Nullable | Default                       | Description                  |
| ----------- | ----------- | -------- | ----------------------------- | ---------------------------- |
| id          | integer     | NO       | nextval('departments_id_seq') | Primary key (auto-increment) |
| name        | text        | NO       | -                             | Department name              |
| description | text        | YES      | -                             | Department description       |
| created_at  | timestamptz | YES      | now()                         | Creation timestamp           |

**Relationships:**

- Referenced by: `profiles(department_id)`
- Referenced by: `jobs(department_id)`

#### leave_types ✅

**Purpose**: Types of leave (vacation, sick, etc.)

| Column            | Type        | Nullable | Default           | Description                            |
| ----------------- | ----------- | -------- | ----------------- | -------------------------------------- |
| id                | uuid        | NO       | gen_random_uuid() | Primary key                            |
| name              | text        | NO       | -                 | Leave type name (Vacation, Sick, etc.) |
| description       | text        | YES      | -                 | Description of leave type              |
| color_scheme      | text        | YES      | -                 | UI color for this leave type           |
| requires_approval | boolean     | NO       | true              | Whether this type needs approval       |
| created_at        | timestamptz | NO       | now()             | Creation timestamp                     |
| updated_at        | timestamptz | NO       | now()             | Last update timestamp                  |

**Relationships:**

- Referenced by: `leave_requests(leave_type_id)`

**Features:**

- UI customization with color schemes
- Configurable approval requirements

#### roles ✅

**Purpose**: System roles (admin, employee, etc.)

| Column      | Type    | Nullable | Default                 | Description                           |
| ----------- | ------- | -------- | ----------------------- | ------------------------------------- |
| id          | integer | NO       | nextval('roles_id_seq') | Primary key (auto-increment)          |
| name        | text    | NO       | -                       | Role name (admin, employee, hr, etc.) |
| description | text    | YES      | -                       | Role description                      |

**Relationships:**

- Referenced by: `user_roles(role_id)`

#### user_roles ✅

**Purpose**: Junction table linking users to roles (many-to-many)

| Column      | Type        | Nullable | Default                      | Description                  |
| ----------- | ----------- | -------- | ---------------------------- | ---------------------------- |
| id          | integer     | NO       | nextval('user_roles_id_seq') | Primary key (auto-increment) |
| user_id     | uuid        | NO       | -                            | Foreign key to auth.users    |
| role_id     | integer     | NO       | -                            | Foreign key to roles         |
| assigned_at | timestamptz | YES      | now()                        | When role was assigned       |

**Relationships:**

- `user_id` → `auth.users(id)` / `profiles(id)`
- `role_id` → `roles(id)`

---

## 🏖️ **Leave Balance System (Updated 2025)**

### **Anniversary-Based Leave Years**

The system uses **hiring anniversary** instead of calendar years:

- **Hired January 15, 2023** → Leave years run **January 15 - January 14** each year
- **Each anniversary**: Employee gets 24 new days + carried forward unused days
- **Maximum annual entitlement**: 72 days (24 base + up to 48 carryover)

### **Balance Calculation Logic**

```javascript
// Current leave year boundaries
const getCurrentLeaveYear = (hiringDate) => {
  const today = new Date();
  const currentYearStart = new Date(
    today.getFullYear(),
    hiringDate.getMonth(),
    hiringDate.getDate()
  );

  if (today < currentYearStart) {
    // Before anniversary this year, so still in previous leave year
    return {
      start: new Date(
        today.getFullYear() - 1,
        hiringDate.getMonth(),
        hiringDate.getDate()
      ),
      end: new Date(currentYearStart.getTime() - 86400000), // Day before anniversary
    };
  } else {
    // After anniversary, in current leave year
    return {
      start: currentYearStart,
      end: new Date(
        today.getFullYear() + 1,
        hiringDate.getMonth(),
        hiringDate.getDate() - 1
      ),
    };
  }
};

// Annual entitlement calculation
const annualEntitlement = 24 + Math.min(carried_forward_days, 48); // Max 72 days total
const remainingBalance = annualEntitlement - usedDaysThisLeaveYear;
```

### **Dashboard Statistics**

- **Balance**: Current remaining days for this leave year
- **Statistics**: Lifetime totals by leave type since hiring
  - Total vacation days taken (all time)
  - Total sick days taken (all time)
  - Total personal days taken (all time)
  - Total casual days taken (all time)

### **Carryover Management**

- **End of leave year**: Unused days automatically carry forward to next year
- **Maximum carryover**: 48 days (prevents excessive accumulation)
- **Formula**: `Next Year Entitlement = 24 + MIN(unused_days, 48)`

---

_📝 Next Step: Run the column detail queries above and share the results_
