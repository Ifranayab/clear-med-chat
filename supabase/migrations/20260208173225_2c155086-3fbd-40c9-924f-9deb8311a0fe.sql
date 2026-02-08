
-- Create storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-reports', 'medical-reports', false);

-- Storage policies
CREATE POLICY "Users can upload their own reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
ON public.reports FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
ON public.reports FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
