# Contexto del proyecto · Proyecto Maíz

Documento de referencia: qué existe, cómo funciona y qué falta.
Fecha de corte: **2 de noviembre de 2026**.

---

## 1. Quién y cómo se trabaja

**Karla Peña** — Licenciada en Ciencias Químicas, especialidad en Química Ambiental.
Trabaja en el occidente de El Salvador, zona de la Reserva de Biosfera Apaneca-Ilamatepec.

- **No programa.** Ella da las ideas; quien la asista implementa todo de principio a fin.
- Los pasos que ella deba hacer se explican **numerados y en palabras sencillas**.
- Se le escribe **en español**. Los textos para clientes van en registro formal (**"usted"**).
- Al terminar algo se le entrega el **enlace funcionando**, ya probado en computadora y celular.
- Si algo requiere una decisión suya o una cuenta nueva, se le pregunta antes.

---

## 2. Las unidades

### Estudio Maíz — agencia de publicidad
Produce contenido audiovisual para redes (reels, videos, fotos) para negocios locales:
restaurantes, hoteles, hostales, fincas, tiendas. El enfoque es **economía circular y sostenibilidad**:
mostrar cómo cada negocio reduce, reutiliza, recicla, aprovecha residuos y compra local.

**Flujo de trabajo:**
1. **Brief** — el cliente llena el formulario web (enlace fijo, se comparte por WhatsApp).
2. **Ficha** — la respuesta llega a la base de datos y se ve como ficha gráfica en el panel. Se descarga en PDF.
3. **Guiones** — con la ficha se crean 3 guiones de reels (conexión, experiencia/diferenciación, conversión).
4. **Visita de grabación** — se coordina por WhatsApp según el mejor día y horario que indicó el cliente.

### Frecuencia Maíz — radio
Radio en línea con biblioteca propia de canciones (sube pistas con licencia o permiso del artista).

### Ruta Maíz — mapa y pasaporte
Mapa de negocios locales con fichas, menús digitales, Wi-Fi para clientes, rutas temáticas
y el **Pasaporte Maíz**: el visitante sella locales con su GPS, sube de nivel y canjea premios.

### Bitácora — Pokédex de la reserva
App de naturaleza con 1,191 especies verificadas. Ver sección 4.

---

## 3. Lo que está construido

### Páginas públicas
| Ruta | Qué es |
|---|---|
| `/` | Portada de Proyecto Maíz |
| `/estudio-maiz` | Agencia: árbol de servicios, cotizador en vivo, portafolio |
| `/brief` | Formulario de 7 secciones, guarda el avance solo, preguntas que cambian según el rubro |
| `/radio-frecuencia-maiz` | Radio con reproductor continuo |
| `/ruta-maiz` | Mapa, lugares, rutas, Pasaporte, planes para negocios |
| `/bitacora` | Pokédex de la reserva |
| `/solicitud` | Solicitudes de servicio de las tres unidades |
| `/negocio?id=…` | Perfil privado de cada negocio (entra con PIN) |
| `/panel` | Panel privado (entra con clave) |
| `/logo` | Marca y recursos gráficos |

### Panel privado (`/panel`)
Secciones: Resumen (estadísticas propias), Fichas, Calendario, Solicitudes, Portafolio,
Ruta Maíz, Sitio, Radio, Precios, Avisos, Negocios, Bitácora.

Lo que permite hacer:
- Ver y cambiar el estado de cada ficha (nuevo → revisado → agendado → grabado), con plan de grabación y PDF.
- Editar textos, colores, equipo, redes y precios sin tocar código.
- Administrar locales y rutas de Ruta Maíz, asignar PIN a cada negocio y aprobar sus cambios.
- Subir música a la radio.
- Importar especies, buscarles fotos y poner avistamientos fijos en el mapa.
- Configurar avisos por WhatsApp (CallMeBot).

### Brief
7 secciones con avance guardado: datos del negocio, equipo y redes, rubro, oferta y locaciones
(las preguntas cambian según sea restaurante, hotel, finca, tienda u otro), economía circular,
historia y objetivos, revisión y envío. Permite subir fotos y marcar días preferidos de grabación.

### Mapas
- Por defecto usa **OpenStreetMap/CARTO** (gratis). Satélite de **Esri**, relieve de **OpenTopoMap**.
- **Vista 3D gratuita** con MapLibre: satélite + relieve real + vuelo tipo Google Earth.
- **Google Maps** es opcional: se activa en Panel → Sitio → Mapa. Requiere facturación activa
  en Google Cloud. Si falla, el sitio detecta el error y vuelve solo a OpenStreetMap por 24 horas.
