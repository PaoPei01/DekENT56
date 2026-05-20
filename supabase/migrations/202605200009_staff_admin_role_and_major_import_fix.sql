create or replace function public.normalize_staff_operational_role(input_role text)
returns text
language plpgsql
immutable
as $$
declare
  raw text := nullif(btrim(coalesce(input_role, '')), '');
  lower_raw text;
begin
  if raw is null then
    return null;
  end if;

  lower_raw := lower(raw);

  if lower_raw in ('staff', 'mentor', 'viewer', 'emergency_staff') then
    return null;
  end if;

  if lower_raw like '%ทีมบริหาร%' or lower_raw like '%ทีมบอ%' or lower_raw like '%วางแผน%' or lower_raw like '%planner%' or lower_raw like '%plan%' then
    return 'ทีมบริหาร';
  elsif lower_raw like '%พี่กลุ่ม%' or lower_raw like '%mentor%' or lower_raw like '%group staff%' then
    return 'พี่กลุ่ม';
  elsif lower_raw like '%พี่ฐาน%' or lower_raw like '%ฐาน%' or lower_raw like '%base%' then
    return 'พี่ฐาน';
  elsif lower_raw like '%ไทม์%' or lower_raw like '%timer%' then
    return 'ไทม์เมอร์';
  elsif lower_raw like '%พยาบาล%' or lower_raw like '%medic%' or lower_raw like '%medical%' or lower_raw like '%nurse%' then
    return 'พยาบาล';
  elsif lower_raw like '%จราจร%' or lower_raw like '%traffic%' then
    return 'จราจร';
  elsif lower_raw like '%สวัสดิการ%' or lower_raw like '%welfare%' then
    return 'สวัสดิการ';
  elsif lower_raw like '%โสต%' or lower_raw like '%audio%' or lower_raw like '%visual%' or lower_raw like '%av%' then
    return 'โสตทัศนูปกรณ์';
  elsif lower_raw like '%โฟโต้%' or lower_raw like '%photo%' or lower_raw like '%photographer%' then
    return 'โฟโต้';
  elsif lower_raw like '%พิธีกร%' or lower_raw like '%mc%' then
    return 'พิธีกร';
  end if;

  return raw;
end;
$$;

create or replace function public.normalize_major(input_major text)
returns text
language plpgsql
immutable
as $$
declare
  raw text := nullif(btrim(coalesce(input_major, '')), '');
  normalized text;
  compact text;
  code text;
