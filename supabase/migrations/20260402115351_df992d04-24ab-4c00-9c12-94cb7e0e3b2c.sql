
-- 1. Add class_id to courses so courses (subjects) are linked to a class
ALTER TABLE public.courses ADD COLUMN class_id uuid REFERENCES public.classes(id);

-- 2. Add absence_reason to attendance
ALTER TABLE public.attendance ADD COLUMN absence_reason text;

-- 3. Add student_id to parent_contacts so parent info is linked to a student
ALTER TABLE public.parent_contacts ADD COLUMN student_id uuid;

-- 4. Allow admins/teachers to view parent contacts for their students
CREATE POLICY "Teachers can view parent contacts for their students"
ON public.parent_contacts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'teacher'::app_role)
);