- Las **rutas** se calculan por calles reales con **OSRM**, igual que Waze o Google Maps,
  y muestran kilómetros y tiempo en carro.

### Pasaporte Maíz
Librero con **tres libros independientes** de aspecto antiguo (cuero, pan de oro, papel envejecido):
1. **Pasaporte y sellos** — datos del viajero, nivel, puntos, visados por departamento, sellos de cada local.
2. **Insignias** — estuche con medallas tipo gimnasio de Pokémon: 8 por página, apagadas hasta obtenerlas.
3. **Premios** — recompensas por nivel, canjeables con código.

Los sellos se obtienen con GPS (hay que estar a menos de 600 m del local). Todo se guarda en el celular.

### Portafolio
Los videos se reproducen solos y **sin sonido** en la miniatura; al tocarlos se abre la publicación
original en TikTok, Instagram, Facebook o YouTube.

---

## 4. La Bitácora (Pokédex)

### Base de datos
**1,191 especies verificadas**, tomadas del Anexo 1 del Plan de Manejo del Área de Conservación
Apaneca-Ilamatepec 2026-2031 y del catálogo de fichas del equipo.

- 625 plantas, 93 mamíferos, 251 aves, 26 anfibios, 65 reptiles, 114 invertebrados.
- Cada una con: orden, grupo, familia, nombre científico, nombre común, estado de conservación,
  rareza, áreas donde vive, descripción, importancia, función y fuente.
- Rarezas: 83 legendarias, 166 raras, 942 comunes.
- 400 tienen descripción del catálogo.

El archivo está en `datos/bitacora-especies.json` y se carga desde Panel → Bitácora → *Importar especies*.

### Áreas protegidas (`assets/anp.json`)
Polígonos de las 5 áreas núcleo, dibujados sobre el mapa oficial de la reserva:

| Código | Área | Sector |
|---|---|---|
| `PNLV` | Parque Nacional Los Volcanes | 1 |
| `CEA` | Área Natural Protegida Cerro El Águila | 2 |
| `LLR` | Complejo Laguna de Las Ranas | 2 |
| `CSM` | Monumento Natural San Marcelino | 3 |
| `SELC` | Área Protegida Municipal San Eugenio – La Concordia | 3 |

### Las cuatro pestañas
1. **Cerca de mí** — detecta por GPS en qué área está el visitante (o cuál es la más cercana)
   y lista lo que vive ahí. Botón 🔊 que lo cuenta en voz.
2. **Bitácora** — lista completa con buscador, filtros por grupo, área y capturadas.
3. **Explorar y capturar** — mapa con las especies apareciendo dentro de las áreas y junto a
   los locales de Ruta Maíz. Se capturan lanzando una mazorca cuando el aro amarillo está pequeño.
4. **Ranking** — alias, puntos, logros y tabla de los mejores.

### Ficha de especie
Foto, nombres, estado, áreas, descripción, importancia, dato curioso, fuentes.
Botones: 🔊 escuchar, 🧊 **holograma 3D** (modelo giratorio con efecto holograma futurista:
azul cian, líneas de barrido, base luminosa y parpadeo), 📍 dónde vive.

### El juego
- Las apariciones se generan por ventanas de 10 minutos y celdas de ~330 m, iguales para todos.
- Rarezas: legendaria 6 %, rara 24 %, común 70 %. Puntos: 50 / 25 / 10.
- Para capturar hay que estar a menos de 60-90 m. Tres intentos por aparición.
- Los puntos se calculan **en el servidor** (no se pueden falsear desde el celular).
- Modo de prueba: `/bitacora?prueba=1` permite simular estar en cualquier área.

### Fuentes externas
- **iNaturalist** — fotos con crédito, nombres en otros idiomas y resumen de Wikipedia.
- **Sketchfab** — modelos 3D buscados automáticamente por nombre científico.
- **Voz** — Web Speech API del navegador, en español, inglés, francés y alemán.

---

## 5. Base de datos (Supabase)

Proyecto actual: `frecuencia-maiz`, id `pgwhbrkvwzticuewxwen`, región us-east-1.

### Tablas públicas
| Tabla | Para qué | Quién puede leer |
|---|---|---|
| `briefs` | Fichas del formulario | Nadie (solo con clave) |
| `solicitudes` | Solicitudes de servicio | Nadie (solo con clave) |
| `site_config` | Textos, colores, equipo, precios, mapa | Todos |
| `visitas` | Estadísticas propias | Nadie |
| `ruta_locales` | Negocios de Ruta Maíz | Solo los publicados |
| `ruta_rutas` | Rutas temáticas | Solo las publicadas |
| `portafolio` | Trabajos de Estudio Maíz | Solo los publicados |
| `radio_tracks` | Música de la radio | Solo las publicadas |
| `especies` | Pokédex | Solo las publicadas |
| `avistamientos` | Especies fijas en el mapa | Solo los activos |
| `jugadores` | Ranking del juego | Nadie (solo por funciones) |

