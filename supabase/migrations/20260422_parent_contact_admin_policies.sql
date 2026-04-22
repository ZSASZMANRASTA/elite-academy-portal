-- Allow admins and teachers to fully manage parent contacts
CREATE POLICY "Admins and teachers can update parent contacts"
  ON public.parent_contacts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Admins and teachers can delete parent contacts"
  ON public.parent_contacts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Also allow teachers to view parent contacts (currently only admins can)
CREATE POLICY "Teachers can view parent contacts"
  ON public.parent_contacts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

-- Allow admins and teachers to insert parent contacts linked to a student
CREATE POLICY "Admins and teachers can insert parent contacts"
  ON public.parent_contacts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
