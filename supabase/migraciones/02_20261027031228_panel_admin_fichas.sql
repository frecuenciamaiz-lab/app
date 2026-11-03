-- ============================================================
-- 02 · panel_admin_fichas
-- Claves de administración con hash (private.admin_keys) y funciones del panel.
-- IMPORTANTE: cambie 'CAMBIE-ESTA-CLAVE' por la clave real antes de ejecutar.
-- ============================================================
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admin_keys (
  id serial primary key,
  label text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);

insert into private.admin_keys (label, key_hash)
values ('Karla', extensions.crypt('CAMBIE-ESTA-CLAVE', extensions.gen_salt('bf')));

create or replace function private.is_admin(p_key text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_keys k
    where k.key_hash = extensions.crypt(p_key, k.key_hash)
  );
$$;

create or replace function public.admin_list_briefs(p_key text)
returns setof public.briefs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_key is null or not private.is_admin(p_key) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  return query select * from public.briefs order by created_at desc;
end;
$$;

create or replace function public.admin_set_estado(p_key text, p_id uuid, p_estado text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_key is null or not private.is_admin(p_key) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  if p_estado not in ('nuevo','revisado','agendado','grabado') then
    raise exception 'estado no válido';
  end if;
  update public.briefs set estado = p_estado where id = p_id;
end;
$$;

revoke all on function public.admin_list_briefs(text) from public;
revoke all on function public.admin_set_estado(text, uuid, text) from public;
grant execute on function public.admin_list_briefs(text) to anon, authenticated;
grant execute on function public.admin_set_estado(text, uuid, text) to anon, authenticated;
revoke all on function private.is_admin(text) from public, anon, authenticated;

-- límites básicos de tamaño para evitar abuso del formulario público
alter table public.briefs
  add constraint briefs_largos check (
    length(nombre) <= 200 and length(responsable) <= 200 and length(whatsapp) <= 40
    and length(coalesce(historia,'')) <= 4000 and length(coalesce(ejemplo_ec,'')) <= 4000
    and length(rubro::text) <= 6000
  );
