# Your Store — UAE COD Dropshipping Storefront

A generic, niche-agnostic e-commerce storefront built for Cash on Delivery
sales across the UAE, with a full admin dashboard and a dedicated Zambeel
Excel export workflow.

## Tech stack
React 18 · Vite · Supabase (Postgres, Auth, Storage) · Tailwind CSS ·
Lucide React · SheetJS (xlsx) · Recharts · React Router

## 1. Set up Supabase

1. Create a new project at https://supabase.com.
2. Open **SQL Editor** and paste the entire contents of `supabase/schema.sql`,
   then run it. This creates every table, RLS policy, trigger, storage
   bucket, and a handful of demo products/categories you can delete later.
3. Go to **Authentication → Users** and create your first admin user (email +
   password). A `profiles` row is created for them automatically and grants
   full admin access via RLS.
4. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Never put your Supabase **service role** key in this file or anywhere in the
frontend — only the anon key belongs here.

## 3. Install & run

```bash
npm install
npm run dev
```

- Storefront: `http://localhost:5173/`
- Admin: `http://localhost:5173/admin/login` (sign in with the user you
  created in Supabase Auth)

## 4. Build for production

```bash
npm run build
```

Output is written to `dist/`, ready to deploy to Vercel, Netlify, or any
static host.

## Project structure

```
src/
  components/       shared UI (ProductCard, skeletons, dialogs, etc.)
  components/storefront/  Header, Footer
  layouts/          StorefrontLayout, AdminLayout
  pages/storefront/ Home, Shop/Category/Search, Product, Cart, Checkout...
  pages/admin/      Dashboard, Products, Categories, Orders, Zambeel...
  contexts/         Auth, Cart, StoreSettings, Toast
  services/         supabase.js, productService, orderService,
                     categoryService, settingsService, storageService,
                     zambeelExport.js   ← isolated Zambeel logic
supabase/
  schema.sql              full database schema + RLS + seed data
  UAE-sample-orders.csv   structural reference for the Zambeel format
```

## How the Zambeel export works

1. Admin opens **Zambeel Export**, sees every unexported order (new,
   confirmed, or processing).
2. Selects some or all orders, reviews the live preview table.
3. Confirms **Generate Zambeel Excel?** — this downloads a `.xlsx` with the
   exact 14 required columns, in the exact required order:

   `order_reference_id, customer_name, Address, delivery_city,
   delivery_country, customer_phone_number, product_sku, Quantity, price,
   shipping_charges, Discount, total_amount, currency, payment_mode`

4. Only **after** the file is generated successfully are the included orders
   recorded in `zambeel_exports` / `zambeel_export_items` and marked
   `exported_to_zambeel` — a failed export never marks orders as exported.
5. **Export History** shows every past export and which orders were in it.

All of this logic lives in `src/services/zambeelExport.js`, isolated from
general order handling, so it's easy to audit or adjust if Zambeel's format
ever changes.

## Notes

- The store is fully generic: categories and products are entirely
  admin-managed, with unlimited images per product via the relational
  `product_images` table, and optional variants (color/size/model/etc.) via
  `product_variants`.
- The store name, branding, currency, shipping fee, and COD toggle are all
  editable from **Settings → Store Settings** and propagate everywhere via
  the `StoreSettingsContext`.
- RLS is configured so anonymous checkout can insert orders, but only signed-in
  staff (rows in `profiles`) can read orders, manage products, or export data.
