alter table public.products
add column if not exists image_style text not null default 'auto';

update public.products
set image_style = 'auto'
where image_style is null or image_style = '';

alter table public.products
drop constraint if exists products_image_style_check;

alter table public.products
add constraint products_image_style_check
check (image_style in ('auto', 'whole', 'bunch', 'cut', 'prepared'));
