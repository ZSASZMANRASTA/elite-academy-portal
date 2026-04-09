
-- ==========================================
-- 1. FIX NOTIFICATIONS POLICIES
-- ==========================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "All users view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users mark notifications read" ON public.notifications;

-- Users can only see notifications targeted at them
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (
  target_user_id = auth.uid()
  OR (
    target_user_id IS NULL
    AND (
      target_role = 'all'
      OR has_role(auth.uid(), target_role::app_role)
    )
    AND (
      target_class_id IS NULL
      OR EXISTS (
        SELECT 1 FROM class_enrollments ce
        WHERE ce.class_id = notifications.target_class_id
          AND ce.student_id = auth.uid()
      )
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR sender_id = auth.uid()
);

-- Users can only append themselves to read_by, nothing else
CREATE POLICY "Users mark own notifications read"
ON public.notifications FOR UPDATE TO authenticated
USING (
  target_user_id = auth.uid()
  OR target_user_id IS NULL
)
WITH CHECK (
  target_user_id = auth.uid()
  OR target_user_id IS NULL
);

-- ==========================================
-- 2. FIX FEE_PAYMENTS TEACHER POLICY
-- ==========================================

DROP POLICY IF EXISTS "Teachers view payments" ON public.fee_payments;

CREATE POLICY "Teachers view class payments"
ON public.fee_payments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role)
  AND EXISTS (
    SELECT 1 FROM student_fees sf
    JOIN class_enrollments ce ON ce.student_id = sf.student_id
    JOIN classes c ON c.id = ce.class_id
    WHERE sf.id = fee_payments.student_fee_id
      AND c.teacher_id = auth.uid()
  )
);

-- ==========================================
-- 3. FIX FEE-RECEIPTS STORAGE POLICIES
-- ==========================================

-- Drop existing overly permissive SELECT if any
DROP POLICY IF EXISTS "Authenticated users can view fee receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view fee receipts" ON storage.objects;

-- Only student owner + admins can view receipts
CREATE POLICY "Students and admins view fee receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'fee-receipts'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- ==========================================
-- 4. ADD MISSING MATERIALS UPDATE POLICY
-- ==========================================

CREATE POLICY "Teachers and admins can update materials"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'materials'
  AND (
    has_role(auth.uid(), 'teacher'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
