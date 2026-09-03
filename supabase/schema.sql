-- ============================================================================
-- UAE COD Dropshipping Store — Full Database Schema
-- Paste this entire file into Supabase → SQL Editor and run it once on a
-- fresh project. Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Utility: updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- profiles — one row per admin/staff user, linked to auth.users
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- store_settings — single-row (or few-row) table of editable store config
-- ---------------------------------------------------------------------------
create table if not exists store_settings (
  id int primary key default 1,
  store_name text not null default 'Your Store',
  store_description text default 'Quality products delivered across the UAE. Cash on Delivery available.',
  logo_url text,
  favicon_url text,
  phone text,
  whatsapp text,
  email text,
  address text,
  currency text not null default 'AED',
  shipping_fee numeric(10,2) not null default 15,
  free_shipping_threshold numeric(10,2) default 200,
  cod_enabled boolean not null default true,
  footer_text text default 'Cash on Delivery across the UAE. Genuine products, fast dispatch.',
  social_instagram text,
  social_facebook text,
  social_tiktok text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into store_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_store_settings_updated_at on store_settings;
create trigger trg_store_settings_updated_at before update on store_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();

create index if not exists idx_categories_active on categories(is_active);
create index if not exists idx_categories_slug on categories(slug);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  description text,
  category_id uuid references categories(id) on delete set null,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  stock int not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  specifications jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

create index if not exists idx_products_active on products(is_active);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_featured on products(is_featured);
create index if not exists idx_products_name_trgm on products using gin (to_tsvector('simple', name));

-- ---------------------------------------------------------------------------
-- product_images — unlimited images per product (relational, not fixed cols)
-- ---------------------------------------------------------------------------
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product on product_images(product_id);

-- Ensure only one primary image per product
create or replace function enforce_single_primary_image()
returns trigger as $$
begin
  if new.is_primary then
    update product_images
      set is_primary = false
      where product_id = new.product_id and id <> new.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_single_primary_image on product_images;
create trigger trg_single_primary_image
  after insert or update of is_primary on product_images
  for each row when (new.is_primary) execute function enforce_single_primary_image();

-- ---------------------------------------------------------------------------
-- product_variants — optional (color, size, model, storage, material, etc.)
-- ---------------------------------------------------------------------------
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,                 -- e.g. "Color: Black / Size: M"
  option_labels jsonb not null default '{}'::jsonb, -- {"Color":"Black","Size":"M"}
  sku text not null unique,
  price numeric(10,2) check (price is null or price >= 0), -- overrides product price when set
  stock int not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_product_variants_updated_at on product_variants;
create trigger trg_product_variants_updated_at before update on product_variants
  for each row execute function set_updated_at();

create index if not exists idx_variants_product on product_variants(product_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create sequence if not exists order_ref_seq start 1001;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique default ('ORDER-' || nextval('order_ref_seq')::text),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  address_line text not null,
  building text,
  area text,
  delivery_city text not null,
  emirate text,
  delivery_country text not null default 'United Arab Emirates',
  delivery_notes text,
  subtotal numeric(10,2) not null default 0,
  shipping_charges numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  currency text not null default 'AED',
  payment_mode text not null default 'COD',
  status text not null default 'new' check (
    status in ('new','confirmed','processing','exported_to_zambeel','shipped','delivered','cancelled','returned')
  ),
  zambeel_exported boolean not null default false,
  zambeel_exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_zambeel on orders(zambeel_exported);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_reference on orders(order_reference);
create index if not exists idx_orders_phone on orders(customer_phone);

-- Log status changes automatically
create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id)
);

