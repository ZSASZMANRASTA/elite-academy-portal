-- ============================================================
-- school_terms: defines each academic term with date range
-- and whether Saturday is a school day (for upper classes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.school_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year text NOT NULL,           -- e.g. "2025/2026"
  term_name text NOT NULL,               -- e.g. "Term 1"
  start_date date NOT NULL,
  end_date date NOT NULL,
  include_saturday boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(academic_year, term_name)
);

ALTER TABLE public.school_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage school terms"
  ON public.school_terms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view school terms"
  ON public.school_terms FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- school_holidays: individual non-school days within a term
-- ============================================================
CREATE TABLE IF NOT EXISTS public.school_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.school_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage holidays"
  ON public.school_holidays FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view holidays"
  ON public.school_holidays FOR SELECT TO authenticated
  USING (true);
