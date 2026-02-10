
-- Add report_type column for categorizing reports
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS report_type text DEFAULT 'general';
