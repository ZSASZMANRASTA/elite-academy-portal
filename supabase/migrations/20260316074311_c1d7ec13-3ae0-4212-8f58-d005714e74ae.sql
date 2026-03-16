
-- Update handle_new_user to accept role from metadata (student or teacher)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  _role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', '')::app_role,
    'student'
  );
  
  -- Only allow student or teacher from signup, never admin
  IF _role NOT IN ('student', 'teacher') THEN
    _role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

-- Create assignments table for term-long assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own assignments" ON public.assignments
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view assignments for published courses" ON public.assignments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM courses c WHERE c.id = assignments.course_id AND c.published = true
  ));

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  text_response text,
  file_url text,
  teacher_feedback text,
  grade text,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own submissions" ON public.assignment_submissions
  FOR ALL TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assignments a WHERE a.id = assignment_submissions.assignment_id AND a.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can update submissions (feedback)" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assignments a WHERE a.id = assignment_submissions.assignment_id AND a.teacher_id = auth.uid()
  ));

-- Create quiz_feedback table
CREATE TABLE IF NOT EXISTS public.quiz_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  feedback text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage feedback" ON public.quiz_feedback
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view feedback on own attempts" ON public.quiz_feedback
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quiz_attempts qa WHERE qa.id = quiz_feedback.attempt_id AND qa.student_id = auth.uid()
  ));

-- Add updated_at triggers
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Make materials bucket public for reading
UPDATE storage.buckets SET public = true WHERE id = 'materials';

-- Add realtime for assignments
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignment_submissions;