### Esquema privado
`private.admin_keys` (clave del panel, cifrada), `private.local_pins` (PIN de negocios, cifrados),
`private.pin_intentos` (bloqueo tras 5 fallos), `private.avisos` (CallMeBot), `private.uso_mapas` (contador 3D).

### Reglas de seguridad
- El público **solo puede insertar** briefs, solicitudes y visitas. Nunca leer datos de clientes.
- Todo lo del panel pasa por funciones `admin_*` que exigen la clave.
- Los negocios entran con su `id` + PIN; se bloquean 15 minutos tras 5 intentos fallidos.
- Hay límites de tamaño en los textos para evitar abuso.

### Clave del panel
`maiz-4su7-90o5` — privada, **no se comparte con clientes**.

---

## 6. Despliegue (Vercel)

Proyecto `estudio-frecuencia-maiz`. Dominio fijo: **estudio-maiz.vercel.app**.
Sitio estático sin build. Para actualizar se despliega **a producción en el mismo proyecto**,
así el enlace nunca cambia.

---

## 7. Lo que falta por hacer

### Panel y administración
- [ ] Unir **Briefs y Solicitudes** en un solo sector con vistas y filtros que los distingan
      (ejemplo: Tiki Island aparecía como solicitud y debía ser brief).
- [ ] **Calendario** que refleje los días y horas disponibles de cada cliente, editable y con reagendado.
- [ ] **Globos de notificación** con el número de fichas incompletas o sin revisar.
- [ ] **Ficha más fácil de leer**: botones, desplegables y una guía interactiva para completar lo acordado.
- [ ] **Storyboard con bocetos generados** en vez de emojis.
- [ ] **Edición colaborativa en tiempo real** de la ficha, para acordar la propuesta con el cliente.
- [ ] Aclarar en el brief que "fechas para grabar" son los **días preferidos de grabación**;
      los días y horas de atención del negocio van en la sección del negocio.
- [ ] Botón del calendario que se ponga **amarillo** al pasar el cursor y al tocarlo.

### Negocios
- [ ] **Enlace de registro** para que los negocios se agreguen solos.
- [ ] **Admin propio de cada negocio** con su clave, su catálogo y código QR, y dos plantillas
      (modo pagado y una genérica).
- [ ] **Admin principal sobre los negocios**: ver y modificar cada perfil, activar o desactivar
      servicios si no han pagado.
- [ ] **Registro de pagos** (efectivo y transferencia) con recordatorios de fin de mes por WhatsApp.
- [ ] **Reseñas y calificaciones** de restaurantes, con incentivo para los mejor calificados.
- [ ] **Rutas base por zona y tipo de experiencia**.

### Otros
- [ ] **Malinche**: opción desplegable con *Tienda Malinche* (catálogo con carrito y pedido por WhatsApp,
      productos cargados desde el panel) y *Estudio Malinche* (página de servicios).
- [ ] **Idiomas** (español, inglés, francés, alemán) en toda la app; por ahora solo en la Bitácora.
- [ ] **"Así se ve la luz"**: escena de paisaje con una línea de tiempo deslizante que pasa de
      mañana a tarde y noche en tiempo real.
- [ ] Botón para **generar los 3 guiones** de cada ficha automáticamente desde el panel.
- [ ] Borrar dos funciones viejas de Supabase (`listar_briefs` y `cambiar_estado`), que usan otra clave.
- [ ] Dominio propio (por ejemplo `estudiomaiz.com`).

### Pendientes de Karla
- [ ] Terminar de importar las especies: la base tiene **409 de 1,191**. Hay que volver a entrar a
      Panel → Bitácora → *Importar especies* y subir el archivo otra vez (no duplica nada).
- [ ] Correr *Buscar fotos* después de importar.
- [ ] Si quiere Google Maps y su 3D fotorrealista, activar la facturación en Google Cloud
      y habilitar *Map Tiles API*.

---

## 8. Reglas para cualquier cambio

1. Mantener siempre el mismo enlace: desplegar a producción en el proyecto `estudio-frecuencia-maiz`.
2. Mantener la identidad visual (colores, estilo iOS, mazorca) en todo lo nuevo.
3. Nunca exponer la lectura de la base de datos al público. Los datos de clientes solo se ven
   en el panel con clave.
4. Probar en computadora y en celular antes de entregar.
5. Si algo requiere una decisión de Karla o una cuenta nueva, preguntarle antes.
