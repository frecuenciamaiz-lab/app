# Prompt maestro

Copie y pegue **todo lo que está debajo de la línea** al empezar a trabajar con Claude
(o cualquier asistente) en una cuenta nueva. Sirve como instrucciones del proyecto.

> Si usa un **Proyecto de Claude**, pegue esto en "Instrucciones del proyecto" una sola vez
> y ya no hay que repetirlo en cada conversación.

---

# Proyecto Maíz · instrucciones

## Quién soy y cómo trabajamos

Soy **Karla Peña**, licenciada en Ciencias Químicas con especialidad en Química Ambiental.
Trabajo en el occidente de El Salvador, en la zona de la Reserva de Biosfera Apaneca-Ilamatepec.

Dirijo **Proyecto Maíz**, que reúne tres unidades y una app de naturaleza:

- **Estudio Maíz** — agencia de publicidad que produce contenido audiovisual para redes
  (reels, videos y fotos) para negocios locales: restaurantes, hoteles, hostales, fincas y tiendas.
  El enfoque es **economía circular y sostenibilidad**: mostrar cómo cada negocio reduce,
  reutiliza, recicla, aprovecha residuos y compra local.
- **Frecuencia Maíz** — radio en línea con biblioteca propia.
- **Ruta Maíz** — mapa de negocios locales, rutas temáticas y Pasaporte Maíz con sellos.
- **Bitácora** — Pokédex de 1,191 especies verificadas de la reserva, con GPS, voz, 3D y juego.

**No sé programar.** Yo soy la orquestadora: doy las ideas y usted las implementa de principio a fin.
Por eso:

- Explíqueme los pasos de forma **sencilla y numerada** cuando yo tenga que hacer algo.
- Haga usted todo lo técnico con las herramientas conectadas (**Vercel**, **Supabase**, **GitHub**).
- Cuando termine algo, entrégueme el **enlace funcionando** y verifíquelo antes en el navegador,
  en tamaño computadora y celular.
- Escríbame **en español**. Los textos para clientes van en registro formal (**"usted"**).
- Si algo requiere una decisión mía o una cuenta nueva, pregúnteme antes.

## El repositorio

Todo el proyecto está en **https://github.com/frecuenciamaiz-lab/app**

Antes de proponer cambios, lea en el repositorio:

- `README.md` — cómo está hecho y cómo ponerlo a andar
- `docs/CONTEXTO-PROYECTO.md` — **el documento principal**: todo lo construido, cómo funciona
  cada parte, la base de datos y la lista de pendientes
- `docs/MIGRACION-SUPABASE.md` — cómo mover la base de datos entre cuentas
- `supabase/migraciones/` — el SQL que recrea la base de datos completa
- `datos/bitacora-especies.json` — las 1,191 especies

## Cómo está hecho

Sitio **estático**, sin compilación: HTML + CSS + JavaScript puro.
No hay `npm install` ni build. Los archivos se suben tal cual.

- **Vercel** aloja el sitio. Proyecto `estudio-frecuencia-maiz`, dominio fijo `estudio-maiz.vercel.app`.
  Para actualizar se despliega **a producción en el mismo proyecto**, así el enlace nunca cambia.
- **Supabase** guarda la base de datos, las funciones y los archivos.
  El público solo puede **insertar** briefs, solicitudes y visitas; nunca leer datos de clientes.
  Todo lo del panel pasa por funciones `admin_*` que exigen la clave.
- **Mapas gratuitos** por defecto: OpenStreetMap/CARTO, satélite de Esri, relieve de OpenTopoMap,
  3D con MapLibre + relieve real, rutas por calles con OSRM. Google Maps es opcional y se
  activa en Panel → Sitio → Mapa (necesita facturación en Google Cloud).
- **iNaturalist** da fotos y datos de especies; **Sketchfab**, los modelos 3D.

## Identidad visual

Estilo **Apple / iOS**: vidrio translúcido (blur), fondo con luces suaves en movimiento,
tarjetas redondeadas, botones tipo cápsula y animaciones con efecto resorte.
Elegante, formal y minimalista.

| Nombre | Código |
|---|---|
| Café | `#3B2418` |
| Café medio | `#6E4A33` |
| Beige | `#E6D6BD` |
| Hueso | `#F5F0E8` |
| Amarillo pollo | `#F4C230` |
| Amarillo claro | `#FBE3A0` |
| Dorado | `#D9A514` |

Tipografía del sistema Apple (San Francisco), con Inter como respaldo.
La **mazorca** es el elemento gráfico de la marca.

## Reglas para cualquier cambio

1. Mantenga siempre el mismo enlace: despliegue a producción en el proyecto de Vercel existente.
2. Mantenga la identidad visual (colores, estilo iOS, mazorca) en todo lo nuevo.
3. Nunca exponga la lectura de la base de datos al público. Los datos de clientes solo se ven
   en el panel con clave.
4. Pruebe en computadora y en celular antes de entregarme el enlace.
5. Si algo requiere una decisión mía o una cuenta nueva, pregúnteme antes.
6. Cuando termine una ronda de cambios, suba el código al repositorio y actualice
   `docs/CONTEXTO-PROYECTO.md` con lo hecho y lo que quedó pendiente.

## Qué sigue

La lista de pendientes está en `docs/CONTEXTO-PROYECTO.md`, sección 7.
Lo más urgente: terminar de importar las especies (la base tiene 409 de 1,191),
unir Briefs y Solicitudes en el panel, y el calendario editable.
