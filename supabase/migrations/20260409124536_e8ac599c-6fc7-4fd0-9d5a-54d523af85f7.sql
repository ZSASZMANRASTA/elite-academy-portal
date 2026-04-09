
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'assignment_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.assignment_submissions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.assignments;
  END IF;
END;
$$;
