-- ============================================================
-- 07 · v4_pin_bloqueo + v4_negocio_update_bloqueo
-- Bloqueo tras 5 intentos fallidos de PIN y versiones finales de negocio_get / negocio_update.
-- OJO: en negocio_update hay una validación con la URL del proyecto de Supabase.
--      Cambie pgwhbrkvwzticuewxwen por el id del NUEVO proyecto.
-- ============================================================
create table if not exists private.pin_intentos(local_id uuid primary key, fallos int not null default 0, hasta timestamptz);

create or replace function private.pin_ok(p_id uuid, p_pin text) returns boolean
language plpgsql security definer set search_path to '' as $$
declare i private.pin_intentos; ok boolean;
begin
  select * into i from private.pin_intentos where local_id = p_id;
  if i.hasta is not null and i.hasta > now() then return null; end if;
  ok := exists (select 1 from private.local_pins where local_id = p_id and pin_hash = extensions.crypt(coalesce(p_pin,''), pin_hash));
  if ok then delete from private.pin_intentos where local_id = p_id; return true; end if;
  insert into private.pin_intentos(local_id, fallos) values (p_id, 1)
    on conflict (local_id) do update set fallos = case when private.pin_intentos.hasta is not null and private.pin_intentos.hasta <= now() then 1 else private.pin_intentos.fallos + 1 end,
      hasta = case when (case when private.pin_intentos.hasta is not null and private.pin_intentos.hasta <= now() then 1 else private.pin_intentos.fallos + 1 end) >= 5 then now() + interval '15 minutes' else null end;
  return false;
end $$;

create or replace function private.check_pin(p_id uuid, p_pin text) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if exists (select 1 from private.pin_intentos where local_id = p_id and hasta > now()) then raise exception 'Demasiados intentos. Espere 15 minutos.' using errcode = '28000'; end if;
  if not exists (select 1 from private.local_pins where local_id = p_id and pin_hash = extensions.crypt(coalesce(p_pin,''), pin_hash)) then
    raise exception 'PIN incorrecto' using errcode = '28000'; end if;
end $$;

drop function if exists public.negocio_get(uuid, text);
create function public.negocio_get(p_id uuid, p_pin text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare ok boolean; r jsonb;
begin
  ok := private.pin_ok(p_id, p_pin);
  if ok is null then return jsonb_build_object('error', 'bloqueado'); end if;
  if not ok then return jsonb_build_object('error', 'pin'); end if;
  select to_jsonb(t) - 'plan' into r from public.ruta_locales t where id = p_id;
  return jsonb_build_object('local', r);
end $$;
grant execute on function public.negocio_get(uuid, text) to anon, authenticated;

create or replace function private.ad_set_pin_reset() returns trigger language plpgsql security definer set search_path to '' as $$
begin delete from private.pin_intentos where local_id = new.local_id; return new; end $$;
drop trigger if exists pin_reset on private.local_pins;
create trigger pin_reset after insert or update on private.local_pins for each row execute function private.ad_set_pin_reset();

drop function if exists public.negocio_update(uuid, text, jsonb);
create function public.negocio_update(p_id uuid, p_pin text, p_row jsonb) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare pend jsonb := '{}'::jsonb; ok boolean;
begin
  ok := private.pin_ok(p_id, p_pin);
  if ok is null then return jsonb_build_object('error','bloqueado'); end if;
  if not ok then return jsonb_build_object('error','pin'); end if;
  update public.ruta_locales t set
    consumo = left(coalesce(p_row->>'consumo', t.consumo), 80),
    horario = left(coalesce(p_row->>'horario', t.horario), 200),
    menu_url = left(coalesce(p_row->>'menu_url', t.menu_url), 600),
    menu = case when p_row ? 'menu' and pg_column_size(p_row->'menu') < 20000 then p_row->'menu' else t.menu end,
    wifi_ssid = left(coalesce(p_row->>'wifi_ssid', t.wifi_ssid), 64),
    wifi_pass = left(coalesce(p_row->>'wifi_pass', t.wifi_pass), 64),
    whatsapp = left(coalesce(p_row->>'whatsapp', t.whatsapp), 30),
    actualizado = now()
  where t.id = p_id;
  if p_row ? 'promo' then pend := pend || jsonb_build_object('promo', left(p_row->>'promo', 300)); end if;
  if p_row ? 'foto_url' and (p_row->>'foto_url') like 'https://pgwhbrkvwzticuewxwen.supabase.co/storage/v1/object/public/media/negocios/%' then pend := pend || jsonb_build_object('foto_url', left(p_row->>'foto_url', 600)); end if;
  if p_row ? 'descripcion' then pend := pend || jsonb_build_object('descripcion', left(p_row->>'descripcion', 1500)); end if;
  if pend <> '{}'::jsonb then update public.ruta_locales set pendiente = coalesce(pendiente,'{}'::jsonb) || pend || jsonb_build_object('fecha', now()) where id = p_id; end if;
  return jsonb_build_object('ok', true, 'pendiente', pend <> '{}'::jsonb);
end $$;
grant execute on function public.negocio_update(uuid, text, jsonb) to anon, authenticated;
