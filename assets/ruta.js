/* Ruta Maíz · mapa, rutas, pasaporte y negocios */
(function () {
  const { esc, I } = MZ;
  MZ.aurora(); MZ.track("vista"); MZ.dock("ruta");
  MZ.waFab("Hola, vengo de Ruta Maíz y quisiera información.");
  document.getElementById("bk").innerHTML = I.back;

  const EMO = { "Café": "☕", "Restaurante": "🍽️", "Hospedaje": "🛏️", "Finca": "🌱", "Tienda": "🛍️", "Experiencia": "🧭" };
  let LOC = [], RUT = [], cat = "", muni = "", precio = "", serv = "", query = "", tab = "lugares", activeRoute = null, activeId = null;
  const map = L.map("map", { zoomControl: false, typeControl: false }).setView([13.86, -89.75], 10);
  const TILES = { roadmap: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png", "© OpenStreetMap"],
    hybrid: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", "© Esri"],
    terrain: ["https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", "© OpenTopoMap"] };
  let base = L.tileLayer(TILES.roadmap[0], { maxZoom: 19, attribution: TILES.roadmap[1] }).addTo(map), vista = "roadmap", verReserva = localStorage.getItem("ruta_reserva") !== "0";
  const resLayer = L.layerGroup().addTo(map);
  const layer = L.layerGroup().addTo(map), routeLayer = L.layerGroup().addTo(map);
  const markers = {};

  // ---------- Pasaporte (se guarda en este dispositivo) ----------
  const PK = "maiz_pasaporte";
  const pass = () => { try { return JSON.parse(localStorage.getItem(PK)) || { sellos: {} }; } catch (e) { return { sellos: {} }; } };
  const savePass = p => localStorage.setItem(PK, JSON.stringify(p));
  const NIVELES = [[0, "Semilla", "🌱"], [2, "Brote", "🌿"], [5, "Milpa", "🌾"], [10, "Mazorca de oro", "🌽"]];
  function nivel(n) { let l = NIVELES[0]; NIVELES.forEach(x => { if (n >= x[0]) l = x; }); const nx = NIVELES.find(x => x[0] > n); return { l, nx }; }
  function insignias(p) {
    const ids = Object.keys(p.sellos), got = LOC.filter(l => ids.includes(l.id));
    const rutaOk = RUT.some(r => (r.locales || []).length && r.locales.every(id => ids.includes(id)));
    return [
      ["🎟️", "Primer sello", "Visite su primer local", ids.length >= 1],
      ["☕", "Cafetero", "3 cafés o fincas", got.filter(l => /Café|Finca/.test(l.categoria)).length >= 3],
      ["♻️", "Eco viajero", "3 locales con economía circular", got.filter(l => (l.practicas || []).length).length >= 3],
      ["🧭", "Ruta completa", "Termine una ruta", rutaOk],
      ["🗺️", "Explorador", "Locales en 4 municipios", new Set(got.map(l => l.municipio)).size >= 4]];
  }

  // ---------- Datos ----------
  async function load() {
    try {
      [LOC, RUT] = await Promise.all([MZ.sbSelect("ruta_locales", "select=*&order=plan.desc,nombre.asc"), MZ.sbSelect("ruta_rutas", "select=*&order=created_at.asc")]);
    } catch (e) { LOC = []; RUT = []; }
    // destacados y aliados primero
    const rank = { aliado: 0, destacado: 1, basico: 2 };
    LOC.sort((a, b) => (rank[a.plan] ?? 3) - (rank[b.plan] ?? 3));
    drawCats(); render(); dibujarReserva();
    if (LOC.length) map.fitBounds(L.latLngBounds(LOC.filter(l => l.lat).map(l => [l.lat, l.lng])).pad(0.25));
  }
  function filtered() {
    const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return LOC.filter(l => (!cat || l.categoria === cat) && (!muni || l.municipio === muni) && (!precio || (parseMoney(l.consumo)[0] || 0) <= +precio) &&
      (!serv || (l.servicios || []).includes(serv)) &&
      (!q || [l.nombre, l.categoria, l.municipio, l.descripcion, (l.servicios || []).join(" "), (l.menu || []).map(c => c.items.map(i => i.n).join(" ")).join(" ")]
        .join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)));
  }
  function drawCats() {
    const cats = [...new Set(LOC.map(l => l.categoria).filter(Boolean))];
    const box = document.getElementById("cats");
    box.innerHTML = `<button class="chip ${!cat ? "on" : ""}" data-c="">Todo</button>` + cats.map(c => `<button class="chip ${cat === c ? "on" : ""}" data-c="${esc(c)}">${EMO[c] || "📍"} ${esc(c)}</button>`).join("");
    box.onclick = e => { const b = e.target.closest(".chip"); if (!b) return; cat = b.dataset.c; drawCats(); if (tab !== "lugares") setTab("lugares"); else render(); };
  }
  function drawMarkers(list) {
    layer.clearLayers();
    list.filter(l => l.lat).forEach(l => {
      const html = `<span class="pin ${l.plan !== "basico" ? "dest" : ""} ${activeId === l.id ? "on" : ""}">${EMO[l.categoria] || "📍"} ${"$".repeat(l.precio_nivel || 1)}</span>`;
      const m = L.marker([l.lat, l.lng], { icon: L.divIcon({ html, className: "", iconSize: [0, 0] }) }).addTo(layer);
      m.on("click", () => detail(l)); markers[l.id] = m;
    });
  }
  function setTab(t) { tab = t; document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.t === t)); render(); }
  document.getElementById("tabs").onclick = e => { const b = e.target.closest("button"); if (b) setTab(b.dataset.t); };
  document.getElementById("q").oninput = e => { query = e.target.value; if (tab !== "lugares") setTab("lugares"); else render(); };
  document.getElementById("loc").onclick = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p => { const ll = [p.coords.latitude, p.coords.longitude]; L.circleMarker(ll, { radius: 8, color: "#fff", weight: 3, fillColor: "#2f7de1", fillOpacity: 1 }).addTo(routeLayer); map.setView(ll, 13); },
      () => MZ.toast("No pudimos obtener su ubicación"));
  };

  const body = () => document.getElementById("pbody");
  function render() {
    if (tab !== "rutas") { routeLayer.clearLayers(); activeRoute = null; }
    ({ lugares, rutas, pasaporte, negocios })[tab]();
  }

  // ---------- Lugares ----------
  function lugares() {
    const L2 = filtered(); drawMarkers(L2);
    const munis = [...new Set(LOC.map(l => l.municipio).filter(Boolean))].sort();
    const servs = [...new Set(LOC.flatMap(l => l.servicios || []))].sort();
    body().innerHTML = `<div class="r-filters">
        <select class="input" id="fm" aria-label="Municipio"><option value="">📍 Municipio</option>${munis.map(m => `<option ${m === muni ? "selected" : ""}>${esc(m)}</option>`).join("")}</select>
        <label class="r-money"><span>$</span><input class="input" id="fp" type="number" inputmode="decimal" min="0" step="1" placeholder="Gasto máx." aria-label="Gasto máximo por persona en dólares" value="${esc(precio)}"></label>
        <select class="input" id="fs" aria-label="Servicios"><option value="">✨ Servicios</option>${servs.map(s => `<option ${s === serv ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></div>
      <div class="r-count">${L2.length} lugar(es)${cat ? " · " + esc(cat) : ""}${(muni || precio || serv || cat || query) ? ' · <a href="#" id="clr">Quitar filtros</a>' : ""}</div>
      <div class="r-list">${L2.map(l => `<div class="place ${activeId === l.id ? "active" : ""}" data-id="${l.id}">
        <div class="img" style="${l.foto_url ? `background-image:url('${esc(l.foto_url)}')` : ""}">${l.foto_url ? "" : EMO[l.categoria] || "📍"}${l.plan !== "basico" ? '<span class="badge">⭐ Recomendado</span>' : ""}</div>
        <div style="min-width:0"><div class="meta">${esc(l.categoria || "")} · ${esc(l.municipio || "")}</div><h3>${esc(l.nombre)}</h3>
        <div class="meta">${esc(l.consumo || "")} ${l.horario ? "· " + esc(l.horario) : ""}</div>${l.promo ? `<span class="promo">🎁 Promoción</span>` : ""}${l.ejemplo ? ' <span class="tag" style="margin-top:6px">Ejemplo</span>' : ""}</div></div>`).join("") || '<p class="muted">No encontramos lugares con esos filtros.</p>'}</div>`;
    const b = body();
    b.querySelector("#fm").onchange = e => { muni = e.target.value; render(); };
    let tP; b.querySelector("#fp").oninput = e => { clearTimeout(tP); tP = setTimeout(() => { precio = e.target.value; render(); const f = document.getElementById("fp"); f.focus(); f.setSelectionRange && 0; }, 450); };
    b.querySelector("#fs").onchange = e => { serv = e.target.value; render(); };
    const clr = b.querySelector("#clr"); if (clr) clr.onclick = e => { e.preventDefault(); muni = precio = serv = cat = query = ""; document.getElementById("q").value = ""; drawCats(); render(); };
    b.querySelectorAll(".place").forEach(p => {
      p.onclick = () => detail(LOC.find(l => l.id === p.dataset.id));
      p.onmouseenter = () => { const l = LOC.find(x => x.id === p.dataset.id); if (l && l.lat && innerWidth >= 900) map.panTo([l.lat, l.lng]); };
    });
  }

  // ---------- Detalle ----------
  function detail(l) {
    activeId = l.id; MZ.track("ruta_ver", "/ruta-maiz/" + l.nombre.slice(0, 60));
    if (l.lat) map.setView([l.lat, l.lng], Math.max(map.getZoom(), 13));
    const p = pass(), got = !!p.sellos[l.id];
    const wa = l.whatsapp ? (l.whatsapp.replace(/\D/g, "").length === 8 ? "503" : "") + l.whatsapp.replace(/\D/g, "") : null;
    const bg = document.createElement("div"); bg.className = "d-bg";
    bg.innerHTML = `<div class="d-sheet" role="dialog" aria-label="${esc(l.nombre)}"><div class="d-hero" style="${l.foto_url ? `background-image:url('${esc(l.foto_url)}')` : ""}">${l.foto_url ? "" : EMO[l.categoria] || "📍"}<button class="icon-btn" data-x aria-label="Cerrar">×</button></div>
      <div class="d-body"><div class="small muted">${esc(l.categoria || "")} · ${esc(l.municipio || "")}${l.ejemplo ? ' · <span class="tag">Local de ejemplo</span>' : ""}</div>
        <h2>${esc(l.nombre)}</h2><p class="muted" style="margin-top:6px">${esc(l.descripcion || "")}</p>
        <div class="d-kv"><div><b>${esc(l.consumo || "—")}</b>Consumo aprox.</div><div><b>${"$".repeat(l.precio_nivel || 1)}</b>Precio</div><div><b>${esc((l.horario || "—").split("·")[0])}</b>Abre</div></div>
        ${l.promo ? `<div class="promo-card"><span class="e">🎁</span><div><b>Promoción</b><div class="small">${esc(l.promo)}</div></div></div>` : ""}
        ${(l.pros || []).length || (l.contras || []).length ? `<div class="pc"><div class="p"><b>👍 Lo mejor</b><ul>${(l.pros || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="c"><b>👀 Tome en cuenta</b><ul>${(l.contras || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>` : ""}
        ${l.wifi_ssid ? `<div class="wifi"><span class="e">📶</span><div style="min-width:0;flex:1"><b>Wi-Fi para clientes</b><div class="small">Red: <b>${esc(l.wifi_ssid)}</b>${l.wifi_pass ? ` · Clave: <code>${esc(l.wifi_pass)}</code>` : " · Abierta"}</div></div>
          <div class="wifi-b">${l.wifi_pass ? '<button class="btn btn-sm btn-accent" id="wCopy">Copiar clave</button>' : ""}<button class="btn btn-sm btn-ghost" id="wQr">QR</button></div></div><div id="wQrBox"></div>` : ""}
        ${(l.practicas || []).length ? `<p class="small" style="margin:10px 0 6px"><b>♻️ Economía circular</b></p><div class="chips">${l.practicas.map(x => `<span class="tag g">${esc(x)}</span>`).join("")}</div>` : ""}
        ${(l.servicios || []).length ? `<p class="small" style="margin:14px 0 6px"><b>✨ Servicios</b>${l.categoria === "Hospedaje" ? " · puede reservarlos por WhatsApp" : ""}</p><div class="chips">${l.servicios.map(x => wa && l.categoria === "Hospedaje" ? `<a class="chip" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(`Hola, vi ${l.nombre} en Ruta Maíz y quisiera reservar: ${x}.`)}">${esc(x)} ›</a>` : `<span class="chip">${esc(x)}</span>`).join("")}</div>` : ""}
        <div class="stack" style="margin-top:18px">
          ${l.menu_url ? `<a class="btn btn-accent" target="_blank" rel="noopener" href="${esc(l.menu_url)}">📖 Ver menú digital</a>` : (l.menu || []).length ? `<button class="btn btn-accent" id="mbtn">📖 Ver menú digital</button>` : ""}
          <div class="row" style="flex-wrap:nowrap">${l.lat ? `<a class="btn btn-ghost" style="flex:1" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}">${I.mapa} Cómo llegar</a>` : ""}
            ${wa ? `<a class="btn btn-wa" style="flex:1" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent("Hola, los encontré en Ruta Maíz.")}">${I.wa} Escribir</a>` : ""}</div>
          ${l.lat ? '<button class="btn btn-ghost" id="v3d">🌍 Ver en 3D</button>' : ""}
          <button class="btn ${got ? "btn-ghost" : "btn-primary"}" id="sello">${got ? "✓ Sello obtenido" : "🎟️ Estoy aquí: sellar mi pasaporte"}</button>
        </div><div id="menuBox"></div></div></div>`;
    const close = () => { bg.remove(); activeId = null; if (tab === "lugares") render(); };
    bg.onclick = e => { if (e.target === bg || e.target.closest("[data-x]")) close(); };
    document.body.appendChild(bg);
    const mb = bg.querySelector("#mbtn");
    if (mb) mb.onclick = () => { bg.querySelector("#menuBox").innerHTML = (l.menu || []).map(c => `<div class="menu-cat"><h4>${esc(c.cat)}</h4>${(c.items || []).map(i => `<div class="menu-it"><span>${esc(i.n)}</span><b>${i.p ? "$" + esc(i.p) : ""}</b></div>`).join("")}</div>`).join(""); mb.remove(); };
    const wc = bg.querySelector("#wCopy");
    if (wc) wc.onclick = async () => { try { await navigator.clipboard.writeText(l.wifi_pass); MZ.toast("Clave copiada ✓ Abra Ajustes → Wi-Fi y péguela", 3500); } catch (e) { MZ.toast("Clave: " + l.wifi_pass, 5000); } };
    const wq = bg.querySelector("#wQr");
    if (wq) wq.onclick = () => qrWifi(l, bg.querySelector("#wQrBox"));
    const v3 = bg.querySelector("#v3d"); if (v3) v3.onclick = () => { bg.remove(); abrir3D(l); };
    bg.querySelector("#sello").onclick = () => {
      if (got) return;
      if (!navigator.geolocation || !l.lat) return MZ.toast("No se puede verificar la ubicación");
      MZ.toast("Verificando que esté en el lugar…");
      navigator.geolocation.getCurrentPosition(pos => {
        const d = map.distance([pos.coords.latitude, pos.coords.longitude], [l.lat, l.lng]);
        if (d > 600) return MZ.toast(`Está a ${(d / 1000).toFixed(1)} km. Acérquese al local para sellar.`, 3500);
        const pp = pass(); pp.sellos[l.id] = new Date().toISOString(); savePass(pp);
        MZ.toast("🎉 ¡Sello agregado a su Pasaporte Maíz!", 3500); close(); setTab("pasaporte");
      }, () => MZ.toast("Active la ubicación para sellar su pasaporte", 3500), { enableHighAccuracy: true, timeout: 12000 });
    };
  }

  // ---------- Rutas ----------
  function parseMoney(s) { const n = (s || "").match(/\d+(\.\d+)?/g); return n ? [+n[0], +(n[1] || n[0])] : [0, 0]; }
  function rutas() {
    drawMarkers([]);
    body().innerHTML = `<p class="muted small" style="margin-bottom:12px">Rutas recomendadas por Proyecto Maíz. Toque una para verla en el mapa.</p>` +
      (RUT.map(r => {
        const st = (r.locales || []).map(id => LOC.find(l => l.id === id)).filter(Boolean);
        const tot = st.reduce((a, l) => { const m = parseMoney(l.consumo); return [a[0] + m[0], a[1] + m[1]]; }, [0, 0]);
        return `<div class="route ${activeRoute === r.id ? "on" : ""}" data-r="${r.id}"><div class="row between"><b>🧭 ${esc(r.nombre)}</b><span class="tag t">${esc(r.duracion || "")}</span></div>
          <p class="small muted" style="margin-top:4px">${esc(r.descripcion || "")}</p>
          <div class="row small" style="margin-top:8px;gap:14px"><span>📍 ${st.length} paradas</span>${tot[1] ? `<span>💲 $${tot[0]}–$${tot[1]} por persona</span>` : ""}${r.tema ? `<span>🏷️ ${esc(r.tema)}</span>` : ""}</div>
          ${activeRoute === r.id ? `<div class="stops">${st.map(l => `<span data-l="${l.id}">${esc(l.nombre)} · <span class="muted">${esc(l.municipio || "")}</span></span>`).join("")}</div>
            <p class="small" id="rutaInfo" style="margin-top:10px">🚗 Calculando el recorrido por calles…</p>
            <div class="row" style="gap:8px;margin-top:10px"><a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="${gmaps(st)}">▶ Ir con Google Maps</a>${st[0] && st[0].lat ? `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://waze.com/ul?ll=${st[0].lat},${st[0].lng}&navigate=yes">Ir con Waze (1.ª parada)</a>` : ""}</div>` : ""}</div>`;
      }).join("") || '<p class="muted">Pronto publicaremos rutas.</p>');
    body().querySelectorAll(".route").forEach(c => c.onclick = e => {
      const s = e.target.closest("[data-l]"); if (s) { e.stopPropagation(); return detail(LOC.find(l => l.id === s.dataset.l)); }
      if (e.target.closest("a")) return;
      activeRoute = c.dataset.r; drawRoute(RUT.find(r => r.id === activeRoute)); rutas();
    });
    if (activeRoute) drawRoute(RUT.find(r => r.id === activeRoute));
  }
  function gmaps(st) {
    const pts = st.filter(l => l.lat); if (!pts.length) return "#";
    const dest = pts[pts.length - 1], way = pts.slice(0, -1).map(l => `${l.lat},${l.lng}`).join("|");
    return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}${way ? "&waypoints=" + encodeURIComponent(way) : ""}`;
  }
  // Recorrido real por calles (OSRM, mismo tipo de cálculo que usan Waze o Google Maps)
  const CALLES = {};
  async function calles(st) {
    const k = st.map(l => l.id).join(","); if (CALLES[k]) return CALLES[k];
    try {
      const coords = st.map(l => `${(+l.lng).toFixed(5)},${(+l.lat).toFixed(5)}`).join(";");
      const j = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`).then(x => x.json());
      const rt = j && j.routes && j.routes[0]; if (!rt) return null;
      return CALLES[k] = { pts: rt.geometry.coordinates.map(c => [c[1], c[0]]), km: rt.distance / 1000, min: Math.round(rt.duration / 60) };
    } catch (e) { return null; }
  }
  function drawRoute(r) {
    routeLayer.clearLayers(); if (!r) return;
    const st = (r.locales || []).map(id => LOC.find(l => l.id === id)).filter(l => l && l.lat);
    if (!st.length) return;
    const recta = L.polyline(st.map(l => [l.lat, l.lng]), { color: "#8A5A3B", weight: 4, dashArray: "8 8", opacity: .6 }).addTo(routeLayer);
    if (st.length > 1) calles(st).then(R => {
      if (!R || routeLayer.__r !== r) return;
      routeLayer.removeLayer ? routeLayer.removeLayer(recta) : recta.remove();
      L.polyline(R.pts, { color: "#1a4f8b", weight: 9, opacity: .35 }).addTo(routeLayer);
      L.polyline(R.pts, { color: "#2f7de1", weight: 5, opacity: .95 }).addTo(routeLayer);
      const info = document.getElementById("rutaInfo"); if (info) info.innerHTML = `🚗 <b>${(R.km).toFixed(1)} km</b> · aprox. <b>${R.min >= 60 ? Math.floor(R.min / 60) + " h " + (R.min % 60) + " min" : R.min + " min"}</b> en carro por calles reales`;
    });
    routeLayer.__r = r;
    st.forEach((l, i) => L.marker([l.lat, l.lng], { icon: L.divIcon({ html: `<span class="pin num">${i + 1}</span>`, className: "", iconSize: [0, 0] }) }).on("click", () => detail(l)).addTo(routeLayer));
    map.fitBounds(L.latLngBounds(st.map(l => [l.lat, l.lng])).pad(0.3));
  }

  // ---------- Pasaporte (libro) ----------
  function pasaporte() {
    drawMarkers(filtered());
    PASAPORTE(body(), { LOC, RUT, pass, savePass, insignias, detail });
  }

  function precioPlan(k, def) {
    try { const it = (PRECIOS().ruta || []).find(x => x.id === k); if (!it) return def;
      return +it.precio ? `${money(it.precio)}${it.unidad || "/mes"}` : "Gratis"; } catch (e) { return def; }
  }

  // ---------- Wi-Fi QR ----------
  function qrWifi(l, box) {
    if (box.innerHTML) { box.innerHTML = ""; return; }
    const e = v => String(v || "").replace(/([\\;,:"])/g, "\\$1");
    const txt = `WIFI:T:${l.wifi_pass ? "WPA" : "nopass"};S:${e(l.wifi_ssid)};${l.wifi_pass ? "P:" + e(l.wifi_pass) + ";" : ""};`;
    const pinta = () => { const q = qrcode(0, "M"); q.addData(txt); q.make();
      box.innerHTML = `<div class="wifi-qr">${q.createSvgTag({ cellSize: 5, margin: 2, scalable: true })}<p class="tiny muted">Para sus acompañantes: abran la cámara del celular y apunten a este código para conectarse.</p></div>`; };
    if (window.qrcode) return pinta();
    const sc = document.createElement("script"); sc.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js";
    sc.onload = pinta; sc.onerror = () => MZ.toast("No se pudo generar el código QR"); document.head.appendChild(sc);
  }

  // ---------- Capas: mapa, satélite, relieve, reserva ----------
  let RES = null;
  async function dibujarReserva() {
    resLayer.clearLayers(); if (!verReserva) return;
    if (!RES) { try { RES = await (await fetch("/assets/reserva.json")).json(); } catch (e) { return; } }
    const Z = { transicion: ["#9ccc65", .16], amortiguamiento: ["#4f9d5d", .22], nucleo: ["#1d6b3a", .38] };
    Object.entries(Z).forEach(([k, [c, o]]) => (RES[k] || []).forEach(poly => L.polygon(poly, { color: c, weight: 1, opacity: .7, fillColor: c, fillOpacity: o, interactive: false }).addTo(resLayer)));
    (RES.limite || []).forEach(poly => L.polygon(poly, { color: "#1d5a32", weight: 2.5, opacity: .9, fillOpacity: 0, interactive: false }).addTo(resLayer));
  }
  function setVista(t) {
    vista = t;
    if (L._google) map.setType(t);
    else { map.removeLayer ? map.removeLayer(base) : base.remove(); base = L.tileLayer(TILES[t][0], { maxZoom: t === "terrain" ? 17 : 19, attribution: TILES[t][1] }).addTo(map); base.bringToBack && base.bringToBack(); }
  }
  function capas() {
    const old = document.querySelector(".r-lay"); if (old) return old.remove();
    const d = document.createElement("div"); d.className = "r-lay glass";
    const o = [["roadmap", "🗺️", "Mapa"], ["hybrid", "🛰️", "Satélite"], ["terrain", "⛰️", "Relieve"]];
    d.innerHTML = `<div class="r-lay-g">${o.map(x => `<button data-v="${x[0]}" class="${vista === x[0] ? "on" : ""}"><span>${x[1]}</span>${x[2]}</button>`).join("")}</div>
      <label class="r-lay-t"><input type="checkbox" id="lyRes" ${verReserva ? "checked" : ""}> 🌳 Zonas de la reserva</label>
      <div class="r-leg"><span><i style="background:#1d6b3a"></i>Núcleo</span><span><i style="background:#4f9d5d"></i>Amortiguamiento</span><span><i style="background:#9ccc65"></i>Transición</span></div>
      <button class="btn btn-primary btn-sm" id="ly3d" style="width:100%;margin-top:10px">🌍 Volar en 3D</button>`;
    document.querySelector(".r-mapwrap").appendChild(d);
    d.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { setVista(b.dataset.v); d.querySelectorAll("[data-v]").forEach(x => x.classList.toggle("on", x === b)); });
    d.querySelector("#lyRes").onchange = e => { verReserva = e.target.checked; localStorage.setItem("ruta_reserva", verReserva ? "1" : "0"); dibujarReserva(); };
    d.querySelector("#ly3d").onclick = () => { d.remove(); abrir3D(); };
  }
  document.getElementById("lay").onclick = capas;
  document.getElementById("b3d").onclick = () => abrir3D();

  // ---------- Vista 3D fotorrealista (tipo Google Earth) ----------
  const LUGARES3D = [["Volcán de Santa Ana", 13.853, -89.630, 4200, 70], ["Lago de Coatepeque", 13.865, -89.548, 6500, 60], ["Volcán de Izalco", 13.813, -89.633, 3200, 72],
    ["Laguna Verde · Apaneca", 13.893, -89.787, 2600, 65], ["Juayúa", 13.842, -89.745, 2200, 62]];
  async function abrir3D(l) {
    const libre = () => MAPA3D.abrir({ lugar: l ? { nombre: limpio(l.nombre), lat: l.lat, lng: l.lng } : null, puntos: LOC.filter(x => x.lat).map(x => ({ nombre: limpio(x.nombre), lat: x.lat, lng: x.lng })) });
    if (!L._google || !window.google || !google.maps.importLibrary) return libre();
    // Google 3D fotorrealista solo mientras no se pase el límite mensual de vistas; luego, la versión gratuita
    let cupo = null; try { cupo = await MZ.rpc("mapa3d_usar", {}); } catch (e) {}
    if (!cupo || !cupo.google) return libre();
    let lib; try { lib = await google.maps.importLibrary("maps3d"); } catch (e) { return libre(); }
    const { Map3DElement, Marker3DElement } = lib;
    const ov = document.createElement("div"); ov.className = "r3d";
    ov.innerHTML = `<div class="r3d-top"><button class="icon-btn glass" data-x aria-label="Cerrar">×</button><b class="glass">🌍 Reserva Apaneca-Ilamatepec en 3D</b></div>
      <div class="r3d-bar glass"><button data-tour>▶ Recorrido</button>${l ? `<button data-l>📍 ${esc(limpio(l.nombre))}</button>` : ""}${LUGARES3D.map((x, i) => `<button data-i="${i}">${x[0]}</button>`).join("")}</div>`;
    document.body.appendChild(ov); document.body.style.overflow = "hidden";
    const m = new Map3DElement({ center: { lat: 13.75, lng: -88.9, altitude: 0 }, range: 900000, tilt: 0, heading: 0, defaultUIDisabled: false });
    m.mode = "SATELLITE"; ov.prepend(m);
    m.addEventListener("gmp-error", () => { ov.remove(); document.body.style.overflow = ""; libre(); });
    try { if (Marker3DElement) LOC.filter(x => x.lat).forEach(x => { const mk = new Marker3DElement({ position: { lat: x.lat, lng: x.lng, altitude: 60 }, altitudeMode: "RELATIVE_TO_GROUND", extruded: true, label: limpio(x.nombre) }); m.append(mk); }); } catch (e) {}
    let tourOn = false;
    const volar = (lat, lng, range, tilt, ms, vuelta) => new Promise(res => {
      m.flyCameraTo({ endCamera: { center: { lat, lng, altitude: 0 }, range, tilt, heading: (Math.random() * 120) - 60 }, durationMillis: ms || 5000 });
      const done = () => { m.removeEventListener("gmp-animationend", done); if (vuelta) { m.flyCameraAround({ camera: { center: { lat, lng, altitude: 0 }, range, tilt, heading: 0 }, durationMillis: 12000, rounds: 1 }); } res(); };
      m.addEventListener("gmp-animationend", done);
    });
    const close = () => { tourOn = false; ov.remove(); document.body.style.overflow = ""; };
    ov.querySelector("[data-x]").onclick = close;
    ov.querySelector(".r3d-bar").onclick = async e => {
      const b = e.target.closest("button"); if (!b) return;
      ov.querySelectorAll(".r3d-bar button").forEach(x => x.classList.toggle("on", x === b)); tourOn = false;
      if (b.dataset.l != null) return volar(l.lat, l.lng, 900, 68, 4000, true);
      if (b.dataset.i != null) { const x = LUGARES3D[+b.dataset.i]; return volar(x[1], x[2], x[3], x[4], 4500, true); }
      tourOn = true;
      for (const x of LUGARES3D) { if (!tourOn) break; await volar(x[1], x[2], x[3], x[4], 5000, false); if (!tourOn) break; await new Promise(r => setTimeout(r, 1800)); }
    };
    // entrada tipo Google Earth: desde el espacio hasta la reserva
    setTimeout(() => l ? volar(l.lat, l.lng, 900, 68, 6000, true) : volar(13.85, -89.68, 26000, 58, 6500, true), 900);
  }
  const limpio = n => String(n || "").replace(/\s*\(ejemplo\)/i, "");

  // ---------- Negocios ----------
  function negocios() {
    drawMarkers(filtered());
    body().innerHTML = `<h2 class="h-md">¿Tiene un negocio en el occidente?</h2>
      <p class="muted small" style="margin:6px 0 14px">Aparezca en Ruta Maíz y reciba visitantes que buscan experiencias locales y sostenibles.</p>
      <div class="plans">
        <div class="plan"><b>🌱 Básico</b> <span class="tag">${precioPlan("basico", "Gratis")}</span><ul><li>Aparece en el mapa y en las búsquedas</li><li>Ficha con horario, consumo y cómo llegar</li><li>Botón de WhatsApp</li></ul>
          <a class="btn btn-ghost btn-sm" href="/solicitud?u=ruta&t=${encodeURIComponent("Unir mi negocio a Ruta Maíz")}&p=Básico">Unirme gratis</a></div>
        <div class="plan hi"><b>⭐ Destacado</b> <span class="tag y">${precioPlan("destacado", "Mensual")}</span><ul><li>Primero en la lista y marcador amarillo en el mapa</li><li>Promociones y canjes con el Pasaporte Maíz</li><li>Menú digital creado por nosotros</li><li>Parte de las rutas recomendadas</li></ul>
          <a class="btn btn-accent btn-sm" href="/solicitud?u=ruta&t=${encodeURIComponent("Unir mi negocio a Ruta Maíz")}&p=Destacado">Quiero destacar</a></div>
        <div class="plan"><b>🌽 Aliado</b> <span class="tag t">${precioPlan("aliado", "Paquete completo")}</span><ul><li>Todo lo del plan Destacado</li><li>Reels profesionales con Estudio Maíz</li><li>Mención en Frecuencia Maíz</li><li>Reservas de servicios (hoteles: tours, alquileres, spa)</li><li>Reporte de visitas a su ficha</li></ul>
          <a class="btn btn-primary btn-sm" href="/solicitud?u=ruta&t=${encodeURIComponent("Unir mi negocio a Ruta Maíz")}&p=Aliado">Ser aliado</a></div>
      </div>
      <div class="card glass" style="margin-top:14px"><b>📖 Menú digital</b><p class="small muted" style="margin:6px 0 10px">¿Ya tiene uno? Solo envíenos el enlace. ¿No tiene? Lo creamos con su marca y le damos un enlace y un código QR para sus mesas.</p>
        <a class="btn btn-ghost btn-sm" href="/solicitud?u=ruta&t=${encodeURIComponent("Crear mi menú digital")}">Solicitar menú digital</a></div>
      <div class="card glass" style="margin-top:12px"><b>🤝 Patrocine una ruta</b> <span class="tag">${precioPlan("patrocinio", "")}</span><p class="small muted" style="margin:6px 0 10px">Su marca presente en una ruta temática completa.</p>
        <a class="btn btn-ghost btn-sm" href="/solicitud?u=ruta&t=${encodeURIComponent("Patrocinar una ruta")}">Conversemos</a></div>`;
  }


  // ---------- Panel que se baja/sube en el celular (como Google Maps) ----------
  (function () {
    const app = document.querySelector(".r-app"), g = document.getElementById("grab"); if (!g) return;
    const set = min => { app.classList.toggle("min", min); g.querySelector("span").textContent = min ? "Ver lista" : "Ver más mapa"; window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => map.invalidateSize && map.invalidateSize(), 380); };
    g.onclick = () => set(!app.classList.contains("min"));
    let y0 = null;
    g.addEventListener("touchstart", e => { y0 = e.touches[0].clientY; }, { passive: true });
    g.addEventListener("touchend", e => { if (y0 == null) return; const d = e.changedTouches[0].clientY - y0; y0 = null; if (d > 30) set(true); else if (d < -30) set(false); });
    document.getElementById("tabs").addEventListener("click", () => { if (app.classList.contains("min")) set(false); });
  })();
  load();
})();
