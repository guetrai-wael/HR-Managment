# Row Level Security (RLS) Policies

This document outlines all RLS policies implemented in the HR Management system.

## 🔍 How to Extract Current Policies

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    permissive,
    roles,
    qual as policy_definition,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public'
ORDER BY
    tablename, policyname;
```

## 🛡️ Security Overview

**Key Security Functions Used:**

- `is_admin_check()` - Checks if user is admin
- `is_admin_user()` - Alternative admin check function
- `auth.uid()` - Gets current authenticated user ID

**Security Principles Applied:**

- ✅ **Admin Full Access** - Admins can manage all data
- ✅ **User Ownership** - Users can only access their own data
- ✅ **Public Job Viewing** - Anyone can see job postings
- ✅ **Controlled Leave Management** - Sophisticated leave request rules

---

## 📋 Policies by Table

### applications

**Security Model**: User ownership + Admin override

| Policy                                  | Operation | Rule                   | Purpose                              |
| --------------------------------------- | --------- | ---------------------- | ------------------------------------ |
| Users can view their own applications   | SELECT    | `auth.uid() = user_id` | Users see only their applications    |
| Users can create their own applications | INSERT    | `auth.uid() = user_id` | Users can only apply as themselves   |
| Admins view all applications            | SELECT    | `is_admin_check()`     | Admins see all applications          |
| Admins update applications              | UPDATE    | `is_admin_check()`     | Admins can change application status |
| Admins delete applications              | DELETE    | `is_admin_check()`     | Admins can remove applications       |

### jobs

**Security Model**: Public read + Admin management

| Policy                      | Operation | Rule               | Purpose                 |
| --------------------------- | --------- | ------------------ | ----------------------- |
| Anyone can view jobs        | SELECT    | `true`             | Public job board        |
| Only admins can create jobs | INSERT    | `is_admin_check()` | Only admins post jobs   |
| Only admins can update jobs | UPDATE    | `is_admin_check()` | Only admins edit jobs   |
| Only admins can delete jobs | DELETE    | `is_admin_check()` | Only admins remove jobs |

### leave_requests

**Security Model**: User ownership + Admin oversight + Smart cancellation

| Policy                         | Operation | Rule                                          | Purpose                          |
| ------------------------------ | --------- | --------------------------------------------- | -------------------------------- |
| Employees can view their own   | SELECT    | `auth.uid() = user_id`                        | Users see their leave requests   |
| Employees can create their own | INSERT    | `auth.uid() = user_id`                        | Users submit leave requests      |
| Employees can cancel pending   | UPDATE    | `auth.uid() = user_id AND status = 'pending'` | Users can cancel before approval |
| Admins can view all            | SELECT    | `is_admin_check()`                            | Admins see all leave requests    |
| Admins can update any          | UPDATE    | `is_admin_check()`                            | Admins approve/reject requests   |
| Admins can delete any          | DELETE    | `is_admin_check()`                            | Admins can remove requests       |

**🎯 Smart Feature**: Users can only cancel their own pending requests!

### profiles

**Security Model**: User ownership + Admin full access

| Policy                     | Operation | Rule               | Purpose                    |
| -------------------------- | --------- | ------------------ | -------------------------- |
| Users can view their own   | SELECT    | `auth.uid() = id`  | Users see their profile    |
| Users can create their own | INSERT    | `auth.uid() = id`  | Users create their profile |
| Users can update their own | UPDATE    | `auth.uid() = id`  | Users edit their profile   |
| Admins view all profiles   | SELECT    | `is_admin_check()` | Admins see all employees   |
| Admins update any profile  | UPDATE    | `is_admin_check()` | Admins edit employee data  |
| Admins delete profiles     | DELETE    | `is_admin_check()` | Admins can remove profiles |

**Note**: Duplicate INSERT policies (cleanup needed)

### departments

**Security Model**: Public read + Admin management

| Policy                   | Operation | Rule                                                            | Purpose                      |
| ------------------------ | --------- | --------------------------------------------------------------- | ---------------------------- |
| Allow public read access | SELECT    | `true`                                                          | Everyone can see departments |
| Allow admin write access | ALL       | `user_id IN (SELECT user_id FROM user_roles WHERE role_id = 1)` | Admins manage departments    |

**🔍 Note**: Uses direct role_id=1 check instead of function

### leave_types

**Security Model**: Authenticated read + Admin management

| Policy                       | Operation | Rule                        | Purpose                         |
| ---------------------------- | --------- | --------------------------- | ------------------------------- |
| Authenticated users can read | SELECT    | `true` (authenticated role) | Logged-in users see leave types |
| Admins can manage            | ALL       | `is_admin_user()`           | Admins manage leave types       |

### roles & user_roles

**Security Model**: Admin management + Self-view

| Policy                     | Operation            | Rule                   | Purpose                              |
| -------------------------- | -------------------- | ---------------------- | ------------------------------------ |
| Anyone can view roles      | SELECT               | `true`                 | Public role information              |
| Admins manage roles        | INSERT/UPDATE/DELETE | `is_admin_check()`     | Admin role management                |
| Users view own roles       | SELECT               | `auth.uid() = user_id` | Users see their roles                |
| Users can insert own roles | INSERT               | `auth.uid() = user_id` | Self-assignment (⚠️ potential issue) |
| Admins manage user_roles   | INSERT/UPDATE/DELETE | `is_admin_check()`     | Admin role assignment                |

**⚠️ Security Note**: Users can insert their own roles - this might be a security risk!

---

## 🎯 Security Assessment

### ✅ **Strengths**

1. **Comprehensive Coverage** - All tables have proper RLS
2. **User Isolation** - Users can only see their own data
3. **Admin Override** - Admins have full system access
4. **Smart Leave Logic** - Users can only cancel pending requests
5. **Public Job Board** - Good for recruitment
6. **Helper Functions** - Consistent admin checking

### ⚠️ **Potential Issues**

1. **Duplicate Profile Policies** - Two INSERT policies for profiles
2. **User Self-Role Assignment** - Users can assign roles to themselves
3. **Mixed Admin Functions** - `is_admin_check()` vs `is_admin_user()` vs direct role checks
4. **Inconsistent Role Patterns** - Different role check methods

### 🔧 **Recommendations**

1. Remove duplicate profile INSERT policy
2. Remove user self-role assignment capability
3. Standardize admin check functions
4. Consider department-level access controls for managers

---

_📝 Next: Let's check what database functions support these policies_
