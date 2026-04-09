
-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('mpesa', 'bank', 'cash');

-- Create fee_payments table for installment tracking
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'mpesa',
  reference_code TEXT,
  bank_name TEXT,
  receipt_url TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage fee payments"
ON public.fee_payments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Students can view their own payments
CREATE POLICY "Students view own payments"
ON public.fee_payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_fees sf
    WHERE sf.id = fee_payments.student_fee_id
    AND sf.student_id = auth.uid()
  )
);

-- Teachers can view payments
CREATE POLICY "Teachers view payments"
ON public.fee_payments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public) VALUES ('fee-receipts', 'fee-receipts', true);

-- Storage policies
CREATE POLICY "Admins can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fee-receipts' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone authenticated can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'fee-receipts');

CREATE POLICY "Admins can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fee-receipts' AND has_role(auth.uid(), 'admin'::app_role));
