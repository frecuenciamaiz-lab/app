# Proyecto Maíz · plataforma web

Plataforma de **Proyecto Maíz** (occidente de El Salvador, Reserva de Biosfera Apaneca-Ilamatepec).
Reúne tres unidades y una app de naturaleza:

| Unidad | Página | Qué hace |
|---|---|---|
| **Estudio Maíz** | `/estudio-maiz` | Agencia de contenido audiovisual: portafolio, cotizador, brief de clientes |
| **Frecuencia Maíz** | `/radio-frecuencia-maiz` | Radio en línea con biblioteca propia |
| **Ruta Maíz** | `/ruta-maiz` | Mapa de negocios locales, rutas, Pasaporte Maíz con sellos |
| **Bitácora** | `/bitacora` | Pokédex de 1,191 especies de la reserva, con GPS, voz, 3D y juego de captura |
| **Panel privado** | `/panel` | Administración de todo (requiere clave) |

Sitio en producción: **https://estudio-maiz.vercel.app**

---

## Cómo está hecho

Sitio **estático**, sin compilación: HTML + CSS + JavaScript puro.
No hay `npm install`, no hay build. Los archivos se suben tal cual.

```
/                       páginas HTML
/assets                 CSS y JavaScript
/supabase/TODO-EN-UNO.sql   toda la base de datos en un solo archivo
/supabase/migraciones   las mismas migraciones por separado (01 → 09)
/supabase/edge-functions/admin-upload   función para subir archivos
/datos                  bitacora-especies.json (1,191 especies verificadas)
/docs                   contexto, guía de migración y prompt maestro
vercel.json             rutas limpias y cabeceras
```

### Servicios externos

| Servicio | Para qué | Gratis |
|---|---|---|
| **Vercel** | Alojar el sitio | Sí |
| **Supabase** | Base de datos, funciones y almacenamiento | Sí (plan gratuito) |
| **OpenStreetMap / CARTO / Esri** | Mapas base y satélite | Sí |
| **AWS Terrain Tiles** | Relieve del 3D gratuito (MapLibre) | Sí |
| **OSRM** | Recorridos por calles reales (tipo Waze) | Sí |
| **iNaturalist** | Fotos y datos de especies | Sí |
| **Sketchfab** | Modelos 3D de animales | Sí |
| **Google Maps** | Mapa y 3D fotorrealista | Opcional, requiere facturación |
| **CallMeBot** | Avisos por WhatsApp | Sí |

---

## Poner el proyecto a andar en otra cuenta

1. **Supabase** → siga `docs/MIGRACION-SUPABASE.md`.
2. **Vercel** → importe este repositorio. Sin framework, sin build command, output = raíz.
3. **Claves** → en `assets/core.js` cambie `SB_URL` y la clave publicable por las del nuevo proyecto.
4. **Panel** → entre a `/panel`, sección **Sitio**, y revise marca, colores y mapa.
5. **Bitácora** → Panel → Bitácora → *Importar especies* con `datos/bitacora-especies.json`, y luego *Buscar fotos*.

Para trabajar con Claude en el proyecto, pegue el contenido de `docs/PROMPT-MAESTRO.md`.
Para recrear solo la base de datos, use `docs/PROMPT-SUPABASE-DESDE-CERO.md` (contiene las claves).

---

## Identidad visual

| Color | Código |
|---|---|
| Café | `#3B2418` |
| Café medio | `#6E4A33` |
| Beige | `#E6D6BD` |
| Hueso | `#F5F0E8` |
| Amarillo pollo | `#F4C230` |
| Amarillo claro | `#FBE3A0` |
| Dorado | `#D9A514` |

Estilo Apple/iOS: vidrio translúcido, tarjetas redondeadas, botones cápsula, animaciones con resorte.
Tipografía del sistema Apple (San Francisco), Inter como respaldo. La mazorca es el símbolo de la marca.
