/* Radio Frecuencia Maíz: en vivo sincronizado + biblioteca + playlists */
(function () {
  const { esc, I } = MZ;
  const $ = s => document.querySelector(s);
  const EPOCH = Date.UTC(2026, 0, 1) / 1000;
  const LS = (k, v) => v === undefined ? (() => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } })() : localStorage.setItem(k, JSON.stringify(v));
  let T = [], LIVE = [], mode = "live", queue = [], qi = 0, playing = false, ctx, analyser, srcNode, sleepT = null;
  let likes = new Set(LS("fm_likes") || []), lists = LS("fm_lists") || [], genre = "", q = "";
  const audio = new Audio(); audio.preload = "none"; audio.crossOrigin = "anonymous";
  const ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 001.5.9l10.4-6.5a1 1 0 000-1.8L9.5 4.6A1 1 0 008 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.5"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.5"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 6.2v11.6a1 1 0 001.6.8l8.2-5.8a1 1 0 000-1.6L6.6 5.4A1 1 0 005 6.2zM17 5h2v14h-2z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="currentColor" style="transform:scaleX(-1)"><path d="M5 6.2v11.6a1 1 0 001.6.8l8.2-5.8a1 1 0 000-1.6L6.6 5.4A1 1 0 005 6.2zM17 5h2v14h-2z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.4-9.2-9A5 5 0 0112 5.6 5 5 0 0121.2 11C19 15.6 12 20 12 20z"/></svg>',
    heartOn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.4-9.2-9A5 5 0 0112 5.6 5 5 0 0121.2 11C19 15.6 12 20 12 20z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14"/></svg>'
  };
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const cover = t => t && t.cover_url ? `background-image:url('${esc(t.cover_url)}')` : "";

  // ---------- En vivo: todos escuchan lo mismo al mismo tiempo ----------
  function livePos() {
    const total = LIVE.reduce((a, t) => a + (t.duracion || 180), 0); if (!total) return null;
    let p = (Date.now() / 1000 - EPOCH) % total;
    for (let i = 0; i < LIVE.length; i++) { const d = LIVE[i].duracion || 180; if (p < d) return { i, off: p }; p -= d; }
    return { i: 0, off: 0 };
  }
  function playLive() {
    mode = "live"; const lp = livePos(); if (!lp) return MZ.toast("Aún no hay canciones en la radio");
    queue = LIVE; qi = lp.i; load(queue[qi], lp.off); setMode();
  }
  function playList(list, start, shuffle) {
    if (!list.length) return MZ.toast("No hay canciones en esta lista");
    mode = "demanda"; queue = shuffle ? list.slice().sort(() => Math.random() - .5) : list.slice(); qi = shuffle ? 0 : (start || 0); load(queue[qi], 0); setMode();
  }
  function load(t, off) {
    if (!t) return;
    audio.src = t.audio_url;
    if (off) audio.addEventListener("loadedmetadata", () => { try { audio.currentTime = Math.min(off, (audio.duration || off + 1) - 1); } catch (e) {} }, { once: true });
    initViz();
    audio.play().then(() => { playing = true; ui(); }).catch(() => { playing = false; ui(); });
    media(t); ui(); MZ.track("vista", "/radio/" + (t.titulo || "").slice(0, 60));
  }
  function toggle() {
    if (!audio.src) return playLive();
    if (audio.paused) { if (mode === "live") return playLive(); audio.play(); playing = true; } else { audio.pause(); playing = false; }
    ui();
  }
  function next(d) {
    if (!queue.length) return;
    if (mode === "live") { qi = (qi + 1) % queue.length; load(queue[qi], 0); return; }
    qi = (qi + (d || 1) + queue.length) % queue.length; load(queue[qi], 0);
  }
  audio.addEventListener("ended", () => next(1));
  audio.addEventListener("timeupdate", () => {
    const t = queue[qi]; if (!t) return; const d = audio.duration || t.duracion || 0;
    $("#rpBar").style.width = (d ? audio.currentTime / d * 100 : 0) + "%"; $("#rpTime").textContent = fmt(audio.currentTime) + " / " + fmt(d);
  });
  audio.addEventListener("play", () => { playing = true; ui(); }); audio.addEventListener("pause", () => { playing = false; ui(); });
  audio.addEventListener("error", () => { MZ.toast("No se pudo cargar la canción; pasamos a la siguiente"); setTimeout(() => next(1), 800); });

  // ---------- Visualizador ----------
  function initViz() {
    if (ctx) { ctx.state === "suspended" && ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      srcNode = ctx.createMediaElementSource(audio); analyser = ctx.createAnalyser(); analyser.fftSize = 128;
      srcNode.connect(analyser); analyser.connect(ctx.destination); draw();
    } catch (e) { ctx = null; }
  }
  function draw() {
    const cv = $("#rViz"); if (!cv) return; const g = cv.getContext("2d"); const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      requestAnimationFrame(loop); const w = cv.width = cv.clientWidth * devicePixelRatio, h = cv.height = cv.clientHeight * devicePixelRatio;
      analyser.getByteFrequencyData(data); g.clearRect(0, 0, w, h);
      const n = 48, bw = w / n;
      for (let i = 0; i < n; i++) {
        const v = (data[Math.floor(i * data.length / n / 1.4)] || 0) / 255, bh = Math.max(h * .06, v * h * .95);
        const grd = g.createLinearGradient(0, h - bh, 0, h); grd.addColorStop(0, "#FBE3A0"); grd.addColorStop(1, "#F4C230");
        g.fillStyle = grd; const x = i * bw + bw * .2, r = Math.min(bw * .3, 6);
        g.beginPath(); g.roundRect ? g.roundRect(x, h - bh, bw * .6, bh, r) : g.rect(x, h - bh, bw * .6, bh); g.fill();
      }
    }; loop();
  }

  // ---------- Pantalla de bloqueo / audífonos ----------
  function media(t) {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.titulo, artist: (t.artista || "Frecuencia Maíz") + (mode === "live" ? " · En vivo" : ""), album: "Frecuencia Maíz",
      artwork: [{ src: t.cover_url || "/icon.svg", sizes: "512x512" }] });
    navigator.mediaSession.setActionHandler("play", toggle); navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("nexttrack", () => next(1)); navigator.mediaSession.setActionHandler("previoustrack", () => next(-1));
  }

  // ---------- UI ----------
  function ui() {
    const t = queue[qi];
    $("#rpPlay").innerHTML = playing ? ICON.pause : ICON.play; $("#rpPlay").setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    $("#rBig").innerHTML = playing ? ICON.pause : ICON.play;
    document.body.classList.toggle("is-playing", playing);
    $("#rpT").textContent = t ? t.titulo : "Frecuencia Maíz"; $("#rpA").textContent = t ? (t.artista || "") + (mode === "live" ? " · En vivo" : "") : "Toque play para escuchar";
    $("#rpC").setAttribute("style", cover(t)); $("#rNowC").setAttribute("style", cover(t));
    $("#rNowT").textContent = t ? t.titulo : "La voz del territorio"; $("#rNowA").textContent = t ? (t.artista || "Frecuencia Maíz") : "Toque play para escuchar en vivo";
    $("#rpLike").innerHTML = t && likes.has(t.id) ? ICON.heartOn : ICON.heart;
    $("#rpPrev").style.visibility = mode === "live" ? "hidden" : "visible";
    document.querySelectorAll("[data-tid]").forEach(r => r.classList.toggle("now", !!(t && r.dataset.tid === t.id)));
    // próximas en vivo
    if (LIVE.length) { const lp = livePos(); $("#rNext").innerHTML = [1, 2, 3].map(k => LIVE[(lp.i + k) % LIVE.length]).filter(Boolean).map(x => `<span>${esc(x.titulo)}</span>`).join(""); }
  }
  function setMode() { document.querySelectorAll("#rModes button").forEach(b => b.classList.toggle("on", b.dataset.m === mode)); }

  function drawLib() {
    const gs = [...new Set(T.map(t => t.genero).filter(Boolean))];
    $("#rGen").innerHTML = `<button class="chip ${!genre ? "on" : ""}" data-g="">Todo</button>` + gs.map(g => `<button class="chip ${genre === g ? "on" : ""}" data-g="${esc(g)}">${esc(g)}</button>`).join("") + `<button class="chip ${genre === "♥" ? "on" : ""}" data-g="♥">♥ Favoritas</button>`;
    const qq = q.toLowerCase();
    const L = T.filter(t => (!genre || (genre === "♥" ? likes.has(t.id) : t.genero === genre)) && (!qq || (t.titulo + " " + (t.artista || "")).toLowerCase().includes(qq)));
    $("#rLib").innerHTML = L.length ? L.map(t => row(t)).join("") : `<p class="muted small" style="padding:10px">${T.length ? "No hay canciones con ese filtro." : "Muy pronto: estamos cargando la música de artistas locales."}</p>`;
    bindRows($("#rLib"), L);
  }
  const row = t => `<div class="trk" data-tid="${t.id}"><div class="trk-c" style="${cover(t)}">${t.cover_url ? "" : "🎵"}<span class="eq"><i></i><i></i><i></i></span></div>
    <div class="trk-i"><b>${esc(t.titulo)}</b><span>${esc(t.artista || "")}${t.genero ? " · " + esc(t.genero) : ""} · ${fmt(t.duracion)}</span></div>
    <button class="ib" data-like aria-label="Me gusta">${likes.has(t.id) ? ICON.heartOn : ICON.heart}</button><button class="ib" data-add aria-label="Agregar a playlist">${ICON.plus}</button></div>`;
  function bindRows(box, L) {
    box.querySelectorAll(".trk").forEach(r => {
      const t = T.find(x => x.id === r.dataset.tid);
      r.onclick = e => { if (e.target.closest("button")) return; playList(L, L.indexOf(t)); };
      r.querySelector("[data-like]").onclick = () => { like(t); };
      r.querySelector("[data-add]").onclick = () => addTo(t);
    });
  }
  function like(t) { if (!t) return; likes.has(t.id) ? likes.delete(t.id) : likes.add(t.id); LS("fm_likes", [...likes]); drawLib(); ui(); MZ.toast(likes.has(t.id) ? "Agregada a Favoritas ♥" : "Quitada de Favoritas"); }

  // ---------- Playlists ----------
  function saveLists() { LS("fm_lists", lists); drawLists(); }
  function drawLists() {
    $("#rLists").innerHTML = lists.map((p, i) => `<div class="pl glass"><div class="pl-art">${p.ids.slice(0, 4).map(id => { const t = T.find(x => x.id === id); return `<i style="${cover(t)}"></i>`; }).join("")}</div>
      <div class="pl-i"><b>${esc(p.nombre)}</b><span>${p.ids.length} canciones</span></div>
      <div class="row" style="gap:6px"><button class="ib" data-pp="${i}" aria-label="Reproducir">${ICON.play}</button><button class="ib" data-ps="${i}" aria-label="Aleatorio">${ICON.shuffle}</button><button class="ib" data-po="${i}" aria-label="Abrir">⋯</button></div></div>`).join("")
      + `<button class="pl pl-new" id="rNewPl">${ICON.plus}<span>Nueva playlist</span></button>`;
    $("#rNewPl").onclick = () => { const n = prompt("Nombre de la playlist", "Mi playlist"); if (n) { lists.push({ nombre: n.slice(0, 40), ids: [] }); saveLists(); } };
    document.querySelectorAll("[data-pp]").forEach(b => b.onclick = () => playList(ids2t(lists[+b.dataset.pp].ids), 0));
    document.querySelectorAll("[data-ps]").forEach(b => b.onclick = () => playList(ids2t(lists[+b.dataset.ps].ids), 0, true));
    document.querySelectorAll("[data-po]").forEach(b => b.onclick = () => openList(+b.dataset.po));
  }
  const ids2t = ids => ids.map(id => T.find(t => t.id === id)).filter(Boolean);
  function sheet(html) { const bg = document.createElement("div"); bg.className = "r-sheet-bg"; bg.innerHTML = `<div class="r-sheet glass">${html}</div>`; bg.onclick = e => { if (e.target === bg) bg.remove(); }; document.body.appendChild(bg); return bg; }
  function addTo(t) {
    const s = sheet(`<b>Agregar “${esc(t.titulo)}” a…</b><div class="stack" style="margin-top:12px">${lists.map((p, i) => `<button class="btn btn-ghost" data-i="${i}">${esc(p.nombre)}</button>`).join("")}<button class="btn btn-primary" data-new>＋ Nueva playlist</button></div>`);
    s.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const p = lists[+b.dataset.i]; if (!p.ids.includes(t.id)) p.ids.push(t.id); saveLists(); s.remove(); MZ.toast("Agregada a " + p.nombre); });
    s.querySelector("[data-new]").onclick = () => { const n = prompt("Nombre de la playlist", "Mi playlist"); if (!n) return; lists.push({ nombre: n.slice(0, 40), ids: [t.id] }); saveLists(); s.remove(); MZ.toast("Playlist creada"); };
  }
  function openList(i) {
    const p = lists[i], L = ids2t(p.ids);
    const s = sheet(`<div class="row between"><b>${esc(p.nombre)}</b><button class="ib" data-x>×</button></div>
      <div class="stack" style="margin:12px 0;gap:6px">${L.map((t, k) => `<div class="row" style="flex-wrap:nowrap"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${k + 1}. ${esc(t.titulo)}</span>${k ? `<button class="ib" data-up="${k}">↑</button>` : ""}<button class="ib" data-rm="${k}">×</button></div>`).join("") || '<p class="muted small">Vacía. Toque ＋ en cualquier canción.</p>'}</div>
      <div class="row"><button class="btn btn-ghost btn-sm" data-ren>Renombrar</button><button class="btn btn-ghost btn-sm" data-share>Compartir</button><button class="btn btn-ghost btn-sm" data-del style="color:#b0392d">Eliminar</button></div>`);
    s.querySelector("[data-x]").onclick = () => s.remove();
    s.querySelectorAll("[data-up]").forEach(b => b.onclick = () => { const k = +b.dataset.up; [p.ids[k - 1], p.ids[k]] = [p.ids[k], p.ids[k - 1]]; saveLists(); s.remove(); openList(i); });
    s.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { p.ids.splice(+b.dataset.rm, 1); saveLists(); s.remove(); openList(i); });
    s.querySelector("[data-ren]").onclick = () => { const n = prompt("Nuevo nombre", p.nombre); if (n) { p.nombre = n.slice(0, 40); saveLists(); s.remove(); openList(i); } };
    s.querySelector("[data-del]").onclick = () => { if (confirm("¿Eliminar esta playlist?")) { lists.splice(i, 1); saveLists(); s.remove(); } };
    s.querySelector("[data-share]").onclick = () => {
      const url = location.origin + "/radio-frecuencia-maiz?pl=" + encodeURIComponent(p.nombre) + "&t=" + p.ids.map(id => id.slice(0, 8)).join(".");
      navigator.share ? navigator.share({ title: p.nombre, text: "Escuche mi playlist en Frecuencia Maíz", url }).catch(() => {}) : navigator.clipboard.writeText(url).then(() => MZ.toast("Enlace copiado"));
    };
  }
  function importShared() {
    const u = new URLSearchParams(location.search); if (!u.get("t")) return;
    const ids = u.get("t").split(".").map(pre => (T.find(t => t.id.startsWith(pre)) || {}).id).filter(Boolean);
    if (!ids.length) return;
    const n = (u.get("pl") || "Playlist compartida").slice(0, 40);
    if (!lists.some(l => l.nombre === n)) { lists.push({ nombre: n, ids }); saveLists(); MZ.toast("Playlist “" + n + "” agregada"); }
  }

  // ---------- Programación ----------
  const PROG_DEF = [
    { dias: "L-V", hora: "07:00", nombre: "Buenos días, territorio", desc: "Noticias del occidente, clima y música para empezar." },
    { dias: "L-V", hora: "12:00", nombre: "NaturalMente", desc: "Biodiversidad, economía circular y saberes de la reserva." },
    { dias: "L-V", hora: "18:00", nombre: "Ruta Maíz al aire", desc: "Negocios locales, sabores y rutas recomendadas." },
    { dias: "S", hora: "10:00", nombre: "Voces del maíz", desc: "Artistas locales en vivo y estrenos." },
    { dias: "D", hora: "16:00", nombre: "Cultura y raíces", desc: "Historias, tradiciones y memoria de los pueblos." }
  ];
  function drawProg() {
    const P = (MZ.CFG().radio && MZ.CFG().radio.programacion) || PROG_DEF;
    const now = new Date(), d = now.getDay(), hm = now.getHours() * 60 + now.getMinutes();
    const hoy = p => p.dias === "L-V" ? d >= 1 && d <= 5 : p.dias === "S" ? d === 6 : p.dias === "D" ? d === 0 : true;
    const toM = h => { const [a, b] = h.split(":"); return +a * 60 + +b; };
    let cur = null; P.filter(hoy).forEach(p => { if (toM(p.hora) <= hm && hm < toM(p.hora) + 120) cur = p; });
    $("#rProg").innerHTML = P.map(p => `<div class="prog ${p === cur ? "now" : ""}"><span class="h">${esc(p.hora)}</span><div><b>${esc(p.nombre)}</b> ${p === cur ? '<span class="tag y">Al aire</span>' : ""}<p class="small muted">${esc(p.desc)}</p></div><span class="tag">${esc(p.dias === "L-V" ? "Lun–Vie" : p.dias === "S" ? "Sábado" : p.dias === "D" ? "Domingo" : p.dias)}</span></div>`).join("");
    $("#rShow").textContent = cur ? cur.nombre : "Música del territorio";
  }

  // ---------- Inicio ----------
  async function init() {
    try { T = await MZ.sbSelect("radio_tracks", "select=*&order=orden.asc,created_at.asc"); } catch (e) { T = []; }
    LIVE = T.filter(t => t.en_vivo !== false);
    $("#rCount").textContent = T.length ? `${T.length} canciones · ${[...new Set(T.map(t => t.artista).filter(Boolean))].length} artistas` : "Biblioteca en preparación";
    importShared(); drawLib(); drawLists(); MZ.cfgReady.then(drawProg); drawProg(); ui();
    setInterval(() => { if (mode === "live" && !playing) ui(); }, 15000);
  }
  // eventos
  $("#rBig").onclick = toggle; $("#rpPlay").onclick = toggle; $("#rpNext").onclick = () => next(1); $("#rpPrev").onclick = () => next(-1);
  $("#rpLike").onclick = () => like(queue[qi]);
  $("#rModes").onclick = e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.m === "live") playLive(); else { mode = "demanda"; setMode(); document.getElementById("biblioteca").scrollIntoView({ behavior: "smooth" }); } };
  $("#rQ").oninput = e => { q = e.target.value; drawLib(); };
  $("#rGen").onclick = e => { const b = e.target.closest("[data-g]"); if (!b) return; genre = b.dataset.g; drawLib(); };
  $("#rpVol").oninput = e => { audio.volume = +e.target.value; LS("fm_vol", audio.volume); };
  audio.volume = LS("fm_vol") ?? 1; $("#rpVol").value = audio.volume;
  $("#rpSeek").onclick = e => { if (mode === "live") return MZ.toast("En vivo no se puede adelantar; cambie a “A mi gusto”"); const r = e.currentTarget.getBoundingClientRect(); if (audio.duration) audio.currentTime = (e.clientX - r.left) / r.width * audio.duration; };
  $("#rSleep").onclick = () => {
    const s = sheet(`<b>Apagar la radio en…</b><div class="chips" style="margin-top:12px">${[15, 30, 45, 60].map(m => `<button class="chip" data-m="${m}">${m} min</button>`).join("")}<button class="chip" data-m="0">Cancelar temporizador</button></div>`);
    s.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { clearTimeout(sleepT); const m = +b.dataset.m; if (m) { sleepT = setTimeout(() => { audio.pause(); MZ.toast("Buenas noches 🌙"); }, m * 60000); MZ.toast("La radio se apagará en " + m + " min"); } else MZ.toast("Temporizador cancelado"); s.remove(); });
  };
  $("#rReq").onclick = () => {
    const s = sheet(`<b>Pida una canción o mande un saludo</b><div class="field" style="margin-top:12px"><input class="input" id="rqN" placeholder="Su nombre y municipio"></div>
      <div class="field"><textarea class="input" id="rqM" placeholder="Canción que quiere escuchar o saludo para alguien"></textarea></div><button class="btn btn-wa btn-block" id="rqGo">${I.wa} Enviar por WhatsApp</button>`);
    s.querySelector("#rqGo").onclick = () => { const n = s.querySelector("#rqN").value, m = s.querySelector("#rqM").value; if (!m.trim()) return MZ.toast("Escriba su mensaje");
      window.open(MZ.waLink(`🎙️ Para Frecuencia Maíz\nDe: ${n}\n${m}`), "_blank"); MZ.track("whatsapp"); s.remove(); };
  };
  init();
})();
