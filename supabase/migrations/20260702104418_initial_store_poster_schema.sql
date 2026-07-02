create table if not exists public.products (
  id text primary key,
  name text not null,
  unit text not null default '',
  category text not null default '',
  image_url text not null default '',
  mrp numeric,
  selling_price numeric not null default 0,
  archived_image_urls jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poster_templates (
  id text primary key,
  name text not null,
  type text not null default 'grocery-grid',
  config_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_settings (
  id text primary key default 'default',
  config_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  product_id text references public.products(id) on delete set null,
  prompt text not null,
  model text not null,
  quality text,
  output_url text,
  provider_response jsonb,
  estimated_cost numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.poster_export_logs (
  id uuid primary key default gen_random_uuid(),
  template_id text references public.poster_templates(id) on delete set null,
  title text,
  selected_product_ids jsonb not null default '[]'::jsonb,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists poster_templates_touch_updated_at on public.poster_templates;
create trigger poster_templates_touch_updated_at
before update on public.poster_templates
for each row execute function public.touch_updated_at();

drop trigger if exists brand_settings_touch_updated_at on public.brand_settings;
create trigger brand_settings_touch_updated_at
before update on public.brand_settings
for each row execute function public.touch_updated_at();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();
