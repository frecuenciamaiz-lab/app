# Cómo pasar la base de datos a otra cuenta de Supabase

Hay dos caminos. El **A** es el más fácil y conserva todos los datos.

---

## Camino A · Transferir el proyecto completo (recomendado)

Supabase permite mover un proyecto de una organización a otra sin recrear nada:
se mantienen tablas, datos, funciones, archivos subidos y la URL del proyecto.

1. En la **cuenta nueva**, cree una organización (o use la que ya tiene).
2. Invite a su cuenta actual (`yeytzikarly@gmail.com`) como **Owner** de esa organización nueva:
   Supabase → la organización nueva → *Team* → *Invite member* → rol **Owner**. Acepte la invitación desde el correo.
3. Vuelva a la **cuenta actual**, abra el proyecto `frecuencia-maiz`
   → *Project Settings* → *General* → **Transfer project**.
4. Elija la organización nueva y confirme.
5. Cuando termine, en la cuenta nueva entre al proyecto → *Project Settings* → *API* y copie:
   - **Project URL**
   - **Publishable key** (empieza con `sb_publishable_`)
6. Si la URL del proyecto cambió, actualice esos dos valores en `assets/core.js`.

**Requisito:** ambas organizaciones deben estar en el mismo plan (el gratuito sirve).
Si Supabase no deja transferir, use el camino B.

---

## Camino B · Recrear el proyecto desde cero

### 1. Crear el proyecto

En la cuenta nueva: *New project* → nombre `frecuencia-maiz` → región **East US (North Virginia)** →
guarde la contraseña de la base de datos en un lugar seguro.

### 2. Ejecutar las migraciones

**La forma rápida:** abra *SQL Editor* y ejecute de una sola vez el archivo
**`supabase/TODO-EN-UNO.sql`**. Ya trae las 9 migraciones en orden, la clave real del panel
y la configuración del sitio. Las claves y el detalle están en `docs/PROMPT-SUPABASE-DESDE-CERO.md`.

Si prefiere ir paso a paso, ejecute **uno por uno y en orden** los archivos de `supabase/migraciones/`:

```
01_20261027031055_brief_audiovisual.sql
02_20261027031228_panel_admin_fichas.sql
03_20261027180111_solicitudes.sql
04_20261102152711_v3_plataforma_completa.sql
05_20261102164151_admin_stats.sql
06_20261102184330_v4_radio_avisos_negocios_pokedex.sql
07_20261102190341_pin_bloqueo_negocio.sql
08_20261102212924_v5_pokedex_juego.sql
09_20261102213007_importar_especies.sql
```

**Antes de ejecutar, cambie estas tres cosas** (en `TODO-EN-UNO.sql` ya están todas juntas):

| Qué buscar | Por qué cambiarlo |
|---|---|
| `CAMBIE-ESTA-CLAVE` (solo en `migraciones/01` y `02`) | la clave del panel; en `TODO-EN-UNO.sql` ya está puesta la real |
| `estudio-maiz.vercel.app` | el dominio nuevo, en los avisos de WhatsApp |
| `pgwhbrkvwzticuewxwen` | el id del proyecto nuevo (se ve en la URL de Supabase) |

### 3. Crear el almacenamiento

*Storage* → *New bucket* → nombre **`media`** → marque **Public bucket**.

### 4. Subir la Edge Function

*Edge Functions* → *Deploy a new function* → nombre **`admin-upload`** →
pegue el contenido de `supabase/edge-functions/admin-upload/index.ts` →
en los ajustes de la función **desactive "Verify JWT"**.

### 5. Activar la extensión de red

*Database* → *Extensions* → busque **`pg_net`** y actívela (sirve para los avisos por WhatsApp).

### 6. Poner las claves nuevas en el sitio

*Project Settings* → *API*. Copie la **Project URL** y la **Publishable key**,
y cámbielas en `assets/core.js` (busque `SB_URL` y `sb_publishable_`).

### 7. Cargar los datos

| Qué | Cómo |
|---|---|
| Especies (1,191) | Panel → Bitácora → *Importar especies* con `datos/bitacora-especies.json`, luego *Buscar fotos* |
| Configuración del sitio | Panel → Sitio: marca, colores, equipo, redes, precios |
| Negocios de Ruta Maíz | Panel → Ruta Maíz → agregarlos a mano |
| Fichas y solicitudes viejas | Ver abajo |

### 8. (Opcional) Pasar los datos viejos

En el proyecto **viejo**, *SQL Editor*, ejecute esto y descargue el resultado como CSV:

```sql
select * from public.briefs;
select * from public.solicitudes;
select * from public.ruta_locales;
select * from public.portafolio;
```

En el proyecto **nuevo**, *Table Editor* → la tabla → *Insert* → *Import data from CSV*.
Las fotos y audios viejos siguen funcionando porque apuntan al almacenamiento del proyecto anterior;
si va a cerrar ese proyecto, descárguelas de *Storage* → `media` y vuélvalas a subir.

---

## Qué NO se puede copiar

- Las **claves** del panel y los **PIN** de los negocios están guardados cifrados y no se pueden leer.
  Hay que volver a asignarlos: la clave del panel en la migración `02`, y los PIN desde
  Panel → Negocios → *Asignar PIN*.
- La **apikey de CallMeBot** hay que volver a pegarla en Panel → Avisos.

---

## Después de migrar, revise que funcione

1. `/brief` → enviar una ficha de prueba y verla aparecer en `/panel`.
2. `/panel` → entrar con la clave nueva.
3. `/ruta-maiz` → que carguen el mapa y los locales.
4. `/bitacora` → que aparezcan las especies y que se pueda capturar una (`/bitacora?prueba=1`).
5. Subir una foto desde el panel (prueba la Edge Function y el bucket).
