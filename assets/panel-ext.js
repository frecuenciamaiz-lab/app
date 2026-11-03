/* Panel Maíz · secciones extra: Radio, Precios, Avisos, Negocios, Bitácora y Recompensas */
(function () {
  const esc = MZ.esc, KEY = () => sessionStorage.getItem("maiz_key");
  const rpc = (f, a) => MZ.rpc(f, Object.assign({ p_key: KEY() }, a || {}));
  const EXT = [["x-radio", "🎵", "Radio"], ["x-precios", "💲", "Precios"], ["x-avisos", "🔔", "Avisos"], ["x-negocios", "🏪", "Negocios"], ["x-bitacora", "📖", "Bitácora"]];
  const head = (t, s) => `<div class="p-head"><h1>${t}</h1></div>${s ? `<p class="muted" style="margin:-6px 0 16px;max-width:720px">${s}</p>` : ""}`;
  const clone = o => JSON.parse(JSON.stringify(o));

  // ---------- Inyección en la navegación ----------
  function navs() {
    const side = document.querySelector(".p-side"), tabs = document.querySelector(".p-tabs");
    if (side && !side.querySelector("[data-x]")) {
      const sp = [...side.children].find(c => c.style && c.style.flex === "1 1 0%" || (c.getAttribute && /flex:\s*1/.test(c.getAttribute("style") || "")));
      EXT.forEach(([h, e, t]) => { const b = document.createElement("button"); b.dataset.x = h; b.innerHTML = `<span class="e">${e}</span>${t}`; b.onclick = () => location.hash = h; sp ? side.insertBefore(b, sp) : side.appendChild(b); });
    }
    if (tabs && !tabs.querySelector("[data-x]")) {
      const b = document.createElement("button"); b.dataset.x = "x-mas"; b.innerHTML = `<span class="e">➕</span>Más`; b.onclick = () => location.hash = "x-mas"; tabs.appendChild(b);
    }
    const h = location.hash.slice(1);
    if (h.startsWith("x-")) {
      document.querySelectorAll(".p-side [data-v], .p-tabs [data-v]").forEach(b => b.classList.remove("on"));
      document.querySelectorAll("[data-x]").forEach(b => b.classList.toggle("on", b.dataset.x === h || (b.dataset.x === "x-mas" && h.startsWith("x-"))));
    } else document.querySelectorAll("[data-x]").forEach(b => b.classList.remove("on"));
  }
  function check() {
    navs();
    const v = document.getElementById("view"), h = location.hash.slice(1); if (!v || !h.startsWith("x-")) return;
    if (v.dataset.ext === h) return;
    v.dataset.ext = h; v.innerHTML = '<p class="muted">Cargando…</p>'; window.scrollTo(0, 0);
    const R = { "x-mas": mas, "x-radio": radio, "x-precios": precios, "x-avisos": avisos, "x-negocios": negocios, "x-bitacora": bitacora };
    (R[h] || mas)(v).catch(e => { v.innerHTML = `<p class="muted">No se pudo cargar: ${esc(e.message)}</p>`; });
  }
  new MutationObserver(() => { const v = document.getElementById("view"); if (v && !location.hash.startsWith("#x-")) delete v.dataset.ext; check(); })
    .observe(document.getElementById("app"), { childList: true, subtree: true });
  window.addEventListener("hashchange", () => { const v = document.getElementById("view"); if (v) delete v.dataset.ext; setTimeout(check, 0); });

  // ---------- Hub móvil ----------
  async function mas(v) {
    v.innerHTML = head("Más herramientas") + `<div class="grid g2">${EXT.map(([h, e, t]) => `<a class="card glass x-hub" href="#${h}"><span style="font-size:1.8rem">${e}</span><b>${t}</b></a>`).join("")}</div>`;
  }

  // ---------- Radio ----------
  async function radio(v) {
    const T = await rpc("admin_list_tracks") || [];
    const tot = T.filter(t => t.en_vivo && t.publicado).reduce((a, t) => a + (t.duracion || 0), 0);
    v.innerHTML = head("🎵 Música de Frecuencia Maíz", "Suba canciones propias o con permiso de sus autores. Las marcadas “En vivo” forman la transmisión continua; todas las publicadas aparecen en la biblioteca para crear playlists.") +
      `<div class="ed-sec glass"><h3>Subir canción</h3>
        <div class="grid g2"><div class="field"><label class="lbl">Archivo de audio (MP3 o M4A)</label><input type="file" class="input" id="tAud" accept="audio/*"></div>
          <div class="field"><label class="lbl">Portada (opcional)</label><input type="file" class="input" id="tCov" accept="image/*"></div>
          <div class="field"><label class="lbl">Título</label><input class="input" id="tTit" maxlength="120"></div>
          <div class="field"><label class="lbl">Artista</label><input class="input" id="tArt" maxlength="120"></div>
          <div class="field"><label class="lbl">Género</label><input class="input" id="tGen" list="gens" maxlength="40" placeholder="Ej.: Cumbia, Folclore, Rock local"><datalist id="gens">${[...new Set(T.map(t => t.genero).filter(Boolean))].map(g => `<option>${esc(g)}`).join("")}</datalist></div>
          <div class="field"><label class="lbl">Licencia o permiso</label><input class="input" id="tLic" maxlength="120" placeholder="Ej.: Autorizada por el artista, Creative Commons BY"></div></div>
        <label class="row small" style="gap:8px"><input type="checkbox" id="tViv" checked> Incluir en la transmisión “En vivo”</label>
        <button class="btn btn-primary btn-sm" id="tSave" style="margin-top:12px">Subir y publicar</button> <span class="small muted" id="tMsg"></span></div>
      <div class="ed-sec glass"><h3>Biblioteca (${T.length})</h3><p class="small muted" style="margin-bottom:10px">Transmisión en vivo: ${Math.round(tot / 60)} min en ciclo.</p>
        <div class="x-list">${T.map(t => `<div class="x-row"><span class="x-cov" style="${t.cover_url ? `background-image:url('${esc(t.cover_url)}')` : ""}">${t.cover_url ? "" : "🎵"}</span>
          <div style="min-width:0;flex:1"><b>${esc(t.titulo)}</b><div class="small muted">${esc(t.artista || "")} · ${esc(t.genero || "")} · ${Math.floor((t.duracion || 0) / 60)}:${String((t.duracion || 0) % 60).padStart(2, "0")}</div></div>
          <label class="tiny"><input type="checkbox" data-viv="${t.id}" ${t.en_vivo ? "checked" : ""}> En vivo</label>
          <label class="tiny"><input type="checkbox" data-pub="${t.id}" ${t.publicado ? "checked" : ""}> Publicada</label>
          <button class="btn btn-ghost btn-sm" data-del="${t.id}">Borrar</button></div>`).join("") || '<p class="muted small">Aún no hay canciones.</p>'}</div></div>`;
    const msg = v.querySelector("#tMsg");
    v.querySelector("#tAud").onchange = e => { const f = e.target.files[0]; if (f && !v.querySelector("#tTit").value) v.querySelector("#tTit").value = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "); };
    v.querySelector("#tSave").onclick = async () => {
      const f = v.querySelector("#tAud").files[0], tit = v.querySelector("#tTit").value.trim();
      if (!f || !tit) return MZ.toast("Elija el audio y escriba el título");
      try {
        msg.textContent = "Leyendo duración…";
        const dur = await new Promise(res => { const a = new Audio(); a.preload = "metadata"; a.onloadedmetadata = () => res(Math.round(a.duration) || 0); a.onerror = () => res(0); a.src = URL.createObjectURL(f); });
        msg.textContent = "Subiendo audio…"; const audio_url = await MZ.upload(KEY(), f);
        let cover_url = null; const c = v.querySelector("#tCov").files[0]; if (c) { msg.textContent = "Subiendo portada…"; cover_url = await MZ.upload(KEY(), c); }
        await rpc("admin_upsert_track", { p_row: { titulo: tit, artista: v.querySelector("#tArt").value.trim(), genero: v.querySelector("#tGen").value.trim(), licencia: v.querySelector("#tLic").value.trim(),
          duracion: dur, audio_url, cover_url, en_vivo: v.querySelector("#tViv").checked, publicado: true, orden: T.length } });
        MZ.toast("Canción publicada ✓"); delete v.dataset.ext; check();
      } catch (e) { msg.textContent = ""; MZ.toast("No se pudo subir: " + e.message, 4500); }
    };
    const upd = async (id, patch) => { const t = T.find(x => x.id === id); try { await rpc("admin_upsert_track", { p_row: Object.assign({}, t, patch) }); Object.assign(t, patch); MZ.toast("Guardado ✓"); } catch (e) { MZ.toast("No se pudo guardar"); } };
    v.querySelectorAll("[data-viv]").forEach(c => c.onchange = () => upd(c.dataset.viv, { en_vivo: c.checked }));
    v.querySelectorAll("[data-pub]").forEach(c => c.onchange = () => upd(c.dataset.pub, { publicado: c.checked }));
    v.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => { if (!confirmar(b)) return; await rpc("admin_delete_track", { p_id: b.dataset.del }); delete v.dataset.ext; check(); });
  }
  // confirmación en dos toques (sin diálogos del navegador)
  function confirmar(b) { if (b.dataset.ok) return true; b.dataset.ok = 1; const t = b.textContent; b.textContent = "¿Seguro? Toque otra vez"; setTimeout(() => { delete b.dataset.ok; b.textContent = t; }, 3000); return false; }

  // ---------- Precios ----------
  async function precios(v) {
    await MZ.cfgReady; const P = clone(PRECIOS());
    const fila = (g, it, i, cols) => `<div class="x-prow">${cols.map(([k, l, t, w]) => `<label style="flex:${w || 1}"><span>${l}</span>${t === "area" ? `<textarea class="input" data-g="${g}" data-i="${i}" data-k="${k}" rows="2">${esc(it[k] ?? "")}</textarea>`
      : t === "sel" ? `<select class="input" data-g="${g}" data-i="${i}" data-k="${k}"><option value="fijo" ${it[k] === "fijo" ? "selected" : ""}>$ fijo</option><option value="porc" ${it[k] === "porc" ? "selected" : ""}>% del total</option></select>`
      : `<input class="input" data-g="${g}" data-i="${i}" data-k="${k}" ${t === "n" ? 'type="number" step="0.5" min="0"' : ""} value="${esc(it[k] ?? "")}">`}</label>`).join("")}<button class="icon-btn" data-rm="${g}:${i}" aria-label="Quitar">×</button></div>`;
    const C1 = [["nombre", "Nombre", "", 2], ["precio", "Precio $", "n"], ["unidad", "Unidad"], ["cat", "Categoría"], ["desc", "Descripción", "area", 3]];
    const C2 = [["nombre", "Nombre", "", 2], ["precio", "Precio $", "n"], ["unidad", "Unidad"], ["desc", "Descripción", "area", 3]];
    const G = { estudio: ["🎬 Estudio Maíz", C1], radio: ["📻 Frecuencia Maíz (publicidad)", C2], ruta: ["🗺️ Ruta Maíz (planes)", C2],
      extras: ["➕ Extras", [["nombre", "Nombre", "", 3], ["tipo", "Tipo", "sel"], ["valor", "Valor", "n"]]], descuentos: ["🏷️ Descuentos", [["nombre", "Nombre", "", 3], ["porc", "% descuento", "n"]]] };
    const draw = () => {
      v.innerHTML = head("💲 Carta de precios", "Los cambios se ven al instante en el cotizador de Estudio Maíz, en la publicidad de Frecuencia y en los planes de Ruta Maíz.") +
        Object.entries(G).map(([g, [t, cols]]) => `<div class="ed-sec glass"><h3>${t}</h3>${(P[g] || []).map((it, i) => fila(g, it, i, cols)).join("")}<button class="btn btn-ghost btn-sm" data-add="${g}">＋ Agregar</button></div>`).join("") +
        `<div class="ed-sec glass"><h3>📝 Nota al pie</h3><textarea class="input" id="pNota" rows="2">${esc(P.nota || "")}</textarea></div>
         <div class="x-save glass"><button class="btn btn-ghost btn-sm" id="pRes">Restaurar valores sugeridos</button><button class="btn btn-primary" id="pSave">Guardar precios</button></div>`;
      v.querySelectorAll("[data-g]").forEach(i => i.oninput = () => { const it = P[i.dataset.g][+i.dataset.i]; it[i.dataset.k] = i.type === "number" ? +i.value : i.value; });
      v.querySelectorAll("[data-g]").forEach(i => { if (i.tagName === "SELECT") i.onchange = i.oninput; });
      v.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { const [g, i] = b.dataset.rm.split(":"); P[g].splice(+i, 1); draw(); });
      v.querySelectorAll("[data-add]").forEach(b => b.onclick = () => { const g = b.dataset.add; (P[g] = P[g] || []).push(g === "extras" ? { id: "x" + Date.now(), nombre: "", tipo: "fijo", valor: 0 } : g === "descuentos" ? { id: "d" + Date.now(), nombre: "", porc: 5 } : { id: "p" + Date.now(), nombre: "", precio: 0, unidad: "c/u", cat: "Otros", desc: "", cantidad: true }); draw(); });
      v.querySelector("#pNota").oninput = e => P.nota = e.target.value;
      v.querySelector("#pRes").onclick = e => { if (!confirmar(e.target)) return; Object.assign(P, clone(PRECIOS_DEFAULT)); draw(); MZ.toast("Restaurado. Toque Guardar para aplicar."); };
      v.querySelector("#pSave").onclick = async () => {
        for (const g of Object.keys(G)) P[g] = (P[g] || []).filter(x => (x.nombre || "").trim());
        try { await rpc("admin_set_config", { p_data: { precios: P } }); sessionStorage.removeItem("maiz_cfg"); MZ.toast("Precios guardados ✓"); draw(); } catch (e) { MZ.toast("No se pudo guardar: " + e.message, 4000); }
      };
    };
    draw();
  }

  // ---------- Avisos por WhatsApp (CallMeBot) ----------
  async function avisos(v) {
    const A = await rpc("admin_get_avisos") || {};
    v.innerHTML = head("🔔 Avisos por WhatsApp", "Reciba en el WhatsApp de Frecuencia Maíz un mensaje cuando llegue un brief o una solicitud, con el enlace directo para responder al negocio.") +
      `<div class="ed-sec glass"><h3>Activar (una sola vez)</h3><ol class="x-steps">
        <li>Abra <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener">la guía oficial de CallMeBot</a> y copie el número del bot que aparece ahí (cambia de vez en cuando). Guárdelo como contacto <b>CallMeBot</b> en el celular de Frecuencia Maíz.</li>
        <li>Envíele por WhatsApp este mensaje exacto: <code>I allow callmebot to send me messages</code></li>
        <li>Le responderá con su <b>apikey</b> (un número). Péguelo abajo con su número y toque <b>Guardar</b>.</li>
        <li>Toque <b>Enviar prueba</b>: debe llegarle un mensaje en menos de un minuto.</li></ol></div>
      <div class="ed-sec glass"><h3>Configuración</h3><div class="grid g2">
        <div class="field"><label class="lbl">Número de WhatsApp (con 503)</label><input class="input" id="aTel" inputmode="tel" value="${esc(A.telefono || "")}" placeholder="50370000000"></div>
        <div class="field"><label class="lbl">Apikey de CallMeBot</label><input class="input" id="aKey" type="password" autocomplete="off" placeholder="${A.tiene_apikey ? "•••••• (guardada; déjela vacía para mantenerla)" : "Ej.: 1234567"}"></div>
        <div class="field"><label class="lbl">Avisarme cada</label><select class="input" id="aCada">${[1, 2, 3, 5, 10].map(n => `<option value="${n}" ${+A.cada === n ? "selected" : ""}>${n === 1 ? "Cada envío" : `Cada ${n} envíos (resumen)`}</option>`).join("")}</select></div>
        <div class="field"><label class="lbl">Estado</label><label class="row" style="gap:8px;padding:10px 0"><input type="checkbox" id="aAct" ${A.activo ? "checked" : ""}> Avisos activos</label></div></div>
        ${A.pendientes ? `<p class="small muted">${A.pendientes} envío(s) esperando el próximo resumen.</p>` : ""}
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn btn-primary btn-sm" id="aSave">Guardar</button><button class="btn btn-ghost btn-sm" id="aTest">Enviar prueba</button></div>
        <p class="tiny muted" style="margin-top:10px">CallMeBot es gratuito para uso personal. El número y la clave se guardan cifrados en la base de datos; nunca se muestran en el sitio público.</p></div>`;
    v.querySelector("#aSave").onclick = async () => {
      const tel = v.querySelector("#aTel").value.replace(/\D/g, ""), key = v.querySelector("#aKey").value.trim(), act = v.querySelector("#aAct").checked;
      if (act && tel.length < 10) return MZ.toast("Escriba el número con 503 (11 dígitos)");
      if (act && !key && !A.tiene_apikey) return MZ.toast("Pegue la apikey que le envió CallMeBot");
      try { await rpc("admin_set_avisos", { p_activo: act, p_telefono: tel, p_apikey: key, p_cada: +v.querySelector("#aCada").value }); MZ.toast("Avisos guardados ✓"); delete v.dataset.ext; check(); } catch (e) { MZ.toast("No se pudo guardar: " + e.message, 4000); }
    };
    v.querySelector("#aTest").onclick = async () => { try { await rpc("admin_test_aviso"); MZ.toast("Prueba enviada. Revise el WhatsApp en un minuto.", 4000); } catch (e) { MZ.toast("No se pudo enviar: " + e.message, 4500); } };
  }

  // ---------- Negocios de Ruta Maíz ----------
  async function negocios(v) {
    const Ls = await rpc("admin_list_locales") || [];
    const pend = Ls.filter(l => l.pendiente && Object.keys(l.pendiente).some(k => k !== "fecha"));
    const etiqueta = { promo: "Promoción", foto_url: "Foto", descripcion: "Descripción" };
    v.innerHTML = head("🏪 Perfiles de negocios", "Cada negocio entra con su enlace privado y un PIN. Precios, horario, menú, Wi-Fi y WhatsApp se publican directo; fotos, promociones y descripción esperan su aprobación aquí.") +
      (pend.length ? `<div class="ed-sec glass x-pend"><h3>⏳ Cambios por aprobar (${pend.length})</h3>${pend.map(l => `<div class="x-row" style="align-items:flex-start"><div style="flex:1;min-width:0"><b>${esc(l.nombre)}</b>
        ${Object.entries(l.pendiente).filter(([k]) => k !== "fecha").map(([k, val]) => `<div class="small" style="margin-top:6px"><span class="tag">${etiqueta[k] || esc(k)}</span> ${k === "foto_url" ? `<img src="${esc(val)}" alt="" style="display:block;max-width:220px;border-radius:12px;margin-top:6px">` : esc(val)}</div>`).join("")}</div>
        <div class="row" style="gap:6px"><button class="btn btn-accent btn-sm" data-ap="${l.id}">Aprobar</button><button class="btn btn-ghost btn-sm" data-re="${l.id}">Rechazar</button></div></div>`).join("")}</div>` : "") +
      `<div class="ed-sec glass"><h3>Locales (${Ls.length})</h3><div class="x-list">${Ls.map(l => `<details class="x-neg"><summary><b>${esc(l.nombre)}</b> <span class="small muted">${esc(l.municipio || "")}${l.departamento ? " · " + esc(l.departamento) : ""}</span>${l.wifi_ssid ? ' <span class="tag t">📶 Wi-Fi</span>' : ""}</summary>
        <div class="grid g2" style="margin-top:10px">
          <div class="field"><label class="lbl">Departamento</label><select class="input" data-dep="${l.id}"><option value="">—</option>${["Ahuachapán", "Sonsonate", "Santa Ana"].map(d => `<option ${l.departamento === d ? "selected" : ""}>${d}</option>`).join("")}</select></div>
          <div class="field"><label class="lbl">Red Wi-Fi</label><input class="input" data-ws="${l.id}" value="${esc(l.wifi_ssid || "")}" placeholder="Nombre de la red"></div>
          <div class="field"><label class="lbl">Clave Wi-Fi</label><input class="input" data-wp="${l.id}" value="${esc(l.wifi_pass || "")}" placeholder="Vacía si es abierta"></div>
          <div class="field"><label class="lbl">&nbsp;</label><button class="btn btn-ghost btn-sm" data-sx="${l.id}">Guardar datos</button></div>
          <div class="field"><label class="lbl">PIN del negocio (mínimo 4)</label><input class="input" data-pin="${l.id}" inputmode="numeric" maxlength="12" placeholder="Nuevo PIN"></div>
          <div class="field"><label class="lbl">&nbsp;</label><button class="btn btn-primary btn-sm" data-sp="${l.id}">Asignar PIN y copiar enlace</button></div></div>
        <p class="small muted">Enlace del negocio: <code>${location.origin}/negocio?id=${l.id}</code></p></details>`).join("")}</div></div>`;
    const $ = s => v.querySelector(s);
    v.querySelectorAll("[data-ap],[data-re]").forEach(b => b.onclick = async () => { const ap = !!b.dataset.ap; try { await rpc("admin_revisar_local", { p_id: b.dataset.ap || b.dataset.re, p_aprobar: ap }); MZ.toast(ap ? "Publicado ✓" : "Rechazado"); delete v.dataset.ext; check(); } catch (e) { MZ.toast("Error: " + e.message); } });
    v.querySelectorAll("[data-sx]").forEach(b => b.onclick = async () => { const id = b.dataset.sx;
      try { await rpc("admin_set_local_extra", { p_id: id, p_row: { departamento: $(`[data-dep="${id}"]`).value || null, wifi_ssid: $(`[data-ws="${id}"]`).value.trim() || null, wifi_pass: $(`[data-wp="${id}"]`).value.trim() || null } }); MZ.toast("Guardado ✓"); } catch (e) { MZ.toast("Error: " + e.message); } });
    v.querySelectorAll("[data-sp]").forEach(b => b.onclick = async () => { const id = b.dataset.sp, pin = $(`[data-pin="${id}"]`).value.trim(), l = Ls.find(x => x.id === id);
      if (pin.length < 4) return MZ.toast("El PIN debe tener al menos 4 caracteres");
      try { await rpc("admin_set_pin_local", { p_id: id, p_pin: pin });
        const txt = `Hola, este es el acceso al perfil de ${l.nombre} en Ruta Maíz:\n${location.origin}/negocio?id=${id}\nPIN: ${pin}\nAhí puede actualizar precios, horario, menú y Wi-Fi.`;
        try { await navigator.clipboard.writeText(txt); MZ.toast("PIN asignado ✓ Mensaje copiado para enviar por WhatsApp", 4000); } catch (e) { MZ.toast("PIN asignado ✓", 3000); }
        $(`[data-pin="${id}"]`).value = ""; } catch (e) { MZ.toast("Error: " + e.message); } });
  }

  // ---------- Bitácora (Pokédex) + Recompensas ----------
  const leaflet = () => window.L ? Promise.resolve() : new Promise((res, rej) => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l);
    const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  async function bitacora(v) {
    await MZ.cfgReady;
    let E = await rpc("admin_list_especies") || [];
    const ANP = await fetch("/assets/anp.json").then(r => r.json()).catch(() => []);
    let AV = await rpc("admin_list_avistamientos").catch(() => []) || [];
    const TIPOS = ["Mamífero", "Ave", "Reptil", "Anfibio", "Invertebrado", "Planta", "Hongo", "Lugar", "Cultura"];
    const ESTADOS = ["", "En peligro", "Amenazada", "Preocupación menor", "No evaluada", "Introducida", "Especie nueva para la ciencia"];
    const REC = clone(((MZ.CFG().ruta || {}).recompensas) || [{ nivel: 1, titulo: "Fondo de pantalla de la reserva", detalle: "" }]);
    let ed = null, q = "", fT = "", fF = "", pag = 1, parar = false;
    const sinFoto = () => E.filter(e => !e.imagen_url && e.cientifico && e.tipo !== "Lugar" && e.tipo !== "Cultura");
    const form = e => `<div class="ed-sec glass" id="eForm"><h3>${e.id ? "Editar especie" : "Nueva especie"}</h3><div class="grid g2">
      <div class="field"><label class="lbl">Nombre común</label><input class="input" id="eN" value="${esc(e.nombre || "")}"></div>
      <div class="field"><label class="lbl">Nombre científico</label><input class="input" id="eC" value="${esc(e.cientifico || "")}"></div>
      <div class="field"><label class="lbl">Grupo</label><select class="input" id="eT">${TIPOS.map(t => `<option ${e.tipo === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label class="lbl">Familia</label><input class="input" id="eFa" value="${esc(e.familia || "")}"></div>
      <div class="field"><label class="lbl">Estado de conservación</label><select class="input" id="eS">${ESTADOS.map(t => `<option ${(e.estado || "") === t ? "selected" : ""} value="${t}">${t || "—"}</option>`).join("")}</select></div>
      <div class="field"><label class="lbl">Rareza en el juego</label><select class="input" id="eR">${[["comun", "Común (10 pts)"], ["rara", "Rara (25 pts)"], ["legendaria", "Legendaria (50 pts)"]].map(([k, t]) => `<option value="${k}" ${(e.rareza || "comun") === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label class="lbl">Foto</label><input class="input" id="eI" type="file" accept="image/*">${e.imagen_url ? `<span class="hint">Ya tiene foto${e.foto_credito ? " (" + esc(e.foto_credito) + ")" : ""}; suba otra para cambiarla.</span>` : ""}</div>
      <div class="field"><label class="lbl">Modelo 3D (enlace de Sketchfab, opcional)</label><input class="input" id="e3" value="${esc(e.modelo_3d || "")}" placeholder="https://sketchfab.com/3d-models/…"><span class="hint">Si lo deja vacío, la app busca un modelo automáticamente.</span></div></div>
      <div class="field"><label class="lbl">Áreas donde vive</label><div class="row" style="gap:6px">${ANP.map(a => `<label class="chip small"><input type="checkbox" data-anp="${a.code}" ${(e.anp || []).includes(a.code) ? "checked" : ""}> ${esc(a.nombre)}</label>`).join("")}</div></div>
      <div class="field"><label class="lbl">Descripción</label><textarea class="input" id="eD" rows="3">${esc(e.descripcion || "")}</textarea></div>
      <div class="field"><label class="lbl">Importancia para la reserva</label><textarea class="input" id="eIm" rows="2">${esc(e.importancia || "")}</textarea></div>
      <div class="field"><label class="lbl">¿Sabía que…? (dato curioso)</label><textarea class="input" id="eF" rows="2">${esc(e.dato || "")}</textarea></div>
      <div class="field"><label class="lbl">Fuente</label><input class="input" id="eCi" value="${esc(e.cita || "")}"></div>
      <label class="row small" style="gap:8px"><input type="checkbox" id="eP" ${e.publicado !== false ? "checked" : ""}> Publicada</label>
      <div class="row" style="gap:8px;margin-top:12px"><button class="btn btn-primary btn-sm" id="eSave">Guardar</button><button class="btn btn-ghost btn-sm" id="eCan">Cancelar</button></div></div>`;
    const filtrar = () => { const qq = q.toLowerCase(); return E.filter(e => (!fT || e.tipo === fT) && (!fF || (fF === "sin" ? !e.imagen_url : !!e.imagen_url)) && (!qq || ((e.nombre || "") + " " + (e.cientifico || "")).toLowerCase().includes(qq))); };
    const draw = () => {
      const F = filtrar(), nf = sinFoto().length;
      v.innerHTML = head("📖 Bitácora de la reserva", "La base de datos de la Pokédex: especies verificadas del Anexo 1 del Plan de Manejo. Los visitantes las ven según el área donde estén y las capturan en el juego.") +
        `<div class="grid g2">
          <div class="ed-sec glass"><h3>📥 Importar especies</h3><p class="small muted">Suba el archivo <b>bitacora-especies.json</b>. Las especies que ya existen (mismo nombre científico) se actualizan; las nuevas se agregan.</p>
            <input class="input" type="file" id="imp" accept=".json,application/json" style="margin-top:8px"><div class="small" id="impSt" style="margin-top:8px"></div></div>
          <div class="ed-sec glass"><h3>📷 Fotos automáticas</h3><p class="small muted">${nf} especies sin foto. Se buscan en iNaturalist (fotos de la comunidad científica, con su crédito). Tarda unos minutos; puede dejar esta pestaña abierta.</p>
            <div class="row" style="gap:8px;margin-top:8px"><button class="btn btn-accent btn-sm" id="fot" ${nf ? "" : "disabled"}>Buscar fotos</button><button class="btn btn-ghost btn-sm" id="fotS" hidden>Detener</button></div><div class="small" id="fotSt" style="margin-top:8px"></div></div></div>` +
        (ed ? form(ed) : `<button class="btn btn-primary btn-sm" id="eNew" style="margin-bottom:12px">＋ Nueva especie</button>`) +
        `<div class="ed-sec glass"><h3>📍 Avistamientos fijos en el mapa del juego</h3><p class="small muted">Toque el mapa para poner una especie en un punto real (un sendero, un mirador, un local). Aparecerá ahí para que los visitantes la capturen.</p>
          <div id="avMap" style="height:340px;border-radius:16px;margin:10px 0"></div><div class="x-list" id="avL">${AV.map(a => { const e = E.find(x => x.id === a.especie_id) || {}; return `<div class="x-row"><b style="flex:1">${esc(e.nombre || "—")}</b><span class="small muted">${(+a.lat).toFixed(4)}, ${(+a.lng).toFixed(4)} · ${a.radio} m${a.nota ? " · " + esc(a.nota) : ""}</span><button class="btn btn-ghost btn-sm" data-avd="${a.id}">Quitar</button></div>`; }).join("") || '<p class="small muted">Aún no hay avistamientos fijos. El juego igual genera apariciones automáticas en las áreas protegidas.</p>'}</div></div>` +
        `<div class="ed-sec glass"><h3>Especies (${E.length})</h3><div class="row" style="gap:8px;margin-bottom:10px">
          <input class="input" id="bq" placeholder="🔎 Buscar" value="${esc(q)}" style="flex:2;min-width:160px"><select class="input" id="bt" style="flex:1;min-width:120px"><option value="">Todos los grupos</option>${TIPOS.map(t => `<option ${fT === t ? "selected" : ""}>${t}</option>`).join("")}</select>
          <select class="input" id="bf" style="flex:1;min-width:120px"><option value="">Con y sin foto</option><option value="sin" ${fF === "sin" ? "selected" : ""}>Sin foto</option><option value="con" ${fF === "con" ? "selected" : ""}>Con foto</option></select></div>
          <div class="x-list">${F.slice(0, pag * 50).map(e => `<div class="x-row"><span class="x-cov" style="${e.imagen_url ? `background-image:url('${esc(e.imagen_url)}')` : ""}">${e.imagen_url ? "" : esc(e.emoji || "🌿")}</span>
          <div style="flex:1;min-width:0"><b>${esc(e.nombre)}</b> <i class="small muted">${esc(e.cientifico || "")}</i><div class="small muted">${esc(e.tipo)}${e.estado ? " · " + esc(e.estado) : ""} · ${esc(e.rareza || "comun")}${(e.anp || []).length ? " · " + e.anp.join(", ") : ""}${e.publicado === false ? " · oculta" : ""}</div></div>
          <button class="btn btn-ghost btn-sm" data-ed="${e.id}">Editar</button><button class="btn btn-ghost btn-sm" data-del="${e.id}">Borrar</button></div>`).join("")}</div>
          ${F.length > pag * 50 ? `<button class="btn btn-ghost btn-sm" id="bMas" style="width:100%;margin-top:10px">Ver más (${F.length - pag * 50})</button>` : ""}</div>
        <div class="ed-sec glass"><h3>🎁 Recompensas por nivel</h3><p class="small muted" style="margin-bottom:10px">Acuérdelas antes con los locales aliados. El visitante muestra un código en el local o lo reclama por WhatsApp.</p>
          ${REC.map((r, i) => `<div class="x-prow"><label style="flex:.6"><span>Nivel</span><input class="input" type="number" min="1" max="20" data-r="${i}" data-k="nivel" value="${r.nivel}"></label>
            <label style="flex:2"><span>Recompensa</span><input class="input" data-r="${i}" data-k="titulo" value="${esc(r.titulo)}"></label><label style="flex:3"><span>Detalle</span><input class="input" data-r="${i}" data-k="detalle" value="${esc(r.detalle || "")}"></label>
            <button class="icon-btn" data-rr="${i}" aria-label="Quitar">×</button></div>`).join("")}
          <div class="row" style="gap:8px"><button class="btn btn-ghost btn-sm" id="rAdd">＋ Agregar</button><button class="btn btn-primary btn-sm" id="rSave">Guardar recompensas</button></div></div>`;
      const recargar = async () => { E = await rpc("admin_list_especies") || []; draw(); };
      // importar
      v.querySelector("#imp").onchange = async ev => {
        const f = ev.target.files[0], st = v.querySelector("#impSt"); if (!f) return;
        let rows; try { rows = JSON.parse(await f.text()); if (!Array.isArray(rows)) throw 0; } catch (e) { st.textContent = "El archivo no es válido."; return; }
        let nuevas = 0, act = 0;
        for (let i = 0; i < rows.length; i += 400) {
          st.textContent = `Importando… ${Math.min(i + 400, rows.length)} de ${rows.length}`;
          try { const r = await rpc("admin_importar_especies", { p_rows: rows.slice(i, i + 400) }); nuevas += r.nuevas || 0; act += r.actualizadas || 0; }
          catch (e) { st.textContent = "Se detuvo por un error: " + e.message; return; }
        }
        st.innerHTML = `<b>✓ Listo:</b> ${nuevas} nuevas y ${act} actualizadas.`; MZ.toast("Importación lista ✓"); sessionStorage.removeItem("pdx_cache_v2"); setTimeout(recargar, 1200);
      };
      // fotos iNaturalist
      v.querySelector("#fot").onclick = async () => {
        const L = sinFoto(), st = v.querySelector("#fotSt"), bS = v.querySelector("#fotS"), bF = v.querySelector("#fot");
        parar = false; bS.hidden = false; bF.disabled = true; bS.onclick = () => { parar = true; };
        let buf = [], ok = 0;
        const flush = async () => { if (!buf.length) return; try { await rpc("admin_set_fotos", { p_rows: buf }); } catch (e) {} buf = []; };
        for (let i = 0; i < L.length && !parar; i++) {
          const e = L[i]; st.textContent = `Buscando ${i + 1} de ${L.length}: ${e.cientifico} · ${ok} fotos encontradas`;
          try {
            const r = await fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(e.cientifico)}&per_page=1&locale=es`).then(x => x.json());
            const x = (r.results || [])[0];
            if (x && x.default_photo && x.name && x.name.toLowerCase().split(" ")[0] === e.cientifico.toLowerCase().split(" ")[0]) {
              const u = x.default_photo.medium_url; e.imagen_url = u; ok++;
              buf.push({ id: e.id, imagen_url: u, inat_id: x.id, foto_credito: (x.default_photo.attribution || "").slice(0, 200) });
            }
          } catch (er) { await new Promise(r => setTimeout(r, 3000)); }
          if (buf.length >= 20) await flush();
          await new Promise(r => setTimeout(r, 700));
        }
        await flush(); st.innerHTML = `<b>✓ ${ok} fotos guardadas.</b> ${parar ? "Detenido; puede continuar luego." : ""}`; bS.hidden = true; sessionStorage.removeItem("pdx_cache_v2");
      };
      // mapa de avistamientos
      leaflet().then(() => {
        const el = v.querySelector("#avMap"); if (!el) return;
        const m = L.map(el).setView([13.84, -89.66], 10);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { attribution: "© OpenStreetMap · © CARTO", maxZoom: 19 }).addTo(m);
        ANP.forEach(a => a.polys.forEach(pl => L.polygon(pl, { color: "#2f7d4f", weight: 1, fillOpacity: .15 }).addTo(m)));
        AV.forEach(a => L.circle([a.lat, a.lng], { radius: a.radio || 80, color: "#D9A514" }).addTo(m).bindTooltip((E.find(x => x.id === a.especie_id) || {}).nombre || ""));
        m.on("click", ev => {
          const opts = E.filter(e => e.tipo !== "Lugar" && e.tipo !== "Cultura").slice().sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
          const box = document.createElement("div");
          box.innerHTML = `<div style="min-width:220px"><input class="input" placeholder="Buscar especie" id="avQ" style="padding:8px"><select class="input" id="avS" size="5" style="margin-top:6px;padding:4px">${opts.slice(0, 200).map(e => `<option value="${e.id}">${esc(e.nombre)}</option>`).join("")}</select>
            <input class="input" id="avN" placeholder="Nota (opcional)" style="padding:8px;margin-top:6px"><label class="small">Radio: <input id="avR" type="number" value="80" min="30" max="500" style="width:70px"> m</label>
            <button class="btn btn-primary btn-sm" id="avOk" style="width:100%;margin-top:6px">Poner aquí</button></div>`;
          const pop = L.popup().setLatLng(ev.latlng).setContent(box).openOn(m);
          box.querySelector("#avQ").oninput = e2 => { const qq = e2.target.value.toLowerCase(); box.querySelector("#avS").innerHTML = opts.filter(e => (e.nombre + " " + e.cientifico).toLowerCase().includes(qq)).slice(0, 200).map(e => `<option value="${e.id}">${esc(e.nombre)}</option>`).join(""); };
          box.querySelector("#avOk").onclick = async () => {
            const id = box.querySelector("#avS").value; if (!id) return MZ.toast("Elija una especie");
            try { await rpc("admin_upsert_avistamiento", { p_row: { especie_id: id, lat: ev.latlng.lat, lng: ev.latlng.lng, radio: +box.querySelector("#avR").value || 80, nota: box.querySelector("#avN").value.trim(), activo: true } });
              m.closePopup(pop); AV = await rpc("admin_list_avistamientos") || []; MZ.toast("Avistamiento guardado ✓"); draw(); } catch (e) { MZ.toast("No se pudo guardar: " + e.message, 4000); }
          };
        });
      }).catch(() => {});
      v.querySelectorAll("[data-avd]").forEach(b => b.onclick = async () => { if (!confirmar(b)) return; await rpc("admin_delete_avistamiento", { p_id: b.dataset.avd }); AV = await rpc("admin_list_avistamientos") || []; draw(); });
      // lista
      const bq = v.querySelector("#bq"); bq.oninput = () => { q = bq.value; pag = 1; clearTimeout(bq._t); bq._t = setTimeout(() => { draw(); const n = v.querySelector("#bq"); n.focus(); n.setSelectionRange(q.length, q.length); }, 350); };
      v.querySelector("#bt").onchange = e => { fT = e.target.value; pag = 1; draw(); };
      v.querySelector("#bf").onchange = e => { fF = e.target.value; pag = 1; draw(); };
      const bm = v.querySelector("#bMas"); if (bm) bm.onclick = () => { pag++; draw(); };
      const n = v.querySelector("#eNew"); if (n) n.onclick = () => { ed = { publicado: true, tipo: "Ave", rareza: "comun", anp: [] }; draw(); };
      v.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => { ed = E.find(x => x.id === b.dataset.ed); draw(); window.scrollTo({ top: v.querySelector("#eForm").offsetTop - 20, behavior: "smooth" }); });
      v.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => { if (!confirmar(b)) return; await rpc("admin_delete_especie", { p_id: b.dataset.del }); E = E.filter(x => x.id !== b.dataset.del); draw(); });
      if (ed) {
        v.querySelector("#eCan").onclick = () => { ed = null; draw(); };
        v.querySelector("#eSave").onclick = async () => {
          const g = id => v.querySelector(id).value.trim(); if (!g("#eN")) return MZ.toast("Escriba el nombre");
          try { let img = ed.imagen_url || null; const f = v.querySelector("#eI").files[0]; if (f) img = await MZ.upload(KEY(), f);
            await rpc("admin_upsert_especie", { p_row: Object.assign({}, ed.id ? { id: ed.id } : {}, { nombre: g("#eN"), cientifico: g("#eC"), tipo: g("#eT"), familia: g("#eFa"), estado: g("#eS"), rareza: g("#eR"),
              anp: [...v.querySelectorAll("[data-anp]:checked")].map(x => x.dataset.anp), imagen_url: img, modelo_3d: g("#e3"), descripcion: g("#eD"), importancia: g("#eIm"), dato: g("#eF"), cita: g("#eCi"), publicado: v.querySelector("#eP").checked }) });
            MZ.toast("Guardado ✓"); ed = null; sessionStorage.removeItem("pdx_cache_v2"); recargar(); } catch (e) { MZ.toast("No se pudo guardar: " + e.message, 4000); }
        };
      }
      v.querySelectorAll("[data-r]").forEach(i => i.oninput = () => { REC[+i.dataset.r][i.dataset.k] = i.type === "number" ? +i.value : i.value; });
      v.querySelectorAll("[data-rr]").forEach(b => b.onclick = () => { REC.splice(+b.dataset.rr, 1); draw(); });
      v.querySelector("#rAdd").onclick = () => { REC.push({ nivel: (REC[REC.length - 1] || { nivel: 0 }).nivel + 2, titulo: "", detalle: "" }); draw(); };
      v.querySelector("#rSave").onclick = async () => {
        const rec = REC.filter(r => r.titulo.trim()).sort((a, b) => a.nivel - b.nivel);
        try { await rpc("admin_set_config", { p_data: { ruta: Object.assign({}, MZ.CFG().ruta || {}, { recompensas: rec }) } }); sessionStorage.removeItem("maiz_cfg"); MZ.toast("Recompensas guardadas ✓"); } catch (e) { MZ.toast("No se pudo guardar"); }
      };
    };
    draw();
  }
})();
