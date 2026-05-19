create or replace function public.search_public_profiles(search_text text default '', major_filter text default '')
returns table (
  id uuid,
  name_th text,
  name_en text,
  nickname text,
  major text,
  main_group text,
  subgroup text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name_th, p.name_en, p.nickname, p.major, ga.main_group, ga.subgroup
  from public.profiles p
  left join public.group_assignments ga on ga.profile_id = p.id
  where (
    coalesce(search_text, '') = ''
    or p.name_th ilike '%' || search_text || '%'
    or p.name_en ilike '%' || search_text || '%'
    or p.nickname ilike '%' || search_text || '%'
    or p.major ilike '%' || search_text || '%'
  )
  and (
    coalesce(major_filter, '') = ''
    or p.major ilike '%' || major_filter || '%'
  )
  order by p.name_th nulls last;
$$;

grant execute on function public.search_public_profiles(text, text) to anon, authenticated;