begin
  if raw is null then
    return null;
  end if;

  normalized := lower(regexp_replace(replace(raw, 'ภาควิชา', ''), '\s+', ' ', 'g'));
  compact := regexp_replace(normalized, '\s+', '', 'g');
  code := upper(nullif(btrim(substring(raw from '\(([^)]+)\)\s*$')), ''));
  if code = 'IGE INTERNATIONAL' then
    code := 'IGME';
  end if;

  if code = 'ISNE' or normalized like '%information systems and network engineering%' or normalized like '%วิศวกรรมระบบสารสนเทศและเครือข่าย%' then
    return 'วิศวกรรมระบบสารสนเทศและเครือข่าย (ISNE)';
  elsif code = 'ISCE' or normalized like '%information systems and cybersecurity engineering%' or normalized like '%วิศวกรรมระบบสารสนเทศและความมั่นคงปลอดภัยไซเบอร์%' then
    return 'วิศวกรรมระบบสารสนเทศและความมั่นคงปลอดภัยไซเบอร์ (ISCE)';
  elsif code = 'EESG' or normalized like '%electrical engineering and smart grid technology%' or normalized like '%วิศวกรรมไฟฟ้าและเทคโนโลยีโครงข่ายไฟฟ้าอัจฉริยะ%' then
    return 'วิศวกรรมไฟฟ้าและเทคโนโลยีโครงข่ายไฟฟ้าอัจฉริยะ (EESG)';
  elsif code = 'MEPM' or normalized like '%mechanical engineering and engineering project management%' or normalized like '%วิศวกรรมเครื่องกลและการบริหารโครงการวิศวกรรม%' then
    return 'วิศวกรรมเครื่องกลและการบริหารโครงการวิศวกรรม (MEPM)';
  elsif code = 'CIE' or normalized like '%civil engineering (international)%' or normalized like '%วิศวกรรมโยธา (นานาชาติ)%' then
    return 'วิศวกรรมโยธา (นานาชาติ) (CIE)';
  elsif code = 'IEL' or normalized like '%industrial engineering and logistics management%' or normalized like '%วิศวกรรมอุตสาหการและการจัดการ โลจิสติกส์%' or compact like '%วิศวกรรมอุตสาหการและการจัดการโลจิสติกส์%' or normalized like '%logistics management%' then
    return 'วิศวกรรมอุตสาหการและการจัดการ โลจิสติกส์ (IEL)';
  elsif code = 'IGME' or normalized like '%integrated and multi-disciplinary engineering%' or normalized like '%พหุวิทยาการ%' or normalized like '%ige international%' then
    return 'วิศวกรรมบูรณาการ และพหุวิทยาการ (IGE international)';
  elsif code = 'REAI' or normalized like '%robotics engineering and artificial intelligence%' or normalized like '%วิศวกรรมหุ่นยนต์และปัญญาประดิษฐ์%' then
    return 'วิศวกรรมหุ่นยนต์และปัญญาประดิษฐ์ (REAI)';
  elsif code = 'ENVI' or normalized like '%environmental engineering%' or normalized like '%วิศวกรรมสิ่งแวดล้อม%' then
    return 'วิศวกรรมสิ่งแวดล้อม (ENVI)';
  elsif code = 'CPE' or normalized like '%computer engineering%' or normalized like '%วิศวกรรมคอมพิวเตอร์%' then
    return 'วิศวกรรมคอมพิวเตอร์ (CPE)';
  elsif code = 'MNP' or normalized like '%mining and petroleum engineering%' or normalized like '%วิศวกรรมเหมืองแร่และปิโตรเลียม%' then
    return 'วิศวกรรมเหมืองแร่และปิโตรเลียม (MNP)';
  elsif code = 'SCE' or normalized like '%semiconductor engineering%' or normalized like '%วิศวกรรมเซมิคอนดักเตอร์%' then
    return 'วิศวกรรมเซมิคอนดักเตอร์ (SCE)';
  elsif code = 'CE' or normalized = 'ce' or normalized like '%civil engineering%' or normalized like '%วิศวกรรมโยธา%' then
    return 'วิศวกรรมโยธา (CE)';
  elsif code = 'EE' or normalized = 'ee' or normalized like '%electrical engineering%' or normalized like '%วิศวกรรมไฟฟ้า%' then
    return 'วิศวกรรมไฟฟ้า (EE)';
  elsif code = 'IE' or normalized = 'ie' or normalized like '%industrial engineering%' or normalized like '%วิศวกรรมอุตสาหการ%' then
    return 'วิศวกรรมอุตสาหการ (IE)';
  elsif code = 'IGE' or normalized = 'ige' or normalized like '%integrated engineering%' or normalized like '%วิศวกรรมบูรณาการ%' then
    return 'วิศวกรรมบูรณาการ (IGE)';
  elsif code = 'ME' or normalized = 'me' or normalized like '%mechanical engineering%' or normalized like '%วิศวกรรมเครื่องกล%' then
    return 'วิศวกรรมเครื่องกล (ME)';
  end if;

  return raw;
end;
$$;

update public.staff_assignments
set primary_role = public.normalize_staff_operational_role(primary_role),
    secondary_roles = coalesce(array(
      select distinct public.normalize_staff_operational_role(role_name)
      from unnest(coalesce(secondary_roles, '{}'::text[])) role_name
      where public.normalize_staff_operational_role(role_name) is not null
    ), '{}'::text[])
where true;

update public.staff_profiles
set major = public.normalize_major(major)
where major is not null;

delete from public.staff_role_quotas
where role_name in ('วางแผน (ทีมบอ)', 'สตาฟให้ความบันเทิง', 'พิธีกร');

insert into public.staff_role_quotas (role_name, target_count, warning_threshold, critical_threshold)
values ('ทีมบริหาร', 7, 1, 2)
on conflict (role_name) do update
set target_count = excluded.target_count,
    warning_threshold = excluded.warning_threshold,
    critical_threshold = excluded.critical_threshold,
    updated_at = now();

grant execute on function public.normalize_staff_operational_role(text) to authenticated;
grant execute on function public.normalize_major(text) to anon, authenticated;