create or replace function log_order_status_change()
returns trigger as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into order_status_history (order_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  elsif (tg_op = 'INSERT') then
    insert into order_status_history (order_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_order_status_log on orders;
create trigger trg_order_status_log
  after insert or update on orders
  for each row execute function log_order_status_change();

-- ---------------------------------------------------------------------------
-- order_items — line items, supports multiple products per order
-- ---------------------------------------------------------------------------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name text not null,     -- snapshot at time of order
  product_sku text not null,      -- snapshot at time of order
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

-- ---------------------------------------------------------------------------
-- zambeel_exports + zambeel_export_items — export history
-- ---------------------------------------------------------------------------
create table if not exists zambeel_exports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  order_count int not null default 0,
  status text not null default 'completed' check (status in ('completed','failed')),
  exported_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists zambeel_export_items (
  id uuid primary key default gen_random_uuid(),
  export_id uuid not null references zambeel_exports(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_zambeel_items_export on zambeel_export_items(export_id);
create index if not exists idx_zambeel_items_order on zambeel_export_items(order_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table store_settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table zambeel_exports enable row level security;
alter table zambeel_export_items enable row level security;

-- Helper: is the current user an authenticated admin/staff member?
create or replace function is_staff()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- profiles: users can read/update their own profile; staff can read all
drop policy if exists "profiles_select_own_or_staff" on profiles;
create policy "profiles_select_own_or_staff" on profiles
  for select using (auth.uid() = id or is_staff());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- store_settings: public can read, only staff can modify
drop policy if exists "store_settings_public_read" on store_settings;
create policy "store_settings_public_read" on store_settings
  for select using (true);

drop policy if exists "store_settings_staff_write" on store_settings;
create policy "store_settings_staff_write" on store_settings
  for update using (is_staff());

-- categories: public can read active categories; staff full access
drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories
  for select using (is_active = true or is_staff());

drop policy if exists "categories_staff_insert" on categories;
create policy "categories_staff_insert" on categories
  for insert with check (is_staff());

drop policy if exists "categories_staff_update" on categories;
create policy "categories_staff_update" on categories
  for update using (is_staff());

drop policy if exists "categories_staff_delete" on categories;
create policy "categories_staff_delete" on categories
  for delete using (is_staff());

-- products: public can read active products; staff full access
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products
  for select using (is_active = true or is_staff());

drop policy if exists "products_staff_insert" on products;
create policy "products_staff_insert" on products
  for insert with check (is_staff());

drop policy if exists "products_staff_update" on products;
create policy "products_staff_update" on products
  for update using (is_staff());

drop policy if exists "products_staff_delete" on products;
create policy "products_staff_delete" on products
  for delete using (is_staff());

-- product_images: readable if parent product is readable; staff manage
drop policy if exists "product_images_public_read" on product_images;
create policy "product_images_public_read" on product_images
  for select using (
    is_staff() or exists (select 1 from products p where p.id = product_id and p.is_active)
  );

drop policy if exists "product_images_staff_write" on product_images;
create policy "product_images_staff_write" on product_images
  for all using (is_staff()) with check (is_staff());

-- product_variants: same pattern
drop policy if exists "product_variants_public_read" on product_variants;
create policy "product_variants_public_read" on product_variants
  for select using (
    is_staff() or exists (select 1 from products p where p.id = product_id and p.is_active)
  );

drop policy if exists "product_variants_staff_write" on product_variants;
create policy "product_variants_staff_write" on product_variants
  for all using (is_staff()) with check (is_staff());

-- orders: anyone (incl. anonymous checkout) can INSERT; only staff can read/update
drop policy if exists "orders_public_insert" on orders;
create policy "orders_public_insert" on orders
  for insert with check (true);

drop policy if exists "orders_staff_select" on orders;
create policy "orders_staff_select" on orders
  for select using (is_staff());

drop policy if exists "orders_staff_update" on orders;
create policy "orders_staff_update" on orders
  for update using (is_staff());

-- order_items: anyone can insert alongside their order; only staff can read
drop policy if exists "order_items_public_insert" on order_items;
create policy "order_items_public_insert" on order_items
  for insert with check (true);

drop policy if exists "order_items_staff_select" on order_items;
create policy "order_items_staff_select" on order_items
  for select using (is_staff());

-- order_status_history: staff only
drop policy if exists "order_status_history_staff_select" on order_status_history;
create policy "order_status_history_staff_select" on order_status_history
  for select using (is_staff());

-- zambeel_exports / items: staff only, all operations
drop policy if exists "zambeel_exports_staff_all" on zambeel_exports;
create policy "zambeel_exports_staff_all" on zambeel_exports
  for all using (is_staff()) with check (is_staff());

drop policy if exists "zambeel_export_items_staff_all" on zambeel_export_items;
create policy "zambeel_export_items_staff_all" on zambeel_export_items
  for all using (is_staff()) with check (is_staff());

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================
insert into storage.buckets (id, name, public)
  values ('product-images', 'product-images', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('category-images', 'category-images', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('store-assets', 'store-assets', true)
  on conflict (id) do nothing;

-- Public read for all three buckets; only authenticated staff can write
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('product-images','category-images','store-assets'));

drop policy if exists "storage_staff_insert" on storage.objects;
create policy "storage_staff_insert" on storage.objects
  for insert with check (
    bucket_id in ('product-images','category-images','store-assets')
    and auth.role() = 'authenticated'
  );

drop policy if exists "storage_staff_update" on storage.objects;
create policy "storage_staff_update" on storage.objects
  for update using (
    bucket_id in ('product-images','category-images','store-assets')
    and auth.role() = 'authenticated'
  );

drop policy if exists "storage_staff_delete" on storage.objects;
create policy "storage_staff_delete" on storage.objects
  for delete using (
    bucket_id in ('product-images','category-images','store-assets')
    and auth.role() = 'authenticated'
  );

-- ============================================================================
-- SEED DATA — demo categories & products (admin can delete freely)
-- ============================================================================
insert into categories (name, slug, description, is_active, sort_order) values
  ('Electronics', 'electronics', 'Gadgets and everyday electronics.', true, 1),
  ('Home & Kitchen', 'home-kitchen', 'Organizers and essentials for the home.', true, 2),
  ('Accessories', 'accessories', 'Everyday carry and accessories.', true, 3)
on conflict (slug) do nothing;

insert into products (name, slug, sku, description, category_id, price, compare_at_price, stock, is_active, is_featured, specifications)
select 'Wireless Earbuds', 'wireless-earbuds', 'WE-1001',
  'Compact true-wireless earbuds with a 24-hour charging case and clear call quality.',
  (select id from categories where slug = 'electronics'), 89.00, 129.00, 40, true, true,
  '{"Battery":"24h with case","Bluetooth":"5.3","Water resistance":"IPX4"}'::jsonb
where not exists (select 1 from products where sku = 'WE-1001');

insert into products (name, slug, sku, description, category_id, price, compare_at_price, stock, is_active, is_featured, specifications)
select 'LED Desk Lamp', 'led-desk-lamp', 'LDL-1002',
  'Adjustable desk lamp with 3 brightness levels and USB charging port.',
  (select id from categories where slug = 'home-kitchen'), 59.00, 79.00, 25, true, true,
  '{"Power":"USB-C","Modes":"3","Material":"Aluminium"}'::jsonb
where not exists (select 1 from products where sku = 'LDL-1002');

insert into products (name, slug, sku, description, category_id, price, compare_at_price, stock, is_active, is_featured, specifications)
select 'Travel Organizer', 'travel-organizer', 'TO-1003',
  'Compact packing organizer set for cables, chargers and toiletries.',
  (select id from categories where slug = 'accessories'), 45.00, null, 60, true, false,
  '{"Pieces":"4","Material":"Polyester"}'::jsonb
where not exists (select 1 from products where sku = 'TO-1003');

insert into products (name, slug, sku, description, category_id, price, compare_at_price, stock, is_active, is_featured, specifications)
select 'Phone Stand', 'phone-stand', 'PS-1004',
  'Foldable aluminium phone and tablet stand, adjustable to any angle.',
  (select id from categories where slug = 'accessories'), 25.00, 35.00, 100, true, false,
  '{"Material":"Aluminium","Foldable":"Yes"}'::jsonb
where not exists (select 1 from products where sku = 'PS-1004');

insert into products (name, slug, sku, description, category_id, price, compare_at_price, stock, is_active, is_featured, specifications)
select 'Kitchen Organizer Set', 'kitchen-organizer-set', 'KOS-1005',
  'Stackable kitchen organizer set for pantry and counter storage.',
  (select id from categories where slug = 'home-kitchen'), 69.00, null, 30, true, true,
  '{"Pieces":"6","Material":"BPA-free plastic"}'::jsonb
where not exists (select 1 from products where sku = 'KOS-1005');

-- Done. Your database is ready.
