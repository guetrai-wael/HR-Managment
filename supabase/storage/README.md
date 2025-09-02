# Storage Configuration

This document outlines the Supabase Storage setup for file handling.

## 🔍 How to Extract Storage Information

```sql
SELECT
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM
    storage.buckets;
```

---

## 📁 Storage Buckets

### `resumes` Bucket ✅

**Purpose**: Store user resume files for job applications

| Setting             | Value         | Description                           |
| ------------------- | ------------- | ------------------------------------- |
| **Public Access**   | `true`        | Files can be accessed via public URLs |
| **File Size Limit** | `unlimited`   | No size restrictions                  |
| **Allowed Types**   | PDF, DOCX     | Professional document formats         |
| **Created**         | April 5, 2025 |                                       |

**Allowed MIME Types**:

- `application/pdf` - PDF documents
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - Word documents (.docx)

**Usage**: Referenced by `applications.resume_url`

---

### `avatars` Bucket ✅

**Purpose**: Store user profile pictures

| Setting             | Value        | Description                             |
| ------------------- | ------------ | --------------------------------------- |
| **Public Access**   | `true`       | Profile pictures can be viewed publicly |
| **File Size Limit** | `2MB`        | Reasonable limit for profile images     |
| **Allowed Types**   | JPEG, PNG    | Standard image formats                  |
| **Created**         | May 21, 2025 |                                         |

**Allowed MIME Types**:

- `image/jpeg` - JPEG images
- `image/png` - PNG images

**Usage**: Referenced by `profiles.avatar_url`

---

## 🔐 Storage Security

### RLS Policies Needed

**⚠️ Note**: Storage buckets need RLS policies for secure access:

```sql
-- Example policies that should be implemented:

-- Resumes: Users can upload their own, admins can view all
CREATE POLICY "Users can upload own resumes" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = owner);

CREATE POLICY "Users can view own resumes" ON storage.objects
FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = owner);

CREATE POLICY "Admins can view all resumes" ON storage.objects
FOR SELECT USING (bucket_id = 'resumes' AND is_admin_check());

-- Avatars: Users manage their own, public viewing
CREATE POLICY "Users can manage own avatars" ON storage.objects
FOR ALL USING (bucket_id = 'avatars' AND auth.uid()::text = owner);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

---

## 💾 Storage Best Practices

### ✅ **Current Setup Strengths**

1. **Appropriate File Types** - PDF/DOCX for resumes, JPEG/PNG for avatars
2. **Size Limits** - 2MB limit on avatars prevents large uploads
3. **Public Access** - Enables direct URL usage in applications
4. **Separation of Concerns** - Different buckets for different purposes

### 🚀 **Enhancement Suggestions**

1. **Add Resume Size Limit** - Consider 10MB limit for resumes
2. **Implement Storage RLS** - Add security policies as shown above
3. **Add File Cleanup** - Auto-delete orphaned files when applications/profiles are removed
4. **Virus Scanning** - Consider adding file scanning for uploaded documents

---

_📝 Storage buckets are properly configured for HR document management_
