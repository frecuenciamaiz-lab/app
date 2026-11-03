/* =========================================================
   PROYECTO MAÍZ · núcleo compartido
   - Configuración por defecto (se sobrescribe desde el panel)
   - Conexión a Supabase, estadísticas, mascota, WhatsApp, dock
   ========================================================= */
(function () {
  const SB_URL = "https://pgwhbrkvwzticuewxwen.supabase.co";
  const SB_KEY = "sb_publishable_QktwCj57rCNRgGEep66_ZA_PcYHqlP6";

  const DEFAULTS = {
    marca: {
      nombre: "Proyecto Maíz",
      lema: "Comunicación, cultura y territorio desde el occidente de El Salvador.",
      whatsapp: "50376365173",
      whatsappTexto: "+503 7636 5173",
      whatsappMensaje: "Hola, vengo de la página de Proyecto Maíz y quisiera información.",
      correo: ""
    },
    portada: {
      titulo: "Contamos la historia de su negocio",
      subtitulo: "Producimos videos, fotos y contenido para redes que muestran lo mejor de su negocio y su compromiso con la tierra.",
      cta: "Cuéntenos de su negocio y agendemos una cita",
      ctaNota: "Toma unos 8 minutos. Le escribimos por WhatsApp para coordinar."
    },
    colores: { acento: "#F4C230", oscuro: "#3B2418", verde: "#4F6B3A", tierra: "#8A5A3B" },
    redes: {
      frecuencia: [], // [{red:"Instagram", url:"https://..."}]
      estudio: [],
      ruta: []
    },
    equipo: [
      { nombre: "Karla Peña", rol: "Dirección y producción", bio: "Licenciada en Ciencias Químicas con especialidad en Química Ambiental. Une la comunicación con la economía circular.", foto: "" },
      { nombre: "Daniel Córdova", rol: "Frecuencia Maíz", bio: "Producción de contenido, radio y podcast.", foto: "" }
    ],
    unidades: {
      radio: { titulo: "Frecuencia Maíz", sub: "Radio y diversas áreas creativas" },
      estudio: { titulo: "Estudio Maíz", sub: "Agencia de contenido audiovisual" },
      ruta: { titulo: "Ruta Maíz", sub: "Rutas, sabores y negocios locales" }
    }
  };

  function merge(a, b) {
    if (Array.isArray(b)) return b.slice();
    if (b && typeof b === "object") {
      const o = Object.assign({}, a || {});
      for (const k in b) o[k] = merge(a ? a[k] : undefined, b[k]);
      return o;
    }
    return b === undefined ? a : b;
  }

  // ---------- Supabase (REST) ----------
  const H = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" };
  async function sbSelect(table, query) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${query || "select=*"}`, { headers: H });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function sbInsert(table, row) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: Object.assign({ Prefer: "return=minimal" }, H), body: JSON.stringify(row) });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }
  async function rpc(fn, args) {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: H, body: JSON.stringify(args || {}) });
    const t = await r.text();
    if (!r.ok) { let m = t; try { m = JSON.parse(t).message || t; } catch (e) {} throw new Error(m); }
    return t ? JSON.parse(t) : null;
  }
  async function upload(key, file) {
    const r = await fetch(`${SB_URL}/functions/v1/admin-upload`, { method: "POST", headers: H, body: JSON.stringify({ key, filename: file.name, contentType: file.type }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "No se pudo subir");
    const up = await fetch(`${SB_URL}/storage/v1/object/upload/sign/media/${j.path}?token=${j.token}`, {
      method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" }, body: file
    });
    if (!up.ok) throw new Error("Error al subir el archivo (" + up.status + ")");
    return j.publicUrl;
  }

  // ---------- Configuración ----------
  let CFG = DEFAULTS;
  const cfgReady = (async () => {
    try {
      const cached = sessionStorage.getItem("maiz_cfg");
      if (cached) CFG = merge(DEFAULTS, JSON.parse(cached));
      const rows = await sbSelect("site_config", "select=data&id=eq.1");
      const data = (rows[0] && rows[0].data) || {};
      sessionStorage.setItem("maiz_cfg", JSON.stringify(data));
      CFG = merge(DEFAULTS, data);
    } catch (e) { /* sin conexión: valores por defecto */ }
    applyColors();
    return CFG;
  })();
  function applyColors() {
    const c = CFG.colores || {}; const s = document.documentElement.style;
    if (c.acento) s.setProperty("--pollo", c.acento);
    if (c.oscuro) s.setProperty("--cafe", c.oscuro);
    if (c.verde) s.setProperty("--verde", c.verde);
    if (c.tierra) s.setProperty("--tierra", c.tierra);
  }

  // ---------- Estadísticas ----------
  function sid() {
    let s = localStorage.getItem("maiz_sid");
    if (!s) { s = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem("maiz_sid", s); }
    return s.slice(0, 40);
  }
  function device() { const w = Math.min(screen.width, innerWidth); return w < 640 ? "movil" : w < 1024 ? "tablet" : "computadora"; }
  function track(evento, path) {
    if (location.pathname.startsWith("/panel") || localStorage.getItem("maiz_admin_device") === "1") return;
    let ref = ""; try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
    if (ref === location.hostname) ref = "interno";
    const p = new URLSearchParams(location.search); if (p.get("utm_source")) ref = p.get("utm_source");
    sbInsert("visitas", { path: (path || location.pathname).slice(0, 200), ref: ref.slice(0, 300), device: device(), sid: sid(), evento: evento || "vista" }).catch(() => {});
  }

  // ---------- Íconos ----------
  const I = {
    home: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    radio: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 010 8.4M7.8 16.2a6 6 0 010-8.4M19 5a10 10 0 010 14M5 19A10 10 0 015 5"/></svg>',
    camara: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="3"/><path d="M16 10l6-3v10l-6-3z"/></svg>',
    mapa: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    wa: '<svg class="i" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.4-.3z"/></svg>',
    back: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    chev: '<svg class="i chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    ig: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    fb: '<svg class="i" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a4 4 0 00-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"/></svg>',
    tt: '<svg class="i" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.2 1.7 3.8 4 4v3.2a7.6 7.6 0 01-4-1.2v6.3A5.7 5.7 0 1110.3 9.6v3.3a2.5 2.5 0 102 2.4V3z"/></svg>',
    yt: '<svg class="i" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a3 3 0 00-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 002 8.2 31 31 0 002 12a31 31 0 00.1 3.8 3 3 0 002.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 002.1-2.1A31 31 0 0022 12a31 31 0 000-3.8zM10 15V9l5.2 3z"/></svg>',
    web: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>',
    spotify: '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.6c2.5-.7 5.2-.4 7.3.8M8.6 15.4c1.9-.5 3.8-.3 5.4.6"/></svg>'
  };
  function redIcon(red) {
    const r = (red || "").toLowerCase();
    if (r.includes("insta")) return I.ig; if (r.includes("face")) return I.fb; if (r.includes("tik")) return I.tt;
    if (r.includes("you")) return I.yt; if (r.includes("whats")) return I.wa; if (r.includes("spoti")) return I.spotify; return I.web;
  }

  // ---------- Mascota: elote con lentes y audífonos (logo Frecuencia Maíz) ----------
  function mascot(size, opts) {
    opts = opts || {};
    const id = "m" + Math.random().toString(36).slice(2, 7);
    const K = "#1d1d1b", T = "#1F9AAE";
    let kern = "";
    for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) {
      const x = 39 + c * 8.4 + (r % 2 ? 4.2 : 0), y = 22 + r * 8;
      kern += `<circle cx="${x}" cy="${y}" r="4.1" fill="url(#${id}k)" stroke="#E2A80B" stroke-width=".8"/>`;
    }
    return `<svg class="mascot mz" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="Mascota de Proyecto Maíz: elote con lentes y audífonos">
      <style>
        .mz .mz-bob{animation:mzBob 1.6s ease-in-out infinite;transform-origin:60px 100px}
        .mz .mz-glint{animation:mzGlint 4s ease-in-out infinite}
        .mz .mz-w1,.mz .mz-w2{animation:mzWave 1.6s ease-out infinite}
        .mz .mz-w2{animation-delay:.5s}
        .mz .mz-leafL{animation:mzLeaf 3.2s ease-in-out infinite;transform-origin:60px 112px}
        .mz .mz-leafR{animation:mzLeaf 3.2s ease-in-out infinite reverse;transform-origin:60px 112px}
        @keyframes mzBob{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-2px) rotate(-2deg)}75%{transform:translateY(-2px) rotate(2deg)}}
        @keyframes mzGlint{0%,70%{transform:translateX(-14px);opacity:0}78%{opacity:.9}90%,100%{transform:translateX(30px);opacity:0}}
        @keyframes mzWave{0%{opacity:0;transform:scale(.8)}30%{opacity:1}100%{opacity:0;transform:scale(1.25)}}
        @keyframes mzLeaf{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(4deg)}}
        @media (prefers-reduced-motion:reduce){.mz *{animation:none!important}}
      </style>
      <defs>
        <radialGradient id="${id}k" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF6C8"/><stop offset="1" stop-color="#F9C823"/></radialGradient>
        <clipPath id="${id}c"><path d="M60 14c19 0 25 24 25 48 0 26-11 42-25 42S35 88 35 62c0-24 6-48 25-48z"/></clipPath>
        <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8CCB4E"/><stop offset="1" stop-color="#3E8E3A"/></linearGradient>
      </defs>
      <g class="mz-bob">
        <path d="M60 14c19 0 25 24 25 48 0 26-11 42-25 42S35 88 35 62c0-24 6-48 25-48z" fill="#F9D423"/>
        <g clip-path="url(#${id}c)">${kern}</g>
        <path d="M60 14c19 0 25 24 25 48 0 26-11 42-25 42S35 88 35 62c0-24 6-48 25-48z" fill="none" stroke="${K}" stroke-width="3"/>
        <path d="M31 58C27 20 93 20 89 58" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/>
        <path d="M31 58C27 20 93 20 89 58" fill="none" stroke="${T}" stroke-width="5" stroke-linecap="round"/>
        <rect x="22" y="50" width="15" height="24" rx="7" fill="${T}" stroke="${K}" stroke-width="3"/>
        <rect x="83" y="50" width="15" height="24" rx="7" fill="${T}" stroke="${K}" stroke-width="3"/>
        <path class="mz-w1" d="M16 54q-5 8 0 16" fill="none" stroke="${T}" stroke-width="2.5" stroke-linecap="round" style="transform-origin:20px 62px"/>
        <path class="mz-w2" d="M10 50q-8 12 0 24" fill="none" stroke="${T}" stroke-width="2.5" stroke-linecap="round" style="transform-origin:20px 62px"/>
        <path class="mz-w1" d="M104 54q5 8 0 16" fill="none" stroke="${T}" stroke-width="2.5" stroke-linecap="round" style="transform-origin:100px 62px"/>
        <path class="mz-w2" d="M110 50q8 12 0 24" fill="none" stroke="${T}" stroke-width="2.5" stroke-linecap="round" style="transform-origin:100px 62px"/>
        <g>
          <path d="M39 52h18l-2 10a6 6 0 01-6 5h-3a6 6 0 01-6-5z" fill="${K}"/>
          <path d="M63 52h18l-1 10a6 6 0 01-6 5h-3a6 6 0 01-6-5z" fill="${K}"/>
          <path d="M56 54h8" stroke="${K}" stroke-width="3"/>
          <clipPath id="${id}g"><path d="M39 52h18l-2 10a6 6 0 01-6 5h-3a6 6 0 01-6-5zM63 52h18l-1 10a6 6 0 01-6 5h-3a6 6 0 01-6-5z"/></clipPath>
          <g clip-path="url(#${id}g)"><rect class="mz-glint" x="40" y="48" width="5" height="24" fill="#fff" opacity=".8" transform="skewX(-20)"/></g>
          <path d="M43 55l4-2M67 55l4-2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>
        </g>
        <path d="M50 76q10 8 20 0" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
      </g>
      <path class="mz-leafL" d="M58 112C36 108 24 92 26 70c8 10 18 22 32 42z" fill="url(#${id}l)" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>
      <path class="mz-leafR" d="M62 112c22-4 34-20 32-42-8 10-18 22-32 42z" fill="url(#${id}l)" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`;
  }

  // ---------- UI comunes ----------
  function waLink(msg) { return `https://wa.me/${CFG.marca.whatsapp}?text=${encodeURIComponent(msg || CFG.marca.whatsappMensaje)}`; }
  function waFab(msg) {
    const a = document.createElement("a");
    a.className = "wa-fab no-print"; a.target = "_blank"; a.rel = "noopener"; a.href = waLink(msg);
    a.setAttribute("aria-label", "Escríbanos por WhatsApp (puede arrastrar el botón)");
    a.innerHTML = `<span class="wa-ico">${I.wa}</span><span class="wa-t">Escríbanos<small>${CFG.marca.whatsappTexto}</small></span>`;
    document.body.appendChild(a);
    cfgReady.then(() => { a.href = waLink(msg); a.querySelector("small").textContent = CFG.marca.whatsappTexto; });
    // Arrastrable: se queda donde el usuario lo deja
    const KEYP = "maiz_wa_pos";
    const place = (x, y) => {
      const r = a.getBoundingClientRect(), m = 8;
      x = Math.max(m, Math.min(innerWidth - r.width - m, x)); y = Math.max(m, Math.min(innerHeight - r.height - m, y));
      a.style.left = x + "px"; a.style.top = y + "px"; a.style.right = "auto"; a.style.bottom = "auto";
    };
    try { const p = JSON.parse(localStorage.getItem(KEYP)); if (p) requestAnimationFrame(() => place(p.x * innerWidth, p.y * innerHeight)); } catch (e) {}
    let sx, sy, ox, oy, moved = false, down = false;
    a.addEventListener("pointerdown", e => { down = true; moved = false; sx = e.clientX; sy = e.clientY; const r = a.getBoundingClientRect(); ox = r.left; oy = r.top; a.setPointerCapture(e.pointerId); });
    a.addEventListener("pointermove", e => {
      if (!down) return; const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true; a.classList.add("dragging"); place(ox + dx, oy + dy);
    });
    const end = () => {
      if (!down) return; down = false; a.classList.remove("dragging");
      if (moved) {
        const r = a.getBoundingClientRect();
        const x = (r.left + r.width / 2) < innerWidth / 2 ? 8 : innerWidth - r.width - 8; // se pega al borde más cercano
        a.style.transition = "left .45s cubic-bezier(.34,1.56,.64,1)"; place(x, r.top); setTimeout(() => a.style.transition = "", 500);
        localStorage.setItem(KEYP, JSON.stringify({ x: x / innerWidth, y: r.top / innerHeight }));
      }
    };
    a.addEventListener("pointerup", end); a.addEventListener("pointercancel", end);
    a.addEventListener("click", e => { if (moved) { e.preventDefault(); moved = false; return; } track("whatsapp"); });
    addEventListener("resize", () => { const r = a.getBoundingClientRect(); if (a.style.left) place(r.left, r.top); });
  }
  function dock(active) {
    const d = document.createElement("nav");
    d.className = "dock glass no-print"; d.setAttribute("aria-label", "Accesos");
    d.innerHTML = `
      <a class="d-home ${active === "home" ? "on" : ""}" href="/" aria-label="Inicio" style="color:var(--cafe)">${I.home}</a>
      <a class="d-radio ${active === "radio" ? "on" : ""}" href="/radio-frecuencia-maiz" aria-label="Frecuencia Maíz" style="color:#fff">${I.radio}</a>
      <a class="d-estudio ${active === "estudio" ? "on" : ""}" href="/estudio-maiz" aria-label="Estudio Maíz" style="color:var(--cafe)">${I.camara}</a>
      <a class="d-ruta ${active === "ruta" ? "on" : ""}" href="/ruta-maiz" aria-label="Ruta Maíz" style="color:#fff">${I.mapa}</a>`;
    document.body.appendChild(d);
  }
  function aurora() { const a = document.createElement("div"); a.className = "aurora"; a.innerHTML = "<i></i><i></i><i></i>"; document.body.prepend(a); }
  function reveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
    els.forEach(e => io.observe(e));
    setTimeout(() => document.querySelectorAll('.reveal:not(.in)').forEach(e => { const r = e.getBoundingClientRect(); if (r.top < innerHeight * 1.5) e.classList.add('in'); }), 1200);
  }
  let toastEl;
  function toast(msg, ms) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast glass"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove("show"), ms || 2600);
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function redesHTML(list, cls) {
    return (list || []).filter(r => r && r.url).map(r =>
      `<a class="${cls || "icon-btn"}" href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="${esc(r.red)}" title="${esc(r.red)}">${redIcon(r.red)}</a>`).join("");
  }

  // PWA: apariencia de app
  (function pwa() {
    const head = document.head;
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement("link"); l.rel = "manifest"; l.href = "/manifest.webmanifest"; head.appendChild(l);
    }
    [["apple-mobile-web-app-capable", "yes"], ["mobile-web-app-capable", "yes"], ["apple-mobile-web-app-status-bar-style", "default"], ["theme-color", "#F5F0E8"]].forEach(([n, c]) => {
      if (!document.querySelector(`meta[name="${n}"]`)) { const m = document.createElement("meta"); m.name = n; m.content = c; head.appendChild(m); }
    });
    if (!document.querySelector('link[rel="icon"]')) { const l = document.createElement("link"); l.rel = "icon"; l.href = "/icon.svg"; head.appendChild(l); }
  })();

  window.MZ = { CFG: () => CFG, cfgReady, DEFAULTS, merge, sbSelect, sbInsert, rpc, upload, track, I, redIcon, mascot, waLink, waFab, dock, aurora, reveal, toast, esc, redesHTML, applyColors, SB_URL };
})();
