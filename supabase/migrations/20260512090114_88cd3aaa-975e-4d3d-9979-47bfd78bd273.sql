-- Add stream to classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS stream text;

-- School terms
CREATE TABLE IF NOT EXISTS public.school_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year text NOT NULL,
  term_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  include_saturday boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view terms" ON public.school_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage terms" ON public.school_terms FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- School holidays
CREATE TABLE IF NOT EXISTS public.school_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view holidays" ON public.school_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage holidays" ON public.school_holidays FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Shop products
CREATE TABLE IF NOT EXISTS public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'uniforms',
  price numeric NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  is_digital boolean NOT NULL DEFAULT false,
  is_donation boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  download_url text,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active products" ON public.shop_products FOR SELECT USING (is_active = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage products" ON public.shop_products FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Shop bundles
CREATE TABLE IF NOT EXISTS public.shop_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active bundles" ON public.shop_bundles FOR SELECT USING (is_active = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage bundles" ON public.shop_bundles FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Shop bundle items
CREATE TABLE IF NOT EXISTS public.shop_bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.shop_bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1
);
ALTER TABLE public.shop_bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view bundle items" ON public.shop_bundle_items FOR SELECT USING (true);
CREATE POLICY "Admins manage bundle items" ON public.shop_bundle_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Shop orders
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  payment_method text NOT NULL DEFAULT 'pay_at_school',
  total numeric NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.shop_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone can create orders" ON public.shop_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins update orders" ON public.shop_orders FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete orders" ON public.shop_orders FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- Shop order items
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.shop_products(id) ON DELETE SET NULL,
  bundle_id uuid REFERENCES public.shop_bundles(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  variant text
);
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own order items" ON public.shop_order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.shop_orders o WHERE o.id = shop_order_items.order_id AND (o.user_id = auth.uid() OR has_role(auth.uid(),'admin')))
);
CREATE POLICY "Anyone create order items" ON public.shop_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage order items" ON public.shop_order_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));