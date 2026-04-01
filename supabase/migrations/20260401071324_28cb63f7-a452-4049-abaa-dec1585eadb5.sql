
-- Fee structures table
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  amount_per_term NUMERIC NOT NULL DEFAULT 0,
  lunch_fee NUMERIC NOT NULL DEFAULT 0,
  academic_year TEXT NOT NULL DEFAULT '2024/2025',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage fee structures" ON public.fee_structures
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view fee structures" ON public.fee_structures
  FOR SELECT TO authenticated
  USING (true);

-- Student fees table
CREATE TABLE public.student_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  term TEXT NOT NULL DEFAULT 'Term 1',
  academic_year TEXT NOT NULL DEFAULT '2024/2025',
  total_expected NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  mpesa_ref TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage student fees" ON public.student_fees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students view own fees" ON public.student_fees
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Add unique constraint for attendance upsert
CREATE UNIQUE INDEX IF NOT EXISTS attendance_date_student_class_idx 
  ON public.attendance (date, student_id, class_id);
