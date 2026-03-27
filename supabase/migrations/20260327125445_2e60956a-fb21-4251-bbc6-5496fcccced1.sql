
-- Enums
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.notification_type AS ENUM ('fee', 'quiz', 'general');

-- Classes
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Class enrollments
CREATE TABLE public.class_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id)
);
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- Attendance
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  student_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  marked_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, student_id, class_id)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'general',
  sender_id UUID NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'student',
  read_by UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: classes
CREATE POLICY "Teachers can manage own classes" ON public.classes FOR ALL TO authenticated
  USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view enrolled classes" ON public.classes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.class_enrollments ce WHERE ce.class_id = classes.id AND ce.student_id = auth.uid())
    OR has_role(auth.uid(), 'teacher'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS: class_enrollments
CREATE POLICY "Teachers and admins manage enrollments" ON public.class_enrollments FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_enrollments.class_id AND c.teacher_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_enrollments.class_id AND c.teacher_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Students view own class enrollments" ON public.class_enrollments FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- RLS: attendance
CREATE POLICY "Teachers manage attendance" ON public.attendance FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = attendance.class_id AND c.teacher_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = attendance.class_id AND c.teacher_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Students view own attendance" ON public.attendance FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- RLS: notifications
CREATE POLICY "Admins teachers manage notifications" ON public.notifications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR sender_id = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "All users view notifications" ON public.notifications FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users mark notifications read" ON public.notifications FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
