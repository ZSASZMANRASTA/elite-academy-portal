ALTER TABLE public.notifications ADD COLUMN target_user_id uuid DEFAULT NULL;
ALTER TABLE public.notifications ADD COLUMN target_class_id uuid DEFAULT NULL;