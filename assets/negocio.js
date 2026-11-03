/* Perfil privado de cada negocio en Ruta Maíz: entra con enlace + PIN */
(function () {
  const esc = MZ.esc, app = document.getElementById("app");
  const id = new URLSearchParams(location.search).get("id");
  const SK = "ng_pin_" + id;
  let L = null, pin = sessionStorage.getItem(SK) || "", fotoNueva = null, sucio = false;
  MZ.aurora && MZ.aurora();

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    app.innerHTML = `<div class="ng-log"><div class="card glass">${MZ.mascot(80)}<h2 style="margin-top:10px">Enlace incompleto</h2><p class="muted">Use el enlace que le envió Proyecto Maíz por WhatsApp.</p></div></div>`;
    return;
  }

  function login(msg) {
    app.innerHTML = `<div class="ng-log"><div class="card glass">${MZ.mascot(84)}<h2 style="margin:10px 0 4px">Perfil de su negocio</h2>
      <p class="muted small" style="margin-bottom:16px">Ruta Maíz · escriba el PIN que le enviamos</p>
      <input class="input ng-pin" id="pin" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="12" placeholder="••••">
      ${msg ? `<p class="small" style="color:#b0402c;margin-top:10px">${esc(msg)}</p>` : ""}
      <button class="btn btn-primary" id="go" style="width:100%;margin-top:14px">Entrar</button>
      <p class="tiny muted" style="margin-top:14px">¿Olvidó su PIN? Escríbanos y le asignamos uno nuevo.</p>
      <a class="btn btn-ghost btn-sm" style="margin-top:6px" href="${MZ.waLink("Hola, necesito un nuevo PIN para el perfil de mi negocio en Ruta Maíz.")}" target="_blank" rel="noopener">Pedir PIN por WhatsApp</a></div></div>`;
    const i = app.querySelector("#pin"); i.focus();
    const go = () => { pin = i.value.trim(); if (pin.length < 4) return MZ.toast("El PIN tiene al menos 4 caracteres"); cargar(); };
    app.querySelector("#go").onclick = go; i.onkeydown = e => { if (e.key === "Enter") go(); };
  }

  async function cargar() {
    if (!pin) return login();
    app.innerHTML = `<div class="ng-log"><p class="muted">Cargando…</p></div>`;
    try {
      const r = await MZ.rpc("negocio_get", { p_id: id, p_pin: pin });
      if (!r || !r.local) { sessionStorage.removeItem(SK); return login(r && r.error === "bloqueado" ? "Demasiados intentos. Espere 15 minutos e intente de nuevo." : "PIN incorrecto."); }
      L = r.local; sessionStorage.setItem(SK, pin); draw();
    } catch (e) { login("No se pudo conectar. Revise su internet."); }
  }

  const menuEd = () => (L.menu || []).map((c, ci) => `<div class="ng-cat"><div class="row" style="gap:6px;flex-wrap:nowrap"><input class="input" data-cat="${ci}" value="${esc(c.cat || "")}" placeholder="Categoría (ej.: Bebidas)" style="font-weight:700"><button class="icon-btn" data-rc="${ci}" aria-label="Quitar categoría">×</button></div>
    ${(c.items || []).map((it, ii) => `<div class="ng-it"><input class="input" data-n="${ci}:${ii}" value="${esc(it.n || "")}" placeholder="Producto"><input class="input" data-p="${ci}:${ii}" value="${esc(it.p || "")}" inputmode="decimal" placeholder="$"><button class="icon-btn" data-ri="${ci}:${ii}" aria-label="Quitar">×</button></div>`).join("")}
    <button class="btn btn-ghost btn-sm" data-ai="${ci}" style="margin-top:8px">＋ Producto</button></div>`).join("");

  function draw() {
    const pend = L.pendiente || {};
    app.innerHTML = `<div class="ng-hd"><span class="ph" style="${L.foto_url ? `background-image:url('${esc(L.foto_url)}')` : ""}">${L.foto_url ? "" : "🏪"}</span>
        <div style="min-width:0;flex:1"><div class="small muted">${esc(L.categoria || "")} · ${esc(L.municipio || "")}</div><h1 class="h-md">${esc(L.nombre)}</h1></div>
        <button class="btn btn-ghost btn-sm" id="out">Salir</button></div>
      <div class="ng-sec glass"><p class="small muted" style="margin:0"><span class="ng-badge d">● Se publica al guardar</span> precios, horario, menú, Wi-Fi y WhatsApp.<br><span class="ng-badge r">● Pasa por revisión</span> foto, promoción y descripción (normalmente en 24 h).</p>
        <a class="btn btn-ghost btn-sm" style="margin-top:10px" href="/ruta-maiz" target="_blank">Ver mi ficha en Ruta Maíz ↗</a></div>
      <div class="ng-sec glass"><h3>💲 Precios y horario <span class="ng-badge d">Directo</span></h3><p class="small muted">Lo que verán los visitantes al abrir su ficha.</p>
        <div class="field"><label class="lbl" for="consumo">Consumo aproximado por persona</label><input class="input" id="consumo" data-f value="${esc(L.consumo || "")}" placeholder="Ej.: $5 – $10" maxlength="80"></div>
        <div class="field"><label class="lbl" for="horario">Horario</label><input class="input" id="horario" data-f value="${esc(L.horario || "")}" placeholder="Ej.: Miércoles a domingo, 8:00 a. m. a 5:00 p. m." maxlength="200"></div>
        <div class="field"><label class="lbl" for="whatsapp">WhatsApp del negocio</label><input class="input" id="whatsapp" data-f inputmode="tel" value="${esc(L.whatsapp || "")}" placeholder="7000 0000" maxlength="30"></div></div>
      <div class="ng-sec glass"><h3>📶 Wi-Fi para clientes <span class="ng-badge d">Directo</span></h3><p class="small muted">Los visitantes podrán copiar la clave o escanear un código QR desde su ficha. Use la red de invitados, no la de su caja o oficina.</p>
        <div class="grid g2"><div class="field"><label class="lbl" for="wifi_ssid">Nombre de la red</label><input class="input" id="wifi_ssid" data-f value="${esc(L.wifi_ssid || "")}" maxlength="64"></div>
        <div class="field"><label class="lbl" for="wifi_pass">Clave</label><input class="input" id="wifi_pass" data-f value="${esc(L.wifi_pass || "")}" maxlength="64" placeholder="Vacía si es abierta"></div></div></div>
      <div class="ng-sec glass"><h3>📖 Menú <span class="ng-badge d">Directo</span></h3><p class="small muted">Pegue el enlace de su menú digital o escríbalo aquí.</p>
        <div class="field"><label class="lbl" for="menu_url">Enlace de menú (opcional)</label><input class="input" id="menu_url" data-f value="${esc(L.menu_url || "")}" placeholder="https://…" maxlength="600"></div>
        <div id="menuEd">${menuEd()}</div><button class="btn btn-ghost btn-sm" id="addCat">＋ Categoría</button></div>
      <div class="ng-sec glass"><h3>🖼️ Foto, promoción y descripción <span class="ng-badge r">Con revisión</span></h3>
        ${Object.keys(pend).some(k => k !== "fecha") ? `<p class="small" style="background:rgba(244,194,48,.2);padding:10px;border-radius:12px;margin-bottom:12px">⏳ Tiene cambios esperando aprobación. Se publicarán cuando Proyecto Maíz los revise.</p>` : ""}
        <div class="ng-foto" id="fPrev" style="${(fotoNueva || pend.foto_url || L.foto_url) ? `background-image:url('${esc(fotoNueva || pend.foto_url || L.foto_url)}')` : ""}">${(fotoNueva || pend.foto_url || L.foto_url) ? "" : "Sin foto"}</div>
        <label class="btn btn-ghost btn-sm">📷 Cambiar foto<input type="file" id="foto" accept="image/*" hidden></label>
        <div class="field" style="margin-top:12px"><label class="lbl" for="promo">Promoción para visitantes con Pasaporte Maíz</label><input class="input" id="promo" data-r value="${esc(pend.promo ?? L.promo ?? "")}" maxlength="300" placeholder="Ej.: 10 % de descuento mostrando su pasaporte"></div>
        <div class="field"><label class="lbl" for="descripcion">Descripción</label><textarea class="input" id="descripcion" data-r rows="4" maxlength="1500">${esc(pend.descripcion ?? L.descripcion ?? "")}</textarea></div></div>
      <div class="ng-save glass"><span class="small muted" id="sMsg">Sin cambios</span><button class="btn btn-primary" id="save">Guardar cambios</button></div>`;
    const marca = () => { sucio = true; app.querySelector("#sMsg").textContent = "Cambios sin guardar"; };
    app.querySelectorAll("[data-f],[data-r]").forEach(i => i.oninput = marca);
    app.querySelector("#out").onclick = () => { sessionStorage.removeItem(SK); pin = ""; login(); };
    bindMenu(marca);
    app.querySelector("#addCat").onclick = () => { leerMenu(); (L.menu = L.menu || []).push({ cat: "", items: [{ n: "", p: "" }] }); app.querySelector("#menuEd").innerHTML = menuEd(); bindMenu(marca); marca(); };
    app.querySelector("#foto").onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      const prev = app.querySelector("#fPrev"); prev.style.backgroundImage = `url('${URL.createObjectURL(f)}')`; prev.textContent = "Subiendo…";
      try {
        const blob = await achicar(f);
        const r = await fetch(`${MZ.SB_URL}/functions/v1/admin-upload`, { method: "POST", headers: { "Content-Type": "application/json", apikey: "sb_publishable_QktwCj57rCNRgGEep66_ZA_PcYHqlP6" },
          body: JSON.stringify({ modo: "negocio", id, pin, filename: "foto.jpg", contentType: "image/jpeg" }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error);
        const up = await fetch(`${MZ.SB_URL}/storage/v1/object/upload/sign/media/${j.path}?token=${j.token}`, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob });
        if (!up.ok) throw new Error("subida");
        fotoNueva = j.publicUrl; prev.textContent = ""; marca(); MZ.toast("Foto lista. Toque Guardar para enviarla a revisión.", 3500);
      } catch (err) { prev.textContent = ""; MZ.toast("No se pudo subir la foto: " + err.message, 4000); }
    };
    app.querySelector("#save").onclick = guardar;
  }
  function bindMenu(marca) {
    const m = app.querySelector("#menuEd");
    m.querySelectorAll("input").forEach(i => i.oninput = marca);
    m.querySelectorAll("[data-ai]").forEach(b => b.onclick = () => { leerMenu(); L.menu[+b.dataset.ai].items.push({ n: "", p: "" }); m.innerHTML = menuEd(); bindMenu(marca); marca(); });
    m.querySelectorAll("[data-ri]").forEach(b => b.onclick = () => { leerMenu(); const [c, i] = b.dataset.ri.split(":").map(Number); L.menu[c].items.splice(i, 1); m.innerHTML = menuEd(); bindMenu(marca); marca(); });
    m.querySelectorAll("[data-rc]").forEach(b => b.onclick = () => { leerMenu(); L.menu.splice(+b.dataset.rc, 1); m.innerHTML = menuEd(); bindMenu(marca); marca(); });
  }
  function leerMenu() {
    const m = app.querySelector("#menuEd"); if (!m) return;
    L.menu = (L.menu || []).map((c, ci) => ({ cat: (m.querySelector(`[data-cat="${ci}"]`) || {}).value || "", items: (c.items || []).map((it, ii) => ({ n: (m.querySelector(`[data-n="${ci}:${ii}"]`) || {}).value || "", p: (m.querySelector(`[data-p="${ci}:${ii}"]`) || {}).value || "" })) }));
  }
  async function guardar() {
    leerMenu();
    const v = k => app.querySelector("#" + k).value.trim(), pend = L.pendiente || {};
    const row = { consumo: v("consumo"), horario: v("horario"), whatsapp: v("whatsapp"), wifi_ssid: v("wifi_ssid"), wifi_pass: v("wifi_pass"), menu_url: v("menu_url"),
      menu: (L.menu || []).map(c => ({ cat: c.cat.trim(), items: c.items.filter(i => i.n.trim()).map(i => ({ n: i.n.trim(), p: i.p.replace(/[^\d.]/g, "") })) })).filter(c => c.cat && c.items.length) };
    if (row.menu_url && !/^https?:\/\//i.test(row.menu_url)) return MZ.toast("El enlace del menú debe empezar con https://");
    if (v("promo") !== (pend.promo ?? L.promo ?? "")) row.promo = v("promo");
    if (v("descripcion") !== (pend.descripcion ?? L.descripcion ?? "")) row.descripcion = v("descripcion");
    if (fotoNueva) row.foto_url = fotoNueva;
    const b = app.querySelector("#save"); b.disabled = true; b.textContent = "Guardando…";
    try {
      const r = await MZ.rpc("negocio_update", { p_id: id, p_pin: pin, p_row: row });
      if (!r || r.error) { b.disabled = false; b.textContent = "Guardar cambios"; return r && r.error === "bloqueado" ? login("Demasiados intentos. Espere 15 minutos.") : login("Su PIN cambió. Ingréselo de nuevo."); }
      sucio = false; fotoNueva = null;
      MZ.toast(r.pendiente ? "✓ Publicado. Foto, promoción o descripción quedan en revisión." : "✓ Cambios publicados", 4000);
      const g = await MZ.rpc("negocio_get", { p_id: id, p_pin: pin }); if (g && g.local) L = g.local; draw();
    } catch (e) { b.disabled = false; b.textContent = "Guardar cambios"; MZ.toast("No se pudo guardar: " + e.message, 4000); }
  }
  function achicar(file) {
    return new Promise(res => { const img = new Image(); img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => res(b || file), "image/jpeg", .85); };
      img.onerror = () => res(file); img.src = URL.createObjectURL(file); });
  }
  addEventListener("beforeunload", e => { if (sucio) { e.preventDefault(); e.returnValue = ""; } });
  cargar();
})();
