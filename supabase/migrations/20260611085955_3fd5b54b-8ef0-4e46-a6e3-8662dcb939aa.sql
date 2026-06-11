ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_unique ON public.profiles (student_id) WHERE student_id IS NOT NULL;