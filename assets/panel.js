/* Panel de control · Proyecto Maíz */
(function () {
  const { esc, I, rpc } = MZ;
  MZ.aurora();
  const app = document.getElementById("app");
  let KEY = sessionStorage.getItem("maiz_key") || "";
  const D = { briefs: [], sols: [], stats: null, locales: [], rutas: [], pf: [], cfg: {} };
  const EST = ["nuevo", "revisado", "agendado", "grabado"];
  const EST_S = ["recibido", "en_revision", "cotizacion_enviada", "aceptado", "finalizado", "descartado"];
  const EST_SN = { recibido: "Recibido", en_revision: "En revisión", cotizacion_enviada: "Cotización enviada", aceptado: "Aceptado", finalizado: "Finalizado", descartado: "Descartado" };
  const EMO = t => /restaur|cafet/i.test(t) ? "🍽️" : /hotel|hostal|aloja/i.test(t) ? "🛏️" : /finca/i.test(t) ? "🌱" : /tienda|comercio/i.test(t) ? "🛍️" : "✨";
  const fdate = (d, o) => d ? new Date(d).toLocaleDateString("es-SV", o || { day: "numeric", month: "short", year: "numeric" }) : "";
  const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const waNum = n => { let d = (n || "").replace(/\D/g, ""); if (d.length === 8) d = "503" + d; return d; };
  const waFmt = n => { const d = (n || "").replace(/\D/g, "").slice(-8); return d.length === 8 ? `+503 ${d.slice(0, 4)} ${d.slice(4)}` : n; };

  // ---------------- Login ----------------
  function login(msg) {
    app.innerHTML = `<div class="login"><form class="card pad-lg glass" id="lf">${MZ.mascot(96)}
      <h1 class="h-md" style="margin:6px 0 4px">Panel de Proyecto Maíz</h1><p class="muted small" style="margin-bottom:18px">Ingrese la clave privada del equipo.</p>
      <input class="input" type="password" id="lk" placeholder="Clave" autocomplete="current-password" style="text-align:center">
      ${msg ? `<p class="err-msg" style="margin-top:8px">${msg}</p>` : ""}
      <button class="btn btn-primary btn-block" style="margin-top:14px">Entrar</button></form></div>`;
    document.getElementById("lf").onsubmit = async e => {
      e.preventDefault(); const k = document.getElementById("lk").value.trim();
      try { const ok = await rpc("admin_check", { p_key: k }); if (!ok) return login("Clave incorrecta."); KEY = k; sessionStorage.setItem("maiz_key", k); localStorage.setItem("maiz_admin_device", "1"); boot(); }
      catch (err) { login("No hay conexión. Intente de nuevo."); }
    };
  }

  // ---------------- Carga ----------------
  async function loadAll() {
    const r = await Promise.allSettled([
      rpc("admin_list_briefs", { p_key: KEY }), rpc("admin_list_solicitudes", { p_key: KEY }), rpc("admin_stats", { p_key: KEY, p_dias: 30 }),
      rpc("admin_list_locales", { p_key: KEY }), rpc("admin_list_rutas", { p_key: KEY }), rpc("admin_list_portafolio", { p_key: KEY }),
      MZ.sbSelect("site_config", "select=data&id=eq.1")]);
    if (r[0].status === "rejected" && /clave/i.test(r[0].reason.message)) { sessionStorage.removeItem("maiz_key"); KEY = ""; throw new Error("clave"); }
    D.briefs = r[0].value || []; D.sols = r[1].value || []; D.stats = r[2].value || null;
    D.locales = r[3].value || []; D.rutas = r[4].value || []; D.pf = r[5].value || [];
    D.cfg = (r[6].value && r[6].value[0] && r[6].value[0].data) || {};
  }

  const NAV = [["resumen", "📊", "Resumen"], ["fichas", "🗂️", "Fichas"], ["calendario", "📅", "Calendario"], ["solicitudes", "📨", "Solicitudes"],
    ["portafolio", "🎬", "Portafolio"], ["ruta", "🗺️", "Ruta Maíz"], ["sitio", "🎨", "Sitio"]];
  function shell() {
    app.innerHTML = `<div class="p-shell"><aside class="p-side glass"><div class="brand"><span class="appicon">${MZ.mascot(30)}</span><span>Panel Maíz</span></div>
      ${NAV.map(n => `<button data-v="${n[0]}"><span class="e">${n[1]}</span>${n[2]}</button>`).join("")}
      <div style="flex:1"></div><a class="btn btn-ghost btn-sm" href="/" target="_blank">Ver sitio ↗</a>
      <button id="out" style="justify-content:center;font-size:.85rem">Cerrar sesión</button></aside>
      <main class="p-main" id="view"></main></div>
      <nav class="p-tabs glass">${NAV.map(n => `<button data-v="${n[0]}"><span class="e">${n[1]}</span>${n[2]}</button>`).join("")}</nav>`;
    app.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { location.hash = b.dataset.v; });
    document.getElementById("out").onclick = () => { sessionStorage.removeItem("maiz_key"); location.hash = ""; location.reload(); };
  }
  async function boot() {
    app.innerHTML = `<div class="login"><div class="card glass">${MZ.mascot(80)}<p class="muted">Cargando…</p></div></div>`;
    try { await loadAll(); } catch (e) { return login(e.message === "clave" ? "La clave cambió. Ingrésela de nuevo." : "No se pudo cargar. Revise la conexión."); }
    shell(); route();
  }
  window.addEventListener("hashchange", () => { if (KEY && document.getElementById("view")) route(); });
  let lmap = [];
  function route() {
    lmap.forEach(m => m.remove()); lmap = [];
    const [v, id, sub] = (location.hash.slice(1) || "resumen").split("/");
    app.querySelectorAll("[data-v]").forEach(b => b.classList.toggle("on", b.dataset.v === (v === "ficha" ? "fichas" : v)));
    const view = document.getElementById("view");
    const R = { resumen, fichas, ficha: () => ficha(id, sub), calendario, solicitudes, sitio, portafolio, ruta };
    (R[v] || resumen)(view);
    window.scrollTo(0, 0);
  }
  const head = (t, extra) => `<div class="p-head"><h1>${t}</h1><div class="row">${extra || ""}</div></div>`;

  // ---------------- Resumen ----------------
  function resumen(v) {
    const s = D.stats || { vistas: 0, visitantes: 0, whatsapp: 0, brief_inicio: 0, brief_envio: 0, por_dia: [], por_pagina: [], dispositivos: {}, origenes: [] };
    const cnt = e => D.briefs.filter(b => (b.estado || "nuevo") === e).length;
    const prox = D.briefs.filter(b => b.fecha_grabacion && new Date(b.fecha_grabacion) >= new Date(Date.now() - 864e5)).sort((a, b) => new Date(a.fecha_grabacion) - new Date(b.fecha_grabacion));
    const kp = (val, l, sub, c) => `<div class="kpi glass" style="--k:${c}"><div class="v">${val}</div><div class="l">${l}</div>${sub ? `<div class="s">${sub}</div>` : ""}</div>`;
    const tot = Object.values(s.dispositivos || {}).reduce((a, b) => a + b, 0) || 1;
    const mov = Math.round(((s.dispositivos || {}).movil || 0) / tot * 100);
    v.innerHTML = head("Resumen", `<span class="tag">Últimos 30 días</span><button class="btn btn-ghost btn-sm" id="rf">↻ Actualizar</button>`) + `
      <div class="kpis">${kp(s.vistas, "Visitas a páginas", `${s.visitantes} personas distintas`, "#FBE3A0")}${kp(D.briefs.length, "Fichas recibidas", `${cnt("nuevo")} nuevas`, "#E3ECD6")}
        ${kp(cnt("agendado"), "Grabaciones agendadas", `${cnt("grabado")} ya grabadas`, "#e9dff3")}${kp(s.whatsapp, "Clics a WhatsApp", `${D.sols.length} solicitudes`, "#dff1e5")}</div>
      <div class="grid g2" style="margin-top:12px">
        <div class="card glass"><div class="row between"><b>Visitas por día</b><span class="tiny muted">${mov}% desde celular</span></div>${chartDias(s.por_dia)}</div>
        <div class="card glass"><b>Embudo de clientes</b><p class="tiny muted" style="margin:2px 0 12px">De la visita al brief enviado</p>${funnel(s)}</div>
        <div class="card glass"><b>Páginas más vistas</b><div class="bars-h" style="margin-top:12px">${barsH((s.por_pagina || []).map(x => [nicePath(x.p), x.n]))}</div></div>
        <div class="card glass"><b>¿De dónde llegan?</b><div class="bars-h" style="margin-top:12px">${barsH((s.origenes || []).map(x => [niceRef(x.r), x.n]))}</div></div>
        <div class="card glass"><b>Próximas grabaciones</b><div style="margin-top:10px">${prox.length ? prox.slice(0, 5).map(b => `<div class="ev" style="cursor:pointer" data-f="${b.id}"><i class="ev-grab"></i><div><b>${esc(b.nombre)}</b><br><span class="muted small">${fdate(b.fecha_grabacion, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}</span></div></div>`).join("") : '<p class="muted small">Aún no hay grabaciones agendadas. Abra una ficha y elija la fecha.</p>'}</div></div>
        <div class="card glass"><b>Opciones de mejora</b><div class="tips" style="margin-top:12px">${tips(s).map(t => `<div class="tip"><span class="e">${t[0]}</span><span>${t[1]}</span></div>`).join("")}</div></div>
      </div>`;
    v.querySelector("#rf").onclick = async () => { await loadAll(); route(); MZ.toast("Datos actualizados"); };
    v.querySelectorAll("[data-f]").forEach(e => e.onclick = () => location.hash = "ficha/" + e.dataset.f);
  }
  const nicePath = p => ({ "/": "Inicio", "/estudio-maiz": "Estudio Maíz", "/brief": "Brief", "/ruta-maiz": "Ruta Maíz", "/radio-frecuencia-maiz": "Frecuencia Maíz", "/solicitud": "Solicitud" })[p] || p;
  const niceRef = r => /facebook/.test(r) ? "Facebook" : /instagram/.test(r) ? "Instagram" : /whatsapp|wa\.me/.test(r) ? "WhatsApp" : /google/.test(r) ? "Google" : /tiktok/.test(r) ? "TikTok" : r === "directo" ? "Directo / enlace compartido" : r === "interno" ? "Dentro del sitio" : r;
  function barsH(rows) {
    if (!rows.length) return '<p class="muted small">Aún sin datos.</p>';
    const mx = Math.max(...rows.map(r => r[1]), 1);
    return rows.map(r => `<div class="r"><span class="t">${esc(r[0])}</span><b>${r[1]}</b><div class="bar"><i style="width:${Math.max(4, r[1] / mx * 100)}%"></i></div></div>`).join("");
  }
  function chartDias(rows) {
    const days = []; const map = Object.fromEntries((rows || []).map(r => [r.d, r.n]));
    for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5); days.push([dkey(d), map[dkey(d)] || 0]); }
    const mx = Math.max(...days.map(d => d[1]), 4), W = 340, H = 170, bw = W / days.length;
    const bars = days.map((d, i) => { const h = d[1] / mx * (H - 30); return `<rect x="${i * bw + 2}" y="${H - 18 - h}" width="${bw - 4}" height="${Math.max(h, 2)}" rx="4" fill="${i === days.length - 1 ? "var(--cafe)" : "var(--pollo)"}"><title>${d[0]}: ${d[1]}</title></rect>`; }).join("");
    const lbl = [0, 10, 20, 29].map(i => `<text x="${i * bw + bw / 2}" y="${H - 2}" font-size="10" text-anchor="middle" fill="var(--ink-3)">${new Date(days[i][0] + "T12:00").toLocaleDateString("es-SV", { day: "numeric", month: "short" })}</text>`).join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitas por día">${bars}${lbl}</svg>`;
  }
  function funnel(s) {
    const st = [["Visitas", s.vistas], ["Abrieron el brief", s.brief_inicio], ["Enviaron el brief", s.brief_envio], ["Escribieron por WhatsApp", s.whatsapp]];
    const mx = Math.max(st[0][1], 1);
    return `<div class="funnel">${st.map(x => `<div class="st"><div class="b" style="width:${Math.max(12, x[1] / mx * 100)}%">${x[1]}</div><span>${x[0]}</span></div>`).join("")}</div>`;
  }
  function tips(s) {
    const t = [];
    const conv = s.brief_inicio ? s.brief_envio / s.brief_inicio : 0;
    if (s.vistas < 50) t.push(["📣", "Pocas visitas este mes: comparta el enlace en sus estados de WhatsApp y en la bio de Instagram y Facebook."]);
    if (s.brief_inicio > 3 && conv < .5) t.push(["✂️", `Solo ${Math.round(conv * 100)}% termina el brief. Ofrezca ayuda por WhatsApp a quienes lo dejan a medias.`]);
    const nuevos = D.briefs.filter(b => (b.estado || "nuevo") === "nuevo").length;
    if (nuevos) t.push(["🗂️", `Tiene ${nuevos} ficha(s) nueva(s) sin revisar. Responder en menos de 24 h aumenta el cierre.`]);
    const tot = Object.values(s.dispositivos || {}).reduce((a, b) => a + b, 0);
    if (tot && (s.dispositivos.movil || 0) / tot > .6) t.push(["📱", "La mayoría entra desde el celular: priorice videos verticales en el portafolio."]);
    if (!D.pf.length) t.push(["🎬", "Suba sus primeros videos al Portafolio: los clientes confían más cuando ven trabajos reales."]);
    if (!(D.cfg.redes && D.cfg.redes.frecuencia && D.cfg.redes.frecuencia.length)) t.push(["🔗", "Agregue las redes de Frecuencia Maíz en “Sitio” para que aparezcan en la página."]);
    if (!(D.cfg.equipo || []).some(m => m.foto)) t.push(["🧑‍🤝‍🧑", "Agregue fotos del equipo en “Sitio → Quiénes somos”."]);
    if (!t.length) t.push(["✅", "¡Todo en orden! Siga publicando con constancia."]);
    return t.slice(0, 5);
  }

  // ---------------- Fichas ----------------
  let fq = "", fr = "", fe = "";
  function fichas(v) {
    const tipos = [...new Set(D.briefs.map(b => b.tipo).filter(Boolean))];
    v.innerHTML = head("Fichas", `<span class="tag">${D.briefs.length} en total</span>`) + `
      <div class="toolbar"><input class="input" id="q" placeholder="Buscar por nombre, lugar o responsable" value="${esc(fq)}">
        <select class="input" id="fr" style="flex:0 1 220px"><option value="">Todos los rubros</option>${tipos.map(t => `<option ${t === fr ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>
      <div class="seg" id="fe" style="margin-bottom:12px"><button data-e="" class="${fe ? "" : "on"}">Todas</button>${EST.map(e => `<button data-e="${e}" class="${fe === e ? "on" : ""}">${cap(e)} · ${D.briefs.filter(b => (b.estado || "nuevo") === e).length}</button>`).join("")}</div>
      <div class="list" id="ls"></div>`;
    const draw = () => {
      const q = fq.toLowerCase();
      const L = D.briefs.filter(b => (!fr || b.tipo === fr) && (!fe || (b.estado || "nuevo") === fe) && (!q || [b.nombre, b.ubicacion, b.responsable].join(" ").toLowerCase().includes(q)));
      v.querySelector("#ls").innerHTML = L.length ? L.map(b => `<div class="item glass" data-id="${b.id}"><div class="av">${EMO(b.tipo)}</div>
        <div style="min-width:0"><h3>${esc(b.nombre)}</h3><p>${esc(b.tipo || "")} · ${esc(b.ubicacion || "")}</p><p>${fdate(b.created_at)}${b.fecha_grabacion ? " · 🎬 " + fdate(b.fecha_grabacion, { day: "numeric", month: "short" }) : ""}</p></div>
        <span class="tag st-${b.estado || "nuevo"}">${cap(b.estado || "nuevo")}</span></div>`).join("") : '<p class="muted">No hay fichas con ese filtro.</p>';
      v.querySelectorAll(".item").forEach(e => e.onclick = () => location.hash = "ficha/" + e.dataset.id);
    };
    v.querySelector("#q").oninput = e => { fq = e.target.value; draw(); };
    v.querySelector("#fr").onchange = e => { fr = e.target.value; draw(); };
    v.querySelector("#fe").onclick = e => { const b = e.target.closest("button"); if (!b) return; fe = b.dataset.e; v.querySelectorAll("#fe button").forEach(x => x.classList.toggle("on", x === b)); draw(); };
    draw();
  }
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "";

  function ficha(id, sub) {
    const v = document.getElementById("view");
    const b = D.briefs.find(x => x.id === id);
    if (!b) { v.innerHTML = '<p class="muted">Ficha no encontrada.</p>'; return; }
    const tab = sub === "plan" ? "plan" : "ficha";
    const n = waNum(b.whatsapp);
    const msg = `Hola ${(b.responsable || "").split(" ")[0]}, le saluda Estudio Maíz. Recibimos la ficha de ${b.nombre}.`;
    v.innerHTML = `<div class="row no-print" style="margin-bottom:10px"><button class="btn btn-ghost btn-sm" onclick="location.hash='fichas'">← Fichas</button></div>
      <div class="f-hero glass"><div class="top"><div class="av">${EMO(b.tipo)}</div><div style="min-width:0"><h2>${esc(b.nombre)}</h2>
        <p class="muted small">${esc(b.tipo || "")} · ${esc(b.ubicacion || "")}</p><p class="tiny muted">Recibida el ${fdate(b.created_at)}${b.servicio ? " · Interés: " + esc(b.servicio) : ""}</p></div></div>
        <div class="seg no-print" id="est">${EST.map(e => `<button data-e="${e}" class="${(b.estado || "nuevo") === e ? "on" : ""}">${cap(e)}</button>`).join("")}</div>
        <div class="f-actions">${n ? `<a class="wa-big" target="_blank" rel="noopener" href="https://wa.me/${n}?text=${encodeURIComponent(msg)}"><span class="ic">${I.wa}</span><span><b>${esc(waFmt(b.whatsapp))}</b><small>Escribir a ${esc(b.responsable || "cliente")} por WhatsApp</small></span></a>` : ""}
          ${b.lat ? `<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}">${I.mapa} Cómo llegar</a>` : b.maps_url ? `<a class="btn btn-ghost" target="_blank" rel="noopener" href="${esc(b.maps_url)}">${I.mapa} Ver en Maps</a>` : ""}
          <button class="btn btn-ghost" id="pdf">⬇︎ PDF</button></div></div>
      <div class="seg ftabs no-print" id="ft"><button data-t="ficha" class="${tab === "ficha" ? "on" : ""}">🗂️ Ficha</button><button data-t="plan" class="${tab === "plan" ? "on" : ""}">🎬 Plan de acción</button></div>
      <div id="fbody"></div>`;
    v.querySelector("#ft").onclick = e => { const x = e.target.closest("button"); if (x) location.hash = `ficha/${id}${x.dataset.t === "plan" ? "/plan" : ""}`; };
    v.querySelector("#pdf").onclick = () => { document.title = `${b.nombre} · ${tab === "plan" ? "Plan de acción" : "Ficha"} · Estudio Maíz`; window.print(); };
    v.querySelector("#est").onclick = async e => {
      const x = e.target.closest("button"); if (!x) return;
      try { await rpc("admin_set_estado", { p_key: KEY, p_id: b.id, p_estado: x.dataset.e }); b.estado = x.dataset.e; v.querySelectorAll("#est button").forEach(y => y.classList.toggle("on", y === x)); MZ.toast("Estado: " + cap(b.estado)); }
      catch (err) { MZ.toast("No se pudo cambiar el estado"); }
    };
    const body = v.querySelector("#fbody");
    tab === "plan" ? planView(body, b) : fichaView(body, b);
  }

  function fichaView(el, b) {
    const r = b.rubro || {};
    const prac = (b.practicas || []).filter(p => p !== "Aún no aplicamos");
    const pct = Math.round(prac.length / 7 * 100);
    const m = +b.mujeres || 0, h = +b.hombres || 0, t = m + h || 1;
    const redes = (b.redes_lista && b.redes_lista.length) ? b.redes_lista : (b.redes ? [{ red: "Redes", url: "", txt: b.redes }] : []);
    const disp = b.disponibilidad || [];
    const ring = `<svg width="96" height="96" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" stroke="rgba(59,36,24,.1)" stroke-width="10" fill="none"/>
      <circle cx="50" cy="50" r="42" stroke="var(--verde-2)" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="${pct * 2.64} 264" transform="rotate(-90 50 50)"/>
      <text x="50" y="56" text-anchor="middle" font-size="20" font-weight="800" fill="var(--cafe)">${pct}%</text></svg>`;
    const fg = b.fecha_grabacion ? new Date(b.fecha_grabacion) : null;
    const local = fg ? new Date(fg.getTime() - fg.getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "";
    el.innerHTML = `<div class="f-grid">
      <div class="f-box glass"><h3>👤 Contacto y negocio</h3><dl class="kv">
        <dt>Responsable</dt><dd>${esc(b.responsable)}</dd><dt>WhatsApp</dt><dd>${esc(waFmt(b.whatsapp))}</dd><dt>Dirección</dt><dd>${esc(b.ubicacion || "—")}</dd>
        <dt>Tiempo</dt><dd>${esc(b.anios || "—")}</dd><dt>Horario</dt><dd>${esc(b.horario || "—")}</dd></dl>
        ${b.lat ? '<div class="mini-map" id="mm"></div>' : ""}</div>
      <div class="f-box glass"><h3>🎬 Agendar grabación</h3>
        <div class="field"><label class="lbl" for="fg">Fecha y hora</label><input class="input" type="datetime-local" id="fg" value="${local}"></div>
        <div class="field"><label class="lbl" for="nt">Notas internas</label><textarea class="input" id="nt" placeholder="Acuerdos, precios, recordatorios">${esc(b.notas || "")}</textarea></div>
        <button class="btn btn-primary btn-sm" id="sv">Guardar y marcar como agendado</button>
        <p class="tiny muted" style="margin-top:10px">Días que el cliente marcó:</p>
        <div class="chips" style="margin-top:6px">${disp.length ? disp.map(d => `<button class="chip" data-d="${d.fecha}">${fdate(d.fecha + "T12:00", { weekday: "short", day: "numeric", month: "short" })} · ${(d.franjas || []).join("/")}</button>`).join("") : `<span class="small">${esc(b.grabacion || "Sin fechas")}</span>`}</div></div>
      <div class="f-box glass"><h3>👥 Equipo</h3><div class="row between small"><span>👩 ${m} mujeres</span><span>👨 ${h} hombres</span></div>
        <div class="team-bar"><i style="width:${m / t * 100}%"></i><i style="width:${h / t * 100}%"></i></div>
        <p class="small muted" style="margin-top:6px">Edades: ${esc((b.edades || []).join(", ") || "—")}</p>
        <h3 style="margin-top:16px">🔗 Redes</h3><div class="stack">${redes.length ? redes.map(x => x.url ? `<a class="row small" href="${esc(x.url)}" target="_blank" rel="noopener" style="text-decoration:none"><span class="icon-btn" style="width:36px;height:36px">${MZ.redIcon(x.red)}</span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.red)} · ${esc(x.url.replace(/^https?:\/\/(www\.)?/, ""))}</span></a>` : `<span class="small">${esc(x.txt)}</span>`).join("") : '<span class="small muted">Sin redes</span>'}</div></div>
      <div class="f-box glass"><h3>♻️ Economía circular</h3><div class="ring">${ring}<div class="chips">${(b.practicas || []).map(p => `<span class="tag g">${esc(p)}</span>`).join("")}</div></div>
        ${b.ejemplo_ec ? `<p class="quote" style="margin-top:12px">${esc(b.ejemplo_ec)}</p>` : ""}</div>
      <div class="f-box glass wide"><h3>${EMO(b.tipo)} Oferta y locaciones</h3><dl class="kv"><dt>Oferta</dt><dd>${esc(r.oferta || "—")}</dd>
        ${r.origen ? `<dt>Origen</dt><dd>${esc(r.origen)}</dd>` : ""}${r.visitantes ? `<dt>Visitantes</dt><dd>${esc(r.visitantes)}</dd>` : ""}${r.tipo_otro ? `<dt>Rubro</dt><dd>${esc(r.tipo_otro)}</dd>` : ""}</dl>
        <div class="chips" style="margin-top:12px">${(r.grabar || []).map(g => `<span class="tag y">🎥 ${esc(g)}</span>`).join("")}</div></div>
      <div class="f-box glass wide"><h3>📖 Historia y brief de campaña</h3>${b.historia ? `<p class="quote">${esc(b.historia)}</p>` : ""}
        <dl class="kv" style="margin-top:12px"><dt>Objetivo</dt><dd>${esc(b.objetivo || "—")}</dd><dt>Producto</dt><dd>${esc(b.producto || "—")}</dd><dt>Eslogan</dt><dd>${esc(b.slogan || "—")}</dd>
        <dt>Público</dt><dd>${esc(b.publico || "—")}</dd><dt>Idea del cliente</dt><dd>${esc(b.idea || "—")}</dd><dt>Material</dt><dd>${esc(b.material || "—")}</dd></dl>
        <button class="btn btn-accent" style="margin-top:16px" onclick="location.hash='ficha/${b.id}/plan'">🎬 Ver plan de acción y storyboard</button></div>
    </div>`;
    if (b.lat && window.L) {
      const mp = L.map(el.querySelector("#mm"), { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false }).setView([b.lat, b.lng], 15);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png").addTo(mp); L.marker([b.lat, b.lng]).addTo(mp); lmap.push(mp);
    }
    el.querySelectorAll("[data-d]").forEach(c => c.onclick = () => {
      const d = c.dataset.d, f = (disp.find(x => x.fecha === d) || {}).franjas || [];
      el.querySelector("#fg").value = `${d}T${f.includes("Tarde") && !f.includes("Mañana") ? "14:30" : f.includes("Mediodía") && !f.includes("Mañana") ? "11:30" : "08:00"}`;
    });
    el.querySelector("#sv").onclick = async () => {
      const val = el.querySelector("#fg").value, notas = el.querySelector("#nt").value;
      try {
        await rpc("admin_update_brief", { p_key: KEY, p_id: b.id, p_fecha: val ? new Date(val).toISOString() : null, p_notas: notas, p_set_fecha: true });
        b.fecha_grabacion = val ? new Date(val).toISOString() : null; b.notas = notas;
        if (val && (b.estado || "nuevo") !== "grabado") { await rpc("admin_set_estado", { p_key: KEY, p_id: b.id, p_estado: "agendado" }); b.estado = "agendado"; }
        MZ.toast(val ? "Grabación agendada ✓" : "Notas guardadas ✓"); route();
      } catch (e) { MZ.toast("No se pudo guardar"); }
    };
  }

  function planView(el, b) {
    const P = PLAN.generar(b);
    const sh = s => `<div class="shot"><div class="frame"><span class="n">T${s.n}</span><span class="sg">${s.seg}</span><span class="ic">${s.ic}</span>${s.texto ? `<span class="tx">“${esc(s.texto)}”</span>` : "<span></span>"}</div>
      <div class="body"><b>${esc(s.plano)} · ${esc(s.camara)}</b><div class="r"><span>🎥</span><span>${esc(s.mov)}</span></div><div class="r"><span>🎬</span><span>${esc(s.accion)}</span></div>
      <div class="r"><span>🎙️</span><span>${esc(s.audio)}</span></div><div class="r"><span>💡</span><span>${esc(s.luz)}</span></div></div></div>`;
    const sug = P.sugerido ? `${fdate(P.sugerido.fecha + "T12:00", { weekday: "long", day: "numeric", month: "long" })} · ${(P.sugerido.franjas || []).join(" / ")}` : (b.grabacion || "Por coordinar");
    el.innerHTML = `
      <div class="card glass" style="margin-bottom:14px"><div class="row between"><div><b>Plan de grabación para ${esc(b.nombre)}</b>
        <p class="small muted">3 reels de 15–35 s en formato vertical 9:16 · Locaciones: ${esc(P.locs.join(", "))}</p></div><span class="tag y">📅 ${esc(sug)}</span></div>
        <p class="tiny muted" style="margin-top:8px">Plan generado a partir de la ficha. Úselo como guía y ajústelo con el cliente.</p></div>
      ${P.reels.map((r, i) => `<div class="reel glass"><div class="reel-h"><div><span class="tag ${["y", "g", "t"][i]}">Reel ${i + 1} · ${r.duracion}</span><h3 style="margin-top:6px">${esc(r.titulo)}</h3><p class="small muted">${esc(r.enfoque)}</p></div>
          <button class="btn btn-ghost btn-sm no-print" data-copy="${i}">📋 Copiar texto</button></div>
        <div class="reel-meta"><div><b>Gancho (0–2 s)</b>${esc(r.gancho)}</div><div><b>Mensaje</b>${esc(r.mensaje)}</div><div><b>Llamada a la acción</b>${esc(r.cta)}</div></div>
        <div class="sb">${r.tomas.map(sh).join("")}</div>
        <div class="cols" style="margin-top:12px"><div class="reel-meta" style="grid-template-columns:1fr;margin:0"><div><b>Música</b>${esc(r.musica)}</div></div>
          <div class="reel-meta" style="grid-template-columns:1fr;margin:0"><div><b>Texto para publicar</b><span style="white-space:pre-line">${esc(r.caption)}</span><br><span class="muted">${esc(r.hashtags.join(" "))}</span></div></div></div></div>`).join("")}
      <div class="cols">
        <div class="f-box glass"><h3>💡 Iluminación</h3><ul class="list-dot">${P.iluminacion.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="f-box glass"><h3>🎒 Lista de equipo</h3><ul class="check">${P.kit.map((x, i) => `<li><input type="checkbox" id="k${i}"><label for="k${i}">${esc(x)}</label></li>`).join("")}</ul></div>
        ${["osmo", "goproA", "goproB", "audio"].map(k => `<div class="f-box glass"><h3>${{ osmo: "📷", goproA: "🎥", goproB: "🏃", audio: "🎙️" }[k]} ${esc(P.camaras[k].rol)}</h3><ul class="list-dot">${P.camaras[k].ajustes.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}
        <div class="f-box glass"><h3>✂️ Edición en CapCut</h3><ol class="steps">${P.capcut.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>
        <div class="f-box glass"><h3>🚀 Publicación para más vistas</h3><ul class="list-dot">${P.publicar.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>`;
    el.querySelectorAll("[data-copy]").forEach(btn => btn.onclick = () => {
      const r = P.reels[+btn.dataset.copy];
      const txt = `${r.titulo}\nGancho: ${r.gancho}\nMensaje: ${r.mensaje}\nCTA: ${r.cta}\n\n` + r.tomas.map(s => `T${s.n} (${s.seg}) ${s.plano} · ${s.camara}\n  ${s.accion}\n  Movimiento: ${s.mov} · Audio: ${s.audio}${s.texto ? " · Texto: " + s.texto : ""}`).join("\n") + `\n\n${r.caption}\n${r.hashtags.join(" ")}`;
      navigator.clipboard.writeText(txt).then(() => MZ.toast("Reel copiado"), () => MZ.toast("No se pudo copiar"));
    });
  }

  // ---------------- Calendario ----------------
  let calM = new Date(new Date().getFullYear(), new Date().getMonth(), 1), calSel = dkey(new Date());
  const CATS = { grab: ["Grabaciones agendadas", "ev-grab", "#4F6B3A"], disp: ["Disponibilidad de clientes", "ev-disp", "#F4C230"], ent: ["Entrega estimada (+7 días)", "ev-ent", "#6b8fc7"], brief: ["Fichas recibidas", "ev-brief", "#c98bb0"], sol: ["Solicitudes", "ev-sol", "#8A5A3B"] };
  const calOff = new Set(JSON.parse(localStorage.getItem("maiz_cal_off") || "[]"));
  function eventos() {
    const E = {};
    const add = (k, cat, txt, id) => { if (calOff.has(cat)) return; (E[k] = E[k] || []).push({ cat, txt, id }); };
    D.briefs.forEach(b => {
      (b.disponibilidad || []).forEach(d => { if ((b.estado || "nuevo") !== "grabado") add(d.fecha, "disp", `${b.nombre} disponible · ${(d.franjas || []).join("/")}`, b.id); });
      if (b.fecha_grabacion) {
        add(dkey(b.fecha_grabacion), "grab", `${b.nombre} · ${new Date(b.fecha_grabacion).toLocaleTimeString("es-SV", { hour: "numeric", minute: "2-digit" })}`, b.id);
        add(dkey(new Date(b.fecha_grabacion).getTime() + 7 * 864e5), "ent", `Entregar videos de ${b.nombre}`, b.id);
      }
      add(dkey(b.created_at), "brief", `Ficha recibida: ${b.nombre}`, b.id);
    });
    D.sols.forEach(s => add(dkey(s.created_at), "sol", `Solicitud ${s.unidad}: ${s.nombre}`, null));
    return E;
  }
  function calendario(v) {
    const E = eventos();
    const y = calM.getFullYear(), m = calM.getMonth(), off = (new Date(y, m, 1).getDay() + 6) % 7;
    const start = new Date(y, m, 1 - off);
    const dispCount = k => (E[k] || []).filter(e => e.cat === "disp").length;
    let g = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => `<div class="dw">${d}</div>`).join("");
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i); const k = dkey(d); const ev = E[k] || [];
      g += `<div class="d ${d.getMonth() !== m ? "out" : ""} ${k === dkey(new Date()) ? "today" : ""} ${k === calSel ? "on" : ""} ${dispCount(k) >= 2 ? "hot" : ""}" data-k="${k}">
        <span class="num">${d.getDate()}</span><div class="dots">${ev.slice(0, 6).map(e => `<i class="${CATS[e.cat][1]}"></i>`).join("")}</div>
        <div class="lbls">${ev.slice(0, 3).map(e => `<span style="background:${CATS[e.cat][2]}22;color:${e.cat === "disp" ? "#7a5a00" : CATS[e.cat][2]}">${esc(e.txt.split(" · ")[0])}</span>`).join("")}${ev.length > 3 ? `<span class="muted">+${ev.length - 3} más</span>` : ""}</div></div>`;
    }
    const sel = E[calSel] || [];
    const best = Object.entries(E).filter(([k]) => k >= dkey(new Date())).map(([k, e]) => [k, e.filter(x => x.cat === "disp").length, e.filter(x => x.cat === "grab").length]).filter(x => x[1] && !x[2]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
    v.innerHTML = head("Calendario", `<button class="icon-btn" id="cp">${I.back}</button><b style="min-width:150px;text-align:center">${cap(calM.toLocaleDateString("es-SV", { month: "long", year: "numeric" }))}</b><button class="icon-btn" id="cn" style="transform:scaleX(-1)">${I.back}</button>`) + `
      <div class="legend" style="margin-bottom:12px">${Object.entries(CATS).map(([k, c]) => `<button data-c="${k}" class="${calOff.has(k) ? "off" : ""}"><i style="background:${c[2]}"></i>${c[0]}</button>`).join("")}</div>
      <div class="calwrap"><div class="calbig glass"><div class="gr">${g}</div></div>
        <div class="stack"><div class="dayp glass"><b>${cap(new Date(calSel + "T12:00").toLocaleDateString("es-SV", { weekday: "long", day: "numeric", month: "long" }))}</b>
          <div style="margin-top:10px">${sel.length ? sel.map(e => `<div class="ev" ${e.id ? `data-f="${e.id}" style="cursor:pointer"` : ""}><i class="${CATS[e.cat][1]}"></i><span>${esc(e.txt)}</span></div>`).join("") : '<p class="muted small">Sin eventos este día.</p>'}</div></div>
          <div class="dayp glass"><b>⭐ Mejores días para grabar</b><p class="tiny muted" style="margin:4px 0 10px">Días con más clientes disponibles y sin grabación agendada.</p>
          ${best.length ? best.map(x => `<div class="ev" data-k="${x[0]}" style="cursor:pointer"><i class="ev-disp"></i><span><b>${new Date(x[0] + "T12:00").toLocaleDateString("es-SV", { weekday: "short", day: "numeric", month: "short" })}</b> · ${x[1]} cliente(s) disponible(s)</span></div>`).join("") : '<p class="muted small">Aún no hay disponibilidad registrada.</p>'}</div></div></div>`;
    v.querySelector("#cp").onclick = () => { calM = new Date(y, m - 1, 1); calendario(v); };
    v.querySelector("#cn").onclick = () => { calM = new Date(y, m + 1, 1); calendario(v); };
    v.querySelectorAll(".d[data-k], .ev[data-k]").forEach(d => d.onclick = () => { calSel = d.dataset.k; const dd = new Date(calSel + "T12:00"); calM = new Date(dd.getFullYear(), dd.getMonth(), 1); calendario(v); });
    v.querySelectorAll(".ev[data-f]").forEach(e => e.onclick = () => location.hash = "ficha/" + e.dataset.f);
    v.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { const c = b.dataset.c; calOff.has(c) ? calOff.delete(c) : calOff.add(c); localStorage.setItem("maiz_cal_off", JSON.stringify([...calOff])); calendario(v); });
  }

  // ---------------- Solicitudes ----------------
  function solicitudes(v) {
    v.innerHTML = head("Solicitudes", `<span class="tag">${D.sols.length}</span>`) + `<p class="muted small" style="margin:-6px 0 14px">Mensajes de Frecuencia Maíz, Ruta Maíz y otros servicios.</p>
      <div class="list">${D.sols.length ? D.sols.map(s => {
        const n = waNum(s.whatsapp); const datos = s.datos || {};
        return `<div class="card glass"><div class="row between"><div><b>${esc(s.nombre)}</b> <span class="tag ${s.unidad === "ruta" ? "t" : s.unidad === "radio" ? "g" : "y"}">${esc({ ruta: "Ruta Maíz", radio: "Frecuencia Maíz", estudio: "Estudio Maíz" }[s.unidad] || s.unidad)}</span>
          <p class="small muted">${esc(s.tipo)}${s.paquete ? " · " + esc(s.paquete) : ""} · ${fdate(s.created_at)}</p></div>
          <select class="input" data-s="${s.id}" style="width:auto">${EST_S.map(e => `<option value="${e}" ${s.estado === e ? "selected" : ""}>${EST_SN[e]}</option>`).join("")}</select></div>
          <dl class="kv small" style="margin-top:10px">${s.contacto ? `<dt>Contacto</dt><dd>${esc(s.contacto)}</dd>` : ""}${s.correo ? `<dt>Correo</dt><dd>${esc(s.correo)}</dd>` : ""}
          ${Object.entries(datos).filter(([, x]) => x && typeof x !== "object").map(([k, x]) => `<dt>${esc(cap(k))}</dt><dd>${esc(x)}</dd>`).join("")}</dl>
          ${n ? `<a class="wa-big" style="margin-top:12px;display:inline-flex" target="_blank" rel="noopener" href="https://wa.me/${n}"><span class="ic">${I.wa}</span><span><b>${esc(waFmt(s.whatsapp))}</b><small>Responder por WhatsApp</small></span></a>` : ""}</div>`;
      }).join("") : '<p class="muted">Aún no hay solicitudes.</p>'}</div>`;
    v.querySelectorAll("[data-s]").forEach(sel => sel.onchange = async () => {
      try { await rpc("admin_set_estado_solicitud", { p_key: KEY, p_id: sel.dataset.s, p_estado: sel.value }); D.sols.find(x => x.id === sel.dataset.s).estado = sel.value; MZ.toast("Estado actualizado"); }
      catch (e) { MZ.toast("No se pudo actualizar"); }
    });
  }

  // ---------------- Sitio (editor visual) ----------------
  function sitio(v) {
    const C = MZ.merge(MZ.DEFAULTS, D.cfg);
    const REDES = ["Instagram", "Facebook", "TikTok", "YouTube", "Spotify", "WhatsApp", "Sitio web"];
    const redesEd = (k) => `<div id="rd_${k}">${(C.redes[k] || []).map((r, i) => `<div class="row" style="margin-bottom:8px;flex-wrap:nowrap"><select class="input" data-rk="${k}" data-i="${i}" data-f="red" style="width:130px;flex:none">${REDES.map(x => `<option ${x === r.red ? "selected" : ""}>${x}</option>`).join("")}</select>
      <input class="input" data-rk="${k}" data-i="${i}" data-f="url" placeholder="https://…" value="${esc(r.url)}"><button class="icon-btn" data-rdel="${k}" data-i="${i}">×</button></div>`).join("")}</div>
      <button class="btn btn-ghost btn-sm" data-radd="${k}">＋ Agregar red</button>`;
    v.innerHTML = head("Sitio", `<a class="btn btn-ghost btn-sm" href="/" target="_blank">Ver sitio ↗</a><button class="btn btn-accent btn-sm" id="save">Guardar cambios</button>`) + `
      <p class="muted small" style="margin:-6px 0 14px">Todo lo que cambie aquí se publica en la página al guardar.</p>
      <div class="ed-sec glass"><h3>🏠 Portada</h3>
        <div class="field"><label class="lbl">Título principal</label><input class="input" data-p="portada.titulo" value="${esc(C.portada.titulo)}" maxlength="90"></div>
        <div class="field"><label class="lbl">Texto debajo del título</label><textarea class="input" data-p="portada.subtitulo" maxlength="260">${esc(C.portada.subtitulo)}</textarea></div>
        <div class="field"><label class="lbl">Texto del botón principal</label><input class="input" data-p="portada.cta" value="${esc(C.portada.cta)}" maxlength="70"></div>
        <div class="field"><label class="lbl">Nota del botón</label><input class="input" data-p="portada.ctaNota" value="${esc(C.portada.ctaNota)}" maxlength="120"></div></div>
      <div class="ed-sec glass"><h3>🎨 Colores de la marca</h3><div class="color-row">
        ${[["acento", "Amarillo (acento)"], ["oscuro", "Café (texto y botones)"], ["verde", "Verde (Frecuencia)"], ["tierra", "Tierra (Ruta)"]].map(([k, l]) => `<label><input type="color" data-p="colores.${k}" value="${esc(C.colores[k])}">${l}</label>`).join("")}</div>
        <button class="btn btn-ghost btn-sm" id="rc" style="margin-top:10px">Restaurar colores originales</button></div>
      <div class="ed-sec glass"><h3>💬 Contacto</h3><div class="grid g2">
        <div class="field"><label class="lbl">WhatsApp (con 503, sin espacios)</label><input class="input" data-p="marca.whatsapp" value="${esc(C.marca.whatsapp)}" inputmode="numeric"></div>
        <div class="field"><label class="lbl">WhatsApp como se muestra</label><input class="input" data-p="marca.whatsappTexto" value="${esc(C.marca.whatsappTexto)}"></div>
        <div class="field"><label class="lbl">Mensaje inicial de WhatsApp</label><input class="input" data-p="marca.whatsappMensaje" value="${esc(C.marca.whatsappMensaje)}"></div>
        <div class="field"><label class="lbl">Correo</label><input class="input" type="email" data-p="marca.correo" value="${esc(C.marca.correo)}"></div></div></div>
      <div class="ed-sec glass"><h3>📻 Redes de Frecuencia Maíz</h3>${redesEd("frecuencia")}</div>
      <div class="ed-sec glass"><h3>🎬 Redes de Estudio Maíz</h3>${redesEd("estudio")}</div>
      <div class="ed-sec glass"><h3>🗺️ Redes de Ruta Maíz</h3>${redesEd("ruta")}</div>
      <div class="ed-sec glass"><h3>🧑‍🤝‍🧑 Quiénes somos</h3><div id="eq"></div><button class="btn btn-ghost btn-sm" id="addm">＋ Agregar integrante</button></div>`;
    const set = (path, val) => { const ks = path.split("."); let o = C; ks.slice(0, -1).forEach(k => o = o[k] = o[k] || {}); o[ks[ks.length - 1]] = val; };
    v.querySelectorAll("[data-p]").forEach(i => i.oninput = () => { set(i.dataset.p, i.value); if (i.type === "color") { D.cfg.colores = C.colores; MZ.CFG().colores = C.colores; MZ.applyColors(); } });
    v.querySelector("#rc").onclick = () => { C.colores = Object.assign({}, MZ.DEFAULTS.colores); v.querySelectorAll("input[type=color]").forEach(i => i.value = C.colores[i.dataset.p.split(".")[1]]); MZ.toast("Colores restaurados (falta Guardar)"); };
    const bindRedes = () => {
      v.querySelectorAll("[data-rk]").forEach(i => i.oninput = i.onchange = () => { C.redes[i.dataset.rk][+i.dataset.i][i.dataset.f] = i.value.trim(); });
      v.querySelectorAll("[data-rdel]").forEach(b => b.onclick = () => { C.redes[b.dataset.rdel].splice(+b.dataset.i, 1); redraw(b.dataset.rdel); });
      v.querySelectorAll("[data-radd]").forEach(b => b.onclick = () => { (C.redes[b.dataset.radd] = C.redes[b.dataset.radd] || []).push({ red: "Instagram", url: "" }); redraw(b.dataset.radd); });
    };
    const redraw = k => { const box = v.querySelector("#rd_" + k).parentElement; box.innerHTML = `<h3>${box.querySelector("h3").innerHTML}</h3>` + redesEd(k); bindRedes(); };
    bindRedes();
    const drawEq = () => {
      const box = v.querySelector("#eq");
      box.innerHTML = C.equipo.map((m, i) => `<div class="mem"><label class="ph" style="${m.foto ? `background-image:url('${esc(m.foto)}')` : ""}" title="Subir foto">${m.foto ? "" : "📷"}<input type="file" accept="image/*" data-up="${i}"></label>
        <div class="stack" style="gap:8px"><div class="row" style="flex-wrap:nowrap"><input class="input" data-m="${i}" data-f="nombre" placeholder="Nombre" value="${esc(m.nombre)}"><button class="icon-btn" data-mdel="${i}" title="Quitar">×</button></div>
        <input class="input" data-m="${i}" data-f="rol" placeholder="Cargo o rol" value="${esc(m.rol)}">
        <textarea class="input" data-m="${i}" data-f="bio" placeholder="Descripción breve" style="min-height:70px">${esc(m.bio)}</textarea></div></div>`).join("");
      box.querySelectorAll("[data-m]").forEach(i => i.oninput = () => C.equipo[+i.dataset.m][i.dataset.f] = i.value);
      box.querySelectorAll("[data-mdel]").forEach(b => b.onclick = () => { C.equipo.splice(+b.dataset.mdel, 1); drawEq(); });
      box.querySelectorAll("[data-up]").forEach(f => f.onchange = async () => {
        const file = f.files[0]; if (!file) return;
        MZ.toast("Subiendo foto…", 8000);
        try { C.equipo[+f.dataset.up].foto = await MZ.upload(KEY, file); MZ.toast("Foto lista (falta Guardar)"); drawEq(); } catch (e) { MZ.toast("No se pudo subir: " + e.message, 4000); }
      });
    };
    drawEq();
    v.querySelector("#addm").onclick = () => { C.equipo.push({ nombre: "", rol: "", bio: "", foto: "" }); drawEq(); };
    v.querySelector("#save").onclick = async () => {
      const out = { marca: C.marca, portada: C.portada, colores: C.colores, redes: { frecuencia: clean(C.redes.frecuencia), estudio: clean(C.redes.estudio), ruta: clean(C.redes.ruta) }, equipo: C.equipo.filter(m => m.nombre), unidades: C.unidades };
      const bad = [].concat(out.redes.frecuencia, out.redes.estudio, out.redes.ruta).find(r => !/^https?:\/\/[^\s.]+\.[^\s]+/.test(r.url));
      if (bad) return MZ.toast(`Revise el enlace de ${bad.red}: debe empezar con https://`, 4000);
      try { await rpc("admin_set_config", { p_key: KEY, p_data: out }); D.cfg = out; sessionStorage.removeItem("maiz_cfg"); MZ.toast("Cambios publicados ✓"); }
      catch (e) { MZ.toast("No se pudo guardar"); }
    };
    function clean(l) { return (l || []).filter(r => r.url).map(r => ({ red: r.red, url: /^https?:\/\//.test(r.url) ? r.url : "https://" + r.url })); }
  }

  // ---------------- Portafolio ----------------
  function portafolio(v) {
    v.innerHTML = head("Portafolio", `<a class="btn btn-ghost btn-sm" href="/estudio-maiz#portafolio" target="_blank">Ver en la página ↗</a><button class="btn btn-accent btn-sm" id="add">＋ Agregar trabajo</button>`) + `
      <p class="muted small" style="margin:-6px 0 14px">Suba videos (MP4 de hasta 50 MB) o pegue el enlace de Instagram, TikTok, YouTube o Facebook.</p>
      <div class="pf-grid">${D.pf.length ? D.pf.map(p => `<div class="pf"><div class="v" style="${p.poster_url ? `background-image:url('${esc(p.poster_url)}')` : ""}">${p.poster_url ? "" : "🎬"}</div>
        <div class="b"><b>${esc(p.titulo)}</b><p class="muted">${esc(p.cliente || "")}${p.publicado ? "" : " · oculto"}</p><div class="row" style="margin-top:8px"><button class="btn btn-ghost btn-sm" data-e="${p.id}">Editar</button></div></div></div>`).join("") : '<p class="muted">Aún no hay trabajos. Agregue el primero.</p>'}</div>`;
    v.querySelector("#add").onclick = () => pfEdit({ publicado: true, orden: 0 });
    v.querySelectorAll("[data-e]").forEach(b => b.onclick = () => pfEdit(D.pf.find(x => x.id === b.dataset.e)));
  }
  function sheet(html) {
    const bg = document.createElement("div"); bg.className = "sheet-bg"; bg.innerHTML = `<div class="sheet glass">${html}</div>`;
    bg.onclick = e => { if (e.target === bg) close(); }; document.body.appendChild(bg);
    const close = () => { bg.remove(); }; bg.close = close; return bg;
  }
  function pfEdit(p) {
    const s = sheet(`<div class="row between" style="margin-bottom:14px"><h2 class="h-md">${p.id ? "Editar trabajo" : "Nuevo trabajo"}</h2><button class="icon-btn" data-x>×</button></div>
      <div class="field"><label class="lbl">Título</label><input class="input" id="pt" value="${esc(p.titulo || "")}" placeholder="Ej.: Reel de La Crepa"></div>
      <div class="grid g2"><div class="field"><label class="lbl">Cliente</label><input class="input" id="pc" value="${esc(p.cliente || "")}"></div>
        <div class="field"><label class="lbl">Rubro</label><input class="input" id="pr" value="${esc(p.rubro || "")}" placeholder="Restaurante, hotel…"></div></div>
      <div class="field"><label class="lbl">Descripción</label><textarea class="input" id="pd" style="min-height:70px">${esc(p.descripcion || "")}</textarea></div>
      <div class="field"><span class="lbl">Video</span><label class="drop"><input type="file" accept="video/mp4,video/quicktime,video/webm" id="pv">📤 Toque para subir un video<br><span class="hint">${p.video_url ? "Ya tiene video. Suba otro para reemplazarlo." : "MP4 vertical recomendado"}</span></label>
        <input class="input" id="pu" placeholder="o pegue un enlace: https://instagram.com/reel/…" value="${esc(p.video_url || "")}" style="margin-top:8px"></div>
      <div class="field"><span class="lbl">Portada (imagen)</span><label class="drop"><input type="file" accept="image/*" id="pp">🖼️ Subir imagen de portada</label>
        ${p.poster_url ? `<img src="${esc(p.poster_url)}" style="height:80px;border-radius:10px;margin-top:8px">` : ""}</div>
      <div class="field"><label class="lbl">Enlace a la publicación en redes (opcional)</label><input class="input" id="pl" value="${esc(p.red_url || "")}" placeholder="https://…"></div>
      <label class="row small" style="margin-bottom:16px"><input type="checkbox" id="pb" ${p.publicado !== false ? "checked" : ""}> Mostrar en la página</label>
      <div class="row"><button class="btn btn-primary" id="ps">Guardar</button>${p.id ? '<button class="btn btn-ghost" id="pdl" style="color:#b0392d">Eliminar</button>' : ""}</div>`);
    const q = id => s.querySelector(id);
    q("[data-x]").onclick = s.close;
    const up = async (inp, k) => { const f = inp.files[0]; if (!f) return; if (f.size > 50 * 1024 * 1024) return MZ.toast("El archivo pasa de 50 MB. Comprímalo en CapCut (1080p).", 5000); MZ.toast("Subiendo… no cierre esta ventana", 60000);
      try { p[k] = await MZ.upload(KEY, f); if (k === "video_url") q("#pu").value = p[k]; MZ.toast("Archivo subido ✓"); } catch (e) { MZ.toast("Error: " + e.message, 5000); } };
    q("#pv").onchange = () => up(q("#pv"), "video_url");
    q("#pp").onchange = () => up(q("#pp"), "poster_url");
    q("#ps").onclick = async () => {
      const row = { id: p.id || "", titulo: q("#pt").value.trim() || "Proyecto", cliente: q("#pc").value, rubro: q("#pr").value, descripcion: q("#pd").value, video_url: q("#pu").value.trim(), poster_url: p.poster_url || "", red_url: q("#pl").value.trim(), orden: p.orden || 0, publicado: q("#pb").checked };
      try { await rpc("admin_upsert_portafolio", { p_key: KEY, p_row: row }); D.pf = await rpc("admin_list_portafolio", { p_key: KEY }); s.close(); route(); MZ.toast("Guardado ✓"); } catch (e) { MZ.toast("No se pudo guardar"); }
    };
    if (p.id) q("#pdl").onclick = async () => { if (!confirm("¿Eliminar este trabajo del portafolio?")) return; await rpc("admin_delete_portafolio", { p_key: KEY, p_id: p.id }); D.pf = D.pf.filter(x => x.id !== p.id); s.close(); route(); };
  }

  // ---------------- Ruta Maíz ----------------
  function ruta(v) {
    v.innerHTML = head("Ruta Maíz", `<a class="btn btn-ghost btn-sm" href="/ruta-maiz" target="_blank">Ver app ↗</a><button class="btn btn-accent btn-sm" id="al">＋ Local</button><button class="btn btn-ghost btn-sm" id="ar">＋ Ruta</button>`) + `
      <p class="muted small" style="margin:-6px 0 14px">Los locales marcados “ejemplo” son de muestra: puede editarlos o borrarlos cuando tenga negocios reales.</p>
      <h3 class="h-md" style="margin:8px 0 10px">Locales (${D.locales.length})</h3>
      <div class="list">${D.locales.map(l => `<div class="item glass" data-l="${l.id}"><div class="av" style="background:#f1dfd2">📍</div><div style="min-width:0"><h3>${esc(l.nombre)}</h3><p>${esc(l.categoria || "")} · ${esc(l.municipio || "")}</p></div>
        <span class="tag ${l.publicado ? "g" : ""}">${l.publicado ? "Publicado" : "Oculto"}${l.plan !== "basico" ? " · " + cap(l.plan) : ""}</span></div>`).join("")}</div>
      <h3 class="h-md" style="margin:22px 0 10px">Rutas (${D.rutas.length})</h3>
      <div class="list">${D.rutas.map(r => `<div class="item glass" data-r="${r.id}"><div class="av" style="background:var(--verde-claro)">🧭</div><div style="min-width:0"><h3>${esc(r.nombre)}</h3><p>${(r.locales || []).length} paradas · ${esc(r.duracion || "")}</p></div>
        <span class="tag ${r.publicado ? "g" : ""}">${r.publicado ? "Publicada" : "Oculta"}</span></div>`).join("")}</div>`;
    v.querySelector("#al").onclick = () => localEdit({ publicado: true, precio_nivel: 2, plan: "basico", pros: [], contras: [], servicios: [], practicas: [], menu: [] });
    v.querySelector("#ar").onclick = () => rutaEdit({ publicado: true, locales: [] });
    v.querySelectorAll("[data-l]").forEach(e => e.onclick = () => localEdit(D.locales.find(x => x.id === e.dataset.l)));
    v.querySelectorAll("[data-r]").forEach(e => e.onclick = () => rutaEdit(D.rutas.find(x => x.id === e.dataset.r)));
  }
  function localEdit(l) {
    const menuTxt = (l.menu || []).map(c => `# ${c.cat}\n` + (c.items || []).map(i => `${i.n} | ${i.p || ""}`).join("\n")).join("\n");
    const s = sheet(`<div class="row between" style="margin-bottom:14px"><h2 class="h-md">${l.id ? "Editar local" : "Nuevo local"}</h2><button class="icon-btn" data-x>×</button></div>
      <div class="grid g2"><div class="field"><label class="lbl">Nombre</label><input class="input" id="n" value="${esc(l.nombre || "")}"></div>
        <div class="field"><label class="lbl">Categoría</label><select class="input" id="c">${["Café", "Restaurante", "Hospedaje", "Finca", "Tienda", "Experiencia"].map(x => `<option ${x === l.categoria ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="field"><label class="lbl">Municipio</label><input class="input" id="mu" value="${esc(l.municipio || "")}"></div>
        <div class="field"><label class="lbl">WhatsApp</label><input class="input" id="w" value="${esc(l.whatsapp || "")}" placeholder="50370000000"></div></div>
      <span class="lbl">Ubicación (toque el mapa)</span><div class="pick-map" id="pm" style="margin-top:6px"></div>
      <div class="grid g2"><div class="field"><label class="lbl">Latitud</label><input class="input" id="la" value="${esc(l.lat ?? "")}"></div><div class="field"><label class="lbl">Longitud</label><input class="input" id="lo" value="${esc(l.lng ?? "")}"></div></div>
      <div class="field"><label class="lbl">Descripción</label><textarea class="input" id="d">${esc(l.descripcion || "")}</textarea></div>
      <div class="grid g2"><div class="field"><label class="lbl">Pros (uno por línea)</label><textarea class="input" id="pr">${esc((l.pros || []).join("\n"))}</textarea></div>
        <div class="field"><label class="lbl">Contras (uno por línea)</label><textarea class="input" id="co">${esc((l.contras || []).join("\n"))}</textarea></div>
        <div class="field"><label class="lbl">Consumo aproximado</label><input class="input" id="cs" value="${esc(l.consumo || "")}" placeholder="$5 – $10 por persona"></div>
        <div class="field"><label class="lbl">Nivel de precio</label><select class="input" id="pn">${[1, 2, 3, 4].map(x => `<option value="${x}" ${x === l.precio_nivel ? "selected" : ""}>${"$".repeat(x)}</option>`).join("")}</select></div>
        <div class="field"><label class="lbl">Horario</label><input class="input" id="h" value="${esc(l.horario || "")}"></div>
        <div class="field"><label class="lbl">Plan del negocio</label><select class="input" id="pl">${["basico", "destacado", "aliado"].map(x => `<option value="${x}" ${x === l.plan ? "selected" : ""}>${cap(x)}</option>`).join("")}</select></div></div>
      <div class="field"><label class="lbl">Servicios (separados por coma)</label><input class="input" id="sv" value="${esc((l.servicios || []).join(", "))}" placeholder="Wifi, Tours, Alquiler de bicicletas, Spa…"></div>
      <div class="field"><label class="lbl">Prácticas de economía circular (separadas por coma)</label><input class="input" id="ec" value="${esc((l.practicas || []).join(", "))}"></div>
      <div class="field"><label class="lbl">Promoción o canje</label><input class="input" id="pmo" value="${esc(l.promo || "")}" placeholder="Ej.: 10% presentando su Pasaporte Maíz"></div>
      <div class="field"><label class="lbl">Menú digital: enlace (si ya tiene uno)</label><input class="input" id="mn" value="${esc(l.menu_url || "")}" placeholder="https://…"></div>
      <div class="field"><label class="lbl">…o menú creado con nosotros</label><textarea class="input" id="mt" placeholder="# Desayunos&#10;Desayuno típico | 4.50&#10;# Bebidas&#10;Café de olla | 1.50">${esc(menuTxt)}</textarea><span class="hint">Escriba “# Categoría” y debajo “Producto | precio”.</span></div>
      <div class="field"><span class="lbl">Foto</span><label class="drop"><input type="file" accept="image/*" id="ft">🖼️ Subir foto del local</label>${l.foto_url ? `<img src="${esc(l.foto_url)}" style="height:80px;border-radius:10px;margin-top:8px">` : ""}</div>
      <div class="row" style="margin-bottom:14px"><label class="row small"><input type="checkbox" id="pu" ${l.publicado ? "checked" : ""}> Publicado</label><label class="row small"><input type="checkbox" id="ej" ${l.ejemplo ? "checked" : ""}> Es de ejemplo</label></div>
      <div class="row"><button class="btn btn-primary" id="sv2">Guardar</button>${l.id ? '<button class="btn btn-ghost" id="del" style="color:#b0392d">Eliminar</button>' : ""}</div>`);
    const q = id => s.querySelector(id);
    q("[data-x]").onclick = s.close;
    if (window.L) {
      const c = l.lat ? [l.lat, l.lng] : [13.86, -89.78];
      const mp = L.map(q("#pm")).setView(c, l.lat ? 14 : 10);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { attribution: "© OpenStreetMap · © CARTO" }).addTo(mp);
      let mk = l.lat ? L.marker(c).addTo(mp) : null;
      mp.on("click", e => { q("#la").value = e.latlng.lat.toFixed(6); q("#lo").value = e.latlng.lng.toFixed(6); mk ? mk.setLatLng(e.latlng) : mk = L.marker(e.latlng).addTo(mp); });
      setTimeout(() => mp.invalidateSize(), 400);
    }
    q("#ft").onchange = async () => { const f = q("#ft").files[0]; if (!f) return; MZ.toast("Subiendo…", 20000); try { l.foto_url = await MZ.upload(KEY, f); MZ.toast("Foto subida ✓"); } catch (e) { MZ.toast("Error: " + e.message); } };
    const lines = t => t.split("\n").map(x => x.trim()).filter(Boolean);
    const commas = t => t.split(",").map(x => x.trim()).filter(Boolean);
    q("#sv2").onclick = async () => {
      const menu = []; lines(q("#mt").value).forEach(x => { if (x.startsWith("#")) menu.push({ cat: x.replace(/^#\s*/, ""), items: [] }); else { if (!menu.length) menu.push({ cat: "Menú", items: [] }); const [n, p] = x.split("|").map(y => y.trim()); menu[menu.length - 1].items.push({ n, p: p || "" }); } });
      const row = { id: l.id || "", nombre: q("#n").value.trim(), categoria: q("#c").value, municipio: q("#mu").value, whatsapp: q("#w").value, lat: q("#la").value, lng: q("#lo").value, descripcion: q("#d").value,
        pros: lines(q("#pr").value), contras: lines(q("#co").value), consumo: q("#cs").value, precio_nivel: q("#pn").value, horario: q("#h").value, plan: q("#pl").value,
        servicios: commas(q("#sv").value), practicas: commas(q("#ec").value), promo: q("#pmo").value, menu_url: q("#mn").value.trim(), menu, foto_url: l.foto_url || "", publicado: q("#pu").checked, ejemplo: q("#ej").checked };
      if (!row.nombre) return MZ.toast("Escriba el nombre del local");
      try { await rpc("admin_upsert_local", { p_key: KEY, p_row: row }); D.locales = await rpc("admin_list_locales", { p_key: KEY }); s.close(); route(); MZ.toast("Local guardado ✓"); } catch (e) { MZ.toast("No se pudo guardar: " + e.message, 4000); }
    };
    if (l.id) q("#del").onclick = async () => { if (!confirm("¿Eliminar este local?")) return; await rpc("admin_delete_local", { p_key: KEY, p_id: l.id }); D.locales = D.locales.filter(x => x.id !== l.id); s.close(); route(); };
  }
  function rutaEdit(r) {
    let sel = (r.locales || []).slice();
    const s = sheet(`<div class="row between" style="margin-bottom:14px"><h2 class="h-md">${r.id ? "Editar ruta" : "Nueva ruta"}</h2><button class="icon-btn" data-x>×</button></div>
      <div class="field"><label class="lbl">Nombre</label><input class="input" id="n" value="${esc(r.nombre || "")}" placeholder="Ruta del Café"></div>
      <div class="field"><label class="lbl">Descripción</label><textarea class="input" id="d">${esc(r.descripcion || "")}</textarea></div>
      <div class="grid g2"><div class="field"><label class="lbl">Duración</label><input class="input" id="du" value="${esc(r.duracion || "")}" placeholder="1 día"></div>
        <div class="field"><label class="lbl">Tema</label><input class="input" id="t" value="${esc(r.tema || "")}" placeholder="Café, Cultura, Naturaleza…"></div></div>
      <span class="lbl">Paradas (en orden)</span><div id="ps" class="stack" style="margin:8px 0 14px;gap:6px"></div>
      <label class="row small" style="margin-bottom:14px"><input type="checkbox" id="pu" ${r.publicado ? "checked" : ""}> Publicada</label>
      <div class="row"><button class="btn btn-primary" id="sv">Guardar</button>${r.id ? '<button class="btn btn-ghost" id="del" style="color:#b0392d">Eliminar</button>' : ""}</div>`);
    const q = id => s.querySelector(id);
    q("[data-x]").onclick = s.close;
    const draw = () => {
      const ordered = sel.map(id => D.locales.find(l => l.id === id)).filter(Boolean).concat(D.locales.filter(l => !sel.includes(l.id)));
      q("#ps").innerHTML = ordered.map(l => { const i = sel.indexOf(l.id); return `<div class="row" style="flex-wrap:nowrap;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.6)">
        <input type="checkbox" data-t="${l.id}" ${i >= 0 ? "checked" : ""}><span style="flex:1;min-width:0">${i >= 0 ? `<b>${i + 1}.</b> ` : ""}${esc(l.nombre)} <span class="muted tiny">${esc(l.municipio || "")}</span></span>
        ${i > 0 ? `<button class="icon-btn" style="width:34px;height:34px" data-up="${l.id}">↑</button>` : ""}</div>`; }).join("");
      q("#ps").querySelectorAll("[data-t]").forEach(c => c.onchange = () => { sel = c.checked ? sel.concat(c.dataset.t) : sel.filter(x => x !== c.dataset.t); draw(); });
      q("#ps").querySelectorAll("[data-up]").forEach(b => b.onclick = () => { const i = sel.indexOf(b.dataset.up); [sel[i - 1], sel[i]] = [sel[i], sel[i - 1]]; draw(); });
    };
    draw();
    q("#sv").onclick = async () => {
      const row = { id: r.id || "", nombre: q("#n").value.trim() || "Ruta", descripcion: q("#d").value, duracion: q("#du").value, tema: q("#t").value, locales: sel, publicado: q("#pu").checked };
      try { await rpc("admin_upsert_ruta", { p_key: KEY, p_row: row }); D.rutas = await rpc("admin_list_rutas", { p_key: KEY }); s.close(); route(); MZ.toast("Ruta guardada ✓"); } catch (e) { MZ.toast("No se pudo guardar"); }
    };
    if (r.id) q("#del").onclick = async () => { if (!confirm("¿Eliminar esta ruta?")) return; await rpc("admin_delete_ruta", { p_key: KEY, p_id: r.id }); D.rutas = D.rutas.filter(x => x.id !== r.id); s.close(); route(); };
  }

  KEY ? boot() : login();
})();
