-- Add term to fee_structures so each structure applies to a specific term
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS term text;

-- Add stream to classes for specialization (e.g. "East Wing", "A", "B")
-- The name field continues to hold the general class level (e.g. "Grade 7")
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS stream text;
