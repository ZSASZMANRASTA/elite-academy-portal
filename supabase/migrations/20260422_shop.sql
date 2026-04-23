-- ============================================================
-- School Commerce & Services
-- ============================================================

-- Product catalog
CREATE TABLE IF NOT EXISTS public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'uniforms',
  -- categories: uniforms | stationery | digital | events | donations
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  is_digital boolean NOT NULL DEFAULT false,
  is_donation boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  variants jsonb DEFAULT '[]',
  -- e.g. [{"size":"S","stock":10},{"size":"M","stock":5}]
  download_url text,  -- for digital products
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active shop products"
  ON public.shop_products FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage shop products"
  ON public.shop_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bundles (e.g. New Student Starter Pack)
CREATE TABLE IF NOT EXISTS public.shop_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  bundle_price numeric(10,2) NOT NULL,
  original_price numeric(10,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active bundles"
  ON public.shop_bundles FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage bundles"
  ON public.shop_bundles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bundle → product links
CREATE TABLE IF NOT EXISTS public.shop_bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.shop_bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  variant text
);

ALTER TABLE public.shop_bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view bundle items"
  ON public.shop_bundle_items FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage bundle items"
  ON public.shop_bundle_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  status text NOT NULL DEFAULT 'pending',
  -- pending | confirmed | fulfilled | cancelled
  payment_method text NOT NULL DEFAULT 'pay_at_school',
  total numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.shop_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can place an order"
  ON public.shop_orders FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update orders"
  ON public.shop_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Order line items
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.shop_products(id) ON DELETE SET NULL,
  bundle_id uuid REFERENCES public.shop_bundles(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  variant text
);

ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.shop_order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_orders o
      WHERE o.id = order_id
        AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Anyone can insert order items"
  ON public.shop_order_items FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user_id ON public.shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order_id ON public.shop_order_items(order_id);
