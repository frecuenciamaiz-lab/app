/* Brief creativo · Estudio Maíz */
(function () {
  const { esc, I } = MZ;
  MZ.aurora();
  document.getElementById("bBack").innerHTML = I.back;
  MZ.track("vista");

  const KEY = "maiz_brief_v3";
  const qs = new URLSearchParams(location.search);
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  S.rubro = S.rubro || {}; S.edades = S.edades || []; S.practicas = S.practicas || [];
  S.redes_lista = S.redes_lista && S.redes_lista.length ? S.redes_lista : [{ red: "Facebook", url: "" }];
  S.disponibilidad = S.disponibilidad || []; S.objetivos = S.objetivos || [];
  S.fotos = S.fotos || [];
  S.hj = S.hj || { dias: [], abre: "08:00", cierra: "17:00" };
  if (qs.get("s")) S.servicio = qs.get("s").slice(0, 120);
  let step = Math.min(+(S._step || 0), 7);
  let started = !!S._started;
  const save = () => { S._step = step; localStorage.setItem(KEY, JSON.stringify(S)); };

  const RUBROS = [
    { id: "Restaurante / cafetería", em: "🍽️", d: "Comida, café, bebidas" },
    { id: "Hotel / hostal / alojamiento", em: "🛏️", d: "Hospedaje y experiencias" },
    { id: "Finca (café, agrícola, agroturismo)", em: "🌱", d: "Cultivos, tours, naturaleza" },
    { id: "Tienda / comercio", em: "🛍️", d: "Productos y artesanías" },
    { id: "Otro", em: "✨", d: "Servicios, arte, eventos…" }
  ];
  const RQ = {
    "Restaurante / cafetería": {
      oferta: ["¿Qué platos o bebidas ofrecen? ¿Cuál es su producto estrella?", "Ej.: pupusas en comal, café de altura, postres caseros"],
      origen: ["¿De dónde vienen sus ingredientes?", ["Mayormente de productores locales", "Una parte es local", "Mayormente de supermercado o distribuidores"]],
      grabar: ["Cocina y preparación", "Salón o comedor", "Terraza o vista", "Fachada y entrada", "Platos servidos", "Equipo atendiendo"]
    },
    "Hotel / hostal / alojamiento": {
      oferta: ["¿Qué tipo de habitaciones y servicios ofrecen?", "Ej.: 6 habitaciones, desayuno, tours, piscina"],
      visitantes: ["¿Qué experiencias viven sus huéspedes?", "Ej.: caminatas, fogata, observación de aves"],
      grabar: ["Habitaciones", "Áreas comunes", "Piscina o jardín", "Desayuno o restaurante", "Paisaje y miradores", "Recepción y bienvenida"]
    },
    "Finca (café, agrícola, agroturismo)": {
      oferta: ["¿Qué producen o venden?", "Ej.: café, cacao, frutales, miel"],
      visitantes: ["¿Qué actividades ofrecen a visitantes?", "Ej.: tours, caminata, comida, día de campo"],
      grabar: ["Cultivo y cosecha", "Proceso (secado, tostado…)", "Paisaje y miradores", "Tour con visitantes", "Producto final", "Personas trabajando"]
    },
    "Tienda / comercio": {
      oferta: ["¿Qué productos venden? ¿Cuál es el más buscado?", "Ej.: artesanías de tule, ropa, productos naturales"],
      origen: ["¿De dónde vienen sus productos?", ["Los hacemos nosotros", "De productores o artesanos locales", "Una parte es local", "Mayormente de distribuidores"]],
      grabar: ["Vitrina y exhibición", "Producto en uso", "Proceso de elaboración", "Fachada y entrada", "Atención al cliente", "Empaque y entrega"]
    },
    "Otro": {
      oferta: ["Cuéntenos qué ofrece", "Ej.: servicio, evento, música, taller"],
      grabar: ["Lugar de trabajo", "Proceso o servicio en acción", "Personas o equipo", "Resultado final", "Clientes disfrutando"]
    }
  };
  const PRACTICAS = ["Reducir desperdicios", "Reutilizar envases, materiales o empaques", "Separar y reciclar residuos", "Compostaje o aprovechar residuos orgánicos",
    "Crear nuevos productos con residuos", "Ahorro de agua o energía", "Comprar a productores locales", "Aún no aplicamos"];
  const REDES = ["Facebook", "Instagram", "TikTok", "YouTube", "WhatsApp Business", "Google Maps", "Sitio web", "Otra"];
  const OBJ = ["Atraer más clientes", "Dar a conocer el negocio", "Lanzar un producto o servicio", "Mostrar nuestra práctica sostenible", "Mejorar la imagen en redes", "Promocionar un evento o temporada"];
  const FRANJAS = ["Mañana", "Mediodía", "Tarde"];

  const STEPS = [
    { t: "Su negocio", r: rNegocio, v: vNegocio },
    { t: "Equipo y redes", r: rEquipo, v: vEquipo },
    { t: "Rubro", r: rRubro, v: () => S.tipo ? "" : "Elija el rubro de su negocio." },
    { t: "Oferta y locaciones", r: rOferta, v: () => (S.rubro.oferta || "").trim() ? "" : "Cuéntenos qué ofrece su negocio." },
    { t: "Economía circular", r: rEC, v: () => S.practicas.length ? "" : "Marque al menos una opción (o “Aún no aplicamos”)." },
    { t: "Historia e ideas", r: rHistoria, v: () => (S.historia || "").trim().length >= 10 ? "" : "Cuéntenos un poco de la historia de su negocio." },
    { t: "Fechas para grabar", r: rFechas, v: () => S.disponibilidad.length ? "" : "Elija al menos un día en el calendario." },
    { t: "Revisión y envío", r: rRevision, v: () => "" }
  ];

  const card = document.getElementById("bCard");
  const side = document.getElementById("bSide");
  const bPrev = document.getElementById("bPrev"), bNext = document.getElementById("bNext");

  function input(id, label, opts) {
    opts = opts || {};
    const v = opts.value !== undefined ? opts.value : (S[id] || "");
    const tag = opts.area ? `<textarea class="input" id="f_${id}" maxlength="${opts.max || 1500}" placeholder="${esc(opts.ph || "")}">${esc(v)}</textarea>`
      : `<input class="input" id="f_${id}" type="${opts.type || "text"}" maxlength="${opts.max || 200}" ${opts.mode ? `inputmode="${opts.mode}"` : ""} autocomplete="${opts.ac || "off"}" placeholder="${esc(opts.ph || "")}" value="${esc(v)}">`;
    return `<div class="field"><label for="f_${id}">${label}${opts.req ? ' <span style="color:var(--dorado)">*</span>' : ""}</label>${tag}${opts.hint ? `<span class="hint">${opts.hint}</span>` : ""}</div>`;
  }
  function chips(name, list, sel, multi) {
    return `<div class="chips" data-chips="${name}" data-multi="${multi ? 1 : 0}">${list.map(x =>
      `<button type="button" class="chip ${(multi ? (sel || []).includes(x) : sel === x) ? "on" : ""}" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div>`;
  }
  function bindInputs() {
    card.querySelectorAll("[id^=f_]").forEach(el => el.addEventListener("input", () => {
      const k = el.id.slice(2);
      if (k.startsWith("r_")) S.rubro[k.slice(2)] = el.value; else S[k] = el.value;
      el.classList.remove("err"); save();
    }));
    card.querySelectorAll("[data-chips]").forEach(box => box.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      const name = box.dataset.chips, multi = box.dataset.multi === "1", v = b.dataset.v;
      const set = (val) => { if (name.startsWith("r_")) S.rubro[name.slice(2)] = val; else S[name] = val; };
      const get = () => name.startsWith("r_") ? S.rubro[name.slice(2)] : S[name];
      if (multi) {
        let arr = (get() || []).slice();
        if (name === "practicas" && v === "Aún no aplicamos") arr = arr.includes(v) ? [] : [v];
        else { arr = arr.filter(x => x !== "Aún no aplicamos"); arr = arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v); }
        set(arr);
        box.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", arr.includes(c.dataset.v)));
      } else {
        set(v); box.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.v === v));
      }
      if (name === "idea_tiene") { const ib = document.getElementById("ideaBox"); const show = v !== "Prefiero que ustedes propongan";
        ib.classList.toggle("open", show); const lb = ib.querySelector("label"); if (lb) lb.textContent = v === "Sí, tengo una idea clara" ? "Cuéntenos su idea" : "Cuéntenos sus ideas";
        if (show) setTimeout(() => { const t = document.getElementById("f_idea"); t && t.focus({ preventScroll: true }); ib.scrollIntoView({ behavior: "smooth", block: "center" }); }, 250); }
      save(); if (box.dataset.rerender) render();
    }));
  }

  // ---------- Paso 1 ----------
  let map, marker;
  function rNegocio() {
    return `<h1>Cuéntenos de su negocio</h1><p class="lead">Con esta información preparamos ideas para su contenido y coordinamos la visita.</p>
      ${S.servicio ? `<div class="tag y" style="margin-bottom:16px">Servicio de interés: ${esc(S.servicio)}</div>` : ""}
      ${input("nombre", "Nombre del negocio", { req: 1, ph: "Ej.: Café La Montaña", max: 150 })}
      <div class="b-grid2">
        ${input("responsable", "Su nombre", { req: 1, ph: "Nombre y apellido", max: 150, ac: "name" })}
        ${input("whatsapp", "WhatsApp", { req: 1, ph: "7000 0000", type: "tel", mode: "tel", max: 20, ac: "tel" })}
      </div>
      ${input("ubicacion", "Dirección o referencia", { ph: "Municipio, cantón, punto de referencia", max: 300 })}
      <div class="field"><span class="lbl">Ubicación GPS</span>
        <span class="hint">Así llegamos sin perdernos el día de la grabación. Use su ubicación actual, toque el mapa o pegue el enlace de Google Maps.</span>
        <div class="gps-box"><div class="gps-map" id="gpsMap"></div>
          <div class="gps-bar"><button type="button" class="btn btn-accent btn-sm" id="gpsMe">${I.mapa} Usar mi ubicación actual</button></div>
          <div class="gps-coords" id="gpsTxt">${S.lat ? `📍 ${(+S.lat).toFixed(5)}, ${(+S.lng).toFixed(5)}` : "Aún no hay punto marcado."}</div>
        </div>
      </div>
      ${input("maps_url", "Enlace de Google Maps (opcional)", { ph: "https://maps.app.goo.gl/…", type: "url", max: 600 })}
      <div class="field"><span class="lbl">¿Cuánto tiempo tiene el negocio?</span>${chips("anios", ["Menos de 1 año", "1 a 3 años", "4 a 10 años", "Más de 10 años"], S.anios)}</div>`;
  }
  function afterNegocio() {
    if (!window.L) return;
    const c = S.lat ? [+S.lat, +S.lng] : [13.86, -89.78];
    map = L.map("gpsMap", { zoomControl: false, attributionControl: true }).setView(c, S.lat ? 16 : 10);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19, attribution: "© OpenStreetMap · © CARTO" }).addTo(map);
    const icon = L.divIcon({ className: "", html: '<div style="font-size:30px;line-height:30px;transform:translate(-4px,-22px)">📍</div>' });
    const setPt = (lat, lng, zoom) => {
      S.lat = +lat.toFixed(6); S.lng = +lng.toFixed(6); save();
      if (!marker) { marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map); marker.on("dragend", e => { const p = e.target.getLatLng(); setPt(p.lat, p.lng); }); }
      else marker.setLatLng([lat, lng]);
      if (zoom) map.setView([lat, lng], 16);
      document.getElementById("gpsTxt").textContent = `📍 ${S.lat.toFixed(5)}, ${S.lng.toFixed(5)} · puede arrastrar el punto para ajustarlo`;
    };
    if (S.lat) setPt(+S.lat, +S.lng);
    map.on("click", e => setPt(e.latlng.lat, e.latlng.lng));
    document.getElementById("gpsMe").onclick = () => {
      if (!navigator.geolocation) return MZ.toast("Su navegador no permite ubicar el dispositivo.");
      MZ.toast("Buscando su ubicación…");
      navigator.geolocation.getCurrentPosition(p => setPt(p.coords.latitude, p.coords.longitude, true),
        () => MZ.toast("No pudimos obtener la ubicación. Toque el mapa para marcarla."), { enableHighAccuracy: true, timeout: 12000 });
    };
    const mu = document.getElementById("f_maps_url");
    mu.addEventListener("change", () => { const p = parseMaps(mu.value); if (p) setPt(p[0], p[1], true); });
    setTimeout(() => map.invalidateSize(), 300);
  }
  function parseMaps(u) {
    const m = u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || u.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || u.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
  }
  function vNegocio() {
    const errs = [];
    if (!(S.nombre || "").trim()) errs.push("nombre");
    if (!(S.responsable || "").trim()) errs.push("responsable");
    const w = (S.whatsapp || "").replace(/\D/g, "");
    if (w.length < 8) errs.push("whatsapp");
    if (S.maps_url && !/^https?:\/\//i.test(S.maps_url.trim())) errs.push("maps_url");
    errs.forEach(k => { const el = document.getElementById("f_" + k); el && el.classList.add("err"); });
    if (errs.includes("whatsapp")) return "Revise el número de WhatsApp (8 dígitos).";
    if (errs.includes("maps_url")) return "El enlace de Google Maps debe empezar con https://";
    return errs.length ? "Complete los campos marcados." : "";
  }

  // ---------- Paso 2 ----------
  function stepper(id, label) {
    return `<div class="field"><span class="lbl">${label}</span><div class="stepper">
      <button type="button" data-step="${id}" data-d="-1" aria-label="Menos">−</button>
      <input id="f_${id}" type="number" inputmode="numeric" min="0" max="999" value="${esc(S[id] || 0)}" aria-label="${label}">
      <span class="u">personas</span>
      <button type="button" data-step="${id}" data-d="1" aria-label="Más">+</button></div></div>`;
  }
  function rEquipo() {
    return `<h1>Su equipo y sus redes</h1><p class="lead">Nos ayuda a saber a quién mostrar y dónde publicar.</p>
      <div class="b-grid2">${stepper("mujeres", "Mujeres en el equipo")}${stepper("hombres", "Hombres en el equipo")}</div>
      <div class="field"><span class="lbl">Edades del equipo</span>${chips("edades", ["Menos de 18", "18 a 25", "26 a 35", "36 a 45", "46 a 59", "60 o más"], S.edades, 1)}</div>
      <div class="b-sub">Redes sociales del negocio</div>
      <p class="hint" style="margin:-4px 0 12px">Agregue todas las que tenga, con el enlace completo (copie la dirección desde su perfil).</p>
      <div id="redes"></div>
      <button type="button" class="btn btn-ghost btn-sm" id="addRed">＋ Agregar otra red</button>`;
  }
  function afterEquipo() {
    card.querySelectorAll("[data-step]").forEach(b => b.onclick = () => {
      const id = b.dataset.step, el = document.getElementById("f_" + id);
      el.value = Math.max(0, Math.min(999, (+el.value || 0) + (+b.dataset.d))); S[id] = el.value; save();
    });
    drawRedes();
    document.getElementById("addRed").onclick = () => { S.redes_lista.push({ red: "Instagram", url: "" }); save(); drawRedes(); };
  }
  function drawRedes() {
    const box = document.getElementById("redes");
    box.innerHTML = S.redes_lista.map((r, i) => `<div class="red-row" data-i="${i}">
      <div class="ico">${MZ.redIcon(r.red)}</div>
      <div class="inner"><select class="input" data-k="red">${REDES.map(x => `<option ${x === r.red ? "selected" : ""}>${x}</option>`).join("")}</select>
        <input class="input" data-k="url" type="url" inputmode="url" placeholder="${phRed(r.red)}" value="${esc(r.url)}" maxlength="300"></div>
      <button type="button" class="del" aria-label="Quitar">×</button></div>`).join("");
    box.querySelectorAll(".red-row").forEach(row => {
      const i = +row.dataset.i;
      row.querySelector("select").onchange = e => { S.redes_lista[i].red = e.target.value; save(); drawRedes(); };
      row.querySelector("input").oninput = e => { S.redes_lista[i].url = e.target.value.trim(); e.target.classList.remove("err"); save(); };
      row.querySelector(".del").onclick = () => { S.redes_lista.splice(i, 1); if (!S.redes_lista.length) S.redes_lista.push({ red: "Facebook", url: "" }); save(); drawRedes(); };
    });
  }
  function phRed(r) {
    return ({ Facebook: "https://facebook.com/sunegocio", Instagram: "https://instagram.com/sunegocio", TikTok: "https://tiktok.com/@sunegocio",
      YouTube: "https://youtube.com/@sunegocio", "WhatsApp Business": "https://wa.me/503…", "Google Maps": "https://maps.app.goo.gl/…", "Sitio web": "https://sunegocio.com" })[r] || "https://…";
  }
  function vEquipo() {
    let bad = false;
    S.redes_lista.forEach((r, i) => {
      if (!r.url) return;
      let u = r.url;
      if (!/^https?:\/\//i.test(u) && /^[\w-]+(\.[\w-]+)+/.test(u)) { u = "https://" + u; r.url = u; }
      try { const x = new URL(u); if (!/^https?:$/.test(x.protocol) || !x.hostname.includes(".")) throw 0; }
      catch (e) { bad = true; const el = document.querySelectorAll("#redes .red-row input")[i]; el && el.classList.add("err"); }
    });
    save();
    if (bad) return "Escriba el enlace completo de cada red (por ejemplo https://facebook.com/sunegocio).";
    return "";
  }

  // ---------- Paso 3 ----------
  function rRubro() {
    return `<h1>¿A qué se dedica su negocio?</h1><p class="lead">Las siguientes preguntas se adaptan a su rubro.</p>
      <div class="opt-cards" id="rubros">${RUBROS.map(r => `<button type="button" class="opt ${S.tipo === r.id ? "on" : ""}" data-v="${esc(r.id)}">
        <span class="em">${r.em}</span><b>${esc(r.id)}</b><span>${r.d}</span></button>`).join("")}</div>
      ${S.tipo === "Otro" ? input("tipo_otro", "¿Cuál?", { ph: "Describa su rubro", max: 80 }) : ""}`;
  }
  function afterRubro() {
    document.getElementById("rubros").onclick = e => {
      const b = e.target.closest(".opt"); if (!b) return;
      if (S.tipo !== b.dataset.v) S.rubro = {};
      S.tipo = b.dataset.v; save(); render();
    };
  }

  // ---------- Paso 4 ----------
  function rOferta() {
    const q = RQ[S.tipo] || RQ.Otro;
    let h = `<h1>Lo que ofrece y dónde grabamos</h1><p class="lead">Así planificamos cada toma.</p>`;
    h += input("r_oferta", q.oferta[0], { area: 1, ph: q.oferta[1], max: 1200, value: S.rubro.oferta || "", req: 1 });
    if (q.origen) h += `<div class="field"><span class="lbl">${q.origen[0]}</span>${chips("r_origen", q.origen[1], S.rubro.origen)}</div>`;
    if (q.visitantes) h += input("r_visitantes", q.visitantes[0], { area: 1, ph: q.visitantes[1], max: 800, value: S.rubro.visitantes || "" });
    h += `<div class="field"><span class="lbl">¿Qué espacios le gustaría que grabemos?</span><span class="hint">Puede marcar varios.</span>${chips("r_grabar", q.grabar, S.rubro.grabar || [], 1)}</div>`;
    h += input("r_otros", "¿Otro espacio o momento especial?", { ph: "Ej.: la fogata de la noche, el primer café del día", max: 200, value: S.rubro.otros || "" });
    return h;
  }

  // ---------- Paso 5 ----------
  function rEC() {
    return `<h1>Economía circular</h1><p class="lead">Mostramos cómo su negocio cuida los recursos. ¡Esto conecta mucho con el público!</p>
      <div class="field"><span class="lbl">¿Qué prácticas aplica?</span>${chips("practicas", PRACTICAS, S.practicas, 1)}</div>
      ${input("ejemplo_ec", "Cuéntenos un ejemplo concreto", { area: 1, ph: "Ej.: con la pulpa del café hacemos abono para el huerto", max: 2000 })}`;
  }

  // ---------- Paso 6 ----------
  function rHistoria() {
    return `<h1>Su historia y sus ideas</h1><p class="lead">Lo que hace único a su negocio es lo que más vistas genera.</p>
      ${input("historia", "¿Cómo nació su negocio?", { area: 1, req: 1, ph: "Quién lo inició, por qué, qué lo hace especial", max: 3000 })}
      <div class="field"><span class="lbl">¿Qué quiere lograr con el contenido?</span>${chips("objetivos", OBJ, S.objetivos, 1)}</div>
      <div class="b-grid2">
        ${input("producto", "Producto o servicio a destacar", { ph: "Ej.: el café de olla", max: 300 })}
        ${input("slogan", "Frase o eslogan (si tiene)", { ph: "Ej.: Sabor de montaña", max: 200 })}
      </div>
      ${input("publico", "¿Quiénes son sus clientes?", { ph: "Ej.: turistas de fin de semana, familias de Santa Ana", max: 1000 })}
      <div class="b-sub">¿Ya tiene alguna idea de lo que quiere?</div>
      <p class="hint" style="margin:-4px 0 10px">Queremos estar de acuerdo con su visión antes de grabar.</p>
      ${chips("idea_tiene", ["Sí, tengo una idea clara", "Tengo algunas ideas", "Prefiero que ustedes propongan"], S.idea_tiene)}
      <div class="idea-box ${S.idea_tiene && S.idea_tiene !== "Prefiero que ustedes propongan" ? "open" : ""}" id="ideaBox">
        ${input("idea", S.idea_tiene === "Sí, tengo una idea clara" ? "Cuéntenos su idea" : "Cuéntenos sus ideas", { area: 1, ph: "Ej.: un video mostrando el camino desde la finca hasta la taza; un estilo divertido; un reel con música alegre…", max: 3000 })}</div>
      <div class="b-sub">Fotos y videos del negocio</div>
      <p class="hint" style="margin:-4px 0 10px">Nos ayudan a preparar las tomas. Súbalas aquí desde su celular o envíelas por WhatsApp.</p>
      <label class="up-box"><input type="file" id="upF" accept="image/*" multiple><span class="up-ic">📷</span><b>Agregar fotos</b><span class="hint">Desde la galería o la cámara · hasta 10 fotos</span></label>
      <div class="up-grid" id="upG"></div>
      <div class="field" style="margin-top:12px"><span class="lbl">¿Cómo prefiere compartir más material?</span>${chips("material", ["Ya las subí aquí", "Se las envío por WhatsApp", "Tengo pocas", "No tengo"], S.material)}</div>`;
  }

  function afterHistoria() {
    drawUp();
    document.getElementById("upF").onchange = async e => {
      const files = [...e.target.files].slice(0, 10 - S.fotos.length); e.target.value = "";
      if (!files.length) return MZ.toast("Máximo 10 fotos");
      for (const f of files) {
        const tmp = { url: URL.createObjectURL(f), subiendo: true }; S.fotos.push(tmp); drawUp();
        try { const blob = await shrink(f); tmp.url = await subirPublica(blob, f.name); delete tmp.subiendo; save(); }
        catch (err) { S.fotos.splice(S.fotos.indexOf(tmp), 1); MZ.toast("No se pudo subir una foto. Intente de nuevo o envíela por WhatsApp.", 4000); }
        drawUp();
      }
      if (S.fotos.length && !S.material) { S.material = "Ya las subí aquí"; card.querySelectorAll('[data-chips="material"] .chip').forEach(c => c.classList.toggle("on", c.dataset.v === S.material)); save(); }
    };
  }
  function drawUp() {
    const g = document.getElementById("upG"); if (!g) return;
    g.innerHTML = S.fotos.map((f, i) => `<div class="up-th ${f.subiendo ? "ld" : ""}" style="background-image:url('${esc(f.url)}')">${f.subiendo ? '<span class="spin"></span>' : `<button type="button" data-rm="${i}" aria-label="Quitar">×</button>`}</div>`).join("");
    g.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { S.fotos.splice(+b.dataset.rm, 1); save(); drawUp(); });
  }
  function shrink(file) {
    return new Promise(res => {
      const img = new Image(); img.onload = () => {
        const m = 1600, k = Math.min(1, m / Math.max(img.width, img.height)); const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => res(b || file), "image/jpeg", .84);
      }; img.onerror = () => res(file); img.src = URL.createObjectURL(file);
    });
  }
  async function subirPublica(blob, name) {
    const r = await fetch(`${MZ.SB_URL}/functions/v1/admin-upload`, { method: "POST", headers: { "Content-Type": "application/json", apikey: "sb_publishable_QktwCj57rCNRgGEep66_ZA_PcYHqlP6" },
      body: JSON.stringify({ modo: "brief", filename: (name || "foto").replace(/\.[^.]+$/, "") + ".jpg", contentType: "image/jpeg" }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    const up = await fetch(`${MZ.SB_URL}/storage/v1/object/upload/sign/media/${j.path}?token=${j.token}`, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob });
    if (!up.ok) throw new Error("subida");
    return j.publicUrl;
  }

  // ---------- Paso 7: calendario ----------
  let calMonth;
  const DIAS = [[1, "L", "Lunes"], [2, "M", "Martes"], [3, "Mi", "Miércoles"], [4, "J", "Jueves"], [5, "V", "Viernes"], [6, "S", "Sábado"], [0, "D", "Domingo"]];
  const HORAS = []; for (let h = 5; h <= 23; h++) for (const m of ["00", "30"]) HORAS.push(`${String(h).padStart(2, "0")}:${m}`);
  const h12 = t => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`; };
  function horarioTexto() {
    const d = S.hj.dias; if (!d.length) return "";
    const ord = DIAS.filter(x => d.includes(x[0])).map(x => x[2]);
    const idx = DIAS.map(x => x[0]).filter(x => d.includes(x)).map(x => DIAS.findIndex(y => y[0] === x));
    const seguido = idx.length > 2 && idx.every((v, i) => !i || v === idx[i - 1] + 1);
    const dias = seguido ? `${ord[0]} a ${ord[ord.length - 1]}` : ord.join(", ");
    return `${dias}, de ${h12(S.hj.abre)} a ${h12(S.hj.cierra)}`.toLowerCase().replace(/^./, c => c.toUpperCase());
  }
  function rFechas() {
    return `<h1>¿Qué días podemos grabar?</h1><p class="lead">Primero marque su horario de atención; luego toque en el calendario los días que le convienen.</p>
      <div class="b-sub">Horario de atención</div>
      <div class="field"><span class="lbl">Días que abre</span><div class="dsel" id="dSel">${DIAS.map(x => `<button type="button" class="${S.hj.dias.includes(x[0]) ? "on" : ""}" data-d="${x[0]}" aria-label="${x[2]}">${x[1]}</button>`).join("")}</div></div>
      <div class="b-grid2"><div class="field"><label class="lbl" for="hA">Abre</label><select class="input" id="hA">${HORAS.map(h => `<option value="${h}" ${h === S.hj.abre ? "selected" : ""}>${h12(h)}</option>`).join("")}</select></div>
        <div class="field"><label class="lbl" for="hC">Cierra</label><select class="input" id="hC">${HORAS.map(h => `<option value="${h}" ${h === S.hj.cierra ? "selected" : ""}>${h12(h)}</option>`).join("")}</select></div></div>
      <p class="hint" id="hTxt">${esc(horarioTexto() || "Si no marca días, todos quedan disponibles.")}</p>
      <div class="b-sub">Así se ve la luz en cada momento</div>
      <div class="luz">
        <div><span>☀️</span><b>Mañana · 7 a 10</b><p>Luz suave y pocos clientes. Ideal para cocina, productos y equipo.</p></div>
        <div><span>🌤️</span><b>Mediodía · 11 a 2</b><p>Luz fuerte. Mejor para interiores y espacios con sombra.</p></div>
        <div><span>🌅</span><b>Tarde · 3 a 5:30</b><p>Hora dorada: paisajes, terrazas y fachadas se ven mejor.</p></div>
      </div>
      <div class="b-sub">Elija los días</div>
      <div class="cal" id="cal"></div>
      <div class="sel-list" id="selList"></div>`;
  }
  function afterFechas() {
    calMonth = calMonth || new Date(new Date().getFullYear(), new Date().getMonth(), 1); drawCal();
    const upd = () => { S.horario = horarioTexto(); document.getElementById("hTxt").textContent = S.horario || "Si no marca días, todos quedan disponibles.";
      const cl = closedDays(); S.disponibilidad = S.disponibilidad.filter(d => !cl.has(new Date(d.fecha + "T12:00").getDay())); save(); drawCal(); };
    document.getElementById("dSel").onclick = e => { const b = e.target.closest("button"); if (!b) return; const d = +b.dataset.d;
      S.hj.dias = S.hj.dias.includes(d) ? S.hj.dias.filter(x => x !== d) : S.hj.dias.concat(d); b.classList.toggle("on"); upd(); };
    document.getElementById("hA").onchange = e => { S.hj.abre = e.target.value; upd(); };
    document.getElementById("hC").onchange = e => { S.hj.cierra = e.target.value; upd(); };
  }
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  function drawCal() {
    const box = document.getElementById("cal"); if (!box) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const max = new Date(today); max.setDate(max.getDate() + 90);
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
    const off = (first.getDay() + 6) % 7;
    const sel = new Set(S.disponibilidad.map(d => d.fecha));
    const closed = closedDays();
    let g = ["L", "M", "M", "J", "V", "S", "D"].map(d => `<div class="dw">${d}</div>`).join("");
    for (let i = 0; i < off; i++) g += "<div></div>";
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d), k = fmt(dt);
      const cerrado = closed.has(dt.getDay()), dis = dt < today || dt > max || cerrado;
      g += `<button type="button" data-d="${k}" ${dis ? "disabled" : ""} class="${sel.has(k) ? "sel" : ""} ${+dt === +today ? "today" : ""} ${cerrado ? "closed" : ""}" ${cerrado ? 'title="Cerrado"' : ""}>${d}</button>`;
    }
    let name = first.toLocaleDateString("es-SV", { month: "long", year: "numeric" }); name = name.charAt(0).toUpperCase() + name.slice(1);
    box.innerHTML = `<div class="cal-h"><button type="button" class="icon-btn" id="cPrev" aria-label="Mes anterior">${I.back}</button><b>${name}</b>
      <button type="button" class="icon-btn" id="cNext" aria-label="Mes siguiente" style="transform:scaleX(-1)">${I.back}</button></div>
      <div class="cal-g">${g}</div>
      <div class="cal-legend"><span><i style="background:var(--pollo)"></i>Elegido</span><span><i style="box-shadow:inset 0 0 0 1.5px var(--cafe-2)"></i>Hoy</span>${closed.size ? '<span><i style="background:repeating-linear-gradient(45deg,#ddd 0 2px,transparent 2px 4px)"></i>Cerrado</span>' : ""}</div>`;
    document.getElementById("cPrev").onclick = () => { calMonth = new Date(y, m - 1, 1); if (calMonth < new Date(today.getFullYear(), today.getMonth(), 1)) calMonth = new Date(today.getFullYear(), today.getMonth(), 1); drawCal(); };
    document.getElementById("cNext").onclick = () => { calMonth = new Date(y, m + 1, 1); drawCal(); };
    box.querySelector(".cal-g").onclick = e => {
      const b = e.target.closest("button[data-d]"); if (!b || b.disabled) return;
      const k = b.dataset.d, i = S.disponibilidad.findIndex(x => x.fecha === k);
      if (i >= 0) S.disponibilidad.splice(i, 1); else S.disponibilidad.push({ fecha: k, franjas: ["Mañana"] });
      S.disponibilidad.sort((a, b) => a.fecha.localeCompare(b.fecha)); save();
      b.classList.toggle("sel", i < 0); if (navigator.vibrate) navigator.vibrate(8);
      drawSel(k);
    };
    drawSel();
  }
  function closedDays() {
    if (S.hj && S.hj.dias.length) return new Set([0, 1, 2, 3, 4, 5, 6].filter(d => !S.hj.dias.includes(d)));
    const h = (S.horario || "").toLowerCase(); const map = { lunes: 1, martes: 2, "miércoles": 3, miercoles: 3, jueves: 4, viernes: 5, "sábado": 6, sabado: 6, domingo: 0 };
    const order = [1, 2, 3, 4, 5, 6, 0];
    const m = h.match(/(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*(?:a|-|al)\s*(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/);
    if (!m) return new Set();
    const a = order.indexOf(map[m[1]]), b = order.indexOf(map[m[2]]);
    const open = new Set(); for (let i = a; ; i = (i + 1) % 7) { open.add(order[i]); if (i === b) break; }
    return new Set(order.filter(d => !open.has(d)));
  }
  function drawSel(nuevo) {
    const box = document.getElementById("selList"); if (!box) return;
    if (!S.disponibilidad.length) { box.innerHTML = '<p class="hint">Aún no ha elegido días.</p>'; return; }
    box.innerHTML = S.disponibilidad.map((d, i) => {
      const dt = new Date(d.fecha + "T12:00:00");
      return `<div class="sel-item ${d.fecha === nuevo ? "new" : ""}"><b>${(x => x.charAt(0).toUpperCase() + x.slice(1))(dt.toLocaleDateString("es-SV", { weekday: "long", day: "numeric", month: "short" }))}</b>
        <div class="seg" data-i="${i}">${FRANJAS.map(f => `<button type="button" class="${d.franjas.includes(f) ? "on" : ""}" data-f="${f}">${f}</button>`).join("")}</div></div>`;
    }).join("");
    box.querySelectorAll(".seg").forEach(sg => sg.onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      const d = S.disponibilidad[+sg.dataset.i], f = b.dataset.f;
      d.franjas = d.franjas.includes(f) ? d.franjas.filter(x => x !== f) : d.franjas.concat(f);
      if (!d.franjas.length) d.franjas = [f];
      save(); drawSel();
    });
  }

  // ---------- Paso 8 ----------
  function rRevision() {
    const dl = rows => `<dl>${rows.filter(r => r[1]).map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl>`;
    const sec = (t, i, rows) => `<div class="rev-s"><h3>${t}<button type="button" data-go="${i}">Editar</button></h3>${dl(rows)}</div>`;
    const redes = S.redes_lista.filter(r => r.url).map(r => r.red).join(", ");
    const fechas = S.disponibilidad.map(d => new Date(d.fecha + "T12:00:00").toLocaleDateString("es-SV", { day: "numeric", month: "short" })).join(", ");
    return `<h1>Revise y envíe</h1><p class="lead">Confirme que todo esté bien. Puede editar cualquier sección.</p>
      <div class="rev">
        ${sec("Su negocio", 0, [["Negocio", S.nombre], ["Responsable", S.responsable], ["WhatsApp", S.whatsapp], ["Dirección", S.ubicacion], ["GPS", S.lat ? `${S.lat}, ${S.lng}` : (S.maps_url ? "Enlace de Google Maps" : "")], ["Tiempo", S.anios]])}
        ${sec("Equipo y redes", 1, [["Equipo", `${S.mujeres || 0} mujeres · ${S.hombres || 0} hombres`], ["Edades", S.edades.join(", ")], ["Redes", redes]])}
        ${sec("Rubro y oferta", 2, [["Rubro", S.tipo === "Otro" && S.tipo_otro ? "Otro: " + S.tipo_otro : S.tipo], ["Oferta", S.rubro.oferta], ["Grabar", (S.rubro.grabar || []).join(", ")]])}
        ${sec("Economía circular", 4, [["Prácticas", S.practicas.join(", ")], ["Ejemplo", S.ejemplo_ec]])}
        ${sec("Historia e ideas", 5, [["Historia", S.historia], ["Objetivos", S.objetivos.join(", ")], ["Idea", S.idea_tiene ? S.idea_tiene + (S.idea ? ": " + S.idea : "") : ""]])}
        ${sec("Fotos e ideas", 5, [["Fotos", S.fotos.filter(f => !f.subiendo).length ? S.fotos.length + " foto(s) subida(s)" : ""], ["Material", S.material]])}
        ${sec("Fechas", 6, [["Horario", S.horario], ["Días", fechas]])}
      </div>
      <p class="hint" style="margin-top:14px">Al enviar, sus datos solo los ve el equipo de Estudio Maíz para preparar su propuesta.</p>`;
  }
  function afterRevision() { S._rev = 1; save(); card.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { step = +b.dataset.go; save(); render(); }); }

  // ---------- Envío ----------
  async function enviar() {
    bNext.disabled = true; bNext.textContent = "Enviando…";
    const disp = S.disponibilidad.map(d => ({ fecha: d.fecha, franjas: d.franjas }));
    const grab = disp.map(d => `${new Date(d.fecha + "T12:00:00").toLocaleDateString("es-SV", { weekday: "short", day: "numeric", month: "short" })} (${d.franjas.join("/")})`).join("; ");
    const redesL = S.redes_lista.filter(r => r.url).map(r => ({ red: r.red, url: r.url.slice(0, 300) }));
    const rubro = Object.assign({}, S.rubro);
    if (S.tipo === "Otro" && S.tipo_otro) rubro.tipo_otro = S.tipo_otro;
    if (rubro.otros) { rubro.grabar = (rubro.grabar || []).concat(rubro.otros); delete rubro.otros; }
    const obj = S.objetivos.join(", ");
    const row = {
      nombre: (S.nombre || "").trim().slice(0, 150), responsable: (S.responsable || "").trim().slice(0, 150), whatsapp: (S.whatsapp || "").trim().slice(0, 30),
      ubicacion: (S.ubicacion || "").slice(0, 300), anios: S.anios || null, horario: (S.horario || "").slice(0, 200),
      mujeres: Math.min(9999, +S.mujeres || 0), hombres: Math.min(9999, +S.hombres || 0), edades: S.edades,
      redes: redesL.map(r => `${r.red}: ${r.url}`).join(" · ").slice(0, 500), redes_lista: redesL,
      tipo: S.tipo, rubro, practicas: S.practicas, ejemplo_ec: (S.ejemplo_ec || "").slice(0, 2000),
      historia: (S.historia || "").slice(0, 3000), slogan: (S.slogan || "").slice(0, 200), objetivo: obj, producto: (S.producto || "").slice(0, 300),
      publico: (S.publico || "").slice(0, 1000), material: (S.material || "").slice(0, 500), grabacion: grab.slice(0, 300),
      idea: ((S.idea_tiene || "") + (S.idea ? ": " + S.idea : "")).slice(0, 3000),
      maps_url: S.maps_url ? S.maps_url.trim().slice(0, 600) : null, lat: S.lat || null, lng: S.lng || null,
      disponibilidad: disp, servicio: S.servicio || null, estado: "nuevo",
      fotos: S.fotos.filter(f => !f.subiendo && /^https:/.test(f.url)).map(f => f.url).slice(0, 10), horario_json: S.hj
    };
    try {
      await MZ.sbInsert("briefs", row);
      MZ.track("brief_envio");
      localStorage.removeItem(KEY);
      const cfg = MZ.CFG();
      const msg = `Hola, acabo de enviar el brief de *${row.nombre}*. Mi nombre es ${row.responsable}. Días posibles para grabar: ${grab || "por definir"}.`;
      card.innerHTML = `<div class="done">${MZ.mascot(120)}<h1>¡Gracias, ${esc(row.responsable.split(" ")[0])}!</h1>
        <p class="lead" style="margin:10px auto 22px;max-width:460px">Recibimos la información de <b>${esc(row.nombre)}</b>. Revisaremos su ficha y le escribiremos por WhatsApp para confirmar la fecha de grabación.</p>
        <a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/${cfg.marca.whatsapp}?text=${encodeURIComponent(msg)}">${I.wa} Avisar por WhatsApp</a>
        <div style="margin-top:12px"><a class="btn btn-ghost" href="/">Volver al inicio</a></div></div>`;
      document.getElementById("bNav").classList.add("hidden"); side.style.visibility = "hidden"; document.getElementById("bSave").classList.add("hidden");
      document.getElementById("bBar").style.width = "100%";
      document.getElementById("bStepName").textContent = "¡Enviado!";
      document.getElementById("bCount").textContent = "✓";
    } catch (e) {
      console.error(e);
      MZ.toast("No se pudo enviar. Revise su conexión e intente de nuevo.", 4000);
      bNext.disabled = false; bNext.textContent = "Enviar";
    }
  }

  // ---------- Render ----------
  const AFTER = { 0: afterNegocio, 1: afterEquipo, 2: afterRubro, 5: afterHistoria, 6: afterFechas, 7: afterRevision };
  const FOCO = { 2: "#rubros", 3: "#f_r_oferta", 4: '[data-chips="practicas"]', 5: "#f_historia", 6: "#cal" };
  function irAlError() {
    const el = card.querySelector(".err") || card.querySelector(FOCO[step]); if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const box = el.closest(".field") || el; box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
    if (el.focus && /INPUT|TEXTAREA|SELECT/.test(el.tagName)) setTimeout(() => el.focus({ preventScroll: true }), 350);
  }
  function render() {
    if (map) { map.remove(); map = null; marker = null; }
    card.innerHTML = STEPS[step].r();
    card.style.animation = "none"; card.offsetHeight; card.style.animation = "";
    bindInputs();
    // chips de franjas: refrescar días ya elegidos sin cambiar las selecciones previas
    AFTER[step] && AFTER[step]();
    document.getElementById("bStepName").textContent = STEPS[step].t;
    document.getElementById("bCount").textContent = `${step + 1}/${STEPS.length}`;
    document.getElementById("bBar").style.width = `${((step + 1) / STEPS.length) * 100}%`;
    bPrev.style.display = step ? "" : "none";
    bNext.textContent = step === STEPS.length - 1 ? "Enviar" : S._rev ? "Guardar y volver a revisión" : "Siguiente";
    let bar = document.getElementById("bChips");
    if (!bar) { bar = document.createElement("nav"); bar.id = "bChips"; bar.className = "b-chips"; document.querySelector(".b-top").after(bar); }
    bar.innerHTML = STEPS.map((x, i) => `<button type="button" class="${i === step ? "on" : ""} ${i < step || S._rev ? "ok" : ""}" data-i="${i}">${i + 1}. ${x.t}</button>`).join("");
    bar.querySelectorAll("button").forEach(b => b.onclick = () => { const i = +b.dataset.i; if (i <= step || S._rev || canJump(i)) { step = i; save(); render(); } else MZ.toast("Complete primero esta sección"); });
    const on = bar.querySelector(".on"); on && on.scrollIntoView({ inline: "center", block: "nearest" });
    bNext.className = "btn " + (step === STEPS.length - 1 ? "btn-accent" : "btn-primary");
    side.innerHTML = STEPS.map((s, i) => `<button type="button" class="${i === step ? "on" : ""} ${i < step ? "ok" : ""}" data-i="${i}"><span class="n">${i < step ? "✓" : i + 1}</span>${s.t}</button>`).join("");
    side.querySelectorAll("button").forEach(b => b.onclick = () => { const i = +b.dataset.i; if (i <= step || S._rev || canJump(i)) { step = i; save(); render(); } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function canJump(i) { for (let k = step; k < i; k++) { const s = step; step = k; const ok = !STEPS[k].v(); step = s; if (!ok) return false; } return true; }
  bPrev.onclick = () => { if (step > 0) { step--; save(); render(); } };
  bNext.onclick = () => {
    const err = STEPS[step].v();
    if (err) { MZ.toast(err, 3200); irAlError(); return; }
    if (!started) { started = true; S._started = 1; MZ.track("brief_inicio"); }
    if (step === STEPS.length - 1) return enviar();
    step = S._rev ? STEPS.length - 1 : step + 1; save(); render();
  };
  render();
})();
