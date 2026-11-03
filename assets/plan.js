/* =========================================================
   Generador del PLAN DE ACCIÓN de grabación (sin IA externa)
   A partir de la ficha arma: 3 reels con storyboard toma por toma,
   iluminación, ajustes de cámaras, audio, edición en CapCut y publicación.
   Equipo: DJI Osmo Pocket 3 · 2 GoPro HERO13 Black · micrófonos DJI · trípodes · luces LED
   ========================================================= */
window.PLAN = (function () {
  const PL = {
    PG: { n: "Plano general", ic: "🏞️" }, PM: { n: "Plano medio", ic: "🧍" }, PP: { n: "Primer plano", ic: "🙂" },
    DT: { n: "Detalle", ic: "🔍" }, POV: { n: "Punto de vista (POV)", ic: "👀" }, CN: { n: "Cenital", ic: "⬇️" }, TL: { n: "Timelapse", ic: "⏱️" }
  };
  const CAM = { O: "Osmo Pocket 3", A: "GoPro 13 · A (trípode)", B: "GoPro 13 · B (mano/pecho)" };

  // Biblioteca de tomas por locación (clave: palabra que aparece en la locación)
  const LIB = [
    { k: /cocina|prepar/i, tomas: [
      { p: "DT", c: "O", m: "Movimiento lento lateral", a: "Manos preparando el producto estrella; vapor o textura en primer plano", l: "Contraluz LED a 45° detrás del plato para resaltar vapor" },
      { p: "CN", c: "A", m: "Fijo desde arriba (trípode con brazo)", a: "Vista cenital del proceso completo, de ingredientes a plato", l: "Luz LED difusa desde arriba, sin sombras duras" }] },
    { k: /sal[oó]n|comedor|recepci|[aá]reas comunes/i, tomas: [
      { p: "PG", c: "O", m: "Avance suave (dolly) desde la puerta", a: "Recorrido del espacio con clientes o mesas listas", l: "Luz natural de ventanas + LED de relleno a 5600 K" }] },
    { k: /terraza|vista|paisaje|mirador/i, tomas: [
      { p: "PG", c: "A", m: "Timelapse fijo 10–15 min", a: "Paisaje, nubes o volcanes; ideal en hora dorada", l: "Hora dorada (≈ 4:30–5:15 p. m.); exposición −0.5" },
      { p: "PM", c: "O", m: "Paneo lento revelando la vista", a: "Persona disfrutando el lugar de espaldas a cámara", l: "Sol detrás o al costado del sujeto (contraluz suave)" }] },
    { k: /fachada|entrada|vitrina|exhibici/i, tomas: [
      { p: "PG", c: "B", m: "POV llegando al lugar", a: "Llegada del cliente: caminar hacia la entrada y abrir la puerta", l: "Mañana o tarde, evitar mediodía con sombras duras" }] },
    { k: /plato|producto final|producto en uso|desayuno/i, tomas: [
      { p: "DT", c: "O", m: "Órbita lenta (modo ActiveTrack o manual)", a: "El producto terminado girando o servido en la mesa", l: "LED principal lateral + rebote blanco del otro lado" }] },
    { k: /equipo|personas|atend|atenci|trabajando/i, tomas: [
      { p: "PM", c: "O", m: "Seguimiento (ActiveTrack)", a: "Personas del equipo trabajando y sonriendo a cámara", l: "Luz suave frontal a 45°; evitar luz cenital de focos" }] },
    { k: /habitaci/i, tomas: [
      { p: "PG", c: "A", m: "Fijo en esquina con lente Lineal", a: "Habitación completa ordenada, cortinas abiertas", l: "Encender lámparas + LED rebotado al techo para llenar" },
      { p: "DT", c: "O", m: "Deslizamiento lento", a: "Detalles: sábanas, toallas dobladas, vista desde la ventana", l: "Luz de ventana como principal" }] },
    { k: /piscina|jard[ií]n|hamaca|cascada|r[ií]o/i, tomas: [
      { p: "POV", c: "B", m: "GoPro en mano a ras de agua / pasto", a: "Toma inmersiva: entrar al agua o caminar por el jardín", l: "Mañana con sol alto, colores vivos" }] },
    { k: /cultivo|cosecha/i, tomas: [
      { p: "DT", c: "O", m: "Enfoque cercano en las manos", a: "Manos cortando el fruto o tocando la planta", l: "Luz de la mañana entre las hojas; evitar mediodía" },
      { p: "PG", c: "B", m: "Caminar entre surcos (POV)", a: "Recorrido entre las plantas", l: "Sol a un costado" }] },
    { k: /proceso|secado|tostado|elaboraci|artesanal/i, tomas: [
      { p: "DT", c: "O", m: "Cámara lenta 60 fps", a: "El momento clave del proceso (tostado, tejido, empaque)", l: "LED cálido 4000 K para un ambiente acogedor" },
      { p: "TL", c: "A", m: "Timelapse del proceso", a: "Proceso completo resumido en segundos", l: "Luz constante (LED), no mezclar con sol cambiante" }] },
    { k: /tour|visitantes|clientes disfrut/i, tomas: [
      { p: "PM", c: "O", m: "Seguimiento por detrás del grupo", a: "Visitantes recorriendo y reaccionando", l: "Luz natural; cuidar caras en sombra" }] },
    { k: /empaque|entrega/i, tomas: [
      { p: "CN", c: "A", m: "Fijo cenital", a: "Empacar el producto con materiales reutilizables", l: "LED difuso desde arriba" }] }
  ];
  const ECTOMA = {
    "Reducir desperdicios": "Mostrar porciones justas o aprovechamiento de sobrantes",
    "Reutilizar envases, materiales o empaques": "Envase reutilizable o empaque de material reciclado en primer plano",
    "Separar y reciclar residuos": "Estación de separación de residuos con rótulos",
    "Compostaje o aprovechar residuos orgánicos": "Residuos de cocina convirtiéndose en abono para el huerto",
    "Crear nuevos productos con residuos": "Producto creado a partir de residuos, antes y después",
    "Ahorro de agua o energía": "Llave, panel solar o sistema de ahorro en uso",
    "Comprar a productores locales": "Productor local entregando insumos frescos"
  };

  const first = s => (s || "").split(/[,.;\n]/)[0].trim();
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  function locaciones(b) {
    const g = ((b.rubro && b.rubro.grabar) || []).slice();
    if (!g.length) g.push("Fachada y entrada", "Producto final", "Personas trabajando");
    return g;
  }
  function tomasPara(loc) {
    const hit = LIB.find(x => x.k.test(loc));
    return hit ? hit.tomas.map(t => Object.assign({ loc }, t)) : [{ loc, p: "PM", c: "O", m: "Paneo lento", a: `Mostrar ${loc.toLowerCase()} con personas en acción`, l: "Luz natural + LED de relleno a 45°" }];
  }

  function generar(b) {
    const tipo = b.tipo || "Negocio";
    const rub = b.rubro || {};
    const prod = b.producto || first(rub.oferta) || "su producto estrella";
    const prac = (b.practicas || []).filter(p => p !== "Aún no aplicamos");
    const locs = locaciones(b);
    const pool = locs.flatMap(tomasPara);
    const nombre = b.nombre || "el negocio";
    const objetivo = (b.objetivo || "").toLowerCase();
    const tag = "#" + nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "");
    const lugar = first(b.ubicacion) || "El Salvador";
    const lugTag = "#" + lugar.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "");
    const ecTxt = prac[0] ? ECTOMA[prac[0]] || prac[0] : null;
    let pi = 0; const next = () => pool[(pi++) % pool.length];

    const mk = (n, seg, p, c, m, a, audio, texto, l) => ({ n, seg, plano: PL[p].n, ic: PL[p].ic, camara: CAM[c], mov: m, accion: a, audio, texto, luz: l });

    // Reel 1 · Conexión
    const t1 = next();
    const r1 = {
      titulo: "Conexión · La historia detrás", enfoque: "Generar cercanía: personas reales y por qué existe el negocio.", duracion: "25–35 s",
      gancho: b.slogan ? `“${b.slogan}”… y así empezó todo.` : `¿Sabía que ${nombre} nació de un sueño familiar?`,
      mensaje: first(b.historia) || "La historia del negocio contada por su gente.",
      cta: "Síganos para conocer más historias de la zona.",
      tomas: [
        mk(1, "0–2 s", "PP", "O", "Acercamiento rápido (push-in)", `Responsable de ${nombre} mirando a cámara, sonríe y dice la primera frase`, "Mic DJI en solapa · voz", "Texto gancho grande arriba", "LED principal a 45° + luz natural de fondo"),
        mk(2, "2–8 s", t1.p, t1.c, t1.m, t1.a, "Voz en off continúa la historia", "Año o dato clave (ej. “Desde 2015”)", t1.l),
        mk(3, "8–16 s", "PM", "O", "Seguimiento (ActiveTrack)", "Equipo trabajando: saludar, servir, reír", "Voz en off + música suave", "Nombres o roles del equipo", "Luz suave frontal"),
        mk(4, "16–24 s", "DT", "O", "Movimiento lento", `Detalle de ${prod}`, "Sonido ambiente real (ASMR)", "", "Contraluz para textura"),
        mk(5, "24–30 s", "PG", "A", "Fijo · trípode", `Equipo completo frente a ${nombre}, saludan a cámara`, "Música sube", "Logo + “Los esperamos”", "Mañana o tarde, sol de frente-lateral")
      ]
    };
    // Reel 2 · Experiencia / diferenciación (+ economía circular)
    const t2 = next(), t3 = next(), t4 = next();
    const r2 = {
      titulo: "Experiencia · Lo que nos hace diferentes", enfoque: ecTxt ? "Mostrar la experiencia y la práctica sostenible del negocio." : "Mostrar la experiencia completa del cliente.", duracion: "20–30 s",
      gancho: ecTxt ? `Lo que nadie ve detrás de ${prod}…` : `Así se vive un día en ${nombre}`,
      mensaje: ecTxt ? `${cap(prac[0])}: ${b.ejemplo_ec ? first(b.ejemplo_ec) : ecTxt}` : (first(rub.visitantes) || first(rub.oferta) || "La experiencia completa."),
      cta: "Guarde este video para su próxima visita.",
      tomas: [
        mk(1, "0–2 s", "POV", "B", "GoPro en el pecho, entrada dinámica", "POV: llegar y ver el lugar por primera vez", "Sonido ambiente + golpe de música", "“POV: descubrió " + nombre + "”", "Exterior con luz de mañana"),
        mk(2, "2–7 s", t2.p, t2.c, t2.m, t2.a, "Música tendencia", t2.loc, t2.l),
        mk(3, "7–12 s", t3.p, t3.c, t3.m, t3.a, "Música", t3.loc, t3.l),
        ecTxt ? mk(4, "12–19 s", "DT", "O", "Cámara lenta 60 fps", ecTxt, "Voz corta explicando la práctica", "♻️ " + prac[0], "LED cálido 4000 K") : mk(4, "12–19 s", t4.p, t4.c, t4.m, t4.a, "Música", t4.loc, t4.l),
        mk(5, "19–25 s", "PM", "O", "Órbita lenta", `Cliente disfrutando ${prod}`, "Risa o reacción real", "", "Contraluz suave"),
        mk(6, "25–28 s", "TL", "A", "Timelapse o transición al logo", "Cierre que conecta con el inicio (para que el video se repita)", "Música termina en el beat", "Logo + ubicación", "Hora dorada si es exterior")
      ]
    };
    // Reel 3 · Conversión
    const t5 = next();
    const r3 = {
      titulo: "Conversión · Visítenos hoy", enfoque: objetivo.includes("lanzar") ? "Lanzar el producto o servicio con una llamada clara." : "Convertir vistas en visitas o mensajes.", duracion: "15–20 s",
      gancho: `3 razones para venir a ${nombre} este fin de semana`,
      mensaje: `${cap(prod)}, ${t5.loc.toLowerCase()} y atención con cariño.`,
      cta: `Escríbanos por WhatsApp${b.horario ? " · " + first(b.horario) : ""}`,
      tomas: [
        mk(1, "0–2 s", "PP", "O", "Push-in rápido", "Persona del equipo levanta 3 dedos: “3 razones…”", "Voz directa", "“3 razones para venir”", "LED frontal suave"),
        mk(2, "2–6 s", "DT", "O", "Cámara lenta 60 fps", `Razón 1: ${prod}`, "Golpe de música en cada razón", "1️⃣ " + cap(prod), "Contraluz"),
        mk(3, "6–10 s", t5.p, t5.c, t5.m, `Razón 2: ${t5.a}`, "Golpe de música", "2️⃣ " + t5.loc, t5.l),
        mk(4, "10–14 s", "PM", "O", "Seguimiento", ecTxt ? `Razón 3: ${ecTxt}` : "Razón 3: la atención del equipo", "Golpe de música", "3️⃣ " + (prac[0] || "Atención con cariño"), "Luz natural"),
        mk(5, "14–18 s", "PG", "A", "Fijo", "Fachada con rótulo, dirección y horario", "Voz: “¡Los esperamos!”", "📍 " + lugar + (b.horario ? " · " + first(b.horario) : "") + " · WhatsApp", "Exterior con buena luz")
      ]
    };
    const reels = [r1, r2, r3];
    reels.forEach((r, i) => {
      r.caption = [
        i === 0 ? `Detrás de cada ${first(rub.oferta) ? first(rub.oferta).toLowerCase() : "detalle"} hay una historia. Esta es la de ${nombre}.` :
        i === 1 ? `${ecTxt ? "Aquí cuidamos la tierra mientras usted disfruta. " : ""}Así se vive ${nombre}.` :
          `¿Ya conoce ${nombre}? Le damos 3 razones para venir.`,
        `📍 ${lugar}${b.horario ? " · " + first(b.horario) : ""}`,
        i === 2 ? "Escríbanos por WhatsApp y reserve." : "¿A quién traería con usted? Etiquételo 👇"
      ].join("\n");
      r.hashtags = [tag, lugTag, "#ElSalvador", "#OccidenteSV", "#RutaDeLasFlores", prac.length ? "#EconomiaCircular" : "#HechoEnElSalvador",
        /restaurante|cafeter/i.test(tipo) ? "#ComidaSalvadoreña" : /hotel|hostal/i.test(tipo) ? "#TurismoSV" : /finca/i.test(tipo) ? "#CafeSalvadoreño" : "#ApoyaLoLocal", "#EstudioMaiz"];
      r.musica = i === 0 ? "Acústica cálida, 80–95 BPM (busque “acoustic warm” en la biblioteca de CapCut)" : i === 1 ? "Audio en tendencia de Reels/TikTok de la semana; cortes al ritmo" : "Ritmo marcado, 110–125 BPM para los 3 golpes";
    });

    // Horario sugerido según disponibilidad
    const disp = b.disponibilidad || [];
    const sugerido = disp.length ? disp.slice().sort((a, c) => (c.franjas || []).length - (a.franjas || []).length)[0] : null;

    const iluminacion = [
      "Llegue 30 min antes para ver dónde entra la luz natural y apague focos amarillos que mezclen colores.",
      "Use las luces LED a 5600 K cuando haya luz de ventana; a 3200–4000 K solo en interiores sin luz natural.",
      "Luz principal a 45° del rostro y un poco arriba; rebote blanco (cartón o tela) del otro lado para suavizar sombras.",
      "Comida y productos: contraluz (luz detrás, a las 10–11 en punto) para que se vea el vapor, el brillo y la textura.",
      locs.some(l => /paisaje|mirador|terraza|vista|piscina|cultivo/i.test(l)) ? "Exteriores: grabe paisajes en hora dorada (aprox. 4:30–5:15 p. m.) y evite 11:00 a. m.–2:00 p. m. por sombras duras." : "Exteriores: evite el mediodía; si no hay opción, grabe a la sombra.",
      "Ponga difusor a las LED para piel natural; nunca apunte la luz directa a los ojos."
    ];
    const camaras = {
      osmo: { rol: "Cámara principal: rostros, detalles, seguimientos y voz", ajustes: [
        "Vertical 9:16 (gire la pantalla) · 4K", "30 fps para personas y voz · 60 fps para tomas que irán en cámara lenta",
        "Perfil de color: Normal (edición rápida). Use D-Log M solo en escenas con mucho contraste y aplique LUT en edición",
        "Modo Pro: obturador 1/60 (a 30 fps) o 1/120 (a 60 fps); ISO 100–800; balance de blancos fijo (5600 K exterior)",
        "Gimbal en modo Seguimiento; ActiveTrack para caminar con personas; desactive efectos de belleza",
        "Conecte el micrófono DJI directo a la Osmo por Bluetooth y active grabación interna de respaldo en el transmisor"] },
      goproA: { rol: "GoPro 13 · A: plano fijo en trípode (generales, cenitales, timelapse)", ajustes: [
        "4K · 8:7 (permite recortar vertical y horizontal) o 9:16 si el plano es solo para Reels", "Lente Lineal en interiores y productos (sin ojo de pez)",
        "Color: Natural · Nitidez: Baja · Tasa de bits: Alta", "Timelapse: intervalo 2 s para nubes y personas; 5 s para procesos largos",
        "EV −0.5 con sol fuerte; ISO máximo 1600 en interiores"] },
      goproB: { rol: "GoPro 13 · B: POV, tomas de acción y de llegada", ajustes: [
        "4K 9:16 · 60 fps para poder hacer rampas de velocidad", "HyperSmooth en AutoBoost; lente Amplio para POV",
        "Montaje de pecho o en mano a ras de suelo/agua", "Active HindSight para no perder momentos espontáneos"] },
      audio: { rol: "Micrófonos DJI", ajustes: [
        "Transmisor en la solapa a 15–20 cm de la boca, oculto bajo la ropa si se puede", "Active la cancelación de ruido en cocinas o lugares con ventiladores",
        "Use el peluche antiviento en exteriores", "Grabe 10 s de sonido ambiente en cada locación (sirve para transiciones)",
        "Pida a la persona decir su frase 3 veces con distinta energía"] }
    };
    const kit = ["Osmo Pocket 3 + batería extra (grip de batería)", "2 GoPro HERO13 + 2 baterías por cámara", "Micrófonos DJI cargados + receptor/adaptador",
      "Trípodes/atriles (uno con brazo para cenital)", "Luces LED + difusores + baterías o extensión", "Rebote blanco o cartón blanco",
      "Tarjetas microSD formateadas (V30 o superior)", "Paño de microfibra para lentes", "Este plan impreso o en el celular"];
    const capcut = [
      "Proyecto nuevo 9:16 · 1080×1920 · 30 fps (exportar en 1080p o 4K, tasa de bits alta).",
      "Ordene los clips por reel con las etiquetas del storyboard (T1, T2…). Corte los primeros 2 s a lo más llamativo: el gancho decide las vistas.",
      "Use “Ritmo / Beat” para marcar el compás de la música y corte cada toma en el golpe.",
      "Clips a 60 fps: aplique Velocidad → Curva (Montaje o Bala) para rampas de velocidad suaves.",
      "Subtítulos automáticos en español; estilo con letra blanca, borde café y palabra clave en amarillo (#F4C230).",
      "Audio: “Reducir ruido” en la voz; baje la música a −18 dB cuando hablan (ducking) y súbala en los cortes.",
      "Color: ajuste Temperatura +5 a +10 para un look cálido de la marca; si grabó en D-Log M, importe el LUT de DJI antes de ajustar.",
      "Transiciones: corte por coincidencia (mismo movimiento entre tomas) o barrido con la mano; evite efectos genéricos.",
      "Termine el video conectando con el inicio para que se repita (loop) y aumente el tiempo de visualización.",
      "Portada: fotograma del producto estrella con 3–4 palabras grandes."];
    const publicar = [
      "Mejor horario: 11:30 a. m.–1:00 p. m. o 6:00–8:00 p. m. (hora de El Salvador), de miércoles a domingo.",
      "Publique como colaboración con la cuenta del cliente (Instagram/Facebook “Colaboración”).",
      "Use audio en tendencia cuando sea posible y responda todos los comentarios la primera hora.",
      "Publique un reel cada 3–4 días: Conexión → Experiencia → Conversión."];
    return { reels, iluminacion, camaras, kit, capcut, publicar, sugerido, locs };
  }
  return { generar };
})();
