CREATE TABLE public.admin_login_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  event text NOT NULL DEFAULT 'login',
  success boolean NOT NULL DEFAULT true,
  ip_address text,
  user_agent text,
  mfa_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_login_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit log"
  ON public.admin_login_audit FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated insert own audit"
  ON public.admin_login_audit FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_admin_login_audit_user_created ON public.admin_login_audit(user_id, created_at DESC);