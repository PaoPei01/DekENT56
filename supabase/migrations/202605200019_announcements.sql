create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text default 'update',
  priority text default 'normal',
  audience text default 'public',
  image_url text,
  file_url text,
  external_url text,
  is_pinned boolean default false,
  is_popup boolean default false,
  visible boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint announcements_type_check check (type in ('banner', 'schedule', 'map', 'traffic', 'emergency', 'faq', 'update', 'document')),
  constraint announcements_priority_check check (priority in ('critical', 'important', 'normal')),
  constraint announcements_audience_check check (audience in ('public', 'staff', 'admin'))
);

create index if not exists announcements_visible_idx on public.announcements (visible, audience, starts_at, ends_at);
create index if not exists announcements_priority_idx on public.announcements (priority, is_pinned, updated_at);

create or replace function public.touch_announcements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists announcements_touch_updated_at on public.announcements;
create trigger announcements_touch_updated_at
before update on public.announcements
for each row execute function public.touch_announcements_updated_at();

alter table public.announcements enable row level security;

drop policy if exists "public visible announcements" on public.announcements;
create policy "public visible announcements"
on public.announcements
for select
using (
  visible = true
  and audience = 'public'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

drop policy if exists "admin manage announcements" on public.announcements;
create policy "admin manage announcements"
on public.announcements
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "staff read staff announcements" on public.announcements;
create policy "staff read staff announcements"
on public.announcements
for select
to authenticated
using (
  visible = true
  and audience in ('public', 'staff')
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
  and (
    public.is_admin(auth.uid())
    or exists (select 1 from public.staff_assignments sa where sa.user_id = auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcements',
  'announcements',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read announcement files" on storage.objects;
create policy "public read announcement files"
on storage.objects
for select
using (bucket_id = 'announcements');

drop policy if exists "admin upload announcement files" on storage.objects;
create policy "admin upload announcement files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'announcements' and public.is_admin(auth.uid()));

drop policy if exists "admin update announcement files" on storage.objects;
create policy "admin update announcement files"
on storage.objects
for update
to authenticated
using (bucket_id = 'announcements' and public.is_admin(auth.uid()))
with check (bucket_id = 'announcements' and public.is_admin(auth.uid()));

drop policy if exists "admin delete announcement files" on storage.objects;
create policy "admin delete announcement files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'announcements' and public.is_admin(auth.uid()));

create or replace function public.get_visible_announcements(input_audience text default 'public')
returns setof public.announcements
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  requested text := coalesce(nullif(input_audience, ''), 'public');
  can_staff boolean := false;
begin
  if requested not in ('public', 'staff', 'admin') then
    requested := 'public';
  end if;

  can_staff := auth.uid() is not null and (
    public.is_admin(auth.uid())
    or exists (select 1 from public.staff_assignments sa where sa.user_id = auth.uid())
  );

  if requested = 'admin' and not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  if requested = 'staff' and not can_staff then
    requested := 'public';
  end if;

  return query
  select *
  from public.announcements a
  where a.visible = true
    and (a.starts_at is null or a.starts_at <= now())
    and (a.ends_at is null or a.ends_at >= now())
    and (
      (requested = 'public' and a.audience = 'public')
      or (requested = 'staff' and a.audience in ('public', 'staff'))
      or (requested = 'admin')
    )
  order by a.is_pinned desc, case a.priority when 'critical' then 1 when 'important' then 2 else 3 end, a.updated_at desc;
end;
$$;

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
grant execute on function public.get_visible_announcements(text) to anon, authenticated;
