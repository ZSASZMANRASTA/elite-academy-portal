
-- Add admin SELECT policy on quiz_attempts so ProgressPage works
CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add admin SELECT policy on lesson_progress
CREATE POLICY "Admins can view all lesson progress"
ON public.lesson_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add unique constraint on attendance for upsert to work
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_date_student_class_unique
UNIQUE (date, student_id, class_id);
