ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

CREATE OR REPLACE FUNCTION public.upsert_student_record(
  _student_id text,
  _full_name text,
  _class_id uuid
)
RETURNS TABLE(record_id uuid, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record_id uuid;
  _created boolean := false;
  _class_label text;
BEGIN
  IF auth.uid() IS NULL OR NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF nullif(btrim(_student_id), '') IS NULL
     OR nullif(btrim(_full_name), '') IS NULL
     OR _class_id IS NULL THEN
    RAISE EXCEPTION 'Student ID, full name, and class are required';
  END IF;

  SELECT concat_ws(' ', c.name, nullif(btrim(c.stream), ''))
    INTO _class_label
  FROM public.classes c
  WHERE c.id = _class_id;

  IF _class_label IS NULL THEN
    RAISE EXCEPTION 'Class not found';
  END IF;

  SELECT p.id INTO _record_id
  FROM public.profiles p
  WHERE lower(btrim(p.student_id)) = lower(btrim(_student_id))
  LIMIT 1;

  IF _record_id IS NULL THEN
    _record_id := gen_random_uuid();
    _created := true;
    INSERT INTO public.profiles (id, full_name, student_id, class, approved)
    VALUES (_record_id, btrim(_full_name), btrim(_student_id), _class_label, true);
  ELSE
    UPDATE public.profiles
    SET full_name = btrim(_full_name),
        student_id = btrim(_student_id),
        class = _class_label,
        updated_at = now()
    WHERE id = _record_id;
  END IF;

  DELETE FROM public.class_enrollments
  WHERE student_id = _record_id AND class_id <> _class_id;

  INSERT INTO public.class_enrollments (student_id, class_id)
  VALUES (_record_id, _class_id)
  ON CONFLICT (student_id, class_id) DO NOTHING;

  RETURN QUERY SELECT _record_id, _created;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_student_record(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_student_record(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_student_record(text, text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.delete_student_record(_student_record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_ids uuid[];
  _fee_ids uuid[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can delete student records';
  END IF;

  IF _student_record_id IS NULL OR _student_record_id = auth.uid() THEN
    RAISE EXCEPTION 'Invalid student record';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _student_record_id AND role <> 'student'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Target record is not a student';
  END IF;

  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
    INTO _fee_ids
  FROM public.student_fees
  WHERE student_id = _student_record_id;

  DELETE FROM public.fee_payments WHERE student_fee_id = ANY(_fee_ids);

  DELETE FROM public.quiz_feedback
  WHERE attempt_id IN (
    SELECT id FROM public.quiz_attempts WHERE student_id = _student_record_id
  );

  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
    INTO _order_ids
  FROM public.shop_orders
  WHERE user_id = _student_record_id;

  DELETE FROM public.shop_order_items WHERE order_id = ANY(_order_ids);
  DELETE FROM public.shop_orders WHERE user_id = _student_record_id;
  DELETE FROM public.notifications
    WHERE target_user_id = _student_record_id OR sender_id = _student_record_id;
  DELETE FROM public.admin_login_audit WHERE user_id = _student_record_id;
  DELETE FROM public.assignment_submissions WHERE student_id = _student_record_id;
  DELETE FROM public.attendance WHERE student_id = _student_record_id;
  DELETE FROM public.class_enrollments WHERE student_id = _student_record_id;
  DELETE FROM public.enrollments WHERE student_id = _student_record_id;
  DELETE FROM public.lesson_progress WHERE student_id = _student_record_id;
  DELETE FROM public.parent_contacts WHERE student_id = _student_record_id;
  DELETE FROM public.quiz_attempts WHERE student_id = _student_record_id;
  DELETE FROM public.student_fees WHERE student_id = _student_record_id;
  DELETE FROM public.user_roles
    WHERE user_id = _student_record_id AND role = 'student'::public.app_role;
  DELETE FROM public.profiles WHERE id = _student_record_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_student_record(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_student_record(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_student_record(uuid) TO service_role;