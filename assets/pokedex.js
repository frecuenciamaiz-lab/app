/* Bitácora Maíz · Pokédex de la Reserva Apaneca-Ilamatepec
   - Base de datos verificada (Anexo 1 del Plan de Manejo AC A-I 2026) en Supabase
   - Qué vive donde está el usuario (áreas núcleo), datos curiosos en texto y voz
   - Juego tipo Pokémon Go: capturar especies en su hábitat real, ranking y premios */
(function () {
  I18N.add({ ver_3d: ["Holograma 3D", "3D hologram", "Hologramme 3D", "3D-Hologramm"] });
  const { esc } = MZ, t = I18N.t, LANG = I18N.lang();
  const $ = s => document.querySelector(s), scr = $("#scr");
  document.getElementById("bk").innerHTML = MZ.I.back;
  document.getElementById("langBox").innerHTML = I18N.picker();
  I18N.apply();
  MZ.aurora(); MZ.track("vista");

  // ---------- Estado del jugador (en este celular) ----------
  const PK = "maiz_pokedex";
  const load = () => { try { return JSON.parse(localStorage.getItem(PK)) || {}; } catch (e) { return {}; } };
  let P = Object.assign({ cap: {}, vis: {}, done: {}, alias: "", voz: false }, load());
  if (!P.uid) P.uid = (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ Math.random() * 16 >> c / 4).toString(16)));
  const save = () => localStorage.setItem(PK, JSON.stringify(P));
  save();
  const PTS = { comun: 10, rara: 25, legendaria: 50 };
  const puntos = () => Object.keys(P.cap).reduce((a, id) => { const s = BYID[id]; return a + (s ? PTS[s.rareza] || 10 : 0); }, 0);

  // ---------- Datos ----------
  let E = [], BYID = {}, ANP = [], LOCALES = [], AVIST = [];
  const COLS = "id,orden,tipo,nombre,cientifico,familia,estado,rareza,anp,imagen_url,inat_id,emoji";
  async function datos() {
    const CK = "pdx_cache_v2";
    try { const c = JSON.parse(localStorage.getItem(CK)); if (c && Date.now() - c.t < 6 * 3600e3 && c.d.length) E = c.d; } catch (e) {}
    const fresh = (async () => {
      const a = await MZ.sbSelect("especies", `select=${COLS}&publicado=eq.true&order=orden.asc.nullslast&limit=1000&offset=0`);
      const b = a.length === 1000 ? await MZ.sbSelect("especies", `select=${COLS}&publicado=eq.true&order=orden.asc.nullslast&limit=1000&offset=1000`) : [];
      const d = a.concat(b); try { localStorage.setItem(CK, JSON.stringify({ t: Date.now(), d })); } catch (e) {}
      return d;
    })();
    if (!E.length) E = await fresh.catch(() => []); else fresh.then(d => { E = d; index(); }).catch(() => {});
    index();
    [ANP, LOCALES, AVIST] = await Promise.all([
      fetch("/assets/anp.json").then(r => r.json()).catch(() => []),
      MZ.sbSelect("ruta_locales", "select=id,nombre,lat,lng,categoria").catch(() => []),
      MZ.sbSelect("avistamientos", "select=id,especie_id,lat,lng,radio,nota").catch(() => [])]);
    const cfg = (await MZ.cfgReady).mapa || {};
    (cfg.anp || []).forEach(o => { const a = ANP.find(x => x.code === o.code); if (a && o.centro) a.centro = o.centro; });
  }
  function index() { E.sort((a, b) => ((a.estado === "Introducida") - (b.estado === "Introducida")) || ((a.orden ?? 1e9) - (b.orden ?? 1e9))); BYID = {}; E.forEach((s, i) => { s.n = i + 1; BYID[s.id] = s; }); $("#pdxCount").textContent = `${E.length} ${t("especies")} · ${Object.keys(P.cap).length} ${t("capturadas")}`; }

  // ---------- Geometría ----------
  function inPoly(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if (((a[0] > p[0]) !== (b[0] > p[0])) && (p[1] < (b[1] - a[1]) * (p[0] - a[0]) / (b[0] - a[0]) + a[1])) c = !c; } return c; }
  const dist = (a, b) => { const R = 6371000, r = x => x * Math.PI / 180, d = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(d)); };
  function anpDe(p) {
    for (const a of ANP) if (a.polys.some(pl => inPoly(p, pl))) return { a, d: 0 };
    let best = null; ANP.forEach(a => a.polys.forEach(pl => pl.forEach(q => { const d = dist(p, q); if (!best || d < best.d) best = { a, d }; })));
    return best;
  }
  const deAnp = code => E.filter(s => (s.anp || []).includes(code));

  // ---------- iNaturalist (fotos, nombres en otros idiomas, datos de Wikipedia) ----------
  const IC = (() => { try { return JSON.parse(localStorage.getItem("pdx_inat") || "{}"); } catch (e) { return {}; } })();
  let icT; const icSave = () => { clearTimeout(icT); icT = setTimeout(() => { try { localStorage.setItem("pdx_inat", JSON.stringify(IC)); } catch (e) { for (const k in IC) delete IC[k]; } }, 800); };
  let cola = Promise.resolve(); const turno = fn => (cola = cola.then(() => new Promise(r => setTimeout(r, 350))).then(fn).catch(() => null));
  async function inat(s) {
    const k = s.cientifico.toLowerCase(); if (IC[k] && IC[k].v === 2) return IC[k];
    const r = await turno(() => fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(s.cientifico)}&per_page=1&locale=${LANG}`).then(x => x.json()));
    const x = r && r.results && r.results[0];
    IC[k] = { v: 2, id: x ? x.id : null, foto: x && x.default_photo ? x.default_photo.medium_url : null, credito: x && x.default_photo ? x.default_photo.attribution : "", nombre: x ? x.preferred_common_name : "" };
    icSave(); return IC[k];
  }
  async function inatDetalle(id) {
    const k = "d" + id + LANG; if (IC[k]) return IC[k];
    const r = await turno(() => fetch(`https://api.inaturalist.org/v1/taxa/${id}?locale=${LANG}`).then(x => x.json()));
    const x = r && r.results && r.results[0]; if (!x) return null;
    const tmp = document.createElement("div"); tmp.innerHTML = x.wikipedia_summary || "";
    IC[k] = { wiki: (tmp.textContent || "").trim().slice(0, 700), nombre: x.preferred_common_name || "", fotos: (x.taxon_photos || []).slice(0, 6).map(p => ({ u: p.photo.medium_url, c: p.photo.attribution })) };
    icSave(); return IC[k];
  }
  // carga perezosa de fotos en tarjetas
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fotoTarjeta(e.target); } }), { rootMargin: "200px" }) : null;
  async function fotoTarjeta(el) {
    const s = BYID[el.dataset.id]; if (!s) return;
    let u = s.imagen_url; if (!u) { const i = await inat(s); u = i && i.foto; }
    if (u) { el.style.backgroundImage = `url('${u}')`; el.classList.add("ok"); }
  }
  const foto = (s, cls) => `<span class="pdx-ph ${cls || ""} ${s.imagen_url ? "ok" : ""}" data-id="${s.id}" ${s.imagen_url ? `style="background-image:url('${esc(s.imagen_url)}')"` : ""}><i>${ICO[s.tipo] || "🌿"}</i></span>`;
  const obs = root => root.querySelectorAll(".pdx-ph:not(.ok)").forEach(el => io ? io.observe(el) : fotoTarjeta(el));
  const ICO = { "Mamífero": "🦊", "Ave": "🐦", "Reptil": "🦎", "Anfibio": "🐸", "Invertebrado": "🦋", "Planta": "🌿", "Lugar": "⛰️", "Cultura": "🎨" };
  const num = n => "#" + String(n).padStart(4, "0");
  const rz = s => `<span class="rz ${s.rareza}">${t("rareza_" + (s.rareza || "comun"))}</span>`;
  const est = s => s.estado ? `<span class="st ${/peligro/i.test(s.estado) ? "r" : /amenaz/i.test(s.estado) ? "y" : "g"}">${t("e_" + s.estado)}</span>` : "";

  // ---------- Voz ----------
  let hablando = false;
  function hablar(texto, btn) {
    if (!("speechSynthesis" in window)) return MZ.toast("Su navegador no tiene voz");
    speechSynthesis.cancel(); if (hablando && btn) { hablando = false; btn.classList.remove("on"); btn.lastChild.textContent = " " + t("escuchar"); return; }
    const u = new SpeechSynthesisUtterance(texto), code = { es: "es", en: "en", fr: "fr", de: "de" }[LANG];
    const vs = speechSynthesis.getVoices(), pref = ["es-MX", "es-US", "es-419", "es-ES"];
    u.voice = (LANG === "es" ? pref.map(p => vs.find(v => v.lang === p)).find(Boolean) : null) || vs.find(v => v.lang.startsWith(code)) || null;
    u.lang = u.voice ? u.voice.lang : code; u.rate = 1;
    u.onend = u.onerror = () => { hablando = false; if (btn) { btn.classList.remove("on"); btn.lastChild.textContent = " " + t("escuchar"); } };
    hablando = true; if (btn) { btn.classList.add("on"); btn.lastChild.textContent = " " + t("detener"); }
    speechSynthesis.speak(u);
  }
  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  // ---------- Pestañas ----------
  let tab = new URLSearchParams(location.search).get("t") || "cerca";
  function setTab(x) { tab = x; document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.t === x)); if (mapa) { mapa.remove(); mapa = null; } detenerGPS(); ({ cerca, lista, explorar, ranking })[x](); }
  document.getElementById("tabs").onclick = e => { const b = e.target.closest("button"); if (b) setTab(b.dataset.t); };

  // ---------- Ubicación ----------
  const PRUEBA = new URLSearchParams(location.search).has("prueba") || localStorage.getItem("maiz_admin_device") === "1";
  let yo = null, sim = null;
  function ubicar() {
    return new Promise(res => {
      if (sim) return res(sim);
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(p => { yo = [p.coords.latitude, p.coords.longitude]; res(yo); }, () => res(null), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
    });
  }

  // ---------- CERCA DE MÍ ----------
  let grupo = "", areaSel = null;
  async function cerca() {
    scr.innerHTML = `<p class="muted">${t("cargando")}</p>`;
    const p = areaSel ? null : await ubicar();
    let info = areaSel ? { a: areaSel, d: 0 } : p ? anpDe(p) : null;
    if (!info) {
      scr.innerHTML = `<div class="pdx-card"><p>${t("sin_ubicacion")}</p><div class="chips" style="margin-top:10px">${ANP.map(a => `<button class="chip" data-a="${a.code}">${esc(a.nombre)}</button>`).join("")}</div>
        <button class="btn btn-accent btn-sm" id="reloc" style="margin-top:12px">📍 ${t("usar_ubicacion")}</button></div>`;
      scr.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { areaSel = ANP.find(a => a.code === b.dataset.a); cerca(); });
      scr.querySelector("#reloc").onclick = () => { areaSel = null; cerca(); };
      return;
    }
    const a = info.a, L = deAnp(a.code), g = [...new Set(L.map(s => s.tipo))];
    const peligro = L.filter(s => s.rareza === "legendaria").length;
    const vista = L.filter(s => !grupo || s.tipo === grupo).sort((x, y) => (P.cap[y.id] ? 0 : 1) - (P.cap[x.id] ? 0 : 1) || ({ legendaria: 0, rara: 1, comun: 2 }[x.rareza] - { legendaria: 0, rara: 1, comun: 2 }[y.rareza]));
    const texto = `${info.d ? t("mas_cercana") : t("esta_en")}: ${a.nombre}. ${a.desc}. ${L.length} ${t("registradas_aqui")}${peligro ? `; ${peligro} ${t("e_En peligro").toLowerCase()}` : ""}.`;
    scr.innerHTML = `<div class="pdx-area">
        <div class="pdx-area-h"><span class="tag ${info.d ? "" : "g"}">${info.d ? t("mas_cercana") + " · " + t("a_km", { n: (info.d / 1000).toFixed(1) }) : "📍 " + t("esta_en")}</span>
          <h2>${esc(a.nombre)}</h2><p class="small muted">${esc(a.desc)}</p></div>
        <div class="pdx-kpis"><div><b>${L.length}</b>${t("especies")}</div><div><b>${L.filter(s => P.cap[s.id]).length}</b>${t("capturadas")}</div><div><b>${peligro}</b>${t("rareza_legendaria")}</div></div>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn btn-ghost btn-sm" id="voz">🔊<span> ${t("escuchar")}</span></button>
          <button class="btn btn-accent btn-sm" id="ir">🌽 ${t("explorar")}</button>
          <select class="input" id="otra" title="Ver otra área" style="width:auto;padding:8px 10px">${ANP.map(x => `<option value="${x.code}" ${x === a ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select></div></div>
      <div class="pdx-chips">${chipG(g)}</div>
      <div class="pdx-grid" id="grid"></div>`;
    pintarGrid(vista);
    scr.querySelector("#voz").onclick = e => hablar(texto, e.currentTarget);
    scr.querySelector("#ir").onclick = () => setTab("explorar");
    const o = scr.querySelector("#otra"); if (o) o.onchange = () => { areaSel = ANP.find(x => x.code === o.value); cerca(); };
    bindChips(cerca);
    // marcar como vistas
    L.forEach(s => P.vis[s.id] = 1); save();
  }
  const chipG = g => `<button class="chip ${!grupo ? "on" : ""}" data-g="">${t("todo")}</button>` + g.map(x => `<button class="chip ${grupo === x ? "on" : ""}" data-g="${x}">${ICO[x] || ""} ${t("g_" + x)}</button>`).join("");
  function bindChips(fn) { scr.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { grupo = b.dataset.g; fn(); }); }

  // ---------- LISTA (Pokédex completa) ----------
  let q = "", fArea = "", soloCap = false, pagina = 1;
  function lista() {
    const g = [...new Set(E.map(s => s.tipo))];
    scr.innerHTML = `<div class="pdx-search"><input class="input" id="q" type="search" placeholder="🔎 ${t("buscar")}" value="${esc(q)}">
        <select class="input" id="fa"><option value="">📍 ${t("todo")}</option>${ANP.map(a => `<option value="${a.code}" ${fArea === a.code ? "selected" : ""}>${esc(a.nombre)}</option>`).join("")}</select>
        <label class="pdx-tg"><input type="checkbox" id="sc" ${soloCap ? "checked" : ""}> ${t("filtros_capt")}</label></div>
      <div class="pdx-chips">${chipG(g)}</div><div class="pdx-grid" id="grid"></div><div id="mas"></div>`;
    const go = () => { pagina = 1; pintar(); };
    scr.querySelector("#q").oninput = e => { q = e.target.value; clearTimeout(go.t); go.t = setTimeout(go, 250); };
    scr.querySelector("#fa").onchange = e => { fArea = e.target.value; go(); };
    scr.querySelector("#sc").onchange = e => { soloCap = e.target.checked; go(); };
    bindChips(lista); pintar();
    function pintar() {
      const qq = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const L = E.filter(s => (!grupo || s.tipo === grupo) && (!fArea || (s.anp || []).includes(fArea)) && (!soloCap || P.cap[s.id]) &&
        (!qq || (s.nombre + " " + s.cientifico + " " + (s.familia || "")).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(qq)));
      pintarGrid(L.slice(0, pagina * 60));
      const m = scr.querySelector("#mas");
      m.innerHTML = L.length > pagina * 60 ? `<button class="btn btn-ghost" style="width:100%;margin-top:12px">${t("ver_mas")} (${L.length - pagina * 60})</button>` : "";
      const b = m.querySelector("button"); if (b) b.onclick = () => { pagina++; pintar(); };
    }
  }
  function pintarGrid(L) {
    const gr = scr.querySelector("#grid");
    gr.innerHTML = L.map(s => { const c = P.cap[s.id]; return `<button class="pdx-it ${c ? "cap" : ""} ${s.rareza}" data-id="${s.id}">
      <span class="n">${num(s.n)}</span>${c ? '<span class="ok">🌽</span>' : ""}${foto(s)}
      <b>${esc(s.nombre.split("/")[0].trim())}</b><i>${esc(s.cientifico)}</i></button>`; }).join("") || `<p class="muted small">—</p>`;
    obs(gr); gr.querySelectorAll(".pdx-it").forEach(b => b.onclick = () => ficha(BYID[b.dataset.id]));
  }

  // ---------- FICHA ----------
  async function ficha(s) {
    if (!s) return;
    const bg = document.createElement("div"); bg.className = "pdx-modal";
    const cap = P.cap[s.id];
    bg.innerHTML = `<div class="pdx-sheet"><div class="pdx-hero holo"><div class="holo-stage">${foto(s, "big")}<i class="holo-scan"></i><i class="holo-base"></i></div><button class="icon-btn" data-x aria-label="${t("cerrar")}">×</button>
        <span class="pdx-num">${num(s.n)}</span><div class="pdx-thumbs" id="th"></div></div>
      <div class="pdx-body"><div class="row" style="gap:6px">${rz(s)}${est(s)}<span class="tag">${ICO[s.tipo] || ""} ${t("g_" + s.tipo)}</span></div>
        <h2 id="nm">${esc(s.nombre)}</h2><p class="sci"><i>${esc(s.cientifico)}</i>${s.familia ? " · " + esc(s.familia) : ""}</p>
        <div class="pdx-acts"><button class="btn btn-ghost btn-sm" id="vz">🔊<span> ${t("escuchar")}</span></button>
          <button class="btn btn-accent btn-sm" id="v3">🧊 ${t("ver_3d")}</button><button class="btn btn-ghost btn-sm" id="dv">📍 ${t("donde_vive")}</button></div>
        <div class="pdx-capst ${cap ? "ok" : ""}">${cap ? "🌽 " + t("capturada_el", { d: new Date(cap).toLocaleDateString(LANG) }) : "🔒 " + t("no_capturada") + " " + (s.anp || []).map(c => { const a = ANP.find(x => x.code === c); return a ? `<b>${esc(a.nombre)}</b>` : ""; }).filter(Boolean).join(", ")}</div>
        <div id="txt"><p class="muted small">${t("cargando")}</p></div></div></div>`;
    document.body.appendChild(bg); document.body.style.overflow = "hidden";
    const close = () => { speechSynthesis && speechSynthesis.cancel(); bg.remove(); document.body.style.overflow = ""; };
    bg.onclick = e => { if (e.target === bg || e.target.closest("[data-x]")) close(); };
    obs(bg);
    bg.querySelector("#dv").onclick = () => { close(); dondeArea = s; setTab("explorar"); };
    bg.querySelector("#v3").onclick = () => ver3d(s);
    // detalle verificado
    let D = {};
    try { D = (await MZ.sbSelect("especies", `select=descripcion,importancia,dato,cita,funcion,modelo_3d,foto_credito&id=eq.${s.id}`))[0] || {}; } catch (e) {}
    s._d = D;
    const i = await inat(s), det = i && i.id ? await inatDetalle(i.id) : null;
    if (det && det.nombre && LANG !== "es") bg.querySelector("#nm").innerHTML = `${esc(det.nombre)} <small class="muted">· ${esc(s.nombre)}</small>`;
    const fotos = (s.imagen_url ? [{ u: s.imagen_url, c: D.foto_credito || "" }] : []).concat(det ? det.fotos : (i && i.foto ? [{ u: i.foto, c: i.credito }] : []));
    const th = bg.querySelector("#th"), hero = bg.querySelector(".pdx-ph.big");
    const setF = k => { const f = fotos[k]; if (!f) return; hero.style.backgroundImage = `url('${f.u}')`; hero.classList.add("ok"); hero.title = f.c || ""; th.querySelectorAll("i").forEach((x, j) => x.classList.toggle("on", j === k)); bg.querySelector("#cred").textContent = f.c ? "📷 " + f.c : ""; };
    th.innerHTML = fotos.length > 1 ? fotos.map((f, k) => `<i data-k="${k}" style="background-image:url('${f.u}')"></i>`).join("") : "";
    th.onclick = e => { const x = e.target.closest("[data-k]"); if (x) setF(+x.dataset.k); };
    const wiki = det && det.wiki;
    const dato = D.dato || (wiki && LANG === "es" ? wiki : "");
    const principal = LANG === "es" ? D.descripcion : (wiki || D.descripcion);
    bg.querySelector("#txt").innerHTML = `
      ${principal ? `<h4>${t("descripcion")}</h4><p>${esc(principal)}</p>` : ""}
      ${LANG !== "es" && D.descripcion && wiki ? `<details><summary class="small">${t("texto_original")}</summary><p class="small">${esc(D.descripcion)}</p></details>` : ""}
      ${D.importancia ? `<div class="pdx-box imp"><b>⭐ ${t("importancia")}</b><p>${esc(D.importancia)}</p></div>` : ""}
      ${D.funcion ? `<div class="pdx-box"><b>🔁</b> ${esc(D.funcion)}</div>` : ""}
      ${dato && dato !== principal ? `<div class="pdx-box dato"><b>💡 ${t("sabia")}</b><p>${esc(dato.slice(0, 520))}${dato.length > 520 ? "…" : ""}</p></div>` : ""}
      <p class="tiny muted" style="margin-top:12px">📚 ${t("fuentes")}: ${esc(D.cita || "Anexo 1, Plan de Manejo AC Apaneca-Ilamatepec 2026")}${wiki ? " · Wikipedia / iNaturalist" : ""}</p>
      <p class="tiny muted" id="cred"></p>`;
    if (fotos.length) setF(0);
    const voz = [ (det && det.nombre && LANG !== "es" ? det.nombre : s.nombre), principal || "", D.importancia ? t("importancia") + ". " + D.importancia : "", dato && dato !== principal ? t("sabia") + " " + dato.slice(0, 400) : ""].filter(Boolean).join(". ");
    bg.querySelector("#vz").onclick = e => hablar(voz, e.currentTarget);
    if (P.voz && cap) hablar(voz);
  }

  // ---------- 3D (Sketchfab) ----------
  async function ver3d(s) {
    const bg = document.createElement("div"); bg.className = "pdx-modal pdx-3d pdx-holo";
    bg.innerHTML = `<div class="pdx-3dbox"><div class="row between"><b>🧊 ${esc(s.nombre)}</b><button class="icon-btn" data-x>×</button></div>
      <div class="holo-wrap"><div class="pdx-3dv" id="v"><p class="muted">${t("cargando")}</p></div><i class="holo-scan"></i><i class="holo-cone"></i></div><p class="tiny muted" id="nota"></p><div class="pdx-3dalt" id="alt"></div></div>`;
    document.body.appendChild(bg); bg.onclick = e => { if (e.target === bg || e.target.closest("[data-x]")) bg.remove(); };
    const v = bg.querySelector("#v"), alt = bg.querySelector("#alt");
    const embed = uid => { v.innerHTML = `<iframe title="3D" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen src="https://sketchfab.com/models/${uid}/embed?autostart=1&autospin=0.25&ui_theme=dark&ui_infos=0&ui_hint=0&ui_watermark_link=0&ui_controls=0&ui_stop=0&dnt=1&preload=1"></iframe>`; };
    const D = s._d || {};
    const pin = D.modelo_3d && (D.modelo_3d.match(/([0-9a-f]{32})/) || [])[1];
    if (pin) { embed(pin); bg.querySelector("#nota").textContent = t("modelo_ref"); return; }
    const i = await inat(s); let en = "";
    try { const r = await fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(s.cientifico)}&per_page=1&locale=en`).then(x => x.json()); en = (r.results[0] || {}).preferred_common_name || ""; } catch (e) {}
    const genero = s.cientifico.split(" ")[0].toLowerCase(), claves = [genero, ...en.toLowerCase().split(/\s+/).filter(w => w.length > 3)];
    let res = [];
    for (const term of [s.cientifico, en].filter(Boolean)) {
      try { const r = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(term)}&count=12&sort_by=-likeCount`).then(x => x.json()); res = res.concat(r.results || []); } catch (e) {}
      if (res.length >= 3) break;
    }
    const ok = res.filter((m, k, a) => a.findIndex(x => x.uid === m.uid) === k).filter(m => { const txt = (m.name + " " + (m.tags || []).map(x => x.name).join(" ")).toLowerCase(); return claves.some(c => txt.includes(c)); })
      .sort((a, b) => (b.animationCount > 0) - (a.animationCount > 0) || (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 6);
    if (!ok.length) { const f = s.imagen_url || (i && i.foto); v.innerHTML = f ? `<div class="pdx-spin" style="background-image:url('${f}')"></div>` : ""; bg.querySelector("#nota").textContent = t("sin_modelo"); return; }
    embed(ok[0].uid); bg.querySelector("#nota").textContent = `${t("modelo_ref")} · “${ok[0].name}” · ${ok[0].user ? ok[0].user.displayName : ""} (Sketchfab)`;
    if (ok.length > 1) { alt.innerHTML = `<span class="tiny muted">${t("otros_modelos")}:</span>` + ok.map(m => `<button data-u="${m.uid}" title="${esc(m.name)}" style="background-image:url('${esc(((m.thumbnails || {}).images || [{}]).slice(-1)[0].url || "")}')"></button>`).join("");
      alt.onclick = e => { const b = e.target.closest("[data-u]"); if (!b) return; const m = ok.find(x => x.uid === b.dataset.u); embed(m.uid); bg.querySelector("#nota").textContent = `${t("modelo_ref")} · “${m.name}” (Sketchfab)`; }; }
  }

  // ---------- EXPLORAR (juego) ----------
  let mapa = null, capaSp = null, yoMk = null, watch = null, dondeArea = null, ultimaArea = null;
  const VENT = 10 * 60e3, CEL = 0.0025;
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  const hashN = (...a) => a.reduce((h, v) => (Math.imul(h, 31) + (Math.round(v * 1e4) | 0)) | 0, 7);
  function elegir(pool, r) {
    if (!pool.length) return null;
    const x = r(), tier = x < 0.06 ? "legendaria" : x < 0.3 ? "rara" : "comun";
    const p = pool.filter(s => s.rareza === tier); const L = p.length ? p : pool;
    return L[Math.floor(r() * L.length)];
  }
  function apariciones(c) {
    const w = Math.floor(Date.now() / VENT), out = [];
    const cx = Math.floor(c[1] / CEL), cy = Math.floor(c[0] / CEL);
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      const lat = (cy + dy + .5) * CEL, lng = (cx + dx + .5) * CEL, inf = anpDe([lat, lng]);
      if (!inf || inf.d > 900) continue;
      const r = rng(hashN(cx + dx, cy + dy, w)), x0 = r(), n = x0 < .4 ? 0 : x0 < .9 ? 1 : 2;
      const pool = deAnp(inf.a.code).filter(s => s.tipo !== "Lugar" && s.tipo !== "Cultura");
      for (let k = 0; k < n; k++) { const s = elegir(pool, r); if (s) out.push({ k: `c${cx + dx}_${cy + dy}_${w}_${k}`, s, p: [(cy + dy + r()) * CEL, (cx + dx + r()) * CEL], rad: 70 }); }
    }
    // locales de Ruta Maíz: cada uno tiene una especie que cambia cada ventana
    LOCALES.filter(l => l.lat && dist(c, [l.lat, l.lng]) < 4000).forEach(l => {
      const inf = anpDe([l.lat, l.lng]); if (!inf) return; const r = rng(hashN(l.lat, l.lng, w));
      const s = elegir(deAnp(inf.a.code), r); if (s) out.push({ k: `l${l.id}_${w}`, s, p: [l.lat + (r() - .5) * .0006, l.lng + (r() - .5) * .0006], rad: 90, local: l.nombre });
    });
    AVIST.forEach(a => { const s = BYID[a.especie_id]; if (s && dist(c, [a.lat, a.lng]) < 5000) out.push({ k: `a${a.id}_${Math.floor(Date.now() / (3 * VENT))}`, s, p: [a.lat, a.lng], rad: a.radio || 80, nota: a.nota }); });
    return out.filter(o => !P.done[o.k]);
  }
  async function explorar() {
    scr.innerHTML = `<div class="pdx-mapwrap"><div id="mp"></div>
      <div class="pdx-hud"><span id="hudA">📍 ${t("cargando")}</span><span id="hudP">${puntos()} ${t("puntos")}</span></div>
      <div class="pdx-mapbtns"><button class="icon-btn glass" id="cen" aria-label="${t("usar_ubicacion")}">◎</button><button class="icon-btn glass" id="sat" aria-label="Satélite">🛰️</button>
        <button class="icon-btn glass ${P.voz ? "on" : ""}" id="gv" aria-label="${t("guia_voz")}" title="${t("guia_voz")}">🔊</button></div></div>
      <div id="expInfo"></div>`;
    const sat = ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", "© Esri"], base = ["https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", "© OpenStreetMap · © CARTO"];
    mapa = L.map("mp", { zoomControl: false }).setView([13.84, -89.66], 11);
    let usaSat = false, capa = L.tileLayer(base[0], { attribution: base[1], maxZoom: 19 }).addTo(mapa);
    scr.querySelector("#sat").onclick = () => { usaSat = !usaSat; mapa.removeLayer(capa); const x = usaSat ? sat : base; capa = L.tileLayer(x[0], { attribution: x[1], maxZoom: 19 }).addTo(mapa); };
    scr.querySelector("#gv").onclick = e => { P.voz = !P.voz; save(); e.currentTarget.classList.toggle("on", P.voz); MZ.toast(t("guia_voz") + (P.voz ? " ✓" : " ✗")); };
    ANP.forEach(a => a.polys.forEach(pl => L.polygon(pl, { color: "#2f7d4f", weight: 1.5, fillColor: "#7cc36b", fillOpacity: .22 }).on("click", () => { if (mapa && mapa.getZoom() < 15) { areaSel = a; setTab("cerca"); } }).addTo(mapa)));
    capaSp = L.layerGroup().addTo(mapa);
    scr.querySelector("#cen").onclick = () => { if (yo || sim) mapa.setView(sim || yo, 17); };
    if (dondeArea) { const s = dondeArea; dondeArea = null; const as = ANP.filter(a => (s.anp || []).includes(a.code)); if (as.length) mapa.fitBounds(L.latLngBounds(as.flatMap(a => a.polys.flat())).pad(.1)); scr.querySelector("#expInfo").innerHTML = `<div class="pdx-card small">📍 <b>${esc(s.nombre)}</b>: ${as.map(a => esc(a.nombre)).join(", ") || "—"}</div>`; }
    if (PRUEBA) {
      const box = document.createElement("div"); box.className = "pdx-card small"; box.innerHTML = `🧪 ${t("simular")} <select class="input" id="sim" style="width:auto;padding:6px 8px;margin-left:6px"><option value="">GPS</option>${ANP.map(a => `<option value="${a.code}">${esc(a.nombre)}</option>`).join("")}</select>`;
      scr.querySelector("#expInfo").appendChild(box);
      box.querySelector("#sim").onchange = e => { const a = ANP.find(x => x.code === e.target.value); sim = a ? a.centro : null; if (sim) posicion(sim, true); };
    }
    iniciarGPS();
  }
  function iniciarGPS() {
    if (sim) return posicion(sim, true);
    if (!navigator.geolocation) return posicion(null);
    let primera = true;
    watch = navigator.geolocation.watchPosition(p => { if (sim) return; yo = [p.coords.latitude, p.coords.longitude]; posicion(yo, primera); primera = false; },
      () => posicion(null), { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  }
  function detenerGPS() { if (watch != null) navigator.geolocation.clearWatch(watch); watch = null; }
  let spawns = [];
  function posicion(c, centrar) {
    if (!mapa) return;
    const hudA = scr.querySelector("#hudA");
    if (!c) { hudA.textContent = "📍 " + t("sin_ubicacion").split(",")[0]; return; }
    if (!yoMk) yoMk = L.circleMarker(c, { radius: 9, color: "#fff", weight: 3, fillColor: "#2f7de1", fillOpacity: 1 }).addTo(mapa); else yoMk.setLatLng(c);
    if (yoMk._map !== mapa) { yoMk = L.circleMarker(c, { radius: 9, color: "#fff", weight: 3, fillColor: "#2f7de1", fillOpacity: 1 }).addTo(mapa); }
    const inf = anpDe(c);
    if (inf && inf.d === 0) { hudA.textContent = "🌿 " + inf.a.nombre; if (ultimaArea !== inf.a.code) { ultimaArea = inf.a.code; const m = t("entro_area", { a: inf.a.nombre, n: deAnp(inf.a.code).length }); MZ.toast(m, 4500); if (P.voz) hablar(m); } }
    else hudA.textContent = inf ? `${t("mas_cercana")}: ${inf.a.nombre} · ${t("a_km", { n: (inf.d / 1000).toFixed(1) })}` : "";
    spawns = apariciones(c); capaSp.clearLayers();
    spawns.forEach(o => {
      const u = o.s.imagen_url || (IC[o.s.cientifico.toLowerCase()] || {}).foto;
      const html = `<div class="sp ${o.s.rareza}"><span style="${u ? `background-image:url('${u}')` : ""}">${u ? "" : ICO[o.s.tipo] || "🌿"}</span></div>`;
      L.marker(o.p, { icon: L.divIcon({ html, className: "", iconSize: [54, 54], iconAnchor: [27, 27] }) }).on("click", () => tocar(o)).addTo(capaSp);
      if (!u) inat(o.s);
    });
    const info = scr.querySelector("#expInfo");
    if (!spawns.length && inf && inf.d > 900) {
      if (!info.querySelector(".fuera")) { const d = document.createElement("div"); d.className = "pdx-card small fuera"; d.innerHTML = `${t("fuera_reserva")} <button class="btn btn-ghost btn-sm" style="margin-top:8px">🧭 ${t("ir_area")}</button>`;
        d.querySelector("button").onclick = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${inf.a.centro[0]},${inf.a.centro[1]}`, "_blank"); info.prepend(d); }
    }
    if (centrar) mapa.setView(c, spawns.length ? 16 : 12);
  }
  function tocar(o) {
    const c = sim || yo; const d = c ? dist(c, o.p) : 1e9;
    if (d > o.rad && !sim) return MZ.toast(`${ICO[o.s.tipo] || ""} ${o.s.nombre.split("/")[0]} · ${t("acerquese", { n: Math.round(d) })}`, 3000);
    capturar(o);
  }
  function capturar(o) {
    const s = o.s, u = s.imagen_url || (IC[s.cientifico.toLowerCase()] || {}).foto;
    const dif = { comun: { u: .82, v: 1.5 }, rara: { u: .68, v: 1.2 }, legendaria: { u: .56, v: .95 } }[s.rareza] || { u: .8, v: 1.4 };
    let tries = 3;
    const bg = document.createElement("div"); bg.className = "cap-bg";
    bg.innerHTML = `<div class="cap"><button class="icon-btn cap-x" aria-label="${t("cerrar")}">×</button>
      <div class="cap-top">${rz(s)}<b>${esc(s.nombre.split("/")[0])}</b><i>${esc(s.cientifico)}</i>${o.local ? `<small>📍 ${esc(o.local)}</small>` : ""}</div>
      <div class="cap-stage"><div class="cap-ring" style="animation-duration:${dif.v}s"></div><div class="cap-target"><span style="${u ? `background-image:url('${u}')` : ""}">${u ? "" : ICO[s.tipo]}</span></div><div class="cap-corn">🌽</div></div>
      <p class="small cap-msg">${t("toque_aro")}</p><p class="tiny muted" id="tr">${t("intentos", { n: tries })}</p>
      <button class="btn btn-accent cap-go">${t("lanzar")}</button></div>`;
    document.body.appendChild(bg);
    const ring = bg.querySelector(".cap-ring"), corn = bg.querySelector(".cap-corn"), msg = bg.querySelector(".cap-msg"), go = bg.querySelector(".cap-go");
    bg.querySelector(".cap-x").onclick = () => bg.remove();
    go.onclick = () => {
      const m = getComputedStyle(ring).transform, sc = m && m !== "none" ? Math.hypot(...m.slice(7, -1).split(",").slice(0, 2).map(Number)) : 1;
      go.disabled = true; corn.classList.remove("fly"); void corn.offsetWidth; corn.classList.add("fly"); if (navigator.vibrate) navigator.vibrate(20);
      setTimeout(() => {
        if (sc <= dif.u) {
          bg.querySelector(".cap-target").classList.add("caught"); ring.style.display = "none";
          setTimeout(() => {
            const nueva = !P.cap[s.id]; P.cap[s.id] = P.cap[s.id] || new Date().toISOString(); P.done[o.k] = 1; save(); index();
            msg.innerHTML = `<b class="cap-ok">✨ ${t("capturado")}</b> ${nueva ? `+${PTS[s.rareza] || 10} ${t("puntos")}` : ""}`;
            go.outerHTML = `<button class="btn btn-primary cap-ver">📖 ${t("pokedex")}</button>`;
            bg.querySelector(".cap-ver").onclick = () => { bg.remove(); ficha(s); };
            confeti(bg.querySelector(".cap")); if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
            const hp = scr.querySelector("#hudP"); if (hp) hp.textContent = `${puntos()} ${t("puntos")}`;
            if (P.voz) hablar(`${t("capturado")} ${s.nombre.split("/")[0]}`);
            sincronizar(true); if (mapa) posicion(sim || yo);
          }, 1500);
        } else {
          tries--; bg.querySelector("#tr").textContent = t("intentos", { n: tries });
          if (tries <= 0) { msg.textContent = t("huyo"); P.done[o.k] = 1; save(); setTimeout(() => { bg.remove(); if (mapa) posicion(sim || yo); }, 1600); }
          else { msg.textContent = t("escapo"); go.disabled = false; }
        }
      }, 650);
    };
  }
  function confeti(box) { for (let i = 0; i < 26; i++) { const c = document.createElement("i"); c.className = "cf"; c.style.left = Math.random() * 100 + "%"; c.style.background = ["#F4C230", "#2f7d4f", "#1F9AAE", "#a1402c", "#fff"][i % 5]; c.style.animationDelay = Math.random() * .3 + "s"; box.appendChild(c); setTimeout(() => c.remove(), 1800); } }

  // ---------- RANKING ----------
  async function sincronizar(silencio) {
    if (!P.alias) return null;
    try { const r = await MZ.rpc("juego_guardar", { p_id: P.uid, p_alias: P.alias, p_capturas: Object.keys(P.cap) }); if (r && r.ok) { P.puesto = r.puesto; save(); } return r; } catch (e) { if (!silencio) MZ.toast("No se pudo guardar"); return null; }
  }
  async function ranking() {
    const ids = Object.keys(P.cap), pts = puntos(), byG = {};
    ids.forEach(id => { const s = BYID[id]; if (s) byG[s.tipo] = (byG[s.tipo] || 0) + 1; });
    const leg = ids.filter(id => (BYID[id] || {}).rareza === "legendaria").length;
    const logros = [["🌱", "1 captura", ids.length >= 1], ["🌿", "10 especies", ids.length >= 10], ["🌾", "50 especies", ids.length >= 50], ["🦅", "1 legendaria", leg >= 1], ["🐦", "10 aves", (byG["Ave"] || 0) >= 10], ["🦊", "5 mamíferos", (byG["Mamífero"] || 0) >= 5], ["🐸", "5 anfibios", (byG["Anfibio"] || 0) >= 5], ["🌳", "5 áreas", new Set(ids.flatMap(id => (BYID[id] || {}).anp || [])).size >= 5]];
    scr.innerHTML = `<div class="pdx-area"><div class="pdx-kpis"><div><b>${pts}</b>${t("puntos")}</div><div><b>${ids.length}</b>${t("capturadas")}</div><div><b>${P.puesto ? "#" + P.puesto : "—"}</b>${t("ranking")}</div></div>
      <div class="pdx-logros">${logros.map(l => `<span class="${l[2] ? "on" : ""}" title="${l[1]}">${l[0]}<small>${l[1]}</small></span>`).join("")}</div>
      <div class="row" style="gap:8px;margin-top:12px;flex-wrap:nowrap"><input class="input" id="al" maxlength="24" placeholder="${t("alias")}" value="${esc(P.alias)}"><button class="btn btn-primary btn-sm" id="gs">${t("guardar_puntaje")}</button></div>
      <button class="btn btn-ghost btn-sm" id="sh" style="margin-top:8px">📣 ${t("presumir")}</button></div>
      <h3 class="h-md" style="margin:16px 4px 8px">🏆 ${t("ranking")}</h3><div class="pdx-rank" id="rk"><p class="muted small">${t("cargando")}</p></div>`;
    scr.querySelector("#gs").onclick = async () => { P.alias = scr.querySelector("#al").value.trim(); save(); if (P.alias.length < 2) return MZ.toast(t("alias")); const r = await sincronizar(); if (r && r.ok) { MZ.toast(t("su_puesto", { n: r.puesto }), 3000); ranking(); } else if (r && r.error === "espere") MZ.toast("⏳"); };
    scr.querySelector("#sh").onclick = () => { const txt = `🌽 ${ids.length} ${t("especies")} · ${pts} ${t("puntos")} — ${t("bitacora")} · Ruta Maíz`; const url = location.origin + "/bitacora"; navigator.share ? navigator.share({ title: "Bitácora Maíz", text: txt, url }).catch(() => {}) : navigator.clipboard.writeText(txt + " " + url).then(() => MZ.toast("✓")); };
    try { const R = await MZ.rpc("juego_ranking", { p_limit: 30 }); scr.querySelector("#rk").innerHTML = (R || []).map((r, i) => `<div class="${r.alias === P.alias ? "yo" : ""}"><span class="p">${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span><b>${esc(r.alias)}</b><span>${r.especies} 🌽</span><span class="pt">${r.puntos}</span></div>`).join("") || `<p class="muted small">—</p>`; }
    catch (e) { scr.querySelector("#rk").innerHTML = `<p class="muted small">—</p>`; }
  }

  // ---------- Inicio ----------
  (async () => { scr.innerHTML = `<p class="muted">${t("cargando")}</p>`; await datos(); setTab(tab); })();
  window.BITACORA = { ficha: id => ficha(BYID[id]), puntos, P: () => P };
})();
