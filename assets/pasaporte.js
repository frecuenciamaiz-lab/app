/* Pasaporte Maíz · libro con sellos vectoriales, niveles, recompensas y Bitácora (Pokédex) de la reserva */
(function () {
  const esc = s => MZ.esc(s);
  const DEP_COL = { "Ahuachapán": "#2f7d4f", "Sonsonate": "#1c6f96", "Santa Ana": "#a1402c" }, OTRO = "#6E4A33";
  const DEPS = ["Ahuachapán", "Sonsonate", "Santa Ana"];
  const ICO = {
    "Café": "M8 14h22v10a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9z M30 17h3a4 4 0 0 1 0 8h-3 M14 3c-2 3 2 5 0 8 M21 3c-2 3 2 5 0 8",
    "Restaurante": "M11 4v11a4 4 0 0 0 4 4v17 M7 4v9 M15 4v9 M28 4c-5 4-5 14 0 17v15",
    "Hospedaje": "M5 35V18L20 6l15 12v17z M15 35v-9h10v9 M13 17h4v4h-4z",
    "Finca": "M20 37V18 M20 23c-8 0-12-6-12-13 8 0 12 6 12 13z M20 18c0-7 5-12 12-12 0 7-5 12-12 12z",
    "Tienda": "M8 14h24l-2 22H10z M14 14v-3a6 6 0 0 1 12 0v3",
    "Experiencia": "M2 35l12-20 6 8 5-6 13 18z M14 15c0-4 3-7 7-9"
  };
  const DEP_ICO = {
    "Santa Ana": "M4 46L24 14h16l20 32z M25 14c3 5 11 5 14 0 M32 12c-3-4 3-6 0-10",
    "Ahuachapán": "M32 30m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M32 25c-4-8 4-12 0-18 0 0 8 6 0 18z M37 30c8-4 12 4 18 0 0 0-6 8-18 0z M32 35c4 8-4 12 0 18 0 0-8-6 0-18z M27 30c-8 4-12-4-18 0 0 0 6-8 18 0z M32 53v-6",
    "Sonsonate": "M8 40L28 10l20 30z M28 10c-2-4 2-6 0-9 M4 48c6-4 10 4 16 0s10 4 16 0 10 4 16 0"
  };
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const fecha = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase().replace(/\./g, ""); };
  const limpio = n => String(n || "").replace(/\s*\(ejemplo\)/i, "");

  // ---------- Sellos vectoriales ----------
  let fid = 0;
  function sello(l, iso) {
    const col = DEP_COL[l.departamento] || OTRO, id = "s" + (++fid), h = hash(l.id), forma = h % 3, rot = (h % 21) - 10;
    const nom = limpio(l.nombre).toUpperCase().slice(0, 26), path = ICO[l.categoria] || ICO.Experiencia;
    const borde = forma === 0 ? `<circle cx="60" cy="60" r="54" fill="none" stroke="${col}" stroke-width="4"/><circle cx="60" cy="60" r="46" fill="none" stroke="${col}" stroke-width="1.5"/>`
      : forma === 1 ? `<rect x="7" y="7" width="106" height="106" rx="16" fill="none" stroke="${col}" stroke-width="4"/><rect x="15" y="15" width="90" height="90" rx="10" fill="none" stroke="${col}" stroke-width="1.5" stroke-dasharray="3 3"/>`
      : `<path d="M60 5l15 9 17 1 9 15 13 12-5 18 5 18-13 12-9 15-17 1-15 9-15-9-17-1-9-15-13-12 5-18-5-18 13-12 9-15 17-1z" fill="none" stroke="${col}" stroke-width="3.5"/><circle cx="60" cy="60" r="42" fill="none" stroke="${col}" stroke-width="1.5"/>`;
    return `<svg class="sv" viewBox="0 0 120 120" style="transform:rotate(${rot}deg)" aria-label="Sello de ${esc(limpio(l.nombre))}">
      <defs><path id="${id}" d="M60 60m-37 0a37 37 0 1 1 74 0"/></defs><g filter="url(#ink)" opacity=".92">${borde}
      <text font-size="9.5" font-weight="800" letter-spacing="1.2" fill="${col}" text-anchor="middle"><textPath href="#${id}" startOffset="50%">${esc(nom)}</textPath></text>
      <g transform="translate(40 40)" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></g>
      <text x="60" y="94" font-size="8" font-weight="800" fill="${col}" text-anchor="middle" letter-spacing=".5">${esc(fecha(iso))}</text>
      <text x="60" y="103" font-size="6" font-weight="700" fill="${col}" text-anchor="middle" letter-spacing="1.5">RUTA MAÍZ</text></g></svg>`;
  }
  function selloDep(dep, iso, completo) {
    const col = DEP_COL[dep] || OTRO, rot = (hash(dep) % 9) - 4;
    return `<svg class="sv dep" viewBox="0 0 200 120" style="transform:rotate(${rot}deg)" aria-label="Sello del departamento ${esc(dep)}"><g filter="url(#ink)">
      <rect x="4" y="4" width="192" height="112" rx="10" fill="none" stroke="${col}" stroke-width="4"/><rect x="11" y="11" width="178" height="98" rx="6" fill="none" stroke="${col}" stroke-width="1.5"/>
      <g transform="translate(18 30)" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${DEP_ICO[dep] || ICO.Experiencia}"/></g>
      <text x="128" y="34" font-size="8" font-weight="800" fill="${col}" text-anchor="middle" letter-spacing="1.5">EL SALVADOR</text>
      <text x="128" y="58" font-size="${dep.length > 9 ? 15 : 18}" font-weight="900" fill="${col}" text-anchor="middle">${esc(dep.toUpperCase())}</text>
      <text x="128" y="76" font-size="9" font-weight="800" fill="${col}" text-anchor="middle" letter-spacing="2">${completo ? "★ COMPLETO ★" : "VISITADO"}</text>
      <text x="128" y="96" font-size="8.5" font-weight="700" fill="${col}" text-anchor="middle">${esc(fecha(iso))}</text></g></svg>`;
  }
  const INK = `<svg width="0" height="0" style="position:absolute"><filter id="ink"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="1.6"/></filter></svg>`;

  // ---------- Niveles ----------
  const umbral = n => 10 * n * (n + 1) / 2;
  const RANGOS = [[0, "Semilla", "🌱"], [1, "Brote", "🌿"], [3, "Milpa", "🌾"], [5, "Elote", "🌽"], [8, "Mazorca", "🌽"], [12, "Mazorca de oro", "✨"], [16, "Guardián de la reserva", "🦅"]];
  const REC_DEF = [
    { nivel: 1, titulo: "Fondo de pantalla de la reserva", detalle: "Le enviamos por WhatsApp un fondo exclusivo de Ruta Maíz." },
    { nivel: 3, titulo: "Sello dorado de bienvenida", detalle: "Muestre su pasaporte en un local aliado y reciba un detalle de bienvenida." },
    { nivel: 5, titulo: "5 % de descuento", detalle: "En locales aliados participantes, una vez por visita." },
    { nivel: 8, titulo: "Bebida de cortesía", detalle: "Un café o refresco en un local aliado participante." },
    { nivel: 12, titulo: "Sorteo mensual", detalle: "Participa en el sorteo de una experiencia (tour, cena o noche de hospedaje)." },
    { nivel: 16, titulo: "Kit Maíz", detalle: "Sticker, postal y pin de Ruta Maíz." },
    { nivel: 20, titulo: "Guardián de la reserva", detalle: "Tour guiado gratuito con un aliado de la reserva." }];

  window.PASAPORTE = function (el, ctx) {
    const { LOC, RUT, pass, savePass, insignias, detail } = ctx;
    let ESP = null, libro = sessionStorage.getItem("pp_lib") || "pasaporte", pagina = +(sessionStorage.getItem("pp_pag_" + libro) || 0), filtroTipo = "";
    const p0 = pass(); if (!p0.desde) { p0.desde = new Date().toISOString(); savePass(p0); }

    function stats() {
      const p = pass(), ids = Object.keys(p.sellos), got = LOC.filter(l => ids.includes(l.id));
      const deps = {}; DEPS.forEach(d => { const de = LOC.filter(l => l.departamento === d), g = de.filter(l => p.sellos[l.id]);
        deps[d] = { total: de.length, got: g.length, primero: g.map(l => p.sellos[l.id]).sort()[0], completo: de.length > 0 && g.length === de.length }; });
      const ins = insignias(p).filter(b => b[3]).length, leidas = Object.keys(p.leidas || {}).length;
      const xp = ids.length * 10 + Object.values(deps).filter(d => d.got).length * 15 + Object.values(deps).filter(d => d.completo).length * 25 + ins * 15 + leidas * 5;
      let lv = 0; while (lv < 20 && xp >= umbral(lv + 1)) lv++;
      let rango = RANGOS[0]; RANGOS.forEach(r => { if (lv >= r[0]) rango = r; });
      return { p, ids, got, deps, xp, lv, rango, ins, leidas, sig: lv < 20 ? umbral(lv + 1) : null, base: umbral(lv) };
    }

    // ---------- Medallas tipo gimnasio ----------
    const FORMAS = [
      "M50 4l33 13 13 33-13 33-33 13-33-13L4 50l13-33z",
      "M50 4C68 30 86 48 86 66a36 36 0 0 1-72 0C14 48 32 30 50 4z",
      "M50 6C82 14 94 42 88 70 74 92 40 98 18 82 8 56 14 24 50 6z",
      "M50 4l11 25 27-8-12 25 20 19-28 3 1 28-19-20-19 20 1-28-28-3 20-19-12-25 27 8z",
      "M50 4l40 14v28c0 26-17 42-40 50C27 88 10 72 10 46V18z",
      "M50 4l40 23v46L50 96 10 73V27z",
      "M50 4l9 16 18-6-2 19 18 6-13 14 13 14-18 6 2 19-18-6-9 16-9-16-18 6 2-19-18-6 13-14L5 45l18-6-2-19 18 6z",
      "M50 2l46 48-46 48L4 50z",
      "M50 6l12 20 23 2-15 17 5 23-25-11-25 11 5-23-15-17 23-2z",
      "M22 18h56l-6 50a26 26 0 0 1-44 0z",
      "M50 4a46 46 0 0 1 0 92 30 46 0 0 1 0-92z",
      "M12 30h76v22a38 38 0 0 1-38 38 38 38 0 0 1-38-38z"];
    const METAL = [["#ffe9a8", "#d9a514", "#7a5508"], ["#d6f3ff", "#3aa0d8", "#0c4f78"], ["#d9f7c9", "#4f9d3a", "#1d4d14"], ["#ffd2c2", "#d8552e", "#6e210c"],
      ["#f0f0f0", "#a3a9b3", "#4a4f57"], ["#f3d9ff", "#9a55cf", "#46176b"], ["#ffe1b8", "#c97b2a", "#5d3207"], ["#ccfff2", "#20b8a0", "#075346"],
      ["#ffe3ef", "#d8477f", "#6b1136"], ["#e2ffd9", "#6fc23a", "#2d5a10"],
      ["#dde6ff", "#5570d8", "#1b2a6b"], ["#fff0cf", "#e0a63c", "#6b4408"]];
    function medalla(i, b) {
      const f = FORMAS[i % FORMAS.length], c = METAL[i % METAL.length], id = "md" + i + (++fid);
      return `<svg class="md ${b[3] ? "got" : ""}" viewBox="0 0 100 100" aria-label="${esc(b[1])}"><defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".45" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>
        <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
        <path d="${f}" fill="url(#${id}g)" stroke="${c[2]}" stroke-width="3"/>
        <path d="${f}" fill="none" stroke="${c[0]}" stroke-width="2" transform="translate(50 50) scale(.78) translate(-50 -50)" opacity=".9"/>
        <ellipse cx="40" cy="30" rx="24" ry="12" fill="url(#${id}h)" transform="rotate(-25 40 30)"/>
        <text x="50" y="62" font-size="30" text-anchor="middle">${b[0]}</text></svg>`;
    }
    const slot = (b, i) => `<div class="md-slot ${b[4] === "ruta" ? "ruta" : ""} ${b[3] ? "got" : ""}" title="${esc(b[1])}">${b[4] === "ruta" ? '<i class="md-cinta"></i>' : ""}${medalla(i, b)}${b[3] && nuevaMedalla(b) ? '<i class="md-nueva"></i>' : ""}</div>`;
    const lista8 = (B, off) => `<div class="md-case">${B.map((b, j) => slot(b, off + j)).join("")}${"<div class='md-slot'></div>".repeat(Math.max(0, 8 - B.length))}</div>
      <div class="md-list">${B.map((b, j) => `<div class="${b[3] ? "got" : ""}"><span class="md-mini">${medalla(off + j, b)}</span><div><b>${esc(b[1])}</b><small>${b[3] ? "✦ Obtenida" : esc(b[2])}</small></div></div>`).join("")}</div>`;
    function nuevaMedalla(b) {
      const p = pass(); p.medallas = p.medallas || {};
      const k = b[5] || b[1];
      if (p.medallas[k]) return false;
      p.medallas[k] = new Date().toISOString(); savePass(p); return true;
    }
    // Medallas de ruta: una por cada ruta de Ruta Maíz que se complete entera
    const RUTA_ICO = ["🧭", "☕", "🌋", "🏞️", "🌸", "🍲", "🛖", "🦋", "💧", "🌄"];
    function medallasRuta(p) {
      const ids = Object.keys(p.sellos || {});
      return (RUT || []).filter(r => (r.locales || []).length).map((r, i) => {
        const st = r.locales, hechos = st.filter(id => ids.includes(id)).length;
        return [RUTA_ICO[i % RUTA_ICO.length], limpio(r.nombre), hechos >= st.length ? "Ruta completa" : `${hechos} de ${st.length} paradas`, hechos >= st.length, "ruta", r.id];
      });
    }
    function insigniasTodas(p) {
      let D = {}; try { D = JSON.parse(localStorage.getItem("maiz_pokedex")) || {}; } catch (e) {}
      const n = Object.keys(D.cap || {}).length;
      return insignias(p).concat([["🔭", "Naturalista", "Capture 10 especies en la Bitácora", n >= 10], ["🌳", "Guardián del bosque", "Capture 50 especies en la Bitácora", n >= 50], ["🦅", "Leyenda de la reserva", "Capture 150 especies en la Bitácora", n >= 150]]);
    }

    // ---------- Páginas ----------
    const tapa = (titulo, sub, emb) => `<div class="pp-cover"><div class="pp-orn"></div><div class="pp-emb">${emb}</div><div class="pp-ct">${titulo}</div>
        <div class="pp-cs">${sub}</div><div class="pp-cc">EL SALVADOR · OCCIDENTE</div><button class="pp-open" data-go="1">Abrir ›</button></div>`;
    const fin = txt => ({ k: "fin", t: "Contratapa", h: `<div class="pp-cover back"><div class="pp-orn"></div><div class="pp-cs">${txt}</div><div class="pp-cc">PROYECTO MAÍZ</div><button class="pp-open" data-go="0">‹ Volver a la tapa</button></div>` });
    function pages() {
      const S = stats(), out = [];
      if (libro === "insignias") {
        const B = insigniasTodas(S.p), R = medallasRuta(S.p), TODAS = B.concat(R);
        out.push({ k: "tapa", t: "Tapa", h: tapa("LIBRO DE<br>INSIGNIAS", `${TODAS.filter(b => b[3]).length} de ${TODAS.length} obtenidas`, '<span class="pp-big">🏅</span>') });
        for (let i = 0; i < B.length; i += 8) out.push({ k: "ins", t: "Insignias", h: `<div class="pp-hd">ESTUCHE DE INSIGNIAS · ${i / 8 + 1}</div>${lista8(B.slice(i, i + 8), i)}` });
        if (R.length) for (let i = 0; i < R.length; i += 8) out.push({ k: "ins", t: "Rutas", h: `<div class="pp-hd">MEDALLAS DE RUTA</div>
          <p class="md-sec">Complete todas las paradas de una ruta para ganar su medalla</p>${lista8(R.slice(i, i + 8), 100 + i)}` });
        else out.push({ k: "ins", t: "Rutas", h: `<div class="pp-hd">MEDALLAS DE RUTA</div><p class="md-sec">Pronto habrá rutas para completar</p>` });
        out.push(fin("“Cada insignia cuenta una historia<br>del occidente.”")); return out;
      }
      if (libro === "premios") {
        const rec = ((MZ.CFG().ruta || {}).recompensas || REC_DEF).slice().sort((a, b) => a.nivel - b.nivel);
        out.push({ k: "tapa", t: "Tapa", h: tapa("LIBRO DE<br>PREMIOS", `Nivel ${S.lv} · ${S.rango[2]} ${S.rango[1]}`, '<span class="pp-big">🎁</span>') });
        for (let j = 0; j < rec.length; j += 5) out.push({ k: "rec", t: "Premios", h: `<div class="pp-hd">RECOMPENSAS POR NIVEL</div><div class="pp-rec">${rec.slice(j, j + 5).map((r, k) => { const i = j + k;
          const ok = S.lv >= r.nivel, used = (S.p.canjes || {})[r.nivel];
          return `<div class="${ok ? "ok" : ""}"><span class="lv">${r.nivel}</span><div><b>${esc(r.titulo)}</b><small>${esc(r.detalle || "")}</small></div>
            ${ok ? `<button class="btn btn-sm ${used ? "btn-ghost" : "btn-accent"}" data-rec="${i}">${used ? "Ver código" : "Canjear"}</button>` : `<span class="lk">🔒</span>`}</div>`; }).join("")}</div>
          <p class="tiny muted" style="margin-top:10px">Las recompensas dependen de los locales aliados participantes.</p>` });
        out.push(fin("“Quien cuida la tierra,<br>cosecha recompensas.”")); return out;
      }
      out.push({ k: "tapa", t: "Tapa", h: `<div class="pp-cover"><div class="pp-orn"></div><div class="pp-emb">${MZ.mascot(92)}</div><div class="pp-ct">PASAPORTE<br>MAÍZ</div>
        <div class="pp-cs">Reserva de Biosfera<br>Apaneca-Ilamatepec</div><div class="pp-cc">EL SALVADOR · OCCIDENTE</div><div class="pp-chip"></div>
        <button class="pp-open" data-go="1">Abrir pasaporte ›</button></div>` });
      const nom = S.p.nombre || "", mrz = ("P<SLVMAIZ<<" + (nom || "VIAJERO").toUpperCase().normalize("NFD").replace(/[^A-Z ]/g, "").replace(/ +/g, "<") + "<".repeat(44)).slice(0, 44);
      out.push({ k: "datos", t: "Datos", h: `<div class="pp-hd">REPÚBLICA DE LA MILPA · PASAPORTE MAÍZ</div>
        <div class="pp-id"><div class="pp-foto">${MZ.mascot(84)}</div><div class="pp-f">
          <label>Nombre del viajero<input id="ppNom" value="${esc(nom)}" placeholder="Escriba su nombre" maxlength="40"></label>
          <div><span>Nivel</span><b>${S.lv} · ${S.rango[2]} ${S.rango[1]}</b></div>
          <div><span>Expedido</span><b>${fecha(S.p.desde)}</b></div><div><span>Nº</span><b>MZ-${String(hash(S.p.desde) % 1e6).padStart(6, "0")}</b></div></div></div>
        <div class="pp-xp"><div class="row between small"><b>${S.xp} puntos</b><span>${S.sig ? `${S.sig - S.xp} para el nivel ${S.lv + 1}` : "Nivel máximo"}</span></div>
          <div class="bar"><i style="width:${S.sig ? Math.round((S.xp - S.base) / (S.sig - S.base) * 100) : 100}%"></i></div></div>
        <div class="pp-sum"><div><b>${S.ids.length}</b>sellos</div><div><b>${Object.values(S.deps).filter(d => d.got).length}/3</b>departamentos</div><div><b>${S.ins}</b>insignias</div><div><b>${S.leidas}</b>especies</div></div>
        <p class="tiny muted" style="margin-top:10px">Gane puntos sellando locales (+10), visitando departamentos (+15), completándolos (+25), con insignias (+15) y leyendo la Bitácora (+5).</p>
        <div class="pp-mrz">${esc(mrz)}<br>${"MZ" + String(S.xp).padStart(6, "0") + "<SLV<<" + "<".repeat(30)}</div>` });
      const grupos = DEPS.concat(LOC.some(l => !DEPS.includes(l.departamento)) ? ["Otros lugares"] : []);
      grupos.forEach(d => {
        const locs = LOC.filter(l => d === "Otros lugares" ? !DEPS.includes(l.departamento) : l.departamento === d), info = S.deps[d];
        out.push({ k: "dep", t: d, h: `<div class="pp-hd">VISADOS · ${esc(d.toUpperCase())}</div>
          ${info ? `<div class="pp-dep ${info.got ? "got" : ""}">${info.got ? selloDep(d, info.primero, info.completo) : `<div class="pp-ghost">${esc(d)}<small>Selle un local de ${esc(d)} para obtener este visado</small></div>`}</div>
            <p class="tiny muted" style="text-align:center;margin:-2px 0 8px">${info.got}/${info.total} locales sellados</p>` : ""}
          <div class="pp-grid">${locs.map(l => S.p.sellos[l.id] ? `<button class="pp-s got" data-l="${l.id}">${sello(l, S.p.sellos[l.id])}</button>`
            : `<button class="pp-s" data-l="${l.id}"><span class="pp-e"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${ICO[l.categoria] || ICO.Experiencia}"/></svg><small>${esc(limpio(l.nombre))}</small></span></button>`).join("") || '<p class="muted small">Pronto habrá locales aquí.</p>'}</div>` });
      });
      out.push({ k: "fin", t: "Contratapa", h: `<div class="pp-cover back"><div class="pp-orn"></div><div class="pp-cs">“Cada sello es un negocio local<br>que cuida la reserva.”</div><div class="pp-cc">PROYECTO MAÍZ</div><button class="pp-open" data-go="0">‹ Volver a la tapa</button></div>` });
      return out;
    }

    // ---------- Bitácora (Pokédex) ----------
    async function bitacora(box, S) {
      let D = {}; try { D = JSON.parse(localStorage.getItem("maiz_pokedex")) || {}; } catch (e) {}
      const n = Object.keys(D.cap || {}).length;
      box.innerHTML = `<div style="text-align:center;padding:10px 4px">
        <div style="font-size:2.6rem">🌽📖</div>
        <p class="small" style="margin:8px 0 4px">La Bitácora ahora es una <b>Pokédex</b> con más de 1,100 especies verificadas de la reserva.</p>
        <p class="tiny muted">Vea qué vive donde usted está, escuche datos curiosos y capture animales y plantas en las áreas protegidas.</p>
        <p style="margin:12px 0"><b style="font-size:1.6rem">${n}</b> <span class="small muted">especies capturadas</span></p>
        <a class="btn btn-accent btn-sm" href="/bitacora">Abrir la Bitácora</a></div>`;
    }
    function ficha(e) {
      const p = pass(), primera = !(p.leidas || {})[e.id];
      if (primera) { p.leidas = p.leidas || {}; p.leidas[e.id] = 1; savePass(p); }
      const bg = document.createElement("div"); bg.className = "d-bg";
      bg.innerHTML = `<div class="d-sheet pp-ficha"><div class="d-hero" style="${e.imagen_url ? `background-image:url('${esc(e.imagen_url)}')` : ""}">${e.imagen_url ? "" : e.emoji || "🌿"}<button class="icon-btn" data-x aria-label="Cerrar">×</button></div>
        <div class="d-body"><div class="small muted">${esc(e.tipo)}${e.zona ? " · " + esc(e.zona) : ""}</div><h2>${esc(e.nombre)}</h2>${e.cientifico ? `<p class="small" style="font-style:italic;margin-top:2px">${esc(e.cientifico)}</p>` : ""}
          ${e.estado ? `<span class="tag ${/amenaz|peligro|vulnerable/i.test(e.estado) ? "r" : "g"}" style="margin-top:8px">${esc(e.estado)}</span>` : ""}
          <p style="margin-top:12px">${esc(e.descripcion || "")}</p>
          ${e.dato ? `<div class="promo-card" style="margin-top:12px"><span class="e">💡</span><div><b>¿Sabía que…?</b><div class="small">${esc(e.dato)}</div></div></div>` : ""}</div></div>`;
      bg.onclick = ev => { if (ev.target === bg || ev.target.closest("[data-x]")) { bg.remove(); if (primera) draw(); } };
      document.body.appendChild(bg);
      if (primera) MZ.toast("📖 +5 puntos por aprender algo nuevo");
    }
    function canjear(r) {
      const p = pass(); p.canjes = p.canjes || {}; if (!p.canjes[r.nivel]) { p.canjes[r.nivel] = new Date().toISOString(); savePass(p); }
      const code = `MZ-${r.nivel}-${(hash(p.desde + r.nivel) % 46656).toString(36).toUpperCase().padStart(3, "0")}`;
      const bg = document.createElement("div"); bg.className = "d-bg";
      bg.innerHTML = `<div class="d-sheet"><div class="d-body" style="text-align:center;padding-top:26px"><div style="font-size:2.4rem">🎁</div><h2>${esc(r.titulo)}</h2>
        <p class="muted small" style="margin:6px 0 16px">${esc(r.detalle || "")}</p><div class="pp-code">${code}</div>
        <p class="tiny muted" style="margin-top:10px">Muestre esta pantalla en el local · canjeado el ${fecha(p.canjes[r.nivel])}</p>
        <a class="btn btn-wa" style="margin-top:14px" target="_blank" rel="noopener" href="${MZ.waLink(`Hola, quiero reclamar mi recompensa de Ruta Maíz: ${r.titulo} (código ${code}).`)}">Reclamar por WhatsApp</a>
        <button class="btn btn-ghost" data-x style="margin-top:8px">Cerrar</button></div></div>`;
      bg.onclick = ev => { if (ev.target === bg || ev.target.closest("[data-x]")) { bg.remove(); draw(); } };
      document.body.appendChild(bg);
    }

    // ---------- Libro ----------
    let PG = [];
    function contenido(i) {
      const pg = PG[i], d = document.createElement("div");
      d.className = "pp-page " + (pg.k === "tapa" || pg.k === "fin" ? "cv" : "");
      d.innerHTML = pg.h + (pg.k !== "tapa" && pg.k !== "fin" ? `<div class="pp-num">${i}</div>` : "");
      return d;
    }
    function bind(pg) {
      pg.querySelectorAll("[data-go]").forEach(b => b.onclick = () => ir(+b.dataset.go));
      pg.querySelectorAll(".pp-s").forEach(b => b.onclick = () => detail(LOC.find(l => l.id === b.dataset.l)));
      const nm = pg.querySelector("#ppNom"); if (nm) nm.onchange = () => { const p = pass(); p.nombre = nm.value.trim(); savePass(p); draw(); };
      const rec = ((MZ.CFG().ruta || {}).recompensas || REC_DEF).slice().sort((a, b) => a.nivel - b.nivel);
      pg.querySelectorAll("[data-rec]").forEach(b => b.onclick = () => canjear(rec[+b.dataset.rec]));
      const bit = pg.querySelector("#ppBit"); if (bit) bitacora(bit, stats());
    }
    let girando = false;
    function ir(n, sinAnim) {
      n = Math.max(0, Math.min(PG.length - 1, n)); if (n === pagina && !sinAnim) return; if (girando) return;
      const book = el.querySelector(".pp-book"), viejo = book.querySelector(".pp-page:not(.pp-leaf)"), nuevo = contenido(n), adelante = n > pagina;
      pagina = n; sessionStorage.setItem("pp_pag_" + libro, n); tabs();
      if (sinAnim || matchMedia("(prefers-reduced-motion: reduce)").matches || !viejo) { book.innerHTML = ""; book.appendChild(nuevo); bind(nuevo); return; }
      girando = true;
      if (adelante) { viejo.classList.add("pp-leaf"); book.insertBefore(nuevo, viejo); bind(nuevo); requestAnimationFrame(() => requestAnimationFrame(() => viejo.classList.add("turn"))); }
      else { nuevo.classList.add("pp-leaf", "turn"); book.appendChild(nuevo); bind(nuevo); requestAnimationFrame(() => requestAnimationFrame(() => nuevo.classList.remove("turn"))); }
      setTimeout(() => { if (adelante) viejo.remove(); else { viejo.remove(); nuevo.classList.remove("pp-leaf"); } girando = false; }, 720);
      if (navigator.vibrate) navigator.vibrate(6);
    }
    function tabs() {
      const t = el.querySelector(".pp-tabs"); if (!t) return;
      const L = [["pasaporte", "Pasaporte y sellos", "#5b1f1a"], ["insignias", "Insignias", "#1f3b2c"], ["premios", "Premios", "#1d2c4f"]];
      t.innerHTML = L.map(([k, n, c]) => `<button class="pp-lomo ${libro === k ? "on" : ""}" style="--c:${c}" data-lib="${k}"><span>${n}</span></button>`).join("") +
        `<a class="pp-lomo dex" href="/bitacora"><span>Bitácora 🌽</span></a>`;
      t.querySelectorAll("[data-lib]").forEach(b => b.onclick = () => { if (libro === b.dataset.lib) return; libro = b.dataset.lib; sessionStorage.setItem("pp_lib", libro); pagina = +(sessionStorage.getItem("pp_pag_" + libro) || 0); draw(); });
      el.querySelector(".pp-pn").textContent = pagina === 0 ? "Tapa" : PG[pagina].k === "fin" ? "Contratapa" : `Página ${pagina} de ${PG.length - 2}`;
    }
    function draw() {
      PG = pages(); if (pagina >= PG.length) pagina = 0;
      el.innerHTML = `${INK}<div class="pp pp-${libro}"><div class="pp-tabs pp-shelf"></div><div class="pp-book"></div>
        <div class="pp-nav"><button class="icon-btn glass" id="ppPrev" aria-label="Página anterior">‹</button><span class="pp-pn"></span><button class="icon-btn glass" id="ppNext" aria-label="Página siguiente">›</button></div>
        <p class="tiny muted" style="text-align:center">Deslice para pasar las páginas. Su pasaporte se guarda en este celular.</p></div>`;
      ir(pagina, true);
      el.querySelector("#ppPrev").onclick = () => ir(pagina - 1);
      el.querySelector("#ppNext").onclick = () => ir(pagina + 1);
      const book = el.querySelector(".pp-book"); let x0 = null, y0 = 0;
      book.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      book.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) ir(pagina + (dx < 0 ? 1 : -1)); });
    }
    draw();
    return { stats };
  };
  window.PASAPORTE.stats = null;
})();
