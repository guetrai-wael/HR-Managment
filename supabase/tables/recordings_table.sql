-- =============================================
-- Recordings Table Creation Script
-- =============================================
-- This table stores metadata about video recordings processed by the Detection-2K25 model
-- Note: Actual video files are processed locally and not stored in Supabase
CREATE TABLE IF NOT EXISTS public.recordings (
    -- Primary key
    id UUID PRIMARY KEY,
    -- Video metadata
    video_name TEXT NOT NULL,
    video_size BIGINT,
    -- File size in bytes (optional)
    video_duration INTEGER,
    -- Duration in seconds (optional)
    -- Processing status
    status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    -- Results from Detection-2K25 model
    results_json JSONB,
    -- Stores the employee presence detection results
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_time_seconds INTEGER,
    -- How long processing took
    -- Error handling
    error_message TEXT,
    -- Store error details if processing fails
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- User who uploaded the recording
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        -- When the recording took place (if available from video/device)
        recorded_at TIMESTAMP WITH TIME ZONE
);
-- =============================================
-- Indexes for Performance
-- =============================================
-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_recordings_status ON public.recordings(status);
-- Index for filtering by upload date
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON public.recordings(created_at DESC);
-- Index for filtering by uploader
CREATE INDEX IF NOT EXISTS idx_recordings_uploaded_by ON public.recordings(uploaded_by);
-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================
-- Enable RLS
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
-- Policy: Admins and employees can view all recordings
CREATE POLICY recordings_select_policy ON public.recordings FOR
SELECT USING (
        (
            EXISTS (
                SELECT 1
                FROM (
                        user_roles ur
                        JOIN roles r ON ((ur.role_id = r.id))
                    )
                WHERE (
                        (ur.user_id = auth.uid())
                        AND (
                            r.name = ANY (ARRAY ['admin'::text, 'employee'::text])
                        )
                    )
            )
        )
    );
-- Policy: Admins and employees can insert recordings
CREATE POLICY recordings_insert_policy ON public.recordings FOR
INSERT WITH CHECK (
        (
            EXISTS (
                SELECT 1
                FROM (
                        user_roles ur
                        JOIN roles r ON ((ur.role_id = r.id))
                    )
                WHERE (
                        (ur.user_id = auth.uid())
                        AND (
                            r.name = ANY (ARRAY ['admin'::text, 'employee'::text])
                        )
                    )
            )
        )
    );
-- Policy: Admins can update recordings
CREATE POLICY recordings_update_policy ON public.recordings FOR
UPDATE USING (
        (
            EXISTS (
                SELECT 1
                FROM (
                        user_roles ur
                        JOIN roles r ON ((ur.role_id = r.id))
                    )
                WHERE (
                        (ur.user_id = auth.uid())
                        AND (r.name = 'admin'::text)
                    )
            )
        )
    )
);
-- Policy: Admins can delete recordings
CREATE POLICY recordings_delete_policy ON public.recordings FOR DELETE USING (
    (
        EXISTS (
            SELECT 1
            FROM (
                    user_roles ur
                    JOIN roles r ON ((ur.role_id = r.id))
                )
            WHERE (
                    (ur.user_id = auth.uid())
                    AND (r.name = 'admin'::text)
                )
        )
    )
)
);
-- =============================================
-- Trigger for Updated At
-- =============================================
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_recordings_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger to automatically update updated_at
CREATE TRIGGER recordings_updated_at_trigger BEFORE
UPDATE ON public.recordings FOR EACH ROW EXECUTE FUNCTION update_recordings_updated_at();
-- =============================================
-- Comments for Documentation
-- =============================================
COMMENT ON TABLE public.recordings IS 'Stores metadata about video recordings processed by the Detection-2K25 model for employee presence tracking';
COMMENT ON COLUMN public.recordings.id IS 'Unique identifier for the recording';
COMMENT ON COLUMN public.recordings.video_name IS 'Original filename of the uploaded video';
COMMENT ON COLUMN public.recordings.status IS 'Processing status: processing, completed, or failed';
COMMENT ON COLUMN public.recordings.results_json IS 'JSON results from Detection-2K25 model containing employee presence data';
COMMENT ON COLUMN public.recordings.uploaded_by IS 'User who uploaded the recording';