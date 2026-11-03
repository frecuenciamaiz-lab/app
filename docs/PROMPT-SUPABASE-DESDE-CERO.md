# Prompt maestro · recrear Supabase desde cero

Copie y pegue **todo lo que está debajo de la línea** en una conversación nueva
(de la cuenta a la que va a migrar) para que se recree la base de datos exactamente igual.

> ⚠️ Este documento contiene **claves**. Compártalo solo con personas de confianza.

---

# Recrear la base de datos de Proyecto Maíz en Supabase

Necesito que crees desde cero la base de datos de **Proyecto Maíz** en una cuenta nueva de
Supabase, exactamente igual a como está, y que luego conectes el sitio.

## Lo que hay que crear

**1. Proyecto de Supabase**
- Nombre: `frecuencia-maiz`
- Región: **East US (North Virginia)** — `us-east-1`
- Guarda la contraseña de la base de datos en un lugar seguro.

**2. Toda la estructura SQL**

Ejecuta de una sola vez, en el *SQL Editor*, el archivo
`supabase/TODO-EN-UNO.sql` del repositorio **https://github.com/frecuenciamaiz-lab/app**

Ese archivo crea 17 tablas y 48 funciones:

| Esquema | Qué contiene |
|---|---|
| `public` | `briefs`, `solicitudes`, `site_config`, `visitas`, `ruta_locales`, `ruta_rutas`, `portafolio`, `radio_tracks`, `especies`, `avistamientos`, `jugadores` |
| `private` | `admin_keys`, `local_pins`, `pin_intentos`, `avisos`, `uso_mapas` |

Y deja la configuración del sitio (marca, colores, equipo, mapa) ya cargada.

**Antes de ejecutarlo, dentro del archivo cambia:**
- `pgwhbrkvwzticuewxwen` → el id del proyecto nuevo (se ve en la URL de Supabase)
- `estudio-maiz.vercel.app` → el dominio nuevo, si cambia

**3. Almacenamiento**
*Storage* → *New bucket* → nombre **`media`** → marcar **Public bucket**.

**4. Edge Function**
*Edge Functions* → *Deploy a new function* → nombre **`admin-upload`**.
El código está en `supabase/edge-functions/admin-upload/index.ts` del repositorio.
En los ajustes de la función, **desactiva "Verify JWT"**.

**5. Extensión**
*Database* → *Extensions* → activa **`pg_net`** (sirve para los avisos por WhatsApp).

**6. Conectar el sitio**
En *Project Settings* → *API* copia la **Project URL** y la **Publishable key**,
y cámbialas en `assets/core.js` (busca `SB_URL` y `sb_publishable_`).

**7. Cargar las especies**
Entra a `/panel` con la clave, sección **Bitácora** → *Importar especies* →
sube `datos/bitacora-especies.json` (1,191 especies). Luego *Buscar fotos*.

---

## Claves y datos del proyecto

### Clave del panel de administración
```
maiz-4su7-90o5
```
Es la que pide `/panel`. Ya viene dentro del archivo SQL (se guarda cifrada con bcrypt
en `private.admin_keys`). Si quieres cambiarla, busca ese texto en el SQL **antes** de ejecutarlo.
Para cambiarla después:
```sql
update private.admin_keys
set key_hash = extensions.crypt('LA-CLAVE-NUEVA', extensions.gen_salt('bf'))
where label = 'Karla';
```

### Clave publicable de Supabase (proyecto actual)
```
sb_publishable_QktwCj57rCNRgGEep66_ZA_PcYHqlP6
```
URL del proyecto actual: `https://pgwhbrkvwzticuewxwen.supabase.co`

Esta clave es **pública a propósito**: va dentro del código del sitio y cualquiera puede verla.
No da acceso a los datos de clientes porque las reglas de seguridad (RLS) solo permiten
**insertar** briefs, solicitudes y visitas, nunca leer. El proyecto nuevo tendrá su propia
URL y su propia clave publicable: hay que ponerlas en `assets/core.js`.

### Clave de Google Maps
```
AIzaSyBxpNShM0jqFa20y-4RN9Obk5xdulYh7W0
```
Está guardada en `site_config` y se edita en Panel → Sitio → Mapa.
Hoy el sitio usa mapas **gratuitos** (`proveedor: "osm"`), así que esta clave no se usa.
Para activar Google Maps hay que habilitar la facturación en Google Cloud,
activar *Maps JavaScript API* y *Map Tiles API*, y cambiar el proveedor a `google` en el panel.

### Lo que NO se puede copiar y hay que volver a poner
| Qué | Dónde se pone |
|---|---|
| **PIN de cada negocio** | Panel → Negocios → *Asignar PIN y copiar enlace*. Hoy no hay ninguno asignado. |
| **Apikey de CallMeBot** | Panel → Avisos. Hoy los avisos están **desactivados**. |
| **Service role key** | No hace falta: Supabase se la inyecta sola a la Edge Function. |

### Datos que hay en el proyecto actual
| Tabla | Registros |
|---|---|
| `especies` | 409 (de 1,191 — la importación quedó a medias) |
| `briefs` | 7 |
| `solicitudes` | 2 |
| `ruta_locales` | 6 |
| `portafolio` | 1 |
| `radio_tracks` | 0 |

El SQL crea las tablas **vacías**. Si quieres traer estos registros, en el proyecto viejo
ve a *Table Editor* → la tabla → exportar a CSV, y en el nuevo → *Insert* → *Import data from CSV*.
Las especies no hace falta exportarlas: se cargan completas desde el JSON del repositorio.

---

## Reglas de seguridad que hay que respetar

1. El público **solo puede insertar** en `briefs`, `solicitudes` y `visitas`. Nunca leer.
2. Todo lo del panel pasa por funciones `admin_*` que exigen la clave; la clave se guarda
   **cifrada con bcrypt**, nunca en texto plano.
3. Los negocios entran con su `id` + PIN. Tras 5 intentos fallidos quedan bloqueados 15 minutos.
4. Los puntos del juego se calculan **en el servidor** (`juego_guardar`), no en el celular.
5. Hay límites de tamaño en todos los textos para evitar abuso del formulario público.
6. La tabla `jugadores` tiene RLS activado **sin políticas**: solo se toca por funciones.

## Cómo comprobar que quedó bien

En el *SQL Editor*:
```sql
select public.admin_check('maiz-4su7-90o5');   -- debe dar true
select count(*) from public.especies;          -- 0 antes de importar
```

En el sitio:
1. `/brief` → enviar una ficha de prueba y verla aparecer en `/panel`.
2. `/panel` → entrar con la clave.
3. `/ruta-maiz` → que carguen el mapa y los locales.
4. `/bitacora` → que aparezcan las especies (`/bitacora?prueba=1` para probar el juego).
5. Subir una foto desde el panel → prueba la Edge Function y el bucket `media`.
