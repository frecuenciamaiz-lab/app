/* =========================================================
   Carta de precios de Proyecto Maíz (valores por defecto)
   Se editan en Panel → Precios y se guardan en site_config.precios
   Referencia de mercado (nov. 2026): editores/videógrafos freelance en
   El Salvador cobran ~$10–15/h; un community manager contratado cuesta
   ~$875/mes. Estos paquetes quedan por debajo de contratar personal y
   arriba del freelance sin estrategia.
   ========================================================= */
window.PRECIOS_DEFAULT = {
  moneda: "$",
  nota: "Precios en dólares, no incluyen IVA. Viáticos incluidos en el occidente (Ahuachapán, Sonsonate y Santa Ana).",
  estudio: [
    { id: "reel", cat: "Contenido para redes", nombre: "Reel profesional", desc: "Grabación y edición de 1 reel vertical de 20 a 40 s, con subtítulos y música.", precio: 45, unidad: "c/u", cantidad: true, destacado: false },
    { id: "fotos", cat: "Contenido para redes", nombre: "Sesión de fotos", desc: "15 fotos editadas de producto, lugar o equipo.", precio: 60, unidad: "sesión", cantidad: true },
    { id: "arranque", cat: "Paquetes", nombre: "Paquete Arranque", desc: "3 reels + 10 fotos en 1 visita. Ideal para empezar.", precio: 120, unidad: "único", cantidad: false, destacado: true },
    { id: "crecimiento", cat: "Paquetes", nombre: "Paquete Crecimiento", desc: "6 reels + 20 fotos al mes, calendario y textos para publicar.", precio: 220, unidad: "/mes", cantidad: false, destacado: true },
    { id: "marca", cat: "Paquetes", nombre: "Paquete Marca Total", desc: "10 reels + 30 fotos al mes, publicación en 2 redes, respuestas básicas y reporte mensual.", precio: 380, unidad: "/mes", cantidad: false },
    { id: "publicitario", cat: "Video", nombre: "Video publicitario", desc: "Video de 30 a 60 s con guion, locución y versión vertical y horizontal.", precio: 150, unidad: "c/u", cantidad: true },
    { id: "documental", cat: "Video", nombre: "Mini documental de economía circular", desc: "2 a 4 minutos contando la práctica sostenible del negocio.", precio: 350, unidad: "c/u", cantidad: true },
    { id: "evento", cat: "Video", nombre: "Cobertura de evento", desc: "Hasta 3 horas: 1 reel resumen + 25 fotos.", precio: 120, unidad: "evento", cantidad: true },
    { id: "artista", cat: "Artistas", nombre: "Promoción de artista", desc: "Video corto de una canción + 2 reels + entrevista en Frecuencia Maíz.", precio: 140, unidad: "único", cantidad: false },
    { id: "menu", cat: "Digital", nombre: "Menú o catálogo digital", desc: "Menú web con su marca y código QR para mesas.", precio: 35, unidad: "único", cantidad: false }
  ],
  extras: [
    { id: "urgente", nombre: "Entrega urgente (48 h)", tipo: "porc", valor: 25 },
    { id: "ingles", nombre: "Subtítulos en inglés", tipo: "fijo", valor: 10 },
    { id: "pauta", nombre: "Manejo de anuncios pagados (sin incluir inversión)", tipo: "fijo", valor: 40 },
    { id: "lejos", nombre: "Viático fuera del occidente", tipo: "fijo", valor: 20 }
  ],
  descuentos: [
    { id: "trimestral", nombre: "Pago trimestral (paquetes mensuales)", porc: 10 },
    { id: "aliado", nombre: "Negocio Aliado de Ruta Maíz", porc: 10 }
  ],
  radio: [
    { id: "mencion", nombre: "Mención en programa", desc: "Su negocio mencionado en vivo por el locutor.", precio: 5, unidad: "c/u" },
    { id: "cuna", nombre: "Cuña de 30 s + 60 pases al mes", desc: "Incluye grabación de la cuña con voz profesional.", precio: 55, unidad: "/mes" },
    { id: "patrocinio", nombre: "Patrocinio de programa", desc: "\"Este programa es presentado por…\" + menciones y redes.", precio: 75, unidad: "/mes" },
    { id: "entrevista", nombre: "Entrevista o podcast patrocinado", desc: "Conversación de 20 a 30 min sobre su negocio o proyecto.", precio: 60, unidad: "c/u" }
  ],
  ruta: [
    { id: "basico", nombre: "Básico", precio: 0, unidad: "gratis", desc: "Aparece en el mapa, ficha con horario, consumo y WhatsApp." },
    { id: "destacado", nombre: "Destacado", precio: 15, unidad: "/mes", desc: "Primero en la lista, marcador amarillo, promociones con Pasaporte, Wi-Fi para visitantes y menú digital." },
    { id: "aliado", nombre: "Aliado", precio: 45, unidad: "/mes", desc: "Todo lo Destacado + 1 reel al trimestre, mención en Frecuencia Maíz, reservas de servicios y reporte de visitas." },
    { id: "patrocinio", nombre: "Patrocinio de ruta", precio: 60, unidad: "/mes", desc: "Su marca presente en una ruta temática completa." }
  ]
};
window.PRECIOS = function () {
  const c = (window.MZ && MZ.CFG && MZ.CFG().precios) || null;
  return c && c.estudio ? c : PRECIOS_DEFAULT;
};
window.money = n => "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
