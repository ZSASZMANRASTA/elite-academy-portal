-- Add uniform-specific columns to shop_bundles
ALTER TABLE public.shop_bundles ADD COLUMN IF NOT EXISTS bundle_type text; -- 'full_uniform', 'tracksuit', null for regular bundles
ALTER TABLE public.shop_bundles ADD COLUMN IF NOT EXISTS uniform_metadata jsonb; -- { gender: 'boys'|'girls', school_level: 'primary'|'junior_secondary'|'senior_secondary', image_urls: {...} }

-- Add flag to shop_products to indicate games shirt (standalone uniform item)
ALTER TABLE public.shop_products ADD COLUMN IF NOT EXISTS is_standalone_uniform boolean DEFAULT false;

-- Sample data structure for uniform_metadata:
-- {
--   "gender": "boys",
--   "school_level": "junior_secondary",
--   "image_urls": {
--     "shirt": "https://...",
--     "trousers": "https://...",
--     "shoes": "https://...",
--     "tie": "https://..."
--   }
-- }
