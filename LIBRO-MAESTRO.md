# 📒 Libro maestro · Proyecto Maíz

**Este archivo es el punto de encuentro del equipo.** Aquí trabajan Karla, Claude y ChatGPT
sobre el mismo repositorio. Antes de tocar nada, se lee. Al terminar, se actualiza.

> Si usted es un asistente (Claude, ChatGPT u otro) y acaba de llegar a este repositorio:
> lea **este archivo primero**, luego `docs/PROMPT-MAESTRO.md` y `docs/PROMPT-COMPORTAMIENTO.md`.

---

## 1. Estado actual

| | |
|---|---|
| **Sitio en producción** | https://estudio-maiz.vercel.app |
| **Repositorio** | https://github.com/frecuenciamaiz-lab/app |
| **Rama de trabajo** | `main` |
| **Última ronda** | Ronda 7 — fotos a color, holograma hiperrealista, medallas de ruta, libros con volumen, maíz minimalista |
| **Actualizado** | 2 de noviembre de 2026 |

### Lo que está funcionando
Estudio Maíz (brief, cotizador, portafolio), Frecuencia Maíz (radio), Ruta Maíz (mapa, rutas por
calles reales, Pasaporte con 3 libros), Bitácora (Pokédex con GPS, voz, 3D y juego), panel privado.

### Lo que está a medias
- **Especies: 409 de 1,191 importadas.** Falta subir `datos/bitacora-especies.json` desde
  Panel → Bitácora → *Importar especies*.
- **Fotos de especies:** las que no están guardadas se buscan en vivo en iNaturalist. Conviene
  correr *Buscar fotos* en el panel para dejarlas guardadas.
- **Google Maps apagado.** El proyecto de Google Cloud es `813869802112`. Faltan activar
  facturación, *Maps JavaScript API* y *Map Tiles API*. Mientras tanto el sitio usa mapas
  gratuitos y funciona bien.

---

## 2. Reglas para no pisarse

Trabajan varias personas y varios asistentes sobre el mismo repositorio. Para evitar choques:

**Antes de empezar**
1. `git pull` siempre. Nunca trabajar sobre una copia vieja.
2. Leer la sección **3. Turnos** de este archivo. Si alguien tiene tomada un área, no la toques.
3. Anotar tu turno en esa sección (quién, qué área, desde cuándo).

**Mientras trabajas**
4. Cambia solo los archivos de tu área. Si necesitas tocar un archivo de otra área, anótalo.
5. Commits pequeños y con mensaje claro en español, explicando el **qué** y el **porqué**.
6. No reformatees ni reorganices archivos que no son de tu cambio.

**Al terminar**
7. Prueba en computadora y en celular.
8. Despliega a producción en Vercel **y** sube a GitHub. Las dos nubes, siempre.
9. Actualiza en este archivo: el estado, los pendientes y la bitácora de la sección 4.
10. Libera tu turno.

**Nunca, sin permiso de Karla**
- cambiar el dominio o crear otro proyecto en Vercel;
- cambiar la clave del panel, los colores de la marca, los precios o los textos al cliente;
- borrar datos o columnas de la base;
- relajar las reglas de seguridad (el público nunca lee datos de clientes);
- agregar servicios de paga.

---

## 3. Turnos

Quien va a trabajar escribe aquí su área antes de empezar, y la borra al terminar.

| Quién | Área / archivos | Desde | Estado |
|---|---|---|---|
| _(libre)_ | | | |

**Áreas del proyecto** (para repartirse sin chocar):

| Área | Archivos |
|---|---|
| Bitácora / Pokédex | `assets/pokedex.js`, `assets/pokedex.css`, `bitacora.html` |
| Ruta Maíz y mapas | `assets/ruta.js`, `assets/ruta.css`, `assets/gmap.js`, `assets/mapa3d.js`, `ruta-maiz.html` |
| Pasaporte y medallas | `assets/pasaporte.js` |
| Panel | `assets/panel.js`, `assets/panel-ext.js`, `assets/panel.css`, `assets/plan.js` |
| Brief | `assets/brief.js`, `assets/brief.css`, `brief.html` |
| Radio | `assets/radio.js`, `radio-frecuencia-maiz.html` |
| Páginas públicas | `index.html`, `estudio-maiz.html`, `assets/pub.js`, `assets/site.css` |
| Base de datos | `supabase/` |
| Núcleo y estilos | `assets/core.js`, `assets/app.css`, `assets/v*.css` ⚠️ los usan todos |

> ⚠️ `core.js` y las hojas `v*.css` afectan a todo el sitio. Avisar antes de tocarlas.

---

## 4. Bitácora de cambios

Lo más nuevo arriba. Una línea por ronda: qué se hizo, quién y qué quedó pendiente.

### Ronda 7 — 2 nov 2026 · Claude
- Fichas de especie: se quitó el filtro azul; la foto se ve a **color real** dentro de un visor
  tipo Pokédex con marco dorado.
