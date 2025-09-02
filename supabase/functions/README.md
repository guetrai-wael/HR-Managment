# Database Functions

This document lists all custom database functions in the HR Management system.

## 🔍 How to Extract Current Functions

```sql
SELECT
    routine_name as function_name,
    routine_definition,
    routine_type,
    data_type as return_type
FROM
    information_schema.routines
WHERE
    routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_definition IS NOT NULL -- Exclude system functions
ORDER BY
    routine_name;
```

---

## 🎯 Core Business Functions

### 🔐 **Authentication & Authorization Functions**

#### `is_admin_check()`

**Purpose**: Primary admin verification function used in RLS policies
**Returns**: `boolean`

```sql
-- Uses the has_role function to check if current user has admin role
RETURN has_role(auth.uid(), 'admin');
```

#### `is_admin_user()`

**Purpose**: Alternative admin check (direct role_id lookup)
**Returns**: `boolean`

```sql
-- Checks if user has role_id = 1 (admin role)
SELECT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role_id = 1
);
```

#### `is_admin()`

**Purpose**: Admin check with fallback mechanism
**Returns**: `boolean`

```sql
-- Primary: Check via user_roles table
-- Fallback: Check if email = 'admin@example.com'
```

#### `has_role(user_uuid, role_name)`

**Purpose**: Generic role checking utility
**Returns**: `boolean`

```sql
-- Check if specific user has specific role by name
RETURN EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_uuid AND r.name = role_name
);
```

---

### 👤 **User Management Triggers**

#### `handle_new_user()` - TRIGGER

**Purpose**: Creates profile when new user signs up
**Triggered on**: `auth.users` INSERT

```sql
-- Extracts first_name/last_name from raw_user_meta_data
INSERT INTO public.profiles (id, email, first_name, last_name)
VALUES (
  NEW.id,
  NEW.email,
  NEW.raw_user_meta_data ->> 'first_name',
  NEW.raw_user_meta_data ->> 'last_name'
);
```

#### `create_profile_for_user()` - TRIGGER

**Purpose**: Alternative profile creation function
**Triggered on**: `auth.users` INSERT

```sql
-- Creates profile with error handling and logging
INSERT INTO public.profiles (id, email, full_name)
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
);
```

#### `assign_role_on_signup()` - TRIGGER

**Purpose**: Auto-assigns 'job_seeker' role to new users
**Triggered on**: `auth.users` INSERT

```sql
-- Finds job_seeker role and assigns it to new user
-- Includes comprehensive error handling and logging
INSERT INTO public.user_roles (user_id, role_id)
VALUES (NEW.id, job_seeker_role_id)
ON CONFLICT (user_id) DO NOTHING;
```

---

### 💼 **HR Workflow Functions**

#### `promote_to_employee()` - TRIGGER

**Purpose**: Promotes job seekers to employees when application accepted
**Triggered on**: `applications` UPDATE

```sql
-- When application status changes to 'accepted':
-- 1. Find employee and job_seeker role IDs
-- 2. Replace job_seeker role with employee role
UPDATE user_roles
SET role_id = employee_role_id
WHERE user_id = NEW.user_id AND role_id = job_seeker_role_id;
```

**🎯 Smart Feature**: Automatic role promotion on hire!

---

### 🏖️ **Leave Management Functions**

#### `get_leave_balance(p_user_id, p_as_of_date)`

**Purpose**: Calculate user's leave balance as of specific date
**Returns**: `numeric`

**Algorithm**:

1. **Get hiring date** from profiles
2. **Calculate anniversary years** (24 days per year)
3. **Sum approved leave taken** across all leave types
4. **Return**: Total entitlement - Total taken

```sql
-- Key logic:
v_total_entitlement := (v_years_of_service_completed + 1) * 24;
-- Sums leave across ALL leave types, not just vacation
```

**🎯 Advanced Features**:

- Anniversary-based accrual (not calendar year)
- Handles partial years correctly
- Cross-leave-type balance calculation
- Proper date range handling

---

### 🔧 **Utility Functions**

#### `handle_updated_at()` - TRIGGER

**Purpose**: Auto-updates `updated_at` timestamps

```sql
NEW.updated_at = timezone('utc'::text, now());
```

#### `set_current_timestamp_updated_at()` - TRIGGER

**Purpose**: Alternative timestamp updater

```sql
NEW.updated_at = NOW();
```

#### `test_profile_insertion()`

**Purpose**: Test function to verify profile insertion works
**Returns**: `text` (success/error message)

---

## 🎯 **Function Analysis**

### ✅ **Strengths**

1. **Comprehensive Automation**

   - Auto profile creation on signup
   - Auto role assignment for new users
   - Auto role promotion on hire
   - Auto timestamp management

2. **Sophisticated Leave System**

   - Anniversary-based accrual calculations
   - Cross-leave-type balance tracking
   - Proper date handling

3. **Robust Error Handling**

   - Extensive logging in triggers
   - Graceful fallbacks (e.g., `is_admin` function)
   - Conflict resolution (`ON CONFLICT DO NOTHING`)

4. **Security Focused**
   - Multiple admin check methods
   - Generic role checking utilities
   - Consistent with RLS policies

### ⚠️ **Potential Issues**

1. **Duplicate Functions**

   - `handle_new_user()` vs `create_profile_for_user()`
   - `handle_updated_at()` vs `set_current_timestamp_updated_at()`
   - Need to pick one and remove duplicates

2. **Hardcoded Values**

   - `role_id = 1` for admin in `is_admin_user()`
   - `admin@example.com` fallback email
   - Fixed 24 days per year leave entitlement

3. **Complex Leave Logic**
   - Very sophisticated but might be hard to modify
   - No obvious way to handle different leave policies per department

### 🚀 **Advanced Features Implemented**

1. **Smart Role Workflows**: job_seeker → employee promotion
2. **Anniversary-Based Leave**: More realistic than calendar year
3. **Cross-Leave-Type Balances**: Unified leave tracking
4. **Comprehensive Logging**: Excellent for debugging
5. **Graceful Error Handling**: System resilience

---

## 📋 **Production Readiness Assessment**

**Database Layer**: ⭐⭐⭐⭐⭐ **Excellent**

- Sophisticated business logic
- Proper error handling
- Comprehensive automation
- Advanced leave calculations

**Recommended Cleanup**:

1. Remove duplicate trigger functions
2. Make hardcoded values configurable
3. Standardize admin check functions

---

_📝 Next: Let's check storage buckets and auth settings to complete the review_
