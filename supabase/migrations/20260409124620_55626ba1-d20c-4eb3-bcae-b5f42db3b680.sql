
-- 1. Remove the broad fee-receipts SELECT policy
-- Try various possible names
DROP POLICY IF EXISTS "Anyone authenticated can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view fee receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access on fee-receipts" ON storage.objects;

-- List and drop all SELECT policies on storage.objects for fee-receipts bucket except our scoped one
-- We need to be explicit about known policy names
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd = 'SELECT'
      AND policyname != 'Students and admins view fee receipts'
      AND policyname LIKE '%receipt%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END;
$$;

-- 2. Fix assignments policy - require enrollment
DROP POLICY IF EXISTS "Students can view assignments for published courses" ON public.assignments;

CREATE POLICY "Students view enrolled course assignments"
ON public.assignments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN enrollments e ON e.course_id = c.id
    WHERE c.id = assignments.course_id
      AND c.published = true
      AND e.student_id = auth.uid()
  )
  OR teacher_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Fix quiz_questions - hide correct_answer from students
-- We can't restrict columns via RLS, so create a secure function instead
CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_student(_quiz_id uuid)
RETURNS TABLE(
  id uuid,
  quiz_id uuid,
  question text,
  options jsonb,
  sort_order int,
  explanation text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT qq.id, qq.quiz_id, qq.question, qq.options, qq.sort_order, NULL::text as explanation
  FROM quiz_questions qq
  WHERE qq.quiz_id = _quiz_id
  ORDER BY qq.sort_order;
$$;
