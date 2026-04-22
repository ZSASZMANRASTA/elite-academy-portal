-- Add academic_year to student_fees (was missing from original migration)
ALTER TABLE public.student_fees ADD COLUMN IF NOT EXISTS academic_year text NOT NULL DEFAULT '2025/2026';

-- Add term to fee_structures so each structure applies to a specific term
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS term text;

-- Add stream to classes for specialization (e.g. "East Wing", "A", "B")
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS stream text;
