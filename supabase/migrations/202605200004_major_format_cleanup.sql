create or replace function public.normalize_major(input_major text)
returns text
language plpgsql
immutable
as $$
declare
  raw text := nullif(btrim(coalesce(input_major, '')), '');
  normalized text;
  code text;
begin
  if raw is null then
    return null;
  end if;

  normalized := lower(regexp_replace(replace(raw, 'ภาควิชา', ''), '\s+', ' ', 'g'));
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
  elsif code = 'IEL' or normalized like '%industrial engineering and logistics management%' or normalized like '%วิศวกรรมอุตสาหการและการจัดการ โลจิสติกส์%' or normalized like '%logistics management%' then
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

update public.profiles
set major = public.normalize_major(major)
where major is not null;

do $$
begin
  if to_regclass('public.staff_profiles') is not null then
    update public.staff_profiles
    set major = public.normalize_major(major)
    where major is not null;
  end if;
end $$;

grant execute on function public.normalize_major(text) to anon, authenticated;
