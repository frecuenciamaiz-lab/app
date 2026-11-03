-- ============================================================
-- 03 · solicitudes_proyecto_maiz
-- Solicitudes de servicios de las tres unidades (estudio, radio, ruta).
-- ============================================================
create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unidad text not null check (unidad in ('estudio','radio','ruta')),
  tipo text not null check (char_length(tipo) between 1 and 60),
  paquete text check (char_length(paquete) <= 120),
  nombre text not null check (char_length(nombre) between 1 and 150),
  contacto text check (char_length(contacto) <= 150),
  whatsapp text check (char_length(whatsapp) <= 30),
  correo text check (char_length(correo) <= 150),
  datos jsonb not null default '{}'::jsonb check (pg_column_size(datos) <= 20000),
  estado text not null default 'recibido' check (estado in ('recibido','en_revision','cotizacion_enviada','aceptado','finalizado','descartado'))
);
alter table public.solicitudes enable row level security;
create policy "cualquiera puede enviar una solicitud" on public.solicitudes
  for insert to anon, authenticated with check (estado = 'recibido');
grant insert on public.solicitudes to anon, authenticated;

create or replace function public.admin_list_solicitudes(p_key text)
returns setof public.solicitudes language plpgsql security definer set search_path to '' as $$
begin
  if p_key is null or not private.is_admin(p_key) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  return query select * from public.solicitudes order by created_at desc;
end; $$;

create or replace function public.admin_set_estado_solicitud(p_key text, p_id uuid, p_estado text)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if p_key is null or not private.is_admin(p_key) then
    raise exception 'clave incorrecta' using errcode = '28000';
  end if;
  if p_estado not in ('recibido','en_revision','cotizacion_enviada','aceptado','finalizado','descartado') then
    raise exception 'estado no válido';
  end if;
  update public.solicitudes set estado = p_estado where id = p_id;
end; $$;
revoke all on function public.admin_list_solicitudes(text) from public;
revoke all on function public.admin_set_estado_solicitud(text,uuid,text) from public;
grant execute on function public.admin_list_solicitudes(text) to anon, authenticated;
grant execute on function public.admin_set_estado_solicitud(text,uuid,text) to anon, authenticated;