- Miniaturas: ahora mandan la **foto del animal**, con franja de color por grupo y número;
  si iNaturalist no tiene foto de la especie exacta, se usa una del mismo género y se avisa.
- Dos vistas en el listado: **Fotos** y **Lista**.
- Holograma 3D: a **color natural**, más definido, con luz de borde y piso luminoso;
  botón para alternar entre *Proyección* y *Normal*.
- **Medallas de ruta**: una medalla por cada ruta de Ruta Maíz que se complete, con cinta y
  marca de "nueva". Más formas y metales para que no se repitan.
- Libros del Pasaporte: **volumen real** (canto de hojas, lomo, cierre metálico, curva al pasar página).
- Mascota del maíz: granos **minimalistas**, sin contornos duros.
- Nombre corregido a **Reserva de Biosfera Apaneca-Ilamatepec**.
- Diagnóstico de Google Maps: proyecto `813869802112`, APIs sin activar (ver sección 1).

### Ronda 6 — 2 nov 2026 · Claude
Holograma en la ficha, insignias como medallas de gimnasio, mapas gratuitos por defecto.

### Ronda 5 — 2 nov 2026 · Claude
Bitácora/Pokédex con 1,191 especies, juego de captura, rutas por calles reales (OSRM),
3D gratuito con MapLibre, panel plegable en celular, Pasaporte como librero de 3 libros,
portafolio que se reproduce solo y sin sonido.

---

## 5. Pendientes

Ordenados por lo que más falta. Al tomar uno, anótelo en los turnos.

### Panel
- [ ] Unir **Briefs y Solicitudes** en un solo sector con vistas y filtros que los distingan.
- [ ] **Calendario** con la disponibilidad real del cliente, editable y con reagendado.
- [ ] **Globos de notificación** con fichas incompletas o sin revisar.
- [ ] Ficha más fácil de leer: botones, desplegables y guía interactiva.
- [ ] **Storyboard con bocetos generados** en vez de emojis.
- [ ] **Edición colaborativa en tiempo real** de la ficha.
- [ ] Botón para **generar los 3 guiones** de cada ficha.
- [ ] Botón del calendario en **amarillo** al pasar el cursor y al tocarlo.

### Negocios
- [ ] **Enlace de registro** para que los negocios se agreguen solos.
- [ ] **Admin propio por negocio**: su clave, su catálogo, código QR y dos plantillas.
- [ ] **Admin principal**: ver y modificar cada perfil, activar o desactivar por falta de pago.
- [ ] **Registro de pagos** (efectivo y transferencia) con recordatorio de fin de mes.
- [ ] **Reseñas y calificaciones** de restaurantes, con incentivo a los mejor calificados.
- [ ] **Rutas base por zona** y tipo de experiencia.

### Otros
- [ ] **Malinche**: Tienda (catálogo, carrito, pedido por WhatsApp) y Estudio Malinche.
- [ ] **Cuatro idiomas** en toda la app; hoy solo en la Bitácora.
- [ ] **"Así se ve la luz"**: paisaje con línea de tiempo de mañana, tarde y noche.
- [ ] Aclarar en el brief que "fechas para grabar" son los días preferidos de grabación.
- [ ] Dominio propio.

### De Karla
- [ ] Importar las especies que faltan y correr *Buscar fotos*.
- [ ] Activar facturación y APIs en Google Cloud, si quiere Google Maps.
- [ ] Activar CallMeBot, subir música, aprobar el logo, asignar PIN a negocios reales.

---

## 6. Cómo se publica

Las dos nubes, siempre, en este orden:

1. **Vercel** — vista previa, verificar que el SHA1 de cada archivo coincida, y luego despliegue
   a **producción** en el proyecto `estudio-frecuencia-maiz`. El enlace nunca cambia.
2. **GitHub** — commit y push a `main`.
3. Abrir el sitio y comprobar que el cambio está vivo.

Si no se puede desplegar a Vercel, **igual se sube a GitHub** y se anota aquí que falta publicar.

---

## 7. Dónde está cada cosa

| Necesito… | Está en |
|---|---|
| Qué es el proyecto y cómo trabajar con Karla | `docs/PROMPT-MAESTRO.md` |
| Cómo se trabaja: no inventar, no cambiar de más | `docs/PROMPT-COMPORTAMIENTO.md` |
| Todo el detalle técnico | `docs/CONTEXTO-PROYECTO.md` |
| Recrear Supabase desde cero, con claves | `docs/PROMPT-SUPABASE-DESDE-CERO.md` |
| Mover Supabase a otra cuenta | `docs/MIGRACION-SUPABASE.md` |
| La base de datos en un solo archivo | `supabase/TODO-EN-UNO.sql` |
| Las 1,191 especies | `datos/bitacora-especies.json` |
