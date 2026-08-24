create type public.app_role as enum ('owner','premium','lite');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'lite',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own role" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'owner'));

create policy "owner manages roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

grant insert, update, delete on public.user_roles to authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug text not null,
  label text not null,
  color text not null default 'teal',
  icon text not null default 'folder',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug),
  constraint categories_label_len check (char_length(label) between 1 and 40),
  constraint categories_slug_len check (char_length(slug) between 1 and 40)
);

grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;

alter table public.categories enable row level security;

create policy "own categories" on public.categories
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index categories_user_idx on public.categories (user_id, created_at);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_categories_updated_at
  before update on public.categories
  for each row execute function public.update_updated_at_column();

insert into public.user_roles (user_id, role)
select id, 'owner'::public.app_role from auth.users
on conflict do nothing;

insert into public.categories (user_id, slug, label, color, icon)
select u.id, c.slug, c.label, c.color, c.icon
from auth.users u
cross join (values
  ('pessoal','Pessoal','violet','heart'),
  ('trabalho','Trabalho','blue','briefcase'),
  ('outros','Outros','amber','folder')
) as c(slug,label,color,icon)
on conflict do nothing;